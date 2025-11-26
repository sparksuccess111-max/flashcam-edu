import { firestore, auth } from './firebase';
import type {
  User, InsertUser, Pack, InsertPack, UpdatePack,
  Flashcard, InsertFlashcard, UpdateFlashcard,
  AccountRequest, InsertAccountRequest,
  Message, InsertMessage, MessageRead, InsertMessageRead,
} from "@shared/schema";
import { Timestamp } from 'firebase-admin/firestore';

export interface IStorageFirebase {
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
  getDeletedPacks(): Promise<Pack[]>;
  getDeletedPacksByTeacher(subject: string): Promise<Pack[]>;
  getPackById(id: string): Promise<Pack | undefined>;
  createPack(pack: InsertPack): Promise<Pack>;
  updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined>;
  softDeletePack(id: string): Promise<void>;
  restorePack(id: string): Promise<void>;
  permanentlyDeletePack(id: string): Promise<void>;
  incrementPackViews(id: string): Promise<void>;
  getPacksBySubject(subject: string): Promise<Pack[]>;
  getPacksByTeacher(subject: string, teacherId: string): Promise<Pack[]>;

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
  deleteOldMessages(): Promise<number>;
}

export class FirestoreStorage implements IStorageFirebase {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await firestore.collection('users').doc(id).get();
    return doc.exists ? (doc.data() as User) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await firestore.collection('users').get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userId = firestore.collection('users').doc().id;
    const user: User = {
      id: userId,
      ...insertUser,
    } as User;
    await firestore.collection('users').doc(userId).set(user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    await firestore.collection('users').doc(id).update(updateData);
    return this.getUser(id);
  }

