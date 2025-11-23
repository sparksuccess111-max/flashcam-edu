import bcrypt from "bcrypt";
import { db } from "./db";
import { users, packs, flashcards } from "@shared/schema";

const SALT_ROUNDS = 10;

async function seed() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("CaMa_39.cAmA", SALT_ROUNDS);
  const tempPassword = await bcrypt.hash("temp", SALT_ROUNDS);

  const [admin] = await db.insert(users).values({
    username: "Camille Cordier",
    password: adminPassword,
    role: "admin",
    passwordSet: true,
  }).returning();

  await db.insert(users).values({
    username: "Stephen Dechelotte",
    password: tempPassword,
    role: "admin",
    passwordSet: false,
  });

  console.log("Created users:");
  console.log("  - Admin: username=Camille Cordier, password=CaMa_39.cAmA");
  console.log("  - Admin: username=Stephen Dechelotte, password=temp (change on first login)");

  const [mathPack] = await db.insert(packs).values({
    title: "Basic Mathematics",
    description: "Essential math concepts and formulas",
    published: true,
  }).returning();

  const [sciencePack] = await db.insert(packs).values({
    title: "Science Fundamentals",
    description: "Core scientific principles and theories",
    published: true,
  }).returning();

  const [draftPack] = await db.insert(packs).values({
    title: "Advanced Topics (Draft)",
    description: "Work in progress - not published yet",
    published: false,
  }).returning();

  console.log(`Created ${3} packs`);

  await db.insert(flashcards).values([
    {
      packId: mathPack.id,
      question: "What is the Pythagorean theorem?",
      answer: "a² + b² = c² (where c is the hypotenuse of a right triangle)",
    },
    {
      packId: mathPack.id,
      question: "What is the area formula for a circle?",
      answer: "A = πr² (where r is the radius)",
    },
    {
      packId: mathPack.id,
      question: "What is the quadratic formula?",
      answer: "x = (-b ± √(b² - 4ac)) / 2a",
    },
    {
      packId: sciencePack.id,
      question: "What are the three laws of motion?",
      answer: "1) Objects remain at rest or in motion unless acted upon. 2) F = ma. 3) For every action, there's an equal and opposite reaction.",
    },
    {
      packId: sciencePack.id,
      question: "What is photosynthesis?",
      answer: "The process by which plants convert light energy into chemical energy (glucose) using CO₂ and water, releasing oxygen.",
    },
    {
      packId: draftPack.id,
      question: "Sample question (not published)",
      answer: "Sample answer for draft content",
    },
  ]);

  console.log(`Created sample flashcards`);
  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin: Camille Cordier / CaMa_39.cAmA");
  console.log("  Admin: Stephen Dechelotte / temp (will set password on first login)");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
