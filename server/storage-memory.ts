import type {
  User, InsertUser, Pack, InsertPack, UpdatePack,
  Flashcard, InsertFlashcard, UpdateFlashcard,
  AccountRequest, InsertAccountRequest,
  Message, InsertMessage, MessageRead, InsertMessageRead,
} from "@shared/schema";

// Generate simple IDs without external dependencies
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export class MemoryStorage {
  private users: Map<string, User> = new Map();
  private packs: Map<string, Pack> = new Map();
  private flashcards: Map<string, Flashcard> = new Map();
  private accountRequests: Map<string, AccountRequest> = new Map();
  private messages: Map<string, Message> = new Map();
  private messageReads: Map<string, MessageRead> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { id: generateId(), ...user } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getUsersByRole(role: "admin" | "student"): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  async getAllAccountRequests(): Promise<AccountRequest[]> {
    return Array.from(this.accountRequests.values());
  }

  async getAccountRequest(id: string): Promise<AccountRequest | undefined> {
    return this.accountRequests.get(id);
  }

  async createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest> {
    const newRequest: AccountRequest = { id: generateId(), ...request } as AccountRequest;
    this.accountRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async approveAccountRequest(id: string, firstName: string, lastName: string, password: string, role: string): Promise<{ user: User; deleted: boolean }> {
    const request = this.accountRequests.get(id);
    if (!request) throw new Error("Request not found");
    this.accountRequests.delete(id);
    return {
      user: await this.createUser({ firstName, lastName, email: request.email, password, role: role as any }),
      deleted: true
    };
  }

  async rejectAccountRequest(id: string): Promise<void> {
    this.accountRequests.delete(id);
  }

  async getAllPacks(): Promise<Pack[]> {
    return Array.from(this.packs.values())
      .filter(p => p.deletedAt === null)
      .sort((a, b) => a.order - b.order);
  }

  async getDeletedPacks(): Promise<Pack[]> {
    return Array.from(this.packs.values())
      .filter(p => p.deletedAt !== null)
      .sort((a, b) => (b.deletedAt?.localeCompare(a.deletedAt || '') || 0));
  }

  async getDeletedPacksByTeacher(subject: string): Promise<Pack[]> {
    return Array.from(this.packs.values())
      .filter(p => p.subject === subject && p.deletedAt !== null);
  }

  async getPackById(id: string): Promise<Pack | undefined> {
    return this.packs.get(id);
  }

  async createPack(pack: InsertPack): Promise<Pack> {
    const newPack: Pack = { id: generateId(), views: 0, deletedAt: null, ...pack } as Pack;
    this.packs.set(newPack.id, newPack);
    return newPack;
  }

  async updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined> {
    const existing = this.packs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...pack };
    this.packs.set(id, updated);
    return updated;
  }

  async softDeletePack(id: string): Promise<void> {
    const pack = this.packs.get(id);
    if (pack) {
      pack.deletedAt = new Date().toISOString();
      this.packs.set(id, pack);
    }
  }

  async restorePack(id: string): Promise<void> {
    const pack = this.packs.get(id);
    if (pack) {
      pack.deletedAt = null;
      this.packs.set(id, pack);
    }
  }

  async permanentlyDeletePack(id: string): Promise<void> {
    this.packs.delete(id);
    Array.from(this.flashcards.values())
      .filter(f => f.packId === id)
      .forEach(f => this.flashcards.delete(f.id));
  }

  async incrementPackViews(id: string): Promise<void> {
    const pack = this.packs.get(id);
    if (pack) {
      pack.views = (pack.views || 0) + 1;
      this.packs.set(id, pack);
    }
  }

  async getFlashcardsByPackId(packId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values())
      .filter(f => f.packId === packId)
      .sort((a, b) => a.order - b.order);
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const newFlashcard: Flashcard = { id: generateId(), ...flashcard } as Flashcard;
    this.flashcards.set(newFlashcard.id, newFlashcard);
    return newFlashcard;
  }

  async updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined> {
    const existing = this.flashcards.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...flashcard };
    this.flashcards.set(id, updated);
    return updated;
  }

  async deleteFlashcard(id: string): Promise<void> {
    this.flashcards.delete(id);
  }

  async getMessages(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.senderId === userId || m.recipientId === userId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = { id: generateId(), ...message } as Message;
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    const msg = this.messages.get(id);
    if (msg) msg.isRead = true;
  }

  async getValidMessageRecipients(userId: string, userRole: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(u => u.id !== userId && userRole === 'admin' || (userRole === 'student' && u.role === 'admin'));
  }

  async getUnreadConversations(userId: string): Promise<{ conversationWith: string; unreadCount: number }[]> {
    const unread = new Map<string, number>();
    Array.from(this.messages.values())
      .filter(m => m.recipientId === userId && !m.isRead)
      .forEach(m => {
        unread.set(m.senderId, (unread.get(m.senderId) || 0) + 1);
      });
    return Array.from(unread.entries()).map(([userId, count]) => ({
      conversationWith: userId,
      unreadCount: count
    }));
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    return Array.from(this.messages.values())
      .filter(m => m.recipientId === userId && !m.isRead).length;
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    Array.from(this.messages.values())
      .filter(m => m.recipientId === userId && m.senderId === otherUserId && !m.isRead)
      .forEach(m => m.isRead = true);
  }

  async recordMessageRead(messageId: string, userId: string): Promise<void> {
    const read: MessageRead = { id: generateId(), messageId, userId, readAt: new Date().toISOString() };
    this.messageReads.set(read.id, read);
  }

  async deleteOldMessages(): Promise<number> {
    return 0;
  }
}
