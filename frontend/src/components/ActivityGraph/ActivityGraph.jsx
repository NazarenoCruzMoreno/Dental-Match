import { useEffect, useState } from "react";
import { statsService } from "../../services/api";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ActivityGraph({ userId, role }) {
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
    return { label: MONTHS[d.getMonth()], value: data.find(x => x.month === key)?.count ?? 0 };
  });

  const max   = Math.max(...bars.map(b => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);

  if (loading) return (
    <div style={st.card}>
      <div style={st.header}>
        <div style={st.title}>📊 Actividad reciente</div>
      </div>
      <div style={st.loadingText}>Cargando...</div>
    </div>
  );

  return (
    <div style={st.card}>
      <div style={st.header}>
        <div>
          <div style={st.title}>📊 Actividad reciente</div>
          <div style={st.subtitle}>
            {total === 0
              ? "Sin actividad registrada aún"
              : `${total} ${role === "estudiante" ? "asignación(es)" : "turno(s)"} en los últimos 6 meses`}
          </div>
        </div>
        <div style={st.totalBadge}>{total} total</div>
      </div>

      <div style={st.chartArea}>
        {bars.map((bar, i) => {
          const pct = max === 0 ? 0 : (bar.value / max) * 100;
          return (
            <div key={i} style={st.barCol}>
              <div style={st.barValue}>{bar.value > 0 ? bar.value : ""}</div>
              <div style={st.barTrack}>
                <div style={{
                  ...st.barFill,
                  height: `${Math.max(pct, bar.value > 0 ? 8 : 0)}%`,
                  background: pct > 60
                    ? "var(--color-primary)"
                    : pct > 30
                    ? "var(--color-primary-hover)"
                    : "var(--color-info-bg)",
                }} />
              </div>
              <div style={st.barLabel}>{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const st = {
  card:        { borderRadius: "var(--radius-lg)", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", background: "var(--bg-card)", boxShadow: "var(--shadow-md)", transition: "background .3s, box-shadow .3s" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title:       { fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" },
  subtitle:    { fontSize: "13px", marginTop: "2px", color: "var(--text-secondary)" },
  totalBadge:  { padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: "13px", fontWeight: 700, flexShrink: 0, background: "var(--color-info-bg)", color: "var(--color-info)" },
  loadingText: { textAlign: "center", padding: "32px 0", fontSize: "14px", color: "var(--text-secondary)" },
  chartArea:   { display: "flex", gap: "8px", alignItems: "flex-end", height: "140px" },
  barCol:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" },
  barValue:    { fontSize: "11px", fontWeight: 700, height: "16px", color: "var(--color-primary)" },
  barTrack:    { flex: 1, width: "100%", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "flex-end", overflow: "hidden", background: "var(--bg-subtle)" },
  barFill:     { width: "100%", borderRadius: "6px 6px 0 0", transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)" },
  barLabel:    { fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" },
};
