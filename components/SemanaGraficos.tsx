"use client";

import { emptyMetas, type Metas } from "@/lib/metas";
import {
  compareAvg,
  compareCount,
  DIAS,
  formatNumber,
  weekSeries,
  weekSummary,
  type Semana,
} from "@/lib/week";
import { useState } from "react";

type Props = {
  semana: Semana;
  semanaAnterior?: Semana | null;
  metas?: Metas;
};

const NAMES = DIAS.map((dia) => dia.nome);

export function SemanaGraficos({
  semana,
  semanaAnterior = null,
  metas = emptyMetas(),
}: Props) {
  const series = weekSeries(semana);
  const now = weekSummary(semana);
  const prev = semanaAnterior && weekSummary(semanaAnterior).filledDays > 0 ? weekSummary(semanaAnterior) : null;
  const labels = series.map((day) => day.short);

  return (
    <section className="semana-graficos" aria-label="Gráficos da semana">
      <div className="graficos-grid">
        <article className="card grafico-card">
          <h2>Refeições feitas</h2>
          <p className="grafico-kpi">
            {now.mealsDone}
            <small> de {now.mealsTotal}</small>
          </p>
          <BarChart labels={labels} values={series.map((day) => day.mealsDone)} max={5} />
          <p className="grafico-delta">{compareCount(now.mealsDone, prev?.mealsDone ?? null, "refeições")}</p>
        </article>

        <article className="card grafico-card">
          <h2>Sono e água</h2>
          <div className="grafico-legend-row">
            <span className="legend-chip sleep">
              Sono {now.avgSleep != null ? formatNumber(now.avgSleep, "h") : "—"}
              {metas.metaSono != null ? ` · meta ${formatNumber(metas.metaSono, "h")}` : ""}
            </span>
            <span className="legend-chip water">
              Água {now.avgWater != null ? formatNumber(now.avgWater, "L") : "—"}
              {metas.metaH2o != null ? ` · meta ${formatNumber(metas.metaH2o, "L")}` : ""}
            </span>
          </div>
          <LineChart
            labels={labels}
            sleep={series.map((day) => day.sono)}
            water={series.map((day) => day.h2o)}
            sleepGoal={metas.metaSono}
            waterGoal={metas.metaH2o}
          />
          <p className="grafico-delta">
            Sono {compareAvg(now.avgSleep, prev?.avgSleep ?? null, "h")}
            <br />
            Água {compareAvg(now.avgWater, prev?.avgWater ?? null, "L")}
          </p>
        </article>

        <article className="card grafico-card">
          <h2>Academia</h2>
          <WeekDots
            labels={labels}
            active={series.map((day) => day.academia)}
            done={now.gymDays}
            goal={metas.metaAcademia}
            doneLabel={now.gymDays === 1 ? "dia" : "dias"}
            onLabel="foi à academia"
            offLabel="não foi"
          />
          <p className="grafico-delta">{compareCount(now.gymDays, prev?.gymDays ?? null, "dias")}</p>
        </article>

        <article className="card grafico-card">
          <h2>Consistência</h2>
          <WeekDots
            labels={labels}
            active={series.map((day) => day.complete)}
            done={now.completeDays}
            goal={metas.metaDiasCompletos}
            doneLabel={now.completeDays === 1 ? "dia completo" : "dias completos"}
            onLabel="dia completo"
            offLabel="ainda incompleto"
          />
          <p className="grafico-delta">{compareCount(now.completeDays, prev?.completeDays ?? null, "dias")}</p>
        </article>
      </div>
    </section>
  );
}

