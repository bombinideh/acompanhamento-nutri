"use client";

import { HeaderActions } from "@/components/HeaderActions";
import { SemanaGraficos } from "@/components/SemanaGraficos";
import { SemanaResumo } from "@/components/SemanaResumo";
import { SemanaTabela } from "@/components/SemanaTabela";
import { emptyMetas, metasFromRecord, parseMeta, type Metas } from "@/lib/metas";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  dayComplete,
  dayFilled,
  DIAS,
  emptyWeek,
  isSameIsoDay,
  mergeWeek,
  mondayOf,
  REFEICOES,
  toIsoDate,
  type DiaHabitos,
  type Refeicao,
  type Semana,
} from "@/lib/week";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const fmtLong = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function HabitosForm() {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [selected, setSelected] = useState(() => Math.min(6, (today.getDay() + 6) % 7));
  const [state, setState] = useState<Semana>(() => emptyWeek(toIsoDate(mondayOf(today))));
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [view, setView] = useState<"preencher" | "relatorio" | "painel">("preencher");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [metas, setMetas] = useState<Metas>(emptyMetas);
  const [semanaAnterior, setSemanaAnterior] = useState<Semana | null>(null);
  const saveTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);
  const saveGen = useRef(0);
  const skipSave = useRef(true);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  };

  const persist = useCallback(async (payload: Semana) => {
    const gen = ++saveGen.current;
    setSaveState("saving");
    try {
      const res = await fetch("/api/semana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (gen !== saveGen.current) return;
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setSaveState("error");
        showToast("Não deu para salvar agora. Tente de novo.");
        return;
      }
      setSaveState("saved");
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => {
        if (saveGen.current === gen) setSaveState("idle");
      }, 2200);
    } catch {
      if (gen !== saveGen.current) return;
      setSaveState("error");
      showToast("Não deu para salvar agora. Tente de novo.");
    }
  }, []);

  const scheduleSave = useCallback(
    (payload: Semana) => {
      setSaveState("saving");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void persist(payload);
      }, 350);
    },
    [persist],
  );

  const update = (patch: (current: Semana) => Semana) => {
    setState((current) => {
      const next = patch(current);
      if (!skipSave.current) scheduleSave(next);
      return next;
    });
  };

  const updateDay = (patch: (day: DiaHabitos) => DiaHabitos) => {
    const diaId = DIAS[selected].id;
    update((current) => ({
      ...current,
      dias: { ...current.dias, [diaId]: patch(current.dias[diaId]) },
    }));
  };

  const loadWeek = useCallback(async (start: Date) => {
    skipSave.current = true;
    setLoading(true);
    const inicio = toIsoDate(start);
    const prevIso = toIsoDate(addDays(start, -7));
    try {
      const [res, prevRes] = await Promise.all([
        fetch(`/api/semana?inicio=${inicio}`),
        fetch(`/api/semana?inicio=${prevIso}`),
      ]);
      if (res.status === 401 || prevRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const remote = res.ok ? await res.json() : null;
      const prevRemote = prevRes.ok ? await prevRes.json() : null;
      setState(mergeWeek(remote, inicio, userName));
      setSemanaAnterior(prevRemote ? mergeWeek(prevRemote, prevIso, userName) : null);
    } catch {
      showToast("Não foi possível carregar a semana.");
      setState(emptyWeek(inicio, userName));
      setSemanaAnterior(null);
    } finally {
      skipSave.current = false;
      setLoading(false);
      setSaveState("idle");
    }
  }, [userName]);

  useEffect(() => {
    void fetch("/api/me").then(async (res) => {
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setUserName(data.name || "");
      setMetas(metasFromRecord(data));
    });
  }, []);

  useEffect(() => {
    void loadWeek(weekStart);
  }, [weekStart, loadWeek]);

  const day = state.dias[DIAS[selected].id];
  const filledDays = DIAS.filter((d) => dayFilled(state.dias[d.id]) > 0).length;
  const fim = addDays(weekStart, 6);
  const isRelatorio = view === "relatorio";
  const isPainel = view === "painel";

  return (
    <div className="page page-fill">
      <div className="wrap wrap-fill">
        <header className="top">
          <div>
            <h1>Hábitos da semana</h1>
            <p className="sub">{userName ? `${userName} · ` : ""}a nutricionista acompanha em tempo real</p>
          </div>
          <HeaderActions homeLabel="Hábitos" />
        </header>

        <section className="card fill-nav">
          <div className="view-tabs tabs-3" role="tablist" aria-label="Modo da semana">
            <button
              type="button"
              role="tab"
              aria-selected={view === "preencher"}
              className={`view-tab ${view === "preencher" ? "active" : ""}`}
              onClick={() => setView("preencher")}
            >
              Preencher
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isPainel}
              className={`view-tab ${isPainel ? "active" : ""}`}
              onClick={() => setView("painel")}
            >
              Painel
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRelatorio}
              className={`view-tab ${isRelatorio ? "active" : ""}`}
              onClick={() => setView("relatorio")}
            >
              Relatório
            </button>
          </div>
          <div className="week-nav">
            <button
              className="icon-btn"
              type="button"
              aria-label="Semana anterior"
              onClick={() => {
                setWeekStart(addDays(weekStart, -7));
                setSelected(0);
              }}
            >
              ‹
            </button>
            <strong>
              {fmt.format(weekStart)} a {fmt.format(fim)}
            </strong>
            <button
              className="icon-btn"
              type="button"
              aria-label="Próxima semana"
              onClick={() => {
                setWeekStart(addDays(weekStart, 7));
                setSelected(0);
              }}
            >
              ›
            </button>
          </div>
          <div className="days">
            {DIAS.map((dia, i) => {
              const date = addDays(weekStart, i);
              const filled = dayFilled(state.dias[dia.id]);
              const today = isSameIsoDay(date);
              const cls = [
                "day-btn",
                i === selected ? "active" : "",
                dayComplete(state.dias[dia.id]) ? "done" : filled ? "partial" : "",
                today ? "today" : "",
              ].join(" ");
              return (
                <button
                  key={dia.id}
                  className={cls}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    setView("preencher");
                  }}
                >
                  {dia.short}
                  <small>{today ? "hoje" : fmt.format(date)}</small>
                </button>
              );
            })}
          </div>
          <p className="status">
            {loading ? "Carregando..." : `${filledDays} de 7 dias com registro`}
            {!loading && saveState === "saving" ? <span className="save-flag"> · Salvando...</span> : null}
            {!loading && saveState === "saved" ? <span className="save-flag is-ok"> · Salvo</span> : null}
            {!loading && saveState === "error" ? <span className="save-flag is-err"> · Não salvou</span> : null}
          </p>
        </section>

        <div className="fill-main">
          {!isRelatorio && !isPainel && state.comentarioNutri.trim() ? (
            <section className="card recado-banner">
              <p className="field">Recado da nutricionista</p>
              <strong>{state.comentarioNutri}</strong>
            </section>
          ) : null}
          {isPainel ? (
            <div className="semana-dash">
              <SemanaResumo semana={state} />
              <SemanaGraficos semana={state} semanaAnterior={semanaAnterior} metas={metas} />
            </div>
          ) : isRelatorio ? (
            <SemanaTabela semana={state} weekStart={weekStart} />
          ) : (
          <div className="fill-body">
            <section className="card fill-day">
              <h2>
                {DIAS[selected].nome} · {fmtLong.format(addDays(weekStart, selected))}
              </h2>
              {REFEICOES.map((nome, i) => {
                const item = day.refeicoes[i];
                return (
                  <div className="meal" key={nome}>
                    <div>
                      <b>{nome}</b>
                      <span>Refeição {i + 1}</span>
                    </div>
                    <div className="toggles">
                      <button
                        className={`toggle ${item.status === "sim" ? "on-sim" : ""}`}
                        type="button"
                        onClick={() =>
                          updateDay((d) => {
                            const refeicoes = d.refeicoes.map((ref, idx) =>
                              idx === i
                                ? { ...ref, status: (ref.status === "sim" ? "" : "sim") as Refeicao["status"] }
                                : ref,
                            );
                            return { ...d, refeicoes };
                          })
                        }
                      >
                        Fiz
                      </button>
                      <button
                        className={`toggle ${item.status === "nao" ? "on-nao" : ""}`}
                        type="button"
                        onClick={() =>
                          updateDay((d) => {
                            const refeicoes = d.refeicoes.map((ref, idx) =>
                              idx === i
                                ? { ...ref, status: (ref.status === "nao" ? "" : "nao") as Refeicao["status"] }
                                : ref,
                            );
                            return { ...d, refeicoes };
                          })
                        }
                      >
                        Não
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Opcional: horário ou o que comeu"
                      value={item.obs}
                      onChange={(e) =>
                        updateDay((d) => {
                          const refeicoes = d.refeicoes.map((ref, idx) =>
                            idx === i ? { ...ref, obs: e.target.value } : ref,
                          );
                          return { ...d, refeicoes };
                        })
                      }
                    />
                  </div>
                );
              })}
            </section>

            <div className="fill-side">
              <section className="card fill-metrics">
                <div className="metrics">
                  <div className="metric">
                    <p>Sono</p>
                    <MetricStepper
                      key={`${DIAS[selected].id}-sono`}
                      value={day.sono}
                      suffix="h"
                      min={0}
                      max={14}
                      step={0.5}
                      ariaLabel="Horas de sono"
                      onChange={(sono) => updateDay((d) => ({ ...d, sono }))}
                    />
                  </div>
                  <div className="metric">
                    <p>Água</p>
                    <MetricStepper
                      key={`${DIAS[selected].id}-h2o`}
                      value={day.h2o}
                      suffix="L"
                      min={0}
                      max={6}
                      step={0.25}
                      ariaLabel="Litros de água"
                      onChange={(h2o) => updateDay((d) => ({ ...d, h2o }))}
                    />
                  </div>
                  <div className="metric">
                    <p>Academia</p>
                    <div className="sn">
                      <button
                        className={`toggle ${day.academia === "sim" ? "on-sim" : ""}`}
                        type="button"
                        onClick={() => updateDay((d) => ({ ...d, academia: d.academia === "sim" ? "" : "sim" }))}
                      >
                        Sim
                      </button>
                      <button
                        className={`toggle ${day.academia === "nao" ? "on-nao" : ""}`}
                        type="button"
                        onClick={() => updateDay((d) => ({ ...d, academia: d.academia === "nao" ? "" : "nao" }))}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                  <div className="metric">
                    <p>Álcool</p>
                    <div className="sn">
                      <button
                        className={`toggle ${day.alcool === "sim" ? "on-sim" : ""}`}
                        type="button"
                        onClick={() => updateDay((d) => ({ ...d, alcool: d.alcool === "sim" ? "" : "sim" }))}
                      >
                        Sim
                      </button>
                      <button
                        className={`toggle ${day.alcool === "nao" ? "on-nao" : ""}`}
                        type="button"
                        onClick={() => updateDay((d) => ({ ...d, alcool: d.alcool === "nao" ? "" : "nao" }))}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card fill-week">
                <h2>Como foi a semana</h2>
                <label className="field" htmlFor="eventos">
                  Teve muitos eventos essa semana?
                </label>
                <textarea
                  id="eventos"
                  placeholder="Sim, não, ou conte um pouco..."
                  value={state.eventos}
                  onChange={(e) => update((current) => ({ ...current, eventos: e.target.value }))}
                />
                <label className="field" htmlFor="ansiedade">
                  Estava se sentindo ansioso(a)?
                </label>
                <textarea
                  id="ansiedade"
                  placeholder="Como você se sentiu..."
                  value={state.ansiedade}
                  onChange={(e) => update((current) => ({ ...current, ansiedade: e.target.value }))}
                />
                <label className="field" htmlFor="acontecimento">
                  Teve algum acontecimento na sua semana?
                </label>
                <textarea
                  id="acontecimento"
                  placeholder="Opcional"
                  value={state.acontecimento}
                  onChange={(e) => update((current) => ({ ...current, acontecimento: e.target.value }))}
                />
              </section>
            </div>
          </div>
          )}
        </div>
      </div>
      {toast ? <div className="toast floating">{toast}</div> : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}

