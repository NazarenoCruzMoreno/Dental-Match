// ── Combo box para disponibilidad horaria ───────────────────────────────────
// Genera slots predefinidos: Lunes mañana, Lunes tarde, Martes mañana, ...
// y los muestra como chips multiselect — evita strings inconsistentes.

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TURNOS = [
  { key: "mañana", label: "Mañana", time: "9-13hs" },
  { key: "tarde",  label: "Tarde",  time: "14-18hs" },
  { key: "noche",  label: "Noche",  time: "18-21hs" },
];

export default function AvailabilityPicker({ value = [], onChange }) {
  const toggle = (slot) => {
    if (value.includes(slot)) onChange(value.filter((v) => v !== slot));
    else onChange([...value, slot]);
  };

  const isActive = (slot) => value.includes(slot);

  return (
    <div style={s.wrapper}>
      <div style={s.help}>
        Tocá los horarios en los que podés atender pacientes.
        {value.length > 0 && <span style={s.count}> · {value.length} elegidos</span>}
      </div>
      {DIAS.map((dia) => (
        <div key={dia} style={s.row}>
          <div style={s.dayLabel}>{dia}</div>
          <div style={s.turnos}>
            {TURNOS.map((t) => {
              const slot = `${dia} ${t.label} (${t.time})`;
              const active = isActive(slot);
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => toggle(slot)}
                  style={{ ...s.chip, ...(active ? s.chipActive : {}) }}
                >
                  {t.label}
                  <span style={{ ...s.chipTime, ...(active ? s.chipTimeActive : {}) }}>{t.time}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrapper:   { display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: "14px" },
  help:      { fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Inter',sans-serif" },
  count:     { color: "#2563eb", fontWeight: 700 },
  row:       { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  dayLabel:  { width: "80px", fontSize: "13px", fontWeight: 700, color: "#0f172a", fontFamily: "'Inter',sans-serif", flexShrink: 0 },
  turnos:    { display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 },
  chip:      { display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", padding: "6px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "12px", fontWeight: 700, color: "#475569", cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s", minWidth: "62px" },
  chipActive:{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid transparent", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" },
  chipTime:  { fontSize: "10px", fontWeight: 600, color: "#94a3b8" },
  chipTimeActive: { color: "rgba(255,255,255,0.85)" },
};
