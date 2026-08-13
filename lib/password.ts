import { compare, hash } from "bcryptjs";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  if (!password.trim()) {
    throw new Error("Senha vazia não pode ser gravada.");
  }
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash) return false;
  return compare(password, passwordHash);
}
