import { useEffect, useState } from "react";
import { statsService } from "../../services/api";
import "./ActivityGraph.css";

const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

const MONTHS      = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// El endpoint /api/activity cuenta asignaciones (estudiante <-> paciente) por mes
const asignaciones = (n) => (n === 1 ? "1 asignación" : `${n} asignaciones`);

export default function ActivityGraph() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService.activity()
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const now  = new Date();
  const bars = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const mes = `${MONTHS_FULL[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
    return { label: MONTHS[d.getMonth()], mes, value: data.find(x => x.month === key)?.count ?? 0 };
  });

  const max   = Math.max(...bars.map(b => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);

  const header = (subtitle) => (
    <div className="ag-header">
      <div>
        <div className="ag-title"><IconActivity /> Actividad reciente</div>
        {subtitle && <div className="ag-subtitle">{subtitle}</div>}
      </div>
      {!loading && <div className="ag-total">{total} total</div>}
    </div>
  );

  if (loading) return (
    <div className="ag-panel">
      {header(null)}
      <div className="ag-loading">Cargando...</div>
    </div>
  );

  return (
    <div className="ag-panel">
      {header(total === 0 ? "Sin actividad registrada aún" : `${asignaciones(total)} en los últimos 6 meses`)}

      <div className="ag-chart">
        {bars.map((bar, i) => {
          const pct  = (bar.value / max) * 100;
          const tip  = `${bar.mes}: ${bar.value === 0 ? "sin actividad" : asignaciones(bar.value)}`;
          const side = i === 0 ? " ag-col--first" : i === bars.length - 1 ? " ag-col--last" : "";
          return (
            <div key={i} className={`ag-col${side}`} tabIndex={0} role="img" aria-label={tip}>
              <div className="ag-tip" aria-hidden="true">{tip}</div>
              <div className="ag-value">{bar.value > 0 ? bar.value : ""}</div>
              <div className="ag-track">
                {bar.value > 0 && <div className="ag-fill" style={{ height: `${Math.max(pct, 8)}%` }} />}
              </div>
              <div className="ag-label">{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
