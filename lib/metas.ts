export type Metas = {
  metaSono: number | null;
  metaH2o: number | null;
  metaAcademia: number | null;
  metaDiasCompletos: number | null;
};

export function emptyMetas(): Metas {
  return { metaSono: null, metaH2o: null, metaAcademia: null, metaDiasCompletos: null };
}

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const raw = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = Number(raw);
  if (!Number.isFinite(number)) return null;
  return number;
}

export function metasFromRecord(record: Partial<Metas> | null | undefined): Metas {
  return {
    metaSono: numOrNull(record?.metaSono),
    metaH2o: numOrNull(record?.metaH2o),
    metaAcademia: numOrNull(record?.metaAcademia),
    metaDiasCompletos: numOrNull(record?.metaDiasCompletos),
  };
}

export function parseMeta(value: unknown, min: number, max: number, integer = false): number | null {
  const number = numOrNull(value);
  if (number == null) return null;
  const clamped = Math.min(max, Math.max(min, number));
  return integer ? Math.round(clamped) : Math.round(clamped * 100) / 100;
}
