import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { authenticate, requireAdmin, requireTeacherOrAdmin, optionalAuth, generateToken, type AuthRequest } from "./middleware/auth";
import { logger } from "./logger";
import {
  loginSchema,
  signupBackendSchema,
  insertPackSchema,
  updatePackSchema,
  insertFlashcardSchema,
  updateFlashcardSchema,
  insertAccountRequestSchema,
  insertMessageSchema,
} from "@shared/schema";

const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).slice(2, 9);
    logger.ws(`Client ${clientId} connected (total: ${wss.clients.size})`);
    
    ws.on('error', (error) => {
      logger.error(`Client ${clientId} error: ${error.message}`, "websocket", error);
    });

    ws.on('close', () => {
      logger.ws(`Client ${clientId} disconnected (total: ${wss.clients.size - 1})`);
    });
  });

  // Health check endpoint for keep-alive monitoring
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Ping endpoint for internal keep-alive script
  // Performs a micro-action (timestamp update in memory) to signal server is active
  app.get("/ping", (_req, res) => {
    // Micro-action: Update last ping timestamp
    const now = new Date().toISOString();
    (global as any).__lastPingTime = now;
    (global as any).__pingCount = ((global as any).__pingCount || 0) + 1;
    
    res.json({ 
      status: "alive",
      lastPingTime: now,
      totalPings: (global as any).__pingCount
    });
  });

  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const users_list = await storage.getAllUsers();
      const user = users_list.find(u => u.firstName === credentials.firstName && u.lastName === credentials.lastName);

      if (!user) {
        logger.warn(`Login failed: user not found (${credentials.firstName} ${credentials.lastName})`, "api");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) {
        logger.warn(`Login failed: invalid password for ${credentials.firstName} ${credentials.lastName}`, "api");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`Login successful: ${user.firstName} ${user.lastName}`, "api");
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      logger.error("Login error", "api", error);
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  app.post("/api/signup", async (req, res) => {
    try {
      const signupData = signupBackendSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(signupData.password, SALT_ROUNDS);
      const request = await storage.createAccountRequest({
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        password: hashedPassword,
      });
      logger.info(`Signup request created: ${signupData.firstName} ${signupData.lastName}`, "api");
      res.status(201).json({ status: "pending", id: request.id });
    } catch (error: any) {
      logger.error("Signup error", "api", error);
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  app.get("/api/admin/requests", authenticate, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllAccountRequests();
      res.json(requests);
    } catch (error: any) {
      logger.error("Failed to fetch account requests", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch requests" });
    }
  });

  app.post("/api/admin/requests/:id/approve", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const request = await storage.getAccountRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      const result = await storage.approveAccountRequest(
        id,
        request.firstName,
        request.lastName,
        request.password,
        role || request.requestedRole || "student"
      );
      broadcastUpdate('account-approved', { id });
      logger.info(`Account approved: ${request.firstName} ${request.lastName} as ${role || request.requestedRole}`, "api");
      res.json({ user: result.user });
    } catch (error: any) {
      logger.error("Failed to approve account request", "api", error);
      res.status(400).json({ error: error.message || "Failed to approve request" });
    }
  });

  app.post("/api/admin/requests/:id/reject", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.rejectAccountRequest(id);
      broadcastUpdate('account-rejected', { id });
      logger.info(`Account request rejected: ${id}`, "api");
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to reject account request", "api", error);
      res.status(400).json({ error: error.message || "Failed to reject request" });
    }
  });

  app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const users_list = await storage.getAllUsers();
      res.json(users_list.map(u => ({ ...u, password: undefined })));
    } catch (error: any) {
      logger.error("Failed to fetch users", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !["admin", "teacher", "student"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Prevent removing admin role from the current user (Camille Cordier)
      if (id === req.user!.id && role !== "admin") {
        return res.status(403).json({ error: "Cannot remove your own admin role" });
      }

      const user = await storage.updateUser(id, { role });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      broadcastUpdate('user-updated', { id, role });
      logger.info(`User role updated: ${user.firstName} ${user.lastName} to ${role}`, "api");
      res.json(user);
    } catch (error: any) {
      logger.error("Failed to update user role", "api", error);
      res.status(400).json({ error: error.message || "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await storage.deleteUser(id);
      broadcastUpdate('user-deleted', { id });
      logger.info(`User deleted: ${user.firstName} ${user.lastName}`, "api");
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to delete user", "api", error);
      res.status(400).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.get("/api/packs", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const allPacks = await storage.getAllPacks();
      const isAdmin = req.user?.role === "admin";
      const filteredPacks = isAdmin ? allPacks : allPacks.filter(pack => pack.published);
      res.json(filteredPacks);
    } catch (error: any) {
      logger.error("Failed to fetch packs", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch packs" });
    }
  });

  app.patch("/api/packs/reorder", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { packId, newOrder } = req.body;
      if (!packId || typeof newOrder !== "number") {
        return res.status(400).json({ error: "Invalid request" });
      }
      const pack = await storage.updatePack(packId, { order: newOrder });
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }
      broadcastUpdate('pack-updated', pack);
      logger.info(`Pack reordered: ${packId} to position ${newOrder}`, "api");
      res.json(pack);
    } catch (error: any) {
      logger.error("Failed to reorder pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to reorder pack" });
    }
  });

  app.get("/api/packs/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.id);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      if (!pack.published && req.user?.role !== "admin") {
        logger.warn(`Unauthorized access to unpublished pack: ${req.params.id}`, "api");
        return res.status(403).json({ error: "This pack is not published" });
      }

      res.json(pack);
    } catch (error: any) {
      logger.error("Failed to fetch pack", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch pack" });
    }
  });

  app.get("/api/messages", authenticate, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getMessages(req.user!.id);
      res.json(messages);
    } catch (error: any) {
      logger.error("Failed to fetch messages", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticate, async (req: AuthRequest, res) => {
    try {
      const messageData = insertMessageSchema.parse({...req.body, fromUserId: req.user!.id});
      const message = await storage.createMessage(messageData);
      broadcastUpdate('message-received', message);
      logger.info(`Message sent from ${req.user!.firstName} to ${req.body.toUserId}`, "api");
      res.status(201).json(message);
    } catch (error: any) {
      logger.error("Failed to create message", "api", error);
      res.status(400).json({ error: error.message || "Failed to create message" });
    }
  });

  app.post("/api/packs", authenticate, requireTeacherOrAdmin, async (req, res) => {
    try {
      const packData = insertPackSchema.parse(req.body);
      const pack = await storage.createPack(packData);
      broadcastUpdate('pack-created', pack);
      logger.info(`Pack created: ${pack.id} - "${pack.title}"`, "api");
      res.status(201).json(pack);
    } catch (error: any) {
      logger.error("Failed to create pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to create pack" });
    }
  });

  app.patch("/api/packs/:id", authenticate, requireTeacherOrAdmin, async (req, res) => {
    try {
      const packData = updatePackSchema.parse(req.body);
      const pack = await storage.updatePack(req.params.id, packData);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }
      broadcastUpdate('pack-updated', pack);
      logger.info(`Pack updated: ${req.params.id} - "${pack.title}"`, "api");
      res.json(pack);
    } catch (error: any) {
      logger.error("Failed to update pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to update pack" });
    }
  });

  app.delete("/api/packs/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await storage.deletePack(req.params.id);
      broadcastUpdate('pack-deleted', { id: req.params.id });
      logger.info(`Pack deleted: ${req.params.id}`, "api");
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to delete pack", "api", error);
      res.status(500).json({ error: error.message || "Failed to delete pack" });
    }
  });

  app.get("/api/packs/:packId/flashcards", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.packId);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      if (!pack.published && req.user?.role !== "admin") {
        logger.warn(`Unauthorized access to flashcards: ${req.params.packId}`, "api");
        return res.status(403).json({ error: "This pack is not published" });
      }

      const flashcards = await storage.getFlashcardsByPackId(req.params.packId);
      res.json(flashcards);
    } catch (error: any) {
      logger.error("Failed to fetch flashcards", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch flashcards" });
    }
  });

  app.post("/api/packs/:packId/flashcards", authenticate, requireTeacherOrAdmin, async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.parse({
        ...req.body,
        packId: req.params.packId,
      });
      const flashcard = await storage.createFlashcard(flashcardData);
      broadcastUpdate('flashcard-created', flashcard);
      logger.info(`Flashcard created in pack ${req.params.packId}: ${flashcard.id}`, "api");
      res.status(201).json(flashcard);
    } catch (error: any) {
      logger.error("Failed to create flashcard", "api", error);
      res.status(400).json({ error: error.message || "Failed to create flashcard" });
    }
  });

  app.patch("/api/packs/:packId/flashcards/:id", authenticate, requireTeacherOrAdmin, async (req, res) => {
    try {
      const flashcardData = updateFlashcardSchema.parse(req.body);
      const flashcard = await storage.updateFlashcard(req.params.id, flashcardData);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      broadcastUpdate('flashcard-updated', flashcard);
      logger.info(`Flashcard updated in pack ${req.params.packId}: ${req.params.id}`, "api");
      res.json(flashcard);
    } catch (error: any) {
      logger.error("Failed to update flashcard", "api", error);
      res.status(400).json({ error: error.message || "Failed to update flashcard" });
    }
  });

  app.delete("/api/packs/:packId/flashcards/:id", authenticate, requireTeacherOrAdmin, async (req, res) => {
    try {
      await storage.deleteFlashcard(req.params.id);
      broadcastUpdate('flashcard-deleted', { id: req.params.id, packId: req.params.packId });
      logger.info(`Flashcard deleted in pack ${req.params.packId}: ${req.params.id}`, "api");
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to delete flashcard", "api", error);
      res.status(500).json({ error: error.message || "Failed to delete flashcard" });
    }
  });

  return httpServer;
}
