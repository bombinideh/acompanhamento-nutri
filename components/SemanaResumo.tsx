import { formatNumber, weekSummary, type Semana } from "@/lib/week";

export function SemanaResumo({ semana }: { semana: Semana }) {
  const summary = weekSummary(semana);

  return (
    <section className="semana-resumo" aria-label="Resumo da semana">
      <div className="resumo-item">
        <p>Refeições feitas</p>
        <strong>
          {summary.mealsDone}/{summary.mealsTotal}
        </strong>
      </div>
      <div className="resumo-item">
        <p>Academia</p>
        <strong>
          {summary.gymDays} {summary.gymDays === 1 ? "dia" : "dias"}
        </strong>
      </div>
      <div className="resumo-item">
        <p>Sono médio</p>
        <strong>{formatNumber(summary.avgSleep, "h") || "—"}</strong>
      </div>
      <div className="resumo-item">
        <p>Água média</p>
        <strong>{formatNumber(summary.avgWater, "L") || "—"}</strong>
      </div>
    </section>
  );
}
