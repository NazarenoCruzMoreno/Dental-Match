import { useState } from "react";
import { casosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/Modal/Modal";
import RatingStars from "../../components/RatingStars/RatingStars";

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
    <Modal open onClose={onClose} title="Finalizar caso" maxWidth="520px">
      <p style={s.sub}>{caso.titulo}</p>

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
            <RatingStars value={rating} onChange={setRating} size={32} />
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
    </Modal>
  );
}

const s = {
  sub:        { fontSize: "13px", color: "var(--text-secondary)", margin: "-8px 0 20px" },
  form:       { display: "flex", flexDirection: "column", gap: "18px" },
  field:      { display: "flex", flexDirection: "column" },
  label:      { fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" },
  req:        { color: "var(--color-danger)" },
  textarea:   { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: "14px", outline: "none", resize: "vertical", lineHeight: "1.5", background: "var(--bg-input)", color: "var(--text-primary)" },
  select:     { height: "46px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0 14px", fontSize: "14px", outline: "none", background: "var(--bg-input)", color: "var(--text-primary)" },
  starsRow:   { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" },
  ratingHelp: { marginLeft: "12px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 },
  errBox:     { padding: "10px 14px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontSize: "13px" },
  actions:    { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:  { padding: "12px 22px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  submitBtn:  { padding: "12px 24px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-sm)" },
};
