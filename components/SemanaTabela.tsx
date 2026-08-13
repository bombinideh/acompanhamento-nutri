"use client";

import {
  addDays,
  cellRefeicao,
  cellSimNao,
  dayComplete,
  dayFilled,
  DIAS,
  formatNumber,
  isSameIsoDay,
  parseIsoDate,
  REFEICOES,
  toIsoDate,
  type DiaId,
  type Semana,
} from "@/lib/week";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function dash(value: string) {
  return value || "—";
}

function cellKey(dia: DiaId, campo: string) {
  return `${dia}-${campo}`;
}

function tone(value: string) {
  if (value === "Sim") return "ok";
  if (value === "Não") return "no";
  if (value && value !== "—") return "fill";
  return "";
}

type Props = {
  semana: Semana;
  weekStart: Date;
  flashed?: Set<string>;
  onComentarioChange?: (value: string) => void;
  comentarioStatus?: "idle" | "saving" | "saved" | "error";
};

export function SemanaTabela({
  semana,
  weekStart,
  flashed = new Set(),
  onComentarioChange,
  comentarioStatus = "idle",
}: Props) {
  const inicio = toIsoDate(weekStart);
  const recado = semana.comentarioNutri.trim();

  return (
    <div className="semana-tabela">
      <section className="card sheet-card">
        <div className="sheet-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Dia</th>
                {REFEICOES.map((nome) => (
                  <th key={nome}>{nome.replace(" da ", "\n")}</th>
                ))}
                <th>Sono</th>
                <th>H2O</th>
                <th>Academia</th>
                <th>Álcool</th>
              </tr>
            </thead>
            <tbody>
              {DIAS.map((dia, i) => {
                const date = addDays(parseIsoDate(inicio), i);
                const dados = semana.dias[dia.id];
                const done = dayComplete(dados);
                const today = isSameIsoDay(date);
                const rowClass = [
                  done ? "row-done" : dayFilled(dados) ? "row-partial" : "",
                  today ? "row-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr key={dia.id} className={rowClass}>
                    <th>
                      {dia.nome}
                      <small>{today ? "hoje" : fmt.format(date)}</small>
                    </th>
                    {dados.refeicoes.map((item, idx) => {
                      const key = cellKey(dia.id, `r${idx}`);
                      const value = dash(cellRefeicao(item));
                      return (
                        <td key={key} className={`${tone(value)} ${flashed.has(key) ? "flash" : ""}`}>
                          {value}
                        </td>
                      );
                    })}
                    {(
                      [
                        ["sono", dash(formatNumber(dados.sono, "h"))],
                        ["h2o", dash(formatNumber(dados.h2o, "L"))],
                        ["academia", dash(cellSimNao(dados.academia))],
                        ["alcool", dash(cellSimNao(dados.alcool))],
                      ] as const
                    ).map(([campo, value]) => {
                      const key = cellKey(dia.id, campo);
                      return (
                        <td key={key} className={`${tone(value)} ${flashed.has(key) ? "flash" : ""}`}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card notes">
        <h2>Como foi a semana</h2>
        <div className={`note ${flashed.has("eventos") ? "flash" : ""}`}>
          <p>Teve muitos eventos essa semana?</p>
          <strong>{semana.eventos || "—"}</strong>
        </div>
        <div className={`note ${flashed.has("ansiedade") ? "flash" : ""}`}>
          <p>Estava se sentindo ansioso(a)?</p>
          <strong>{semana.ansiedade || "—"}</strong>
        </div>
        <div className={`note ${flashed.has("acontecimento") ? "flash" : ""}`}>
          <p>Teve algum acontecimento na sua semana?</p>
          <strong>{semana.acontecimento || "—"}</strong>
        </div>
        {onComentarioChange ? (
          <div className="note recado-edit">
            <label className="field" htmlFor="comentarioNutri">
              Recado para a paciente
            </label>
            <textarea
              id="comentarioNutri"
              placeholder="Orientação da semana, combinado, ponto de atenção..."
              value={semana.comentarioNutri}
              onChange={(e) => onComentarioChange(e.target.value.slice(0, 1500))}
              maxLength={1500}
            />
            {comentarioStatus === "saving" ? <p className="save-flag">Salvando...</p> : null}
            {comentarioStatus === "saved" ? <p className="save-flag is-ok">Salvo</p> : null}
            {comentarioStatus === "error" ? <p className="save-flag is-err">Não salvou</p> : null}
          </div>
        ) : recado ? (
          <div className={`note recado-view ${flashed.has("comentarioNutri") ? "flash" : ""}`}>
            <p>Recado da nutricionista</p>
            <strong>{semana.comentarioNutri}</strong>
          </div>
        ) : null}
      </section>
    </div>
  );
}
