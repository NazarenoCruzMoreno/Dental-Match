import { useEffect, useState } from "react";
import { adminService } from "../../services/api";

const CARDS = [
  { key: "estudiantes", label: "Estudiantes", icon: "🎓", tone: "info" },
  { key: "pacientes",   label: "Pacientes",   icon: "👤", tone: "success" },
  { key: "casos",       label: "Casos",       icon: "🦷", tone: "warning" },
];

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    adminService.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Panel de administración</h1>
          <p style={s.sub}>Vista general de la plataforma</p>
        </div>

        {loading ? (
          <div style={s.grid}>
            {CARDS.map((c) => <div key={c.key} style={s.skeletonCard} />)}
          </div>
        ) : error ? (
          <div style={s.errorBox}>{error}</div>
        ) : (
          <div style={s.grid}>
            {CARDS.map((c) => (
              <div key={c.key} style={{ ...s.card, background: `var(--color-${c.tone}-bg)` }}>
                <div style={s.cardIcon}>{c.icon}</div>
                <div style={{ ...s.cardValue, color: `var(--color-${c.tone})` }}>{stats?.[c.key] ?? 0}</div>
                <div style={s.cardLabel}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={s.tableSection}>
          <h2 style={s.tableTitle}>Resumen</h2>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Métrica</th>
                <th style={s.th}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {CARDS.map((c) => (
                <tr key={c.key}>
                  <td style={s.td}>{c.icon} {c.label}</td>
                  <td style={s.td}>{loading ? "..." : (stats?.[c.key] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "var(--bg-page)", padding: "36px 20px 60px" },
  container: { maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
  header:    { display: "flex", flexDirection: "column", gap: "4px" },
  title:     { fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  sub:       { fontSize: "14px", color: "var(--text-secondary)", margin: 0 },

  grid:          { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  card:          { borderRadius: "var(--radius-lg)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center" },
  cardIcon:      { fontSize: "28px" },
  cardValue:     { fontSize: "32px", fontWeight: 900 },
  cardLabel:     { fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 },
  skeletonCard:  { borderRadius: "var(--radius-lg)", height: "120px", background: "var(--bg-subtle)" },

  errorBox: { padding: "16px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: "14px" },

  tableSection: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-sm)" },
  tableTitle:   { fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { textAlign: "left", fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 0", borderBottom: "1px solid var(--border)" },
  td:           { padding: "12px 0", fontSize: "14px", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" },
};