  async getAllPacks(): Promise<Pack[]> {
    const snapshot = await firestore.collection('packs')
      .where('deletedAt', '==', null)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Pack);
  }

  async getPacksBySubject(subject: string): Promise<Pack[]> {
    const snapshot = await firestore.collection('packs')
      .where('subject', '==', subject)
      .where('deletedAt', '==', null)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Pack);
  }

  async getPacksByTeacher(subject: string, teacherId: string): Promise<Pack[]> {
    const snapshot = await firestore.collection('packs')
      .where('subject', '==', subject)
      .where('createdByUserId', '==', teacherId)
      .where('deletedAt', '==', null)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Pack);
  }

  async getDeletedPacks(): Promise<Pack[]> {
    const snapshot = await firestore.collection('packs')
      .where('deletedAt', '!=', null)
      .orderBy('deletedAt', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Pack);
  }

  async getDeletedPacksByTeacher(subject: string): Promise<Pack[]> {
    const snapshot = await firestore.collection('packs')
      .where('subject', '==', subject)
      .where('deletedAt', '!=', null)
      .orderBy('deletedAt', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Pack);
  }

  async getPackById(id: string): Promise<Pack | undefined> {
    const doc = await firestore.collection('packs').doc(id).get();
    return doc.exists ? (doc.data() as Pack) : undefined;
  }

  async createPack(insertPack: InsertPack): Promise<Pack> {
    const packId = firestore.collection('packs').doc().id;
    const pack: Pack = {
      id: packId,
      views: 0,
      ...insertPack,
      deletedAt: null,
    } as Pack;
    await firestore.collection('packs').doc(packId).set(pack);
    return pack;
  }

  async updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined> {
    await firestore.collection('packs').doc(id).update(pack);
    return this.getPackById(id);
  }

  async softDeletePack(id: string): Promise<void> {
    await firestore.collection('packs').doc(id).update({
      deletedAt: new Date().toISOString(),
    });
  }

  async restorePack(id: string): Promise<void> {
    await firestore.collection('packs').doc(id).update({
      deletedAt: null,
    });
  }

  async permanentlyDeletePack(id: string): Promise<void> {
    await firestore.collection('packs').doc(id).delete();
    const flashcards = await this.getFlashcardsByPackId(id);
    for (const fc of flashcards) {
      await this.deleteFlashcard(fc.id);
    }
  }

  async incrementPackViews(id: string): Promise<void> {
    const pack = await this.getPackById(id);
    if (pack) {
      await firestore.collection('packs').doc(id).update({
        views: (pack.views || 0) + 1,
      });
    }
  }

  async getFlashcardsByPackId(packId: string): Promise<Flashcard[]> {
    const snapshot = await firestore.collection('flashcards')
      .where('packId', '==', packId)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Flashcard);
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    const doc = await firestore.collection('flashcards').doc(id).get();
    return doc.exists ? (doc.data() as Flashcard) : undefined;
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const fcId = firestore.collection('flashcards').doc().id;
    const flashcard: Flashcard = {
      id: fcId,
      ...insertFlashcard,
    } as Flashcard;
    await firestore.collection('flashcards').doc(fcId).set(flashcard);
    return flashcard;
  }

  async updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined> {
    await firestore.collection('flashcards').doc(id).update(flashcard);
    return this.getFlashcardById(id);
  }

  async deleteFlashcard(id: string): Promise<void> {
    await firestore.collection('flashcards').doc(id).delete();
  }

  async getAllAccountRequests(): Promise<AccountRequest[]> {
    const snapshot = await firestore.collection('accountRequests').get();
    return snapshot.docs.map(doc => doc.data() as AccountRequest);
  }

  async getAccountRequest(id: string): Promise<AccountRequest | undefined> {
    const doc = await firestore.collection('accountRequests').doc(id).get();
    return doc.exists ? (doc.data() as AccountRequest) : undefined;
  }

  async createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest> {
    const reqId = firestore.collection('accountRequests').doc().id;
    const accountReq: AccountRequest = {
      id: reqId,
      status: 'pending',
      ...request,
    } as AccountRequest;
    await firestore.collection('accountRequests').doc(reqId).set(accountReq);
    return accountReq;
  }

  async approveAccountRequest(id: string, firstName: string, lastName: string, password: string, role: string): Promise<{ user: User; deleted: boolean }> {
    await firestore.collection('accountRequests').doc(id).delete();
    const user = await this.createUser({ firstName, lastName, password, role: role as any });
    return { user, deleted: true };
  }

  async rejectAccountRequest(id: string): Promise<void> {
    await firestore.collection('accountRequests').doc(id).delete();
  }

  async deleteUser(id: string): Promise<void> {
    await firestore.collection('users').doc(id).delete();
  }

  async getUsersByRole(role: "admin" | "student"): Promise<User[]> {
    const snapshot = await firestore.collection('users').where('role', '==', role).get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  async getMessages(userId: string): Promise<Message[]> {
    const snapshot = await firestore.collection('messages')
      .where('toUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Message);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const msgId = firestore.collection('messages').doc().id;
    const msg: Message = {
      id: msgId,
      read: false,
      createdAt: new Date().toISOString(),
      ...message,
    } as Message;
    await firestore.collection('messages').doc(msgId).set(msg);
    return msg;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await firestore.collection('messages').doc(id).update({ read: true });
  }

  async getValidMessageRecipients(userId: string, userRole: string): Promise<User[]> {
    const allUsers = await this.getAllUsers();
    return userRole === 'admin' ? allUsers.filter(u => u.id !== userId) : allUsers.filter(u => u.role === 'admin' && u.id !== userId);
  }

  async getUnreadConversations(userId: string): Promise<{ conversationWith: string; unreadCount: number }[]> {
    const snapshot = await firestore.collection('messages')
      .where('toUserId', '==', userId)
      .where('read', '==', false)
      .get();
    const conversations: { [key: string]: number } = {};
    snapshot.docs.forEach(doc => {
      const msg = doc.data() as Message;
      conversations[msg.fromUserId] = (conversations[msg.fromUserId] || 0) + 1;
    });
    return Object.entries(conversations).map(([userId, count]) => ({
      conversationWith: userId,
      unreadCount: count,
    }));
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const snapshot = await firestore.collection('messages')
      .where('toUserId', '==', userId)
      .where('read', '==', false)
      .get();
    return snapshot.size;
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    const snapshot = await firestore.collection('messages')
      .where('toUserId', '==', userId)
      .where('fromUserId', '==', otherUserId)
      .where('read', '==', false)
      .get();
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  async recordMessageRead(messageId: string, userId: string): Promise<void> {
    await firestore.collection('messageReads').add({
      messageId,
      userId,
      readAt: new Date().toISOString(),
    });
  }

  async deleteOldMessages(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const snapshot = await firestore.collection('messages')
      .where('createdAt', '<', sevenDaysAgo.toISOString())
      .get();
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return snapshot.size;
  }
}

export const storage = new FirestoreStorage();
