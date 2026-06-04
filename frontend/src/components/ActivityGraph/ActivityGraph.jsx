import { useEffect, useState } from "react";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ActivityGraph({ userId, role }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener asignaciones de los últimos 6 meses
    fetch("/api/activity", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Construir labels de los últimos 6 meses
  const now   = new Date();
  const bars  = Array.from({ length: 6 }, (_, i) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const found = data.find(x => x.month === key);
    return { label: MONTHS[d.getMonth()], value: found?.count ?? 0 };
  });

  const max   = Math.max(...bars.map(b => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);

  if (loading) return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.title}>📊 Actividad reciente</div>
      </div>
      <div style={styles.loadingText}>Cargando...</div>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>📊 Actividad reciente</div>
          <div style={styles.subtitle}>
            {total === 0
              ? "Sin actividad registrada aún"
              : `${total} ${role === "estudiante" ? "asignación(es)" : "turno(s)"} en los últimos 6 meses`}
          </div>
        </div>
        <div style={styles.totalBadge}>{total} total</div>
      </div>

      <div style={styles.chartArea}>
        {bars.map((bar, i) => {
          const pct = max === 0 ? 0 : (bar.value / max) * 100;
          return (
            <div key={i} style={styles.barCol}>
              <div style={styles.barValue}>{bar.value > 0 ? bar.value : ""}</div>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    height: `${Math.max(pct, bar.value > 0 ? 8 : 0)}%`,
                    background: pct > 60
                      ? "linear-gradient(180deg, #3b82f6, #2563eb)"
                      : pct > 30
                      ? "linear-gradient(180deg, #60a5fa, #3b82f6)"
                      : "linear-gradient(180deg, #bfdbfe, #93c5fd)",
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <div style={styles.barLabel}>{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  card:        { background: "#fff", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title:       { fontSize: "15px", fontWeight: 800, color: "#0f172a", fontFamily: "'Inter', sans-serif" },
  subtitle:    { fontSize: "13px", color: "#64748b", marginTop: "2px", fontFamily: "'Inter', sans-serif" },
  totalBadge:  { padding: "4px 12px", background: "#eff6ff", color: "#2563eb", borderRadius: "999px", fontSize: "13px", fontWeight: 700, fontFamily: "'Inter', sans-serif" },
  loadingText: { textAlign: "center", color: "#94a3b8", padding: "32px 0", fontFamily: "'Inter', sans-serif", fontSize: "14px" },
  chartArea:   { display: "flex", gap: "8px", alignItems: "flex-end", height: "140px" },
  barCol:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" },
  barValue:    { fontSize: "11px", fontWeight: 700, color: "#3b82f6", height: "16px", fontFamily: "'Inter', sans-serif" },
  barTrack:    { flex: 1, width: "100%", background: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barFill:     { width: "100%", borderRadius: "6px 6px 0 0", transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)", minHeight: "0" },
  barLabel:    { fontSize: "11px", color: "#94a3b8", fontWeight: 600, fontFamily: "'Inter', sans-serif" },
};