function BarChart({ labels, values, max }: { labels: string[]; values: number[]; max: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 340;
  const height = 156;
  const pad = { l: 24, r: 8, t: 18, b: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const gap = innerW / values.length;
  const barW = gap * 0.52;

  return (
    <div className="grafico-plot">
      <svg viewBox={`0 0 ${width} ${height}`} className="grafico-svg" role="img" aria-label="Refeições feitas por dia">
        {[0, 1, 2, 3, 4, 5].map((tick) => {
          const y = pad.t + innerH - (tick / max) * innerH;
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grafico-grid" />
              <text x={pad.l - 5} y={y + 3} className="grafico-axis" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
        {values.map((value, i) => {
          const h = (value / max) * innerH;
          const x = pad.l + gap * i + (gap - barW) / 2;
          const y = pad.t + innerH - h;
          const active = hover === i;
          return (
            <g
              key={labels[i]}
              className={active ? "is-hover" : ""}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <rect x={pad.l + gap * i} y={pad.t} width={gap} height={innerH} className="grafico-hit" />
              <rect x={x} y={pad.t} width={barW} height={innerH} rx="5" className="grafico-track" />
              <rect
                x={x}
                y={value ? y : pad.t + innerH - 3}
                width={barW}
                height={value ? Math.max(h, 3) : 3}
                rx="5"
                className={`grafico-bar ${value ? "" : "is-empty"}`}
              />
              <text x={x + barW / 2} y={value ? y - 4 : pad.t + innerH - 8} className="grafico-value" textAnchor="middle">
                {value}
              </text>
              <text x={x + barW / 2} y={height - 6} className={`grafico-axis ${active ? "is-strong" : ""}`} textAnchor="middle">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {hover != null ? (
        <div className="grafico-tip" role="status">
          <strong>{NAMES[hover]}</strong>
          <span>
            {values[hover]} de {max} refeições feitas
          </span>
        </div>
      ) : null}
    </div>
  );
}

function LineChart({
  labels,
  sleep,
  water,
  sleepGoal,
  waterGoal,
}: {
  labels: string[];
  sleep: (number | null)[];
  water: (number | null)[];
  sleepGoal: number | null;
  waterGoal: number | null;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 340;
  const height = 168;
  const pad = { l: 28, r: 28, t: 16, b: 26 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const sleepMax = Math.max(8, sleepGoal ?? 0, ...sleep.filter((v): v is number => v != null), 1);
  const waterMax = Math.max(3, waterGoal ?? 0, ...water.filter((v): v is number => v != null), 1);
  const xAt = (i: number) => pad.l + (innerW / Math.max(labels.length - 1, 1)) * i;
  const ySleep = (v: number) => pad.t + innerH - (v / sleepMax) * innerH;
  const yWater = (v: number) => pad.t + innerH - (v / waterMax) * innerH;
  const colW = innerW / Math.max(labels.length - 1, 1);

  return (
    <div className="grafico-plot">
      <svg viewBox={`0 0 ${width} ${height}`} className="grafico-svg" role="img" aria-label="Sono e água por dia">
        {sleepGoal != null ? (
          <line x1={pad.l} x2={width - pad.r} y1={ySleep(sleepGoal)} y2={ySleep(sleepGoal)} className="grafico-goal sleep" />
        ) : null}
        {waterGoal != null ? (
          <line x1={pad.l} x2={width - pad.r} y1={yWater(waterGoal)} y2={yWater(waterGoal)} className="grafico-goal water" />
        ) : null}
        {polyline(sleep, xAt, ySleep, "grafico-line sleep")}
        {polyline(water, xAt, yWater, "grafico-line water")}
        {hover != null ? (
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + innerH} className="grafico-guide" />
        ) : null}
        {sleep.map((value, i) =>
          value == null ? null : (
            <circle
              key={`s${i}`}
              cx={xAt(i)}
              cy={ySleep(value)}
              r={hover === i ? 5 : 3.4}
              className="grafico-dot sleep"
            />
          ),
        )}
        {water.map((value, i) =>
          value == null ? null : (
            <circle
              key={`w${i}`}
              cx={xAt(i)}
              cy={yWater(value)}
              r={hover === i ? 5 : 3.4}
              className="grafico-dot water"
            />
          ),
        )}
        {labels.map((label, i) => (
          <g
            key={label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <rect x={xAt(i) - colW / 2} y={pad.t} width={colW} height={innerH} className="grafico-hit" />
            <text x={xAt(i)} y={height - 6} className={`grafico-axis ${hover === i ? "is-strong" : ""}`} textAnchor="middle">
              {label}
            </text>
          </g>
        ))}
      </svg>
      {hover != null ? (
        <div className="grafico-tip" role="status">
          <strong>{NAMES[hover]}</strong>
          <span className="tip-sleep">Sono {sleep[hover] != null ? formatNumber(sleep[hover], "h") : "sem registro"}</span>
          <span className="tip-water">Água {water[hover] != null ? formatNumber(water[hover], "L") : "sem registro"}</span>
        </div>
      ) : null}
    </div>
  );
}

function polyline(
  values: (number | null)[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
  className: string,
) {
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((value, i) => {
    if (value == null) {
      if (current.length) segments.push(current.join(" "));
      current = [];
      return;
    }
    current.push(`${xAt(i)},${yAt(value)}`);
  });
  if (current.length) segments.push(current.join(" "));
  return segments.map((points) => <polyline key={points} points={points} className={className} fill="none" />);
}

function WeekDots({
  labels,
  active,
  done,
  goal,
  doneLabel,
  onLabel,
  offLabel,
}: {
  labels: string[];
  active: boolean[];
  done: number;
  goal: number | null;
  doneLabel: string;
  onLabel: string;
  offLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const target = goal ?? 7;
  const pct = Math.min(100, Math.round((done / Math.max(target, 1)) * 100));

  return (
    <div className="grafico-plot">
      <p className="grafico-kpi">
        {done}
        <small>
          {" "}
          {doneLabel}
          {goal != null ? ` · meta ${goal}` : ""}
        </small>
      </p>
      <div className="grafico-progress" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="week-dots">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`week-dot ${active[i] ? "on" : ""} ${hover === i ? "is-hover" : ""}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`${NAMES[i]}: ${active[i] ? onLabel : offLabel}`}
          >
            <b>{label}</b>
            <small>{active[i] ? "sim" : "não"}</small>
          </button>
        ))}
      </div>
      {hover != null ? (
        <div className="grafico-tip" role="status">
          <strong>{NAMES[hover]}</strong>
          <span>{active[hover] ? onLabel : offLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
