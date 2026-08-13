"use client";

import { HeaderActions } from "@/components/HeaderActions";
import { MetasForm } from "@/components/MetasForm";
import { SemanaGraficos } from "@/components/SemanaGraficos";
import { SemanaResumo } from "@/components/SemanaResumo";
import { SemanaTabela } from "@/components/SemanaTabela";
import { emptyMetas, metasFromRecord, type Metas } from "@/lib/metas";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  cellRefeicao,
  cellSimNao,
  dayFilled,
  DIAS,
  emptyWeek,
  formatNumber,
  mergeWeek,
  mondayOf,
  toIsoDate,
  type DiaId,
  type Semana,
} from "@/lib/week";

type Paciente = {
  id: string;
  name: string;
  email: string;
} & Metas;

const PACIENTE_KEY = "nutri-paciente-id";
const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const POLL_MS = 2500;

function relativeTime(iso: string | null, nowTs = Date.now()) {
  if (!iso) return "ainda sem registros";
  const seconds = Math.max(0, Math.round((nowTs - new Date(iso).getTime()) / 1000));
  if (seconds < 4) return "agora";
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `há ${hours} h`;
}

function cellKey(dia: DiaId, campo: string) {
  return `${dia}-${campo}`;
}

function snapshot(semana: Semana) {
  const map: Record<string, string> = {};
  for (const dia of DIAS) {
    const dados = semana.dias[dia.id];
    dados.refeicoes.forEach((item, i) => {
      map[cellKey(dia.id, `r${i}`)] = cellRefeicao(item);
    });
    map[cellKey(dia.id, "sono")] = formatNumber(dados.sono, "h");
    map[cellKey(dia.id, "h2o")] = formatNumber(dados.h2o, "L");
    map[cellKey(dia.id, "academia")] = cellSimNao(dados.academia);
    map[cellKey(dia.id, "alcool")] = cellSimNao(dados.alcool);
  }
  map.eventos = semana.eventos;
  map.ansiedade = semana.ansiedade;
  map.acontecimento = semana.acontecimento;
  map.paciente = semana.paciente;
  return map;
}

