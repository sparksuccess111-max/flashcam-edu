import bcrypt from "bcrypt";
import { db } from "./db";
import { users, packs, flashcards } from "@shared/schema";

const SALT_ROUNDS = 10;

async function seed() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const studentPassword = await bcrypt.hash("student123", SALT_ROUNDS);

  const [admin] = await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    role: "admin",
  }).returning();

  const [student] = await db.insert(users).values({
    username: "student",
    password: studentPassword,
    role: "student",
  }).returning();

  console.log("Created users:");
  console.log("  - Admin: username=admin, password=admin123");
  console.log("  - Student: username=student, password=student123");

  const [mathPack] = await db.insert(packs).values({
    title: "Basic Mathematics",
    description: "Essential math concepts and formulas",
    order: 0,
    published: true,
  }).returning();

  const [sciencePack] = await db.insert(packs).values({
    title: "Science Fundamentals",
    description: "Core scientific principles and theories",
    order: 1,
    published: true,
  }).returning();

  const [draftPack] = await db.insert(packs).values({
    title: "Advanced Topics (Draft)",
    description: "Work in progress - not published yet",
    order: 2,
    published: false,
  }).returning();

  console.log(`Created ${3} packs`);

  await db.insert(flashcards).values([
    {
      packId: mathPack.id,
      question: "What is the Pythagorean theorem?",
      answer: "a² + b² = c² (where c is the hypotenuse of a right triangle)",
      order: 0,
    },
    {
      packId: mathPack.id,
      question: "What is the area formula for a circle?",
      answer: "A = πr² (where r is the radius)",
      order: 1,
    },
    {
      packId: mathPack.id,
      question: "What is the quadratic formula?",
      answer: "x = (-b ± √(b² - 4ac)) / 2a",
      order: 2,
    },
    {
      packId: sciencePack.id,
      question: "What are the three laws of motion?",
      answer: "1) Objects remain at rest or in motion unless acted upon. 2) F = ma. 3) For every action, there's an equal and opposite reaction.",
      order: 0,
    },
    {
      packId: sciencePack.id,
      question: "What is photosynthesis?",
      answer: "The process by which plants convert light energy into chemical energy (glucose) using CO₂ and water, releasing oxygen.",
      order: 1,
    },
    {
      packId: draftPack.id,
      question: "Sample question (not published)",
      answer: "Sample answer for draft content",
      order: 0,
    },
  ]);

  console.log(`Created sample flashcards`);
  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin: admin / admin123");
  console.log("  Student: student / student123");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
