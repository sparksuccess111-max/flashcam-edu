import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull().unique(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "student"] }).notNull().default("student"),
});

export const packs = pgTable("packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  published: boolean("published").notNull().default(false),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packId: varchar("pack_id").notNull().references(() => packs.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
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
  password: z.string().min(1, "Password is required"),
});

export const insertPackSchema = createInsertSchema(packs).omit({ id: true });
export const updatePackSchema = insertPackSchema.partial();

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true });
export const updateFlashcardSchema = insertFlashcardSchema.partial().omit({ packId: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type InsertPack = z.infer<typeof insertPackSchema>;
export type UpdatePack = z.infer<typeof updatePackSchema>;
export type Pack = typeof packs.$inferSelect;

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type UpdateFlashcard = z.infer<typeof updateFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