export function NutriDashboard() {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [state, setState] = useState<Semana>(() => emptyWeek(toIsoDate(mondayOf(today))));
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [flashed, setFlashed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteId, setPacienteId] = useState("");
  const prev = useRef<Record<string, string>>({});
  const commentDirty = useRef(false);
  const commentTimer = useRef<number | null>(null);
  const commentSavedTimer = useRef<number | null>(null);
  const commentGen = useRef(0);
  const [commentStatus, setCommentStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [semanaAnterior, setSemanaAnterior] = useState<Semana | null>(null);
  const [metasStatus, setMetasStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [view, setView] = useState<"painel" | "relatorio">("relatorio");
  const metasTimer = useRef<number | null>(null);
  const metasSavedTimer = useRef<number | null>(null);
  const metasGen = useRef(0);
  const prevWeekGen = useRef(0);
  const inicio = toIsoDate(weekStart);
  const fim = addDays(weekStart, 6);
  const selected = pacientes.find((p) => p.id === pacienteId);

  const load = useCallback(async (startIso: string, currentPacienteId: string, silent = false) => {
    if (!currentPacienteId) return;
    const res = await fetch(`/api/semana?inicio=${startIso}&pacienteId=${currentPacienteId}`);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) return;
    const remote = await res.json();
    const merged = mergeWeek(remote, startIso, remote.paciente || "");
    const current = snapshot(merged);
    if (silent) {
      const changed = new Set<string>();
      for (const key of Object.keys(current)) {
        if (prev.current[key] !== undefined && prev.current[key] !== current[key]) {
          changed.add(key);
        }
      }
      if (changed.size) {
        setFlashed(changed);
        window.setTimeout(() => setFlashed(new Set()), 1400);
      }
    }
    prev.current = current;
    setState((prevState) => {
      if (commentDirty.current) {
        return { ...merged, comentarioNutri: prevState.comentarioNutri };
      }
      return merged;
    });
    setUpdatedAt(remote.updatedAt || null);
  }, []);

  useEffect(() => {
    void fetch("/api/pacientes").then(async (res) => {
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      const list = (data.pacientes || []) as Paciente[];
      setPacientes(list);
      const stored = localStorage.getItem(PACIENTE_KEY) || "";
      const nextId = list.some((p) => p.id === stored) ? stored : list[0]?.id || "";
      setPacienteId(nextId);
    });
  }, []);

  useEffect(() => {
    if (!pacienteId) return;
    localStorage.setItem(PACIENTE_KEY, pacienteId);
    prev.current = {};
    commentDirty.current = false;
    commentGen.current += 1;
    if (commentTimer.current) window.clearTimeout(commentTimer.current);
    if (metasTimer.current) window.clearTimeout(metasTimer.current);
    setCommentStatus("idle");
    setMetasStatus("idle");
    void load(inicio, pacienteId, false);
    const prevIso = toIsoDate(addDays(weekStart, -7));
    const gen = ++prevWeekGen.current;
    void fetch(`/api/semana?inicio=${prevIso}&pacienteId=${pacienteId}`).then(async (res) => {
      if (gen !== prevWeekGen.current) return;
      if (!res.ok) {
        setSemanaAnterior(null);
        return;
      }
      const remote = await res.json();
      setSemanaAnterior(mergeWeek(remote, prevIso, remote.paciente || ""));
    });
  }, [inicio, pacienteId, load, weekStart]);

  const persistComment = useCallback(
    async (paciente: string, startIso: string, comentarioNutri: string) => {
      const gen = ++commentGen.current;
      setCommentStatus("saving");
      try {
        const res = await fetch("/api/semana", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pacienteId: paciente, semanaInicio: startIso, comentarioNutri }),
        });
        if (gen !== commentGen.current) return;
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) {
          setCommentStatus("error");
          return;
        }
        commentDirty.current = false;
        setCommentStatus("saved");
        if (commentSavedTimer.current) window.clearTimeout(commentSavedTimer.current);
        commentSavedTimer.current = window.setTimeout(() => {
          if (commentGen.current === gen) setCommentStatus("idle");
        }, 2200);
      } catch {
        if (gen !== commentGen.current) return;
        setCommentStatus("error");
      }
    },
    [],
  );

  const persistMetas = useCallback(async (paciente: string, next: Metas) => {
    const gen = ++metasGen.current;
    setMetasStatus("saving");
    try {
      const res = await fetch("/api/pacientes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId: paciente, ...next }),
      });
      if (gen !== metasGen.current) return;
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setMetasStatus("error");
        return;
      }
      setMetasStatus("saved");
      if (metasSavedTimer.current) window.clearTimeout(metasSavedTimer.current);
      metasSavedTimer.current = window.setTimeout(() => {
        if (metasGen.current === gen) setMetasStatus("idle");
      }, 2200);
    } catch {
      if (gen !== metasGen.current) return;
      setMetasStatus("error");
    }
  }, []);

  function onComentarioChange(value: string) {
    commentDirty.current = true;
    setState((current) => ({ ...current, comentarioNutri: value }));
    setCommentStatus("saving");
    if (commentTimer.current) window.clearTimeout(commentTimer.current);
    commentTimer.current = window.setTimeout(() => {
      if (!pacienteId) return;
      void persistComment(pacienteId, inicio, value);
    }, 400);
  }

  function onMetasChange(next: Metas) {
    if (!pacienteId) return;
    setPacientes((list) => list.map((paciente) => (paciente.id === pacienteId ? { ...paciente, ...next } : paciente)));
    setMetasStatus("saving");
    if (metasTimer.current) window.clearTimeout(metasTimer.current);
    metasTimer.current = window.setTimeout(() => {
      void persistMetas(pacienteId, next);
    }, 400);
  }

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "hidden" || !pacienteId) return;
      void load(inicio, pacienteId, true);
    };
    const poll = window.setInterval(tick, POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && pacienteId) void load(inicio, pacienteId, true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [inicio, pacienteId, load]);

  const filledDays = DIAS.filter((d) => dayFilled(state.dias[d.id]) > 0).length;

  return (
    <div className="page page-wide">
      <div className="wrap-wide">
        <header className="top">
          <div>
            <h1>Acompanhamento ao vivo</h1>
            <p className="sub">
              {selected
                ? `Vendo agora: ${selected.name}`
                : "Selecione uma paciente para acompanhar"}
            </p>
          </div>
          <HeaderActions homeLabel="Acompanhamento" />
        </header>

        <section className="card">
          <p className="field" style={{ marginBottom: 10 }}>
            Suas pacientes
          </p>
          {pacientes.length === 0 ? (
            <p className="status">Nenhuma paciente cadastrada ainda.</p>
          ) : (
            <div className="patient-list">
              {pacientes.map((paciente) => (
                <button
                  key={paciente.id}
                  type="button"
                  className={`patient-chip ${paciente.id === pacienteId ? "active" : ""}`}
                  onClick={() => setPacienteId(paciente.id)}
                >
                  <b>{paciente.name}</b>
                  <small>{paciente.email}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <MetasForm
          metas={selected ? metasFromRecord(selected) : emptyMetas()}
          onChange={onMetasChange}
          status={metasStatus}
          title={selected ? `Metas de ${selected.name}` : "Metas da paciente"}
        />

        <section className="card toolbar">
          <div className="live">
            <span className="live-dot" />
            Ao vivo
          </div>
          <div className="view-tabs" role="tablist" aria-label="Visão da semana">
            <button
              type="button"
              role="tab"
              aria-selected={view === "painel"}
              className={`view-tab ${view === "painel" ? "active" : ""}`}
              onClick={() => setView("painel")}
            >
              Painel
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "relatorio"}
              className={`view-tab ${view === "relatorio" ? "active" : ""}`}
              onClick={() => setView("relatorio")}
            >
              Relatório
            </button>
          </div>
          <div className="week-nav">
            <button className="icon-btn" type="button" aria-label="Semana anterior" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              ‹
            </button>
            <strong>
              {fmt.format(weekStart)} a {fmt.format(fim)}
            </strong>
            <button className="icon-btn" type="button" aria-label="Próxima semana" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              ›
            </button>
          </div>
          <p className="status">
            {filledDays} de 7 dias · {relativeTime(updatedAt, now)}
          </p>
        </section>

        {view === "painel" ? (
          <div className="semana-dash">
            <SemanaResumo semana={state} />
            <SemanaGraficos
              semana={state}
              semanaAnterior={semanaAnterior}
              metas={selected ? metasFromRecord(selected) : emptyMetas()}
            />
          </div>
        ) : (
          <SemanaTabela
            semana={state}
            weekStart={weekStart}
            flashed={flashed}
            onComentarioChange={onComentarioChange}
            comentarioStatus={commentStatus}
          />
        )}
      </div>
    </div>
  );
}
