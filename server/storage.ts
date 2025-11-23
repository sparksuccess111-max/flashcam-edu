import {
  users,
  packs,
  flashcards,
  type User,
  type InsertUser,
  type Pack,
  type InsertPack,
  type UpdatePack,
  type Flashcard,
  type InsertFlashcard,
  type UpdateFlashcard,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  getAllPacks(): Promise<Pack[]>;
  getPackById(id: string): Promise<Pack | undefined>;
  createPack(pack: InsertPack): Promise<Pack>;
  updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined>;
  deletePack(id: string): Promise<void>;

  getFlashcardsByPackId(packId: string): Promise<Flashcard[]>;
  getFlashcardById(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllPacks(): Promise<Pack[]> {
    return await db.select().from(packs);
  }

  async getPackById(id: string): Promise<Pack | undefined> {
    const [pack] = await db.select().from(packs).where(eq(packs.id, id));
    return pack || undefined;
  }

  async createPack(insertPack: InsertPack): Promise<Pack> {
    const [pack] = await db.insert(packs).values(insertPack).returning();
    return pack;
  }

  async updatePack(id: string, updatePack: UpdatePack): Promise<Pack | undefined> {
    const [pack] = await db
      .update(packs)
      .set(updatePack)
      .where(eq(packs.id, id))
      .returning();
    return pack || undefined;
  }

  async deletePack(id: string): Promise<void> {
    await db.delete(packs).where(eq(packs.id, id));
  }

  async getFlashcardsByPackId(packId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.packId, packId));
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return flashcard || undefined;
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db
      .insert(flashcards)
      .values(insertFlashcard)
      .returning();
    return flashcard;
  }

  async updateFlashcard(id: string, updateFlashcard: UpdateFlashcard): Promise<Flashcard | undefined> {
    const [flashcard] = await db
      .update(flashcards)
      .set(updateFlashcard)
      .where(eq(flashcards.id, id))
      .returning();
    return flashcard || undefined;
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }
}

export const storage = new DatabaseStorage();
