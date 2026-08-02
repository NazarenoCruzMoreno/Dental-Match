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
  wrapper:   { display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" },
  help:      { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" },
  count:     { color: "var(--color-primary)", fontWeight: 700 },
  row:       { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  dayLabel:  { width: "80px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 },
  turnos:    { display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 },
  chip:      { display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer", transition: "all .15s", minWidth: "62px" },
  chipActive:{ background: "var(--color-primary)", color: "var(--color-primary-text)", border: "1px solid transparent", boxShadow: "var(--shadow-sm)" },
  chipTime:  { fontSize: "10px", fontWeight: 600, color: "var(--text-tertiary)" },
  chipTimeActive: { color: "rgba(255,255,255,0.85)" },
};
