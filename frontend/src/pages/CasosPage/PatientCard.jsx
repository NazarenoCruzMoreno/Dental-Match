import { useState } from "react";
import { timeAgo } from "../../utils/format";

// Imagen del caso con fallback automático si falla la carga
function CaseImage({ src }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

  return (
    <div
      style={{ ...s.card, ...(hover ? s.cardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Imagen del caso (foto de la boca) */}
      <div style={s.imgArea}>
        <CaseImage src={caso.imagen_url} />
        <div style={s.availBadge}>● Disponible</div>
        {caso.es_analisis && (
          <div style={s.analisisBadge}>🎓 Análisis · Junior</div>
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
  card:           { background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all .22s ease", display: "flex", flexDirection: "column" },
  cardHover:      { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(37,99,235,0.13)", border: "1px solid #bfdbfe" },
  imgArea:        { position: "relative", height: "160px", overflow: "hidden", flexShrink: 0 },
  img:            { width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" },
  imgPlaceholder: { height: "100%", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center" },
  availBadge:     { position: "absolute", top: "10px", right: "10px", background: "rgba(16,185,129,0.9)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", backdropFilter: "blur(4px)" },
  analisisBadge:  { position: "absolute", top: "10px", left: "10px", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "999px", boxShadow: "0 2px 8px rgba(139,92,246,0.35)" },
  body:           { padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 },
  patRow:         { display: "flex", alignItems: "center", gap: "10px" },
  avatar:         { width: "36px", height: "36px", minWidth: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 },
  name:           { fontWeight: 700, fontSize: "14px", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  age:            { fontSize: "12px", color: "#94a3b8" },
  title:          { fontWeight: 800, fontSize: "15px", color: "#0f172a", lineHeight: 1.3, fontFamily: "'Inter',sans-serif" },
  desc:           { fontSize: "13px", color: "#64748b", lineHeight: "1.55", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  footer:         { display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" },
  type:           { fontSize: "11px", color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 },
  date:           { fontSize: "11px", color: "#94a3b8", marginLeft: "auto" },
  btn:            { width: "100%", padding: "10px", background: "#f8fafc", color: "#2563eb", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s", marginTop: "4px" },
  btnHover:       { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid transparent", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" },
};
