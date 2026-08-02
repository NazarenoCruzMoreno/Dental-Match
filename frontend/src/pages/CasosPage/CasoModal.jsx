import { useState } from "react";
import { timeAgo, inferSintomas } from "../../utils/format";
import Modal from "../../components/Modal/Modal";
import StatusBadge from "../../components/StatusBadge/StatusBadge";

function CaseImage({ src, height = 220 }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ height, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)" }}>
        <span style={{ fontSize: "60px" }}>🦷</span>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", height, overflow: "hidden", borderRadius: "var(--radius-md)" }}>
      <img src={src} alt="Foto del caso" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setError(true)} />
    </div>
  );
}

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
    <Modal open onClose={onClose} title={caso.titulo} maxWidth="560px">
      {/* Imagen del caso con fallback */}
      <div style={{ marginBottom: "16px" }}>
        <CaseImage src={caso.imagen_url} />
      </div>

      {/* Meta */}
      <div style={s.mMeta}>
        <StatusBadge estado="disponible" />
        {caso.tipo_tratamiento && <span style={s.typePill}>{caso.tipo_tratamiento}</span>}
        <span style={s.date}>{timeAgo(caso.created_at)}</span>
      </div>

      {/* Info paciente */}
      {caso.pacientes && (
        <div style={s.patSection}>
          <div style={s.patAvatar}>{caso.pacientes.nombre?.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={s.patName}>{caso.pacientes.nombre}</div>
            <div style={s.patAge}>{caso.pacientes.edad} años</div>
          </div>
          {/* Rating + experiencia previa del paciente */}
          {(caso.pacientes.rating > 0 || caso.pacientes.turnos_completados > 0) && (
            <div style={{ textAlign: "right" }}>
              {caso.pacientes.rating > 0 && (
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-warning)" }}>
                  ★ {caso.pacientes.rating}
                </div>
              )}
              {caso.pacientes.turnos_completados > 0 && (
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {caso.pacientes.turnos_completados} turno{caso.pacientes.turnos_completados !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Badge si es caso de análisis */}
      {caso.es_analisis && (
        <div style={{ marginBottom: "16px" }}>
          <StatusBadge estado="analisis" label="🎓 Análisis · Apto para estudiantes en formación" />
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
    </Modal>
  );
}

const s = {
  mMeta:          { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" },
  typePill:       { fontSize: "12px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 },
  date:           { fontSize: "12px", color: "var(--text-tertiary)" },
  patSection:     { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", marginBottom: "20px" },
  patAvatar:      { width: "44px", height: "44px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, flexShrink: 0 },
  patName:        { fontWeight: 700, color: "var(--text-primary)" },
  patAge:         { fontSize: "13px", color: "var(--text-secondary)" },
  section:        { marginBottom: "18px" },
  sLabel:         { fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  sText:          { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 },
  tagRow:         { display: "flex", gap: "8px", flexWrap: "wrap" },
  tag:            { padding: "5px 12px", background: "var(--color-info-bg)", color: "var(--color-primary)", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 700 },
  errBox:         { padding: "10px 14px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontSize: "13px", marginBottom: "12px" },
  actions:        { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:      { padding: "12px 24px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  applyBtn:       { padding: "12px 28px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  successPill:    { padding: "12px 20px", background: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700 },
};
