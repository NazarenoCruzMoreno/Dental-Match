import { useState } from "react";

const DIAS  = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/**
 * Calendario simple para elegir fecha. Devuelve string "YYYY-MM-DD".
 * Props:
 *  - value: string "YYYY-MM-DD" o ""
 *  - onChange: (str) => void
 *  - minDate, maxDate: opcionales, también strings "YYYY-MM-DD"
 */
export default function Calendar({ value, onChange, minDate, maxDate }) {
  const today = new Date();
  const init  = value ? new Date(value + "T12:00:00") : today;
  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());

  const min = minDate ? new Date(minDate + "T00:00:00") : null;
  const max = maxDate ? new Date(maxDate + "T23:59:59") : null;

  // Lunes = 0
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Construir grilla 6 semanas
  const cells = [];
  for (let i = 0; i < startWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedStr = value;
  const isToday = (d) => {
    return d &&
      year  === today.getFullYear() &&
      month === today.getMonth() &&
      d     === today.getDate();
  };
  const isSelected = (d) => {
    if (!d || !selectedStr) return false;
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return ds === selectedStr;
  };
  const isDisabled = (d) => {
    if (!d) return true;
    const date = new Date(year, month, d);
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const selectDay = (d) => {
    if (isDisabled(d)) return;
    const str = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    onChange(str);
  };

  return (
    <div style={s.calendar}>
      {/* Header navegación */}
      <div style={s.header}>
        <button type="button" style={s.navBtn} onClick={prev} aria-label="Mes anterior">‹</button>
        <div style={s.monthLabel}>{MESES[month]} {year}</div>
        <button type="button" style={s.navBtn} onClick={next} aria-label="Mes siguiente">›</button>
      </div>

      {/* Días de la semana */}
      <div style={s.weekdays}>
        {DIAS.map((d, i) => <div key={i} style={s.weekday}>{d}</div>)}
      </div>

      {/* Grilla */}
      <div style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={s.empty}/>;
          const disabled = isDisabled(d);
          const sel = isSelected(d);
          const tod = isToday(d);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => selectDay(d)}
              style={{
                ...s.day,
                ...(sel ? s.daySel : tod ? s.dayToday : {}),
                ...(disabled ? s.dayDisabled : {}),
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  calendar:  { background: "#fff", borderRadius: "14px", padding: "14px", border: "1px solid #e2e8f0", fontFamily: "'Inter',sans-serif", userSelect: "none" },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  navBtn:    { width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "18px", fontWeight: 700, cursor: "pointer", lineHeight: 1 },
  monthLabel:{ fontSize: "14px", fontWeight: 800, color: "#0f172a" },
  weekdays:  { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "4px" },
  weekday:   { textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94a3b8", padding: "4px 0" },
  grid:      { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" },
  day:       { aspectRatio: "1", border: "none", background: "transparent", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#0f172a", cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .15s" },
  daySel:    { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: 800, boxShadow: "0 4px 12px rgba(37,99,235,0.35)" },
  dayToday:  { background: "#eff6ff", color: "#2563eb", fontWeight: 800 },
  dayDisabled:{ color: "#cbd5e1", cursor: "not-allowed", pointerEvents: "none" },
  empty:     { aspectRatio: "1" },
};
