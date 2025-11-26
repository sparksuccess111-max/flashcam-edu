import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase";
import type { User } from "@shared/schema";

export interface AuthRequest extends Request {
  user?: User;
  firebaseUid?: string;
}

export async function firebaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function optionalFirebaseAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (token) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.firebaseUid = decodedToken.uid;
    } catch (error) {
      // Invalid token, continue without auth
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireTeacherOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Teacher or Admin access required" });
  }
  next();
}
