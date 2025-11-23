import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { authenticate, requireAdmin, optionalAuth, generateToken, type AuthRequest } from "./middleware/auth";
import {
  loginSchema,
  insertPackSchema,
  updatePackSchema,
  insertFlashcardSchema,
  updateFlashcardSchema,
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
    console.log('WebSocket client connected');
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByFirstName(credentials.firstName);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  app.get("/api/packs", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const allPacks = await storage.getAllPacks();
      const isAdmin = req.user?.role === "admin";
      const packs = isAdmin ? allPacks : allPacks.filter(pack => pack.published);
      res.json(packs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch packs" });
    }
  });

  app.get("/api/packs/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const pack = await storage.getPackById(req.params.id);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }

      if (!pack.published && req.user?.role !== "admin") {
        return res.status(403).json({ error: "This pack is not published" });
      }

      res.json(pack);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch pack" });
    }
  });

  app.post("/api/packs", authenticate, requireAdmin, async (req, res) => {
    try {
      const packData = insertPackSchema.parse(req.body);
      const pack = await storage.createPack(packData);
      broadcastUpdate('pack-created', pack);
      res.status(201).json(pack);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create pack" });
    }
  });

  app.patch("/api/packs/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const packData = updatePackSchema.parse(req.body);
      const pack = await storage.updatePack(req.params.id, packData);
      if (!pack) {
        return res.status(404).json({ error: "Pack not found" });
      }
      broadcastUpdate('pack-updated', pack);
      res.json(pack);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update pack" });
    }
  });

  app.delete("/api/packs/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await storage.deletePack(req.params.id);
      broadcastUpdate('pack-deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
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
        return res.status(403).json({ error: "This pack is not published" });
      }

      const flashcards = await storage.getFlashcardsByPackId(req.params.packId);
      res.json(flashcards);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch flashcards" });
    }
  });

  app.post("/api/packs/:packId/flashcards", authenticate, requireAdmin, async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.parse({
        ...req.body,
        packId: req.params.packId,
      });
      const flashcard = await storage.createFlashcard(flashcardData);
      broadcastUpdate('flashcard-created', flashcard);
      res.status(201).json(flashcard);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create flashcard" });
    }
  });

  app.patch("/api/packs/:packId/flashcards/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const flashcardData = updateFlashcardSchema.parse(req.body);
      const flashcard = await storage.updateFlashcard(req.params.id, flashcardData);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      broadcastUpdate('flashcard-updated', flashcard);
      res.json(flashcard);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update flashcard" });
    }
  });

  app.delete("/api/packs/:packId/flashcards/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await storage.deleteFlashcard(req.params.id);
      broadcastUpdate('flashcard-deleted', { id: req.params.id, packId: req.params.packId });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete flashcard" });
    }
  });

  return httpServer;
}
