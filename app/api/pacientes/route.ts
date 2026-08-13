import { NextResponse } from "next/server";
import { metasFromRecord, parseMeta } from "@/lib/metas";
import { getPrisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/require-auth";
import { findPacienteDaNutri } from "@/lib/users";

export const runtime = "nodejs";

const pacienteSelect = {
  id: true,
  name: true,
  email: true,
  metaSono: true,
  metaH2o: true,
  metaAcademia: true,
  metaDiasCompletos: true,
} as const;

export async function GET() {
  const forbidden = await requireRole("nutri");
  if (forbidden) return forbidden;
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const rows = await getPrisma().user.findMany({
    where: {
      role: "paciente",
      OR: [{ nutriId: session.userId }, { nutriId: null }],
    },
    orderBy: { name: "asc" },
    select: pacienteSelect,
  });

  return NextResponse.json({
    pacientes: rows.map((paciente) => ({
      id: paciente.id,
      name: paciente.name,
      email: paciente.email,
      ...metasFromRecord(paciente),
    })),
  });
}

export async function PATCH(request: Request) {
  const forbidden = await requireRole("nutri");
  if (forbidden) return forbidden;
  const session = await getSession();
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const pacienteId = String(body?.pacienteId || "");
  const paciente = await findPacienteDaNutri(session.userId, pacienteId);
  if (!paciente) {
    return NextResponse.json({ erro: "Paciente não encontrada." }, { status: 404 });
  }

  try {
    const updated = await getPrisma().user.update({
      where: { id: paciente.id },
      data: {
        metaSono: parseMeta(body?.metaSono, 0, 14),
        metaH2o: parseMeta(body?.metaH2o, 0, 8),
        metaAcademia: parseMeta(body?.metaAcademia, 0, 7, true),
        metaDiasCompletos: parseMeta(body?.metaDiasCompletos, 0, 7, true),
      },
      select: pacienteSelect,
    });

    return NextResponse.json({
      ok: true,
      paciente: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        ...metasFromRecord(updated),
      },
    });
  } catch {
    return NextResponse.json({ erro: "Não foi possível salvar as metas." }, { status: 500 });
  }
}
