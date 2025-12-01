import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull().default("student"),
  subject: text("subject", { enum: ["Histoire-Géo", "Maths", "Français", "SVT", "Anglais", "Physique-Chimie", "Technologie", "Éducation Physique"] }),
});

export const accountRequests = pgTable("account_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  requestedRole: text("requested_role", { enum: ["admin", "teacher", "student"] }).notNull().default("student"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
  read: boolean("read").notNull().default(false),
});

export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: text("read_at").notNull().default(sql`now()`),
});

export const packs = pgTable("packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  subject: text("subject", { enum: ["Histoire-Géo", "Maths", "Français", "SVT", "Anglais", "Physique-Chimie", "Technologie", "Éducation Physique"] }).notNull(),
  createdByUserId: varchar("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  views: integer("views").notNull().default(0),
  deletedAt: text("deleted_at"),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packId: varchar("pack_id").notNull().references(() => packs.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
});

export const packsRelations = relations(packs, ({ many }) => ({
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  pack: one(packs, {
    fields: [flashcards.packId],
    references: [packs.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const loginSchema = z.object({
  firstName: z.string().min(1, "Prénom is required"),
  lastName: z.string().min(1, "Nom is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, "Prénom is required"),
  lastName: z.string().min(1, "Nom is required"),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmation du mot de passe est requise"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const signupBackendSchema = z.object({
  firstName: z.string().min(1, "Prénom is required"),
  lastName: z.string().min(1, "Nom is required"),
  email: z.string().email("Email must be valid"),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
});

export const insertAccountRequestSchema = createInsertSchema(accountRequests).omit({ id: true, status: true });
export const insertPackSchema = createInsertSchema(packs).omit({ id: true });
export const updatePackSchema = insertPackSchema.partial().omit({ subject: true });

export const SUBJECTS = ["Histoire-Géo", "Maths", "Français", "SVT", "Anglais", "Physique-Chimie", "Technologie", "Éducation Physique"] as const;

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true });
export const updateFlashcardSchema = insertFlashcardSchema.partial().omit({ packId: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type AccountRequest = typeof accountRequests.$inferSelect;
export type InsertAccountRequest = z.infer<typeof insertAccountRequestSchema>;

export type InsertPack = z.infer<typeof insertPackSchema>;
export type UpdatePack = z.infer<typeof updatePackSchema>;
export type Pack = typeof packs.$inferSelect;

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type UpdateFlashcard = z.infer<typeof updateFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

export type Message = typeof messages.$inferSelect;
export const insertMessageSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  content: z.string().min(1, "Message is required"),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MessageRead = typeof messageReads.$inferSelect;
export const insertMessageReadSchema = z.object({
  messageId: z.string(),
  userId: z.string(),
});
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;
