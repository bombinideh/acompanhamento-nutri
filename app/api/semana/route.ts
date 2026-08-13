import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getSession, requireAuth, requireRole } from "@/lib/require-auth";
import { findPacienteDaNutri } from "@/lib/users";
import { emptyWeek, mergeWeek, mondayIso, type Semana } from "@/lib/week";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const inicio = mondayIso(searchParams.get("inicio"));
  let patientId = session.userId;

  if (session.role === "nutri") {
    const requested = searchParams.get("pacienteId");
    if (!requested) {
      return NextResponse.json({ erro: "Selecione uma paciente." }, { status: 400 });
    }
    const paciente = await findPacienteDaNutri(session.userId, requested);
    if (!paciente) {
      return NextResponse.json({ erro: "Paciente não encontrada." }, { status: 404 });
    }
    patientId = paciente.id;
  }

  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  const row = await prisma.week.findUnique({
    where: { patientId_weekStart: { patientId, weekStart: inicio } },
  });
  if (!row) {
    return NextResponse.json({ ...emptyWeek(inicio, patient?.name || ""), updatedAt: null });
  }
  return NextResponse.json({
    ...mergeWeek(row.payload as Partial<Semana>, inicio, patient?.name || ""),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function POST(request: Request) {
  const forbidden = await requireRole("paciente");
  if (forbidden) return forbidden;
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const patientId = session.userId;

  const prisma = getPrisma();
  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  const body = await request.json();
  const inicio = mondayIso(body?.semanaInicio);
  const existing = await prisma.week.findUnique({
    where: { patientId_weekStart: { patientId, weekStart: inicio } },
  });
  const payload = mergeWeek(body, inicio, patient?.name || body?.paciente || "");
  payload.comentarioNutri = existing
    ? mergeWeek(existing.payload as Partial<Semana>, inicio).comentarioNutri
    : "";
  const row = await prisma.week.upsert({
    where: { patientId_weekStart: { patientId, weekStart: inicio } },
    update: { payload: payload as unknown as Prisma.InputJsonValue },
    create: {
      patientId,
      weekStart: inicio,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ ok: true, semanaInicio: inicio, updatedAt: row.updatedAt.toISOString() });
}

export async function PATCH(request: Request) {
  const forbidden = await requireRole("nutri");
  if (forbidden) return forbidden;
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const pacienteId = String(body?.pacienteId || "");
  const inicio = mondayIso(body?.semanaInicio);
  const comentarioNutri = String(body?.comentarioNutri ?? "").slice(0, 1500);

  const paciente = await findPacienteDaNutri(session.userId, pacienteId);
  if (!paciente) {
    return NextResponse.json({ erro: "Paciente não encontrada." }, { status: 404 });
  }

  const prisma = getPrisma();
  const existing = await prisma.week.findUnique({
    where: { patientId_weekStart: { patientId: paciente.id, weekStart: inicio } },
  });
  const payload = mergeWeek(existing?.payload as Partial<Semana> | undefined, inicio, paciente.name);
  payload.comentarioNutri = comentarioNutri;

  const row = await prisma.week.upsert({
    where: { patientId_weekStart: { patientId: paciente.id, weekStart: inicio } },
    update: { payload: payload as unknown as Prisma.InputJsonValue },
    create: {
      patientId: paciente.id,
      weekStart: inicio,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ ok: true, semanaInicio: inicio, updatedAt: row.updatedAt.toISOString() });
}
