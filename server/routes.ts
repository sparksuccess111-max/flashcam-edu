import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { authenticate, requireAdmin, requireTeacherOrAdmin, optionalAuth, generateToken, type AuthRequest } from "./middleware/auth";
import { logger } from "./logger";
import { normalizeName, findUserByNormalizedName } from "./utils/normalize";
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
      
      let user;
      try {
        user = findUserByNormalizedName(users_list, credentials.firstName, credentials.lastName);
      } catch (err: any) {
        logger.warn(`Login failed: ${err.message}`, "api");
        return res.status(401).json({ error: err.message });
      }

      if (!user) {
        logger.warn(`Login failed: user not found (${normalizeName(credentials.firstName)} ${normalizeName(credentials.lastName)})`, "api");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) {
        logger.warn(`Login failed: invalid password for ${user.firstName} ${user.lastName}`, "api");
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

  app.patch("/api/admin/users/:id/subject", authenticate, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { subject } = req.body;
      
      const validSubjects = ["Histoire-Géo", "Maths", "Français", "SVT", "Anglais", "Physique-Chimie", "Technologie", "Éducation Physique"];
      if (subject && !validSubjects.includes(subject)) {
        return res.status(400).json({ error: "Invalid subject" });
      }

      const user = await storage.updateUser(id, { subject });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      broadcastUpdate('user-updated', { id, subject });
      logger.info(`User subject updated: ${user.firstName} ${user.lastName} to ${subject}`, "api");
      res.json(user);
    } catch (error: any) {
      logger.error("Failed to update user subject", "api", error);
      res.status(400).json({ error: error.message || "Failed to update user subject" });
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
      const isAdminOrTeacher = req.user?.role === "admin" || req.user?.role === "teacher";
      const filteredPacks = isAdminOrTeacher ? allPacks : allPacks.filter(pack => pack.published);
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

  app.get("/api/messages/unread-count", authenticate, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error: any) {
      logger.error("Failed to fetch unread count", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/mark-conversation-read", authenticate, async (req: AuthRequest, res) => {
    try {
      const { otherUserId } = req.body;
      await storage.markConversationAsRead(req.user!.id, otherUserId);
      const unreadCount = await storage.getTotalUnreadCount(req.user!.id);
      broadcastUpdate('notifications-updated', { userId: req.user!.id, unreadCount });
      logger.info(`Conversation marked as read for ${req.user!.id}`, "api");
      res.json({ success: true, unreadCount });
    } catch (error: any) {
      logger.error("Failed to mark conversation as read", "api", error);
      res.status(400).json({ error: error.message || "Failed to mark conversation as read" });
    }
  });

  app.get("/api/notifications/unread-count", authenticate, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getTotalUnreadCount(req.user!.id);
      res.json({ count });
    } catch (error: any) {
      logger.error("Failed to fetch unread count", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch unread count" });
    }
  });

  app.get("/api/messages/recipients", authenticate, async (req: AuthRequest, res) => {
    try {
      const recipients = await storage.getValidMessageRecipients(req.user!.id, req.user!.role);
      res.json(recipients);
    } catch (error: any) {
      logger.error("Failed to fetch recipients", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch recipients" });
    }
  });

  app.post("/api/messages", authenticate, async (req: AuthRequest, res) => {
    try {
      const messageData = insertMessageSchema.parse({...req.body, fromUserId: req.user!.id});
      const recipients = await storage.getValidMessageRecipients(req.user!.id, req.user!.role);
      
      if (!recipients.find(r => r.id === messageData.toUserId)) {
        logger.warn(`Unauthorized message attempt from ${req.user!.id} to ${messageData.toUserId}`, "api");
        return res.status(403).json({ error: "You don't have permission to message this user" });
      }

      const message = await storage.createMessage(messageData);
      const unreadCount = await storage.getTotalUnreadCount(messageData.toUserId);
      broadcastUpdate('message-received', { ...message, totalUnreadCount: unreadCount });
      broadcastUpdate('notifications-updated', { userId: messageData.toUserId, unreadCount });
      logger.info(`Message sent from ${req.user!.firstName} to ${req.body.toUserId}`, "api");
      res.status(201).json(message);
    } catch (error: any) {
      logger.error("Failed to create message", "api", error);
      res.status(400).json({ error: error.message || "Failed to create message" });
    }
  });

  app.post("/api/packs", authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res) => {
    try {
      const packData = insertPackSchema.parse(req.body);
      
      // Teachers can only create packs in their subject
      if (req.user!.role === "teacher") {
        // Get current user from database to check latest subject assignment
        const currentUser = await storage.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, req.user!.id),
        });
        
        if (!currentUser || currentUser.subject !== packData.subject) {
          const userSubject = currentUser?.subject || "Non assigné";
          logger.warn(`Unauthorized pack creation: teacher ${req.user!.id} tried to create pack in subject ${packData.subject} (assigned: ${userSubject})`, "api");
          return res.status(403).json({ error: `You can only create packs in your assigned subject: ${userSubject}` });
        }
      }
      
      const pack = await storage.createPack({ ...packData, createdByUserId: req.user!.id });
      broadcastUpdate('pack-created', pack);
      logger.info(`Pack created: ${pack.id} - "${pack.title}" (${pack.subject}) by ${req.user!.firstName}`, "api");
      res.status(201).json(pack);
    } catch (error: any) {
      logger.error("Failed to create pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to create pack" });
    }
  });

  app.patch("/api/packs/:id", authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res) => {
    try {
      const packData = updatePackSchema.parse(req.body);
      const pack = await storage.getPackById(req.params.id);
      
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      // Teachers can only update packs in their subject
      if (req.user!.role === "teacher") {
        // Get current user from database to check latest subject assignment
        const currentUser = await storage.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, req.user!.id),
        });
        
        if (!currentUser || pack.subject !== currentUser.subject) {
          logger.warn(`Unauthorized pack update: teacher ${req.user!.id} tried to modify pack in subject ${pack.subject}`, "api");
          return res.status(403).json({ error: "You can only modify packs in your assigned subject" });
        }
      }

      const updatedPack = await storage.updatePack(req.params.id, packData);
      broadcastUpdate('pack-updated', updatedPack);
      logger.info(`Pack updated: ${req.params.id} - "${updatedPack?.title}"`, "api");
      res.json(updatedPack);
    } catch (error: any) {
      logger.error("Failed to update pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to update pack" });
    }
  });

  app.delete("/api/packs/:id", authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.id);
      
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      // Teachers can only delete packs in their subject
      if (req.user!.role === "teacher" && pack.subject !== req.user!.subject) {
        logger.warn(`Unauthorized pack deletion: teacher ${req.user!.id} tried to delete pack in subject ${pack.subject}`, "api");
        return res.status(403).json({ error: "You can only delete packs in your assigned subject" });
      }

      await storage.deletePack(req.params.id);
      broadcastUpdate('pack-deleted', { id: req.params.id });
      logger.info(`Pack deleted: ${req.params.id}`, "api");
      res.status(204).send();
    } catch (error: any) {
      logger.error("Failed to delete pack", "api", error);
      res.status(500).json({ error: error.message || "Failed to delete pack" });
    }
  });

  app.get("/api/packs", authenticate, async (req: AuthRequest, res) => {
    try {
      let packs;
      if (req.user!.role === "teacher") {
        packs = await storage.getPacksByTeacher(req.user!.subject!);
      } else if (req.user!.role === "admin") {
        packs = await storage.getAllPacks();
      } else {
        const allPacks = await storage.getAllPacks();
        packs = allPacks.filter(p => p.published);
      }
      res.json(packs);
    } catch (error: any) {
      logger.error("Failed to fetch packs", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch packs" });
    }
  });

  app.get("/api/subjects", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const subjects = ["Histoire-Géo", "Maths", "Français", "SVT", "Anglais", "Physique-Chimie", "Technologie", "Éducation Physique"];
      res.json(subjects);
    } catch (error: any) {
      logger.error("Failed to fetch subjects", "api", error);
      res.status(500).json({ error: error.message || "Failed to fetch subjects" });
    }
  });

  app.get("/api/packs/:packId/flashcards", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.packId);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      if (!pack.published && req.user?.role !== "admin" && req.user?.role !== "teacher") {
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

  app.get("/api/packs/:packId/export", authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.packId);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      // Teachers can only export their own packs
      if (req.user!.role === "teacher" && pack.subject !== req.user!.subject) {
        return res.status(403).json({ error: "You can only export packs from your subject" });
      }

      const flashcards = await storage.getFlashcardsByPackId(req.params.packId);
      
      // Format: ("question", "réponse"),
      const lines = flashcards.map(fc => `("${fc.question.replace(/"/g, '\\"')}", "${fc.answer.replace(/"/g, '\\"')}")`).join(',\n');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${pack.title}-flashcards.txt"`);
      res.send(lines);
      
      logger.info(`Pack exported: ${pack.id} - ${flashcards.length} flashcards`, "api");
    } catch (error: any) {
      logger.error("Failed to export pack", "api", error);
      res.status(500).json({ error: error.message || "Failed to export pack" });
    }
  });

  app.post("/api/packs/:packId/import", authenticate, requireTeacherOrAdmin, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.packId);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      // Teachers can only import to their own packs
      if (req.user!.role === "teacher" && pack.subject !== req.user!.subject) {
        return res.status(403).json({ error: "You can only import to packs in your subject" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "No content provided" });
      }

      const flashcards: Array<{ question: string; answer: string }> = [];
      
      // Parse format: ("question", "réponse"),
      // Also support: ("question", "réponse")
      const regex = /\("([^"]*(?:\\"[^"]*)*)"\s*,\s*"([^"]*(?:\\"[^"]*)*)"\)/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const question = match[1].replace(/\\"/g, '"');
        const answer = match[2].replace(/\\"/g, '"');
        flashcards.push({ question, answer });
      }

      if (flashcards.length === 0) {
        return res.status(400).json({ error: "No valid flashcards found in the file" });
      }

      // Create all flashcards
      const created = [];
      for (const fc of flashcards) {
        const flashcard = await storage.createFlashcard({
          packId: req.params.packId,
          question: fc.question,
          answer: fc.answer,
        });
        created.push(flashcard);
      }

      broadcastUpdate('flashcards-imported', { packId: req.params.packId, count: created.length });
      logger.info(`Pack imported: ${pack.id} - ${created.length} flashcards added`, "api");
      res.status(201).json({ count: created.length, flashcards: created });
    } catch (error: any) {
      logger.error("Failed to import pack", "api", error);
      res.status(400).json({ error: error.message || "Failed to import pack" });
    }
  });

  return httpServer;
}
