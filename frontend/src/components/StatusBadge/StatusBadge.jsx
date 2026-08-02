// Fuente única de verdad para "estado -> color". Antes esta tabla estaba
// duplicada (con hex ligeramente distintos) en CasosPage, AsignacionesPage
// y TurnosPage.
export const ESTADOS = {
  abierto:      { label: "Abierto",           tone: "info" },
  en_progreso:  { label: "En progreso",       tone: "info" },
  pendiente:    { label: "Pendiente",         tone: "warning" },
  propuesto:    { label: "Propuesto",         tone: "warning" },
  confirmado:   { label: "Confirmado",        tone: "success" },
  aceptado:     { label: "Aceptado",          tone: "success" },
  asignado:     { label: "Asignado",          tone: "info" },
  completado:   { label: "Completado",        tone: "success" },
  cancelado:    { label: "Cancelado",         tone: "neutral" },
  rechazado:    { label: "Rechazado",         tone: "danger" },
  disponible:   { label: "Disponible",        tone: "success" },
  analisis:     { label: "Análisis · Junior", tone: "purple" },
};

const TONES = {
  info:    { color: "var(--color-info)",    bg: "var(--color-info-bg)" },
  success: { color: "var(--color-success)", bg: "var(--color-success-bg)" },
  warning: { color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  danger:  { color: "var(--color-danger)",  bg: "var(--color-danger-bg)" },
  purple:  { color: "var(--color-purple)",  bg: "var(--color-purple-bg)" },
  neutral: { color: "var(--text-secondary)", bg: "var(--bg-subtle)" },
};

export default function StatusBadge({ estado, label }) {
  const config = ESTADOS[estado] || { label: label || estado, tone: "neutral" };
  const tone = TONES[config.tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "var(--radius-full)",
      fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap",
      color: tone.color, background: tone.bg,
    }}>
      {label || config.label}
    </span>
  );
}
