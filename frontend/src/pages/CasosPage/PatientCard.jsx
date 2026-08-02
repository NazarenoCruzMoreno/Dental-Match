import { useState } from "react";
import { timeAgo } from "../../utils/format";
import StatusBadge from "../../components/StatusBadge/StatusBadge";

// Imagen del caso con fallback automático si falla la carga
function CaseImage({ src }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ width: "100%", height: "100%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "48px" }}>🦷</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Foto del caso"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

// ── Tarjeta de paciente para el marketplace ─────────────────────────────────
export default function PatientCard({ caso, onClick }) {
  const [hover, setHover] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
  };

  return (
    <div
      style={{ ...s.card, ...(hover ? s.cardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Imagen del caso (foto de la boca) */}
      <div style={s.imgArea}>
        <CaseImage src={caso.imagen_url} />
        <div style={s.availBadge}>● Disponible</div>
        {caso.es_analisis && (
          <div style={s.analisisBadgeWrap}><StatusBadge estado="analisis" /></div>
        )}
      </div>

      <div style={s.body}>
        {/* Info paciente */}
        <div style={s.patRow}>
          <div style={s.avatar}>{caso.pacientes?.nombre?.charAt(0) ?? "P"}</div>
          <div>
            <div style={s.name}>{caso.pacientes?.nombre ?? "Paciente"}</div>
            <div style={s.age}>{caso.pacientes?.edad} años</div>
          </div>
        </div>

        <div style={s.title}>{caso.titulo}</div>
        <p style={s.desc}>{caso.descripcion}</p>

        <div style={s.footer}>
          {caso.tipo_tratamiento && <span style={s.type}>{caso.tipo_tratamiento}</span>}
          <span style={s.date}>{timeAgo(caso.created_at)}</span>
        </div>

        <button style={{ ...s.btn, ...(hover ? s.btnHover : {}) }}>Ver Caso →</button>
      </div>
    </div>
  );
}

const s = {
  card:           { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer", transition: "border-color .2s ease, box-shadow .2s ease", display: "flex", flexDirection: "column" },
  cardHover:      { boxShadow: "var(--shadow-md)", border: "1px solid var(--border-strong)" },
  imgArea:        { position: "relative", height: "160px", overflow: "hidden", flexShrink: 0 },
  availBadge:     { position: "absolute", top: "10px", right: "10px", background: "var(--color-success)", color: "var(--color-primary-text)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-full)" },
  analisisBadgeWrap: { position: "absolute", top: "10px", left: "10px" },
  body:           { padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 },
  patRow:         { display: "flex", alignItems: "center", gap: "10px" },
  avatar:         { width: "36px", height: "36px", minWidth: "36px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 },
  name:           { fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" },
  age:            { fontSize: "12px", color: "var(--text-tertiary)" },
  title:          { fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.3 },
  desc:           { fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.55", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  footer:         { display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" },
  type:           { fontSize: "11px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 600 },
  date:           { fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "auto" },
  btn:            { width: "100%", padding: "10px", background: "var(--bg-subtle)", color: "var(--color-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all .2s", marginTop: "4px" },
  btnHover:       { background: "var(--color-primary)", color: "var(--color-primary-text)", border: "1px solid transparent" },
};
