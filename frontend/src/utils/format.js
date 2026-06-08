// ── Utilidades de formato compartidas ───────────────────────────────────────

export const timeAgo = (date) => {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d === 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 7)  return `Hace ${d} días`;
  return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

// Síntomas inferidos de un texto libre — usado en el modal de casos
const SINTOMAS_MAP = [
  ["dolor",      "Dolor"],
  ["inflam",     "Inflamación"],
  ["sangr",      "Sangrado"],
  ["sensibil",   "Sensibilidad"],
  ["caries",     "Caries"],
  ["ortodoncia", "Ortodoncia"],
  ["muela",      "Muela del juicio"],
  ["encía",      "Encías"],
];

export const inferSintomas = (desc = "") => {
  const lower = desc.toLowerCase();
  return SINTOMAS_MAP
    .filter(([k]) => lower.includes(k))
    .map(([, v]) => v)
    .slice(0, 4);
};
