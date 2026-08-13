import type { Role } from "@/lib/auth";
import { hashPassword, normalizeEmail } from "@/lib/password";
import { getPrisma } from "@/lib/prisma";

export type NewUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
  nutriId?: string | null;
};

export async function findUserByEmail(email: string) {
  return getPrisma().user.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export async function createUser(input: NewUser) {
  return getPrisma().user.create({
    data: {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      passwordHash: await hashPassword(input.password),
      role: input.role,
      nutriId: input.role === "paciente" ? input.nutriId || null : null,
    },
  });
}

export async function findPacienteDaNutri(nutriId: string, pacienteId: string) {
  return getPrisma().user.findFirst({
    where: {
      id: pacienteId,
      role: "paciente",
      OR: [{ nutriId }, { nutriId: null }],
    },
  });
}

export async function resolveNutriId(nutriId?: string, nutriEmail?: string) {
  const prisma = getPrisma();
  if (nutriId) {
    const nutri = await prisma.user.findFirst({ where: { id: nutriId, role: "nutri" } });
    return nutri?.id || null;
  }
  if (nutriEmail) {
    const nutri = await prisma.user.findFirst({
      where: { email: normalizeEmail(nutriEmail), role: "nutri" },
    });
    return nutri?.id || null;
  }
  const nutris = await prisma.user.findMany({ where: { role: "nutri" }, take: 2 });
  return nutris.length === 1 ? nutris[0].id : null;
}
