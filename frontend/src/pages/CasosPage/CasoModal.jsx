import { useState } from "react";
import { timeAgo, inferSintomas } from "../../utils/format";

// ── Modal de detalle de caso clínico (vista estudiante) ─────────────────────
export default function CasoModal({ caso, onClose, onAplicar }) {
  const [applying, setApplying] = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const sintomas = inferSintomas(caso.descripcion);

  const handleAplicar = async () => {
    setApplying(true); setErr("");
    try {
      await onAplicar(caso.id);
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setApplying(false); }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} data-modal role="dialog">

        {/* Imagen */}
        {caso.imagen_url ? (
          <div style={s.imgWrap}>
            <img src={caso.imagen_url} alt="Foto caso" style={s.img} />
            <div style={s.imgOverlay} />
            <button style={s.closeAbsolute} onClick={onClose}>✕</button>
          </div>
        ) : (
          <div style={s.imgPlaceholder}>
            <span style={{ fontSize: "52px" }}>🦷</span>
            <button style={s.closeAbsolute} onClick={onClose}>✕</button>
          </div>
        )}

        <div style={s.body}>
          {/* Header */}
          <div style={s.mHeader}>
            <h2 style={s.mTitle}>{caso.titulo}</h2>
            <div style={s.mMeta}>
              <span style={s.availBadge}>● Disponible</span>
              {caso.tipo_tratamiento && <span style={s.typePill}>{caso.tipo_tratamiento}</span>}
              <span style={s.date}>{timeAgo(caso.created_at)}</span>
            </div>
          </div>

          {/* Info paciente */}
          {caso.pacientes && (
            <div style={s.patSection}>
              <div style={s.patAvatar}>{caso.pacientes.nombre?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={s.patName}>{caso.pacientes.nombre}</div>
                <div style={s.patAge}>{caso.pacientes.edad} años</div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div style={s.section}>
            <div style={s.sLabel}>Descripción completa</div>
            <p style={s.sText}>{caso.descripcion}</p>
          </div>

          {/* Notas */}
          {caso.notas && (
            <div style={s.section}>
              <div style={s.sLabel}>Notas adicionales</div>
              <p style={s.sText}>{caso.notas}</p>
            </div>
          )}

          {/* Síntomas */}
          {sintomas.length > 0 && (
            <div style={s.section}>
              <div style={s.sLabel}>Síntomas detectados</div>
              <div style={s.tagRow}>
                {sintomas.map((sym) => <span key={sym} style={s.tag}>{sym}</span>)}
              </div>
            </div>
          )}

          {/* Acciones */}
          {err && <div style={s.errBox}>{err}</div>}
          <div style={s.actions}>
            <button style={s.cancelBtn} onClick={onClose}>Cerrar</button>
            {done ? (
              <div style={s.successPill}>✅ Aplicación enviada</div>
            ) : (
              <button style={s.applyBtn} onClick={handleAplicar} disabled={applying}>
                {applying ? "Enviando..." : "Tomar Paciente"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay:        { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(6px)", padding: "20px" },
  modal:          { background: "#fff", borderRadius: "24px", maxWidth: "560px", width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.25)" },
  imgWrap:        { position: "relative", height: "220px", overflow: "hidden", borderRadius: "24px 24px 0 0" },
  img:            { width: "100%", height: "100%", objectFit: "cover" },
  imgOverlay:     { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3))" },
  imgPlaceholder: { height: "160px", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "24px 24px 0 0", position: "relative" },
  closeAbsolute:  { position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", cursor: "pointer", fontSize: "14px", backdropFilter: "blur(4px)" },
  body:           { padding: "28px 32px 32px" },
  mHeader:        { marginBottom: "16px" },
  mTitle:         { fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px", fontFamily: "'Inter',sans-serif" },
  mMeta:          { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
  availBadge:     { fontSize: "12px", fontWeight: 700, color: "#10b981", background: "#f0fdf4", padding: "3px 10px", borderRadius: "999px", border: "1px solid #bbf7d0" },
  typePill:       { fontSize: "12px", color: "#3b82f6", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px", fontWeight: 600 },
  date:           { fontSize: "12px", color: "#94a3b8" },
  patSection:     { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "#f8fafc", borderRadius: "14px", marginBottom: "20px" },
  patAvatar:      { width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, flexShrink: 0 },
  patName:        { fontWeight: 700, color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  patAge:         { fontSize: "13px", color: "#64748b" },
  section:        { marginBottom: "18px" },
  sLabel:         { fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  sText:          { fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: 0, fontFamily: "'Inter',sans-serif" },
  tagRow:         { display: "flex", gap: "8px", flexWrap: "wrap" },
  tag:            { padding: "5px 12px", background: "#eff6ff", color: "#2563eb", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: "1px solid #bfdbfe" },
  errBox:         { padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontSize: "13px", marginBottom: "12px" },
  actions:        { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:      { padding: "12px 24px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  applyBtn:       { padding: "12px 28px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" },
  successPill:    { padding: "12px 20px", background: "#f0fdf4", color: "#16a34a", borderRadius: "12px", fontSize: "14px", fontWeight: 700 },
};
