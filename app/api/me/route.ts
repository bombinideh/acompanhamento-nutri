import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { metasFromRecord } from "@/lib/metas";
import { getSession } from "@/lib/require-auth";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/password";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const user = await getPrisma().user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...metasFromRecord(user),
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const user = await getPrisma().user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? user.name).trim();
  const email = normalizeEmail(String(body?.email ?? user.email));
  const newPassword = typeof body?.password === "string" ? body.password.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (!name || !email.includes("@")) {
    return NextResponse.json({ erro: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  const data: { name: string; email: string; passwordHash?: string } = { name, email };

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ erro: "A nova senha precisa ter no mínimo 6 caracteres." }, { status: 400 });
    }
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ erro: "Senha atual incorreta." }, { status: 400 });
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  try {
    const updated = await getPrisma().user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      ...metasFromRecord(updated),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ erro: "Este e-mail já está em uso." }, { status: 409 });
    }
    return NextResponse.json({ erro: "Não foi possível salvar." }, { status: 500 });
  }
}
