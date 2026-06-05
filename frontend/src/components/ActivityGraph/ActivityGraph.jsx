import { useEffect, useState } from "react";
import { statsService } from "../../services/api";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ActivityGraph({ userId, role, isDark = false }) {
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

  // Colores según tema
  const cardBg      = isDark ? "#1e293b" : "#fff";
  const titleColor  = isDark ? "#f1f5f9" : "#0f172a";
  const subColor    = isDark ? "#94a3b8" : "#64748b";
  const trackBg     = isDark ? "#334155" : "#f1f5f9";
  const labelColor  = isDark ? "#64748b" : "#94a3b8";
  const valueColor  = isDark ? "#60a5fa" : "#3b82f6";
  const badgeBg     = isDark ? "#1e3a5f" : "#eff6ff";
  const badgeColor  = isDark ? "#93c5fd" : "#2563eb";
  const shadowStyle = isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)";

  if (loading) return (
    <div style={{ ...st.card, background: cardBg, boxShadow: shadowStyle }}>
      <div style={st.header}>
        <div style={{ ...st.title, color: titleColor }}>📊 Actividad reciente</div>
      </div>
      <div style={{ ...st.loadingText, color: subColor }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ ...st.card, background: cardBg, boxShadow: shadowStyle }}>
      <div style={st.header}>
        <div>
          <div style={{ ...st.title, color: titleColor }}>📊 Actividad reciente</div>
          <div style={{ ...st.subtitle, color: subColor }}>
            {total === 0
              ? "Sin actividad registrada aún"
              : `${total} ${role === "estudiante" ? "asignación(es)" : "turno(s)"} en los últimos 6 meses`}
          </div>
        </div>
        <div style={{ ...st.totalBadge, background: badgeBg, color: badgeColor }}>{total} total</div>
      </div>

      <div style={st.chartArea}>
        {bars.map((bar, i) => {
          const pct = max === 0 ? 0 : (bar.value / max) * 100;
          return (
            <div key={i} style={st.barCol}>
              <div style={{ ...st.barValue, color: valueColor }}>{bar.value > 0 ? bar.value : ""}</div>
              <div style={{ ...st.barTrack, background: trackBg }}>
                <div style={{
                  ...st.barFill,
                  height: `${Math.max(pct, bar.value > 0 ? 8 : 0)}%`,
                  background: pct > 60
                    ? "linear-gradient(180deg,#3b82f6,#2563eb)"
                    : pct > 30
                    ? "linear-gradient(180deg,#60a5fa,#3b82f6)"
                    : "linear-gradient(180deg,#bfdbfe,#93c5fd)",
                }} />
              </div>
              <div style={{ ...st.barLabel, color: labelColor }}>{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const st = {
  card:        { borderRadius: "20px", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", transition: "background .3s, box-shadow .3s" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title:       { fontSize: "15px", fontWeight: 800, fontFamily: "'Inter',sans-serif" },
  subtitle:    { fontSize: "13px", marginTop: "2px", fontFamily: "'Inter',sans-serif" },
  totalBadge:  { padding: "4px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, fontFamily: "'Inter',sans-serif", flexShrink: 0 },
  loadingText: { textAlign: "center", padding: "32px 0", fontFamily: "'Inter',sans-serif", fontSize: "14px" },
  chartArea:   { display: "flex", gap: "8px", alignItems: "flex-end", height: "140px" },
  barCol:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" },
  barValue:    { fontSize: "11px", fontWeight: 700, height: "16px", fontFamily: "'Inter',sans-serif" },
  barTrack:    { flex: 1, width: "100%", borderRadius: "6px", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barFill:     { width: "100%", borderRadius: "6px 6px 0 0", transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)" },
  barLabel:    { fontSize: "11px", fontWeight: 600, fontFamily: "'Inter',sans-serif" },
};
