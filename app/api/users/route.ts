import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuthSecret } from "@/lib/auth";
import { createUser, resolveNutriId } from "@/lib/users";
import { normalizeEmail } from "@/lib/password";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  try {
    const secret = requireAuthSecret();
    const header = request.headers.get("x-api-key") || "";
    return header === secret;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const email = normalizeEmail(String(body?.email || ""));
  const password = String(body?.password || "");
  const role = body?.role === "nutri" ? "nutri" : body?.role === "paciente" ? "paciente" : null;

  if (!name || !email.includes("@") || password.length < 6 || !role) {
    return NextResponse.json(
      { erro: "Envie name, email, password (mínimo 6) e role (paciente ou nutri)." },
      { status: 400 },
    );
  }

  let nutriId: string | null = null;
  if (role === "paciente") {
    nutriId = await resolveNutriId(body?.nutriId, body?.nutriEmail);
    if (!nutriId) {
      return NextResponse.json(
        { erro: "Informe nutriEmail da nutricionista ou cadastre a nutri primeiro." },
        { status: 400 },
      );
    }
  }

  try {
    const user = await createUser({ name, email, password, role, nutriId });
    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role, nutriId: user.nutriId },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ erro: "Não foi possível criar o usuário." }, { status: 500 });
  }
}
