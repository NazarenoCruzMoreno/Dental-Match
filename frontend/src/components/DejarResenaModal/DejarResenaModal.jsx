import { useState } from "react";
import Modal from "../Modal/Modal";
import RatingStars from "../RatingStars/RatingStars";
import Button from "../Button/Button";
import { reviewService } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Deja una review del paciente hacia el estudiante que finalizó su caso.
// El backend identifica al paciente por el token — acá solo mandamos
// estudiante_id, rating y comment (POST /api/reviews).
export default function DejarResenaModal({ open, onClose, estudianteId, estudianteNombre, onSuccess }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setRating(0); setComment(""); setError(""); };

  const handleClose = () => {
    if (submitting) return; // evita cerrar a mitad de un envío
    reset();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // evita doble envío (doble click / doble Enter)

    if (rating < 1) {
      setError("Elegí una puntuación de 1 a 5 estrellas.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await reviewService.create({
        estudiante_id: estudianteId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("¡Gracias por tu reseña!");
      reset();
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "No se pudo enviar la reseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Dejar reseña" maxWidth="440px">
      <form onSubmit={handleSubmit} style={s.form}>
        {estudianteNombre && (
          <p style={s.intro}>¿Cómo fue tu experiencia con <strong>{estudianteNombre}</strong>?</p>
        )}

        <div style={s.ratingBlock}>
          <RatingStars value={rating} onChange={setRating} size={32} />
        </div>

        <div style={s.field}>
          <label htmlFor="resena-comentario" style={s.label}>Comentario (opcional)</label>
          <textarea
            id="resena-comentario"
            style={s.textarea}
            rows={4}
            maxLength={500}
            placeholder="Contale a otros pacientes cómo te fue..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.actions}>
          <Button type="button" variant="ghost" arrow={false} onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" arrow={false} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar reseña"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const s = {
  form:        { display: "flex", flexDirection: "column", gap: "18px" },
  intro:       { margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" },
  ratingBlock: { display: "flex", justifyContent: "center", padding: "8px 0" },
  field:       { display: "flex", flexDirection: "column", gap: "6px" },
  label:       { fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" },
  textarea:    { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", color: "var(--text-primary)", padding: "10px 12px", fontSize: "14px", resize: "vertical", outline: "none", fontFamily: "inherit" },
  errorBox:    { padding: "10px 14px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "var(--radius-sm)", fontSize: "13px" },
  actions:     { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" },
};
