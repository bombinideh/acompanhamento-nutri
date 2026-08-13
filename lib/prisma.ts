import { cache } from "react";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida.");
  }
  const adapter = new PrismaPg({ connectionString, max: 1, maxUses: 1 });
  return new PrismaClient({ adapter });
}

export const getPrisma = cache(createPrisma);
