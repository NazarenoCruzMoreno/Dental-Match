import { useState } from "react";
import { casosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const TRATAMIENTOS = [
  "Limpieza dental", "Empaste", "Endodoncia", "Extracción simple",
  "Extracción compleja", "Corona", "Ortodoncia inicial", "Análisis y diagnóstico",
  "Periodoncia", "Estética dental", "Otro",
];

export default function FinalizarCasoModal({ caso, onClose, onDone }) {
  const toast = useToast();
  const [diagnostico,  setDiagnostico]   = useState("");
  const [tratamiento,  setTratamiento]   = useState("");
  const [rating,       setRating]        = useState(0);
  const [comentario,   setComentario]    = useState("");
  const [saving,       setSaving]        = useState(false);
  const [error,        setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (diagnostico.length < 10) return setError("Diagnóstico muy corto (mínimo 10 caracteres)");
    if (!tratamiento)             return setError("Indicá el tratamiento realizado");
    if (rating === 0)             return setError("Calificá al paciente del 1 al 5");
    setError(""); setSaving(true);
    try {
      await casosService.finalizar(caso.id, {
        diagnostico,
        tratamiento_asignado: tratamiento,
        rating_paciente:      rating,
        comentario:           comentario || undefined,
      });
      toast.success("Caso finalizado correctamente 🎉");
      onDone?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} role="dialog">
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Finalizar caso</h2>
            <p style={s.sub}>{caso.titulo}</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.divider}/>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.errBox}>{error}</div>}

          {/* Diagnóstico */}
          <div style={s.field}>
            <label style={s.label}>Diagnóstico <span style={s.req}>*</span></label>
            <textarea
              value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ej: Caries en molar inferior derecho, sin afectar pulpa..."
              rows={3} style={s.textarea}
            />
          </div>

          {/* Tratamiento */}
          <div style={s.field}>
            <label style={s.label}>Tratamiento realizado <span style={s.req}>*</span></label>
            <select value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} style={s.select}>
              <option value="">Seleccioná un tratamiento...</option>
              {TRATAMIENTOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Rating del paciente */}
          <div style={s.field}>
            <label style={s.label}>Calificá al paciente <span style={s.req}>*</span></label>
            <div style={s.starsRow}>
              {[1,2,3,4,5].map((n) => (
                <button
                  type="button" key={n}
                  onClick={() => setRating(n)}
                  style={{ ...s.starBtn, color: n <= rating ? "#f59e0b" : "#e2e8f0" }}
                  aria-label={`${n} estrellas`}
                >★</button>
              ))}
              <span style={s.ratingHelp}>
                {rating === 0 && "Tocá para calificar"}
                {rating === 1 && "Muy mala experiencia"}
                {rating === 2 && "No fue buena"}
                {rating === 3 && "Aceptable"}
                {rating === 4 && "Buena"}
                {rating === 5 && "Excelente paciente"}
              </span>
            </div>
          </div>

          {/* Comentario */}
          <div style={s.field}>
            <label style={s.label}>Comentario (opcional)</label>
            <textarea
              value={comentario} onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej: Paciente puntual, cooperativo, cumplió las indicaciones..."
              rows={2} style={s.textarea} maxLength={500}
            />
          </div>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" style={s.submitBtn} disabled={saving}>
              {saving ? "Guardando..." : "✓ Finalizar caso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9100, backdropFilter: "blur(6px)", padding: "20px" },
  modal:      { background: "#fff", borderRadius: "24px", padding: "28px 32px", maxWidth: "520px", width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.2)" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  title:      { fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0, fontFamily: "'Inter',sans-serif" },
  sub:        { fontSize: "13px", color: "#64748b", margin: "4px 0 0" },
  closeBtn:   { background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", color: "#64748b" },
  divider:    { height: "1px", background: "#f1f5f9", margin: "20px 0" },
  form:       { display: "flex", flexDirection: "column", gap: "18px" },
  field:      { display: "flex", flexDirection: "column" },
  label:      { fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", fontFamily: "'Inter',sans-serif" },
  req:        { color: "#ef4444" },
  textarea:   { border: "2px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", fontFamily: "'Inter',sans-serif", outline: "none", resize: "vertical", lineHeight: "1.5" },
  select:     { height: "46px", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 14px", fontSize: "14px", fontFamily: "'Inter',sans-serif", outline: "none", background: "#fff" },
  starsRow:   { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" },
  starBtn:    { background: "none", border: "none", fontSize: "32px", cursor: "pointer", padding: "2px 6px", lineHeight: 1, transition: "color .15s" },
  ratingHelp: { marginLeft: "12px", fontSize: "13px", color: "#94a3b8", fontWeight: 600 },
  errBox:     { padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontSize: "13px" },
  actions:    { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:  { padding: "12px 22px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  submitBtn:  { padding: "12px 24px", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" },
};
