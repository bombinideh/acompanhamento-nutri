"use client";

import { useEffect, useRef, useState } from "react";
import { parseMeta, type Metas } from "@/lib/metas";

type Props = {
  metas: Metas;
  onChange: (metas: Metas) => void;
  status?: "idle" | "saving" | "saved" | "error";
  title?: string;
};

export function MetasForm({ metas, onChange, status = "idle", title = "Metas da semana" }: Props) {
  return (
    <section className="card metas-row">
      <p className="field">{title}</p>
      <div className="metas-fields">
        <MetaField
          label="Sono (h)"
          value={metas.metaSono}
          min={0}
          max={14}
          onCommit={(metaSono) => onChange({ ...metas, metaSono })}
        />
        <MetaField
          label="Água (L)"
          value={metas.metaH2o}
          min={0}
          max={8}
          onCommit={(metaH2o) => onChange({ ...metas, metaH2o })}
        />
        <MetaField
          label="Academia (dias)"
          value={metas.metaAcademia}
          min={0}
          max={7}
          integer
          onCommit={(metaAcademia) => onChange({ ...metas, metaAcademia })}
        />
        <MetaField
          label="Dias completos"
          value={metas.metaDiasCompletos}
          min={0}
          max={7}
          integer
          onCommit={(metaDiasCompletos) => onChange({ ...metas, metaDiasCompletos })}
        />
      </div>
      {status === "saving" ? <p className="save-flag">Salvando metas...</p> : null}
      {status === "saved" ? <p className="save-flag is-ok">Metas salvas</p> : null}
      {status === "error" ? <p className="save-flag is-err">Não salvou as metas</p> : null}
    </section>
  );
}

function formatMeta(value: number | null) {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

function isTyping(raw: string, integer: boolean) {
  if (raw === "") return true;
  return integer ? /^\d{0,2}$/.test(raw) : /^-?\d*[.,]?\d*$/.test(raw);
}

function MetaField({
  label,
  value,
  min,
  max,
  integer = false,
  onCommit,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  integer?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const [text, setText] = useState(() => formatMeta(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(formatMeta(value));
  }, [value]);

  return (
    <label>
      {label}
      <input
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={text}
        placeholder="—"
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (!isTyping(raw, integer)) return;
          setText(raw);
          if (raw.trim() === "") {
            onCommit(null);
            return;
          }
          const parsed = parseMeta(raw, min, max, integer);
          if (parsed != null && !/[.,]$/.test(raw)) onCommit(parsed);
        }}
        onBlur={() => {
          focused.current = false;
          const parsed = text.trim() === "" ? null : parseMeta(text, min, max, integer);
          onCommit(parsed);
          setText(formatMeta(parsed));
        }}
      />
    </label>
  );
}
