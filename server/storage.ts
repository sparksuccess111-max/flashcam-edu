// DEPRECATED: This file is no longer used
// Storage is now provided by storage-selector.ts which uses:
// - SQLiteStorage (primary, reliable, persistent)
// - FirestoreStorage (fallback if Firebase is configured)
// - MemoryStorage (final fallback)
//
// This file is kept only for reference and backward compatibility.
// DO NOT USE - All imports should be from storage-selector.ts

import type {
  User, InsertUser, Pack, InsertPack, UpdatePack,
  Flashcard, InsertFlashcard, UpdateFlashcard,
  AccountRequest, InsertAccountRequest,
  Message, InsertMessage, MessageRead, InsertMessageRead,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getPack(id: string): Promise<Pack | undefined>;
  getAllPacks(): Promise<Pack[]>;
  getPacksBySubject(subject: string): Promise<Pack[]>;
  getPacksByTeacher(teacherId: string): Promise<Pack[]>;
  getDeletedPacks(): Promise<Pack[]>;
  getDeletedPacksBySubject(subject: string): Promise<Pack[]>;
  createPack(pack: InsertPack): Promise<Pack>;
  updatePack(id: string, pack: UpdatePack): Promise<Pack | undefined>;
  softDeletePack(id: string): Promise<void>;
  restorePack(id: string): Promise<void>;
  hardDeletePack(id: string): Promise<void>;
  incrementPackViews(id: string): Promise<void>;

  getFlashcards(packId: string): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, flashcard: UpdateFlashcard): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;

  getAccountRequests(): Promise<AccountRequest[]>;
  createAccountRequest(request: InsertAccountRequest): Promise<AccountRequest>;
  deleteAccountRequest(id: string): Promise<void>;

  getMessages(toUserId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteOldMessages(): Promise<number>;

  getMessageReads(messageId: string): Promise<MessageRead[]>;
  createMessageRead(read: InsertMessageRead): Promise<MessageRead>;
}
