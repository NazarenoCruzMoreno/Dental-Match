import { useEffect, useState } from "react";
import { adminService } from "../../services/api";
import { s } from "./estilos";

const CARDS = [
  { key: "estudiantes", label: "Estudiantes", icon: "🎓", tone: "info" },
  { key: "pacientes",   label: "Pacientes",   icon: "👤", tone: "success" },
  { key: "casos",       label: "Casos",       icon: "🦷", tone: "warning" },
];

export default function AdminResumen() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    adminService.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div style={s.errorBox}>{error}</div>;

  return (
    <div style={s.grid}>
      {CARDS.map((c) => loading ? (
        <div key={c.key} style={s.skeletonCard} />
      ) : (
        <div key={c.key} style={{ ...s.card, background: `var(--color-${c.tone}-bg)` }}>
          <div style={s.cardIcon}>{c.icon}</div>
          <div style={{ ...s.cardValue, color: `var(--color-${c.tone})` }}>{stats?.[c.key] ?? 0}</div>
          <div style={s.cardLabel}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