function formatMetric(value: number | null) {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

function isMetricTyping(raw: string) {
  return raw === "" || /^-?\d*[.,]?\d*$/.test(raw);
}

function MetricStepper({
  value,
  suffix,
  min,
  max,
  step,
  ariaLabel,
  onChange,
}: {
  value: number | null;
  suffix: string;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(() => formatMetric(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(formatMetric(value));
  }, [value]);

  function commit(raw: string) {
    if (raw.trim() === "") {
      onChange(null);
      setText("");
      return;
    }
    const parsed = parseMeta(raw, min, max);
    onChange(parsed);
    setText(formatMetric(parsed));
  }

  return (
    <div className="stepper">
      <button
        type="button"
        aria-label={`Diminuir ${ariaLabel}`}
        onClick={() => onChange(clamp((value ?? 0) - step, min, max))}
      >
        −
      </button>
      <label className="stepper-value">
        <span className="sr-only">{ariaLabel}</span>
        <input
          type="text"
          inputMode="decimal"
          value={text}
          placeholder="—"
          aria-label={ariaLabel}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => {
            const raw = e.target.value;
            if (!isMetricTyping(raw)) return;
            setText(raw);
            if (raw.trim() === "") {
              onChange(null);
              return;
            }
            const parsed = parseMeta(raw, min, max);
            if (parsed != null && !/[.,]$/.test(raw)) onChange(parsed);
          }}
          onBlur={() => {
            focused.current = false;
            commit(text);
          }}
        />
        <span>{suffix}</span>
      </label>
      <button
        type="button"
        aria-label={`Aumentar ${ariaLabel}`}
        onClick={() => onChange(clamp((value ?? 0) + step, min, max))}
      >
        +
      </button>
    </div>
  );
}
