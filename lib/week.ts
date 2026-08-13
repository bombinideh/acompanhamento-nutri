export const REFEICOES = [
  "Café da manhã",
  "Lanche da manhã",
  "Almoço",
  "Lanche da tarde",
  "Jantar",
] as const;

export const DIAS = [
  { id: "segunda", short: "Seg", nome: "Segunda" },
  { id: "terca", short: "Ter", nome: "Terça" },
  { id: "quarta", short: "Qua", nome: "Quarta" },
  { id: "quinta", short: "Qui", nome: "Quinta" },
  { id: "sexta", short: "Sex", nome: "Sexta" },
  { id: "sabado", short: "Sáb", nome: "Sábado" },
  { id: "domingo", short: "Dom", nome: "Domingo" },
] as const;

export type DiaId = (typeof DIAS)[number]["id"];

export type Refeicao = {
  status: "" | "sim" | "nao";
  obs: string;
};

export type DiaHabitos = {
  refeicoes: Refeicao[];
  sono: number | null;
  h2o: number | null;
  academia: "" | "sim" | "nao";
  alcool: "" | "sim" | "nao";
};

export type Semana = {
  paciente: string;
  semanaInicio: string;
  dias: Record<DiaId, DiaHabitos>;
  eventos: string;
  ansiedade: string;
  acontecimento: string;
  comentarioNutri: string;
};

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diff);
  return d;
}

export function mondayIso(value?: string | null): string {
  const base = value ? parseIsoDate(value) : new Date();
  return toIsoDate(mondayOf(base));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function emptyDay(): DiaHabitos {
  return {
    refeicoes: REFEICOES.map(() => ({ status: "", obs: "" })),
    sono: null,
    h2o: null,
    academia: "",
    alcool: "",
  };
}

export function emptyWeek(inicio: string, paciente = ""): Semana {
  const dias = {} as Record<DiaId, DiaHabitos>;
  for (const dia of DIAS) {
    dias[dia.id] = emptyDay();
  }
  return {
    paciente,
    semanaInicio: mondayIso(inicio),
    dias,
    eventos: "",
    ansiedade: "",
    acontecimento: "",
    comentarioNutri: "",
  };
}

export function mergeWeek(saved: Partial<Semana> | null | undefined, inicio: string, paciente = ""): Semana {
  const week = emptyWeek(inicio, paciente);
  if (!saved) return week;
  week.paciente = saved.paciente || week.paciente;
  week.eventos = saved.eventos || "";
  week.ansiedade = saved.ansiedade || "";
  week.acontecimento = saved.acontecimento || "";
  week.comentarioNutri = saved.comentarioNutri || "";
  for (const dia of DIAS) {
    const src = saved.dias?.[dia.id];
    week.dias[dia.id] = {
      ...emptyDay(),
      ...src,
      refeicoes: emptyDay().refeicoes.map((slot, i) => ({
        ...slot,
        ...(src?.refeicoes?.[i] || {}),
      })),
    };
  }
  return week;
}

export function dayFilled(day: DiaHabitos): number {
  const meals = (day.refeicoes || []).filter((r) => r.status || r.obs?.trim()).length;
  const extras = [day.sono != null, day.h2o != null, Boolean(day.academia), Boolean(day.alcool)].filter(Boolean).length;
  return meals + extras;
}

export function dayComplete(day: DiaHabitos): boolean {
  return dayFilled(day) >= 9;
}

export function formatNumber(value: number | null | undefined, suffix: string): string {
  if (value == null) return "";
  const number = Number(value);
  if (Number.isNaN(number)) return "";
  const text = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
  return `${text}${suffix}`;
}

export function cellRefeicao(item?: Refeicao): string {
  if (!item) return "";
  const obs = item.obs?.trim();
  if (obs) return obs;
  if (item.status === "sim") return "Sim";
  if (item.status === "nao") return "Não";
  return "";
}

export function cellSimNao(value?: string): string {
  if (value === "sim") return "Sim";
  if (value === "nao") return "Não";
  return "";
}

export function isSameIsoDay(date: Date, other = new Date()): boolean {
  return toIsoDate(date) === toIsoDate(other);
}

export type WeekSummary = {
  mealsDone: number;
  mealsTotal: number;
  gymDays: number;
  avgSleep: number | null;
  avgWater: number | null;
  filledDays: number;
  completeDays: number;
};

export function weekSummary(semana: Semana): WeekSummary {
  let mealsDone = 0;
  let gymDays = 0;
  let filledDays = 0;
  let completeDays = 0;
  const sleeps: number[] = [];
  const waters: number[] = [];

  for (const dia of DIAS) {
    const day = semana.dias[dia.id];
    if (dayFilled(day) > 0) filledDays += 1;
    if (dayComplete(day)) completeDays += 1;
    for (const refeicao of day.refeicoes) {
      if (refeicao.status === "sim") mealsDone += 1;
    }
    if (day.academia === "sim") gymDays += 1;
    if (day.sono != null) sleeps.push(day.sono);
    if (day.h2o != null) waters.push(day.h2o);
  }

  const average = (values: number[]) => {
    if (!values.length) return null;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  };

  return {
    mealsDone,
    mealsTotal: REFEICOES.length * DIAS.length,
    gymDays,
    avgSleep: average(sleeps),
    avgWater: average(waters),
    filledDays,
    completeDays,
  };
}

export type DaySeries = {
  id: DiaId;
  short: string;
  mealsDone: number;
  sono: number | null;
  h2o: number | null;
  academia: boolean;
  complete: boolean;
};

export function weekSeries(semana: Semana): DaySeries[] {
  return DIAS.map((dia) => {
    const day = semana.dias[dia.id];
    return {
      id: dia.id,
      short: dia.short,
      mealsDone: day.refeicoes.filter((refeicao) => refeicao.status === "sim").length,
      sono: day.sono,
      h2o: day.h2o,
      academia: day.academia === "sim",
      complete: dayComplete(day),
    };
  });
}

export function compareCount(current: number, previous: number | null, unit: string) {
  if (previous == null) return "sem dados na semana anterior";
  if (current === previous) return `igual à anterior (${current} ${unit})`;
  return `${previous} → ${current} ${unit}`;
}

export function compareAvg(current: number | null, previous: number | null, suffix: string) {
  if (current == null) return "ainda sem média nesta semana";
  if (previous == null) return `${formatNumber(current, suffix)} · sem dados na anterior`;
  const delta = Math.round((current - previous) * 100) / 100;
  const sign = delta > 0 ? "+" : "";
  return `${formatNumber(current, suffix)} · ${sign}${formatNumber(delta, suffix)} vs anterior`;
}
