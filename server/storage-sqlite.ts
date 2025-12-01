import Database from 'better-sqlite3';
import path from 'path';
import type {
  User, InsertUser, Pack, InsertPack, UpdatePack,
  Flashcard, InsertFlashcard, UpdateFlashcard,
  AccountRequest, InsertAccountRequest,
  Message, InsertMessage, MessageRead, InsertMessageRead,
} from "@shared/schema";

// Generate simple IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/flashcamedu.db'
  : path.join(process.cwd(), 'flashcamedu.db');

export class SQLiteStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables() {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        subject TEXT
      );

      CREATE TABLE IF NOT EXISTS packs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        published INTEGER DEFAULT 0,
        subject TEXT NOT NULL,
        createdByUserId TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        deletedAt TEXT,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY(createdByUserId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        packId TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY(packId) REFERENCES packs(id)
      );

      CREATE TABLE IF NOT EXISTS accountRequests (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        requestedRole TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        fromUserId TEXT NOT NULL,
        toUserId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(fromUserId) REFERENCES users(id),
        FOREIGN KEY(toUserId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messageReads (
        id TEXT PRIMARY KEY,
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        readAt TEXT NOT NULL,
        FOREIGN KEY(messageId) REFERENCES messages(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `);
  }

  async getUser(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users');
    return stmt.all() as User[];
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = generateId();
    const stmt = this.db.prepare(
      'INSERT INTO users (id, firstName, lastName, email, password, role, subject) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, user.firstName, user.lastName, user.email, user.password, user.role, user.subject);
    return { id, ...user } as User;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const existing = await this.getUser(id);
    if (!existing) return undefined;
    
    const updates = Object.entries(user)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`)
      .join(', ');
    
    const values = Object.entries(user)
      .filter(([key]) => key !== 'id')
      .map(([_, val]) => val);

    if (updates) {
      const stmt = this.db.prepare(`UPDATE users SET ${updates} WHERE id = ?`);
      stmt.run(...values, id);
    }
    
    return { ...existing, ...user } as User;
  }

  async deleteUser(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  async getUsersByRole(role: "admin" | "student"): Promise<User[]> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE role = ?');
    return stmt.all(role) as User[];
  }

  async getAllAccountRequests(): Promise<AccountRequest[]> {
    const stmt = this.db.prepare('SELECT * FROM accountRequests');
    return stmt.all() as AccountRequest[];
  }

  async getAccountRequest(id: string): Promise<AccountRequest | undefined> {
    const stmt = this.db.prepare('SELECT * FROM accountRequests WHERE id = ?');
    return stmt.get(id) as AccountRequest | undefined;
  }

  async createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest> {
    const id = generateId();
    const stmt = this.db.prepare(
      'INSERT INTO accountRequests (id, firstName, lastName, email, password, requestedRole) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, request.firstName, request.lastName, request.email, request.password, request.requestedRole);
    return { id, ...request } as AccountRequest;
  }

  async approveAccountRequest(id: string, firstName: string, lastName: string, password: string, role: string): Promise<{ user: User; deleted: boolean }> {
    const request = await this.getAccountRequest(id);
    if (!request) throw new Error("Request not found");
    
    const user = await this.createUser({
      firstName,
      lastName,
      email: request.email,
      password,
      role: role as any
    });
    
    const deleteStmt = this.db.prepare('DELETE FROM accountRequests WHERE id = ?');
    deleteStmt.run(id);
    
    return { user, deleted: true };
  }

  async rejectAccountRequest(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM accountRequests WHERE id = ?');
    stmt.run(id);
  }

  async getAllPacks(): Promise<Pack[]> {
    const stmt = this.db.prepare('SELECT * FROM packs WHERE deletedAt IS NULL ORDER BY "order"');
    return stmt.all() as Pack[];
  }

  async getDeletedPacks(): Promise<Pack[]> {
    const stmt = this.db.prepare('SELECT * FROM packs WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
    return stmt.all() as Pack[];
  }

  async getDeletedPacksByTeacher(subject: string): Promise<Pack[]> {
    const stmt = this.db.prepare('SELECT * FROM packs WHERE subject = ? AND deletedAt IS NOT NULL');
    return stmt.all(subject) as Pack[];
  }

  async getPackById(id: string): Promise<Pack | undefined> {
    const stmt = this.db.prepare('SELECT * FROM packs WHERE id = ?');
    return stmt.get(id) as Pack | undefined;
  }

  async createPack(pack: InsertPack): Promise<Pack> {
    const id = generateId();
    const stmt = this.db.prepare(
      'INSERT INTO packs (id, title, description, published, subject, createdByUserId, views, deletedAt, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, pack.title, pack.description, pack.published ? 1 : 0, pack.subject, pack.createdByUserId, 0, null, 0);
    return { id, views: 0, deletedAt: null, ...pack } as Pack;
  }

  async updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined> {
    const existing = await this.getPackById(id);
    if (!existing) return undefined;
    
    const updates = Object.entries(pack)
      .filter(([key]) => key !== 'id')
      .map(([key]) => key === 'published' ? 'published = ?' : `${key} = ?`)
      .join(', ');
    
    const values = Object.entries(pack)
      .filter(([key]) => key !== 'id')
      .map(([key, val]) => key === 'published' ? (val ? 1 : 0) : val);

    if (updates) {
      const stmt = this.db.prepare(`UPDATE packs SET ${updates} WHERE id = ?`);
      stmt.run(...values, id);
    }
    
    return { ...existing, ...pack } as Pack;
  }

  async softDeletePack(id: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE packs SET deletedAt = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
  }

  async restorePack(id: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE packs SET deletedAt = NULL WHERE id = ?');
    stmt.run(id);
  }

  async permanentlyDeletePack(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM packs WHERE id = ?');
    stmt.run(id);
  }

  async incrementPackViews(id: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE packs SET views = views + 1 WHERE id = ?');
    stmt.run(id);
  }

  async getFlashcardsByPackId(packId: string): Promise<Flashcard[]> {
    const stmt = this.db.prepare('SELECT * FROM flashcards WHERE packId = ? ORDER BY "order"');
    return stmt.all(packId) as Flashcard[];
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    const stmt = this.db.prepare('SELECT * FROM flashcards WHERE id = ?');
    return stmt.get(id) as Flashcard | undefined;
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const id = generateId();
    const stmt = this.db.prepare(
      'INSERT INTO flashcards (id, packId, front, back, "order") VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, flashcard.packId, flashcard.front, flashcard.back, 0);
    return { id, ...flashcard } as Flashcard;
  }

  async updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined> {
    const existing = await this.getFlashcardById(id);
    if (!existing) return undefined;
    
    const updates = Object.entries(flashcard)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`)
      .join(', ');
    
    const values = Object.entries(flashcard)
      .filter(([key]) => key !== 'id')
      .map(([_, val]) => val);

    if (updates) {
      const stmt = this.db.prepare(`UPDATE flashcards SET ${updates} WHERE id = ?`);
      stmt.run(...values, id);
    }
    
    return { ...existing, ...flashcard } as Flashcard;
  }

  async deleteFlashcard(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM flashcards WHERE id = ?');
    stmt.run(id);
  }

  async getMessages(userId: string): Promise<Message[]> {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE fromUserId = ? OR toUserId = ? ORDER BY createdAt DESC');
    return stmt.all(userId, userId) as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = generateId();
    const stmt = this.db.prepare(
      'INSERT INTO messages (id, fromUserId, toUserId, content, createdAt) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, message.fromUserId, message.toUserId, message.content, new Date().toISOString());
    return { id, ...message, createdAt: new Date().toISOString() } as Message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    // Implementation if needed
  }

  async getValidMessageRecipients(userId: string, userRole: string): Promise<User[]> {
    if (userRole === 'admin') {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id != ?');
      return stmt.all(userId) as User[];
    }
    
    const stmt = this.db.prepare('SELECT * FROM users WHERE role = ? AND id != ?');
    return stmt.all('admin', userId) as User[];
  }

  async getUnreadConversations(userId: string): Promise<{ conversationWith: string; unreadCount: number }[]> {
    return [];
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    return 0;
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    // Implementation if needed
  }

  async recordMessageRead(messageId: string, userId: string): Promise<void> {
    // Implementation if needed
  }

  async deleteOldMessages(): Promise<number> {
    return 0;
  }
}
