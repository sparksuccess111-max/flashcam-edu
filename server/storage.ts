import {
  users,
  packs,
  flashcards,
  accountRequests,
  messages,
  messageReads,
  type User,
  type InsertUser,
  type Pack,
  type InsertPack,
  type UpdatePack,
  type Flashcard,
  type InsertFlashcard,
  type UpdateFlashcard,
  type AccountRequest,
  type InsertAccountRequest,
  type Message,
  type InsertMessage,
  type MessageRead,
  type InsertMessageRead,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, or, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  getAllAccountRequests(): Promise<AccountRequest[]>;
  getAccountRequest(id: string): Promise<AccountRequest | undefined>;
  createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest>;
  approveAccountRequest(id: string, firstName: string, lastName: string, password: string, role: string): Promise<{ user: User; deleted: boolean }>;
  rejectAccountRequest(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getUsersByRole(role: "admin" | "student"): Promise<User[]>;

  getAllPacks(): Promise<Pack[]>;
  getPackById(id: string): Promise<Pack | undefined>;
  createPack(pack: InsertPack): Promise<Pack>;
  updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined>;
  deletePack(id: string): Promise<void>;
  incrementPackViews(id: string): Promise<void>;

  getFlashcardsByPackId(packId: string): Promise<Flashcard[]>;
  getFlashcardById(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;

  getMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getValidMessageRecipients(userId: string, userRole: string): Promise<User[]>;
  
  getUnreadConversations(userId: string): Promise<{ conversationWith: string; unreadCount: number }[]>;
  getTotalUnreadCount(userId: string): Promise<number>;
  markConversationAsRead(userId: string, otherUserId: string): Promise<void>;
  recordMessageRead(messageId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    return await db.select().from(packs).orderBy(asc(packs.order));
  }

  async getPacksBySubject(subject: string): Promise<Pack[]> {
    return await db.select().from(packs).where(eq(packs.subject, subject)).orderBy(asc(packs.order));
  }

  async getPacksByTeacher(subject: string, teacherId: string): Promise<Pack[]> {
    return await db.select().from(packs).where(and(eq(packs.subject, subject), eq(packs.createdByUserId, teacherId))).orderBy(asc(packs.order));
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

  async incrementPackViews(id: string): Promise<void> {
    await db.update(packs).set({ views: sql`${packs.views} + 1` }).where(eq(packs.id, id));
  }

  async getFlashcardsByPackId(packId: string): Promise<Flashcard[]> {
    const cards = await db.select().from(flashcards).where(eq(flashcards.packId, packId));
    const sorted = cards.sort((a, b) => a.order - b.order);
    
    // Reassign orders sequentially to fix any disorder
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await db.update(flashcards).set({ order: i }).where(eq(flashcards.id, sorted[i].id));
        sorted[i].order = i;
      }
    }
    
    return sorted;
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

  async getAllAccountRequests(): Promise<AccountRequest[]> {
    return await db.select().from(accountRequests).where(eq(accountRequests.status, "pending"));
  }

  async getAccountRequest(id: string): Promise<AccountRequest | undefined> {
    const [request] = await db.select().from(accountRequests).where(eq(accountRequests.id, id));
    return request || undefined;
  }

  async createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest> {
    const [newRequest] = await db
      .insert(accountRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async approveAccountRequest(id: string, firstName: string, lastName: string, password: string, role: string): Promise<{ user: User; deleted: boolean }> {
    const [user] = await db
      .insert(users)
      .values({ firstName, lastName, password, role })
      .returning();
    await db.delete(accountRequests).where(eq(accountRequests.id, id));
    return { user, deleted: true };
  }

  async rejectAccountRequest(id: string): Promise<void> {
    await db.delete(accountRequests).where(eq(accountRequests.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersByRole(role: "admin" | "teacher" | "student"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getMessages(userId: string): Promise<Message[]> {
    return await db.select().from(messages).where(or(eq(messages.toUserId, userId), eq(messages.fromUserId, userId))).orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    await db.update(messages).set({ read: true }).where(and(eq(messages.toUserId, userId), eq(messages.fromUserId, otherUserId), eq(messages.read, false)));
  }

  async getValidMessageRecipients(userId: string, userRole: string): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(u => {
      if (u.id === userId) return false;
      if (userRole === "admin") return true; // Admins can message anyone
      if (userRole === "teacher") return u.role === "teacher" || u.role === "admin"; // Teachers can message teachers and admins
      if (userRole === "student") return u.role === "admin" || u.role === "teacher"; // Students can message admins and teachers
      return false;
    });
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(messages).where(and(eq(messages.toUserId, userId), eq(messages.read, false)));
    return result[0]?.count || 0;
  }

  async getUnreadConversations(userId: string): Promise<{ conversationWith: string; unreadCount: number }[]> {
    const unreadMessages = await db
      .select({
        otherUserId: sql<string>`CASE WHEN ${messages.fromUserId} = ${userId} THEN ${messages.toUserId} ELSE ${messages.fromUserId} END`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.toUserId, userId),
          eq(messages.read, false)
        )
      )
      .groupBy(
        sql`CASE WHEN ${messages.fromUserId} = ${userId} THEN ${messages.toUserId} ELSE ${messages.fromUserId} END`
      );
    
    return unreadMessages.map(m => ({ conversationWith: m.otherUserId, unreadCount: m.count }));
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(messages)
      .where(and(eq(messages.toUserId, userId), eq(messages.read, false)));
    return result[0]?.count || 0;
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.toUserId, userId),
          eq(messages.fromUserId, otherUserId),
          eq(messages.read, false)
        )
      );
  }

  async recordMessageRead(messageId: string, userId: string): Promise<void> {
    try {
      await db.insert(messageReads).values({ messageId, userId });
    } catch (error) {
      // Ignore duplicate key errors
    }
  }
}

export const storage = new DatabaseStorage();
