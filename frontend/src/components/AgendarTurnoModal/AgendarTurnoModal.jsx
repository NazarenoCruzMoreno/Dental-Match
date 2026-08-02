import { useState } from "react";
import Modal from "../Modal/Modal";
import Calendar from "../Calendar/Calendar";
import { turnosService } from "../../services/api";

// ── Modal compartido para agendar un turno (Calendar + grid de horarios) ───
// Unifica lo que antes eran dos componentes casi idénticos:
//  - ProponerTurnoModal (ChatPage): el estudiante propone un horario al paciente.
//  - ReservarModal (TurnosPage): el paciente reserva un turno directamente.
// La única diferencia real de comportamiento es el texto/notas y qué endpoint
// se llama al confirmar — eso se resuelve con `mode` y el prop `onSubmit`.

const MODE_CFG = {
  proponer: {
    icon: "📅",
    title: "Proponer turno",
    slotsLabel: "Horario propuesto",
    confirmLabel: "Enviar propuesta",
    confirmingLabel: "Enviando...",
    showNotas: false,
  },
  reservar: {
    icon: "📅",
    title: "Reservar turno",
    slotsLabel: "Horario disponible",
    confirmLabel: "Confirmar turno",
    confirmingLabel: "Reservando...",
    showNotas: true,
  },
};

/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - caso: { id, titulo, estudiante_id }
 *  - mode: "proponer" | "reservar"
 *  - onSubmit: async ({ fecha, hora, notas }) => void — dispara el request real
 *      (turnosService.proponer / turnosService.reservar) del caller. Si tira
 *      error, se muestra error.message y el modal queda abierto.
 *  - onSuccess: () => void — se llama cuando onSubmit resuelve sin error.
 */
export default function AgendarTurnoModal({ open, onClose, caso, mode = "reservar", onSubmit, onSuccess }) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const cfg = MODE_CFG[mode] ?? MODE_CFG.reservar;
  const today = new Date().toISOString().split("T")[0];

  const cargarSlots = async (f) => {
    if (!f || !caso?.estudiante_id) return;
    setLoadingSlots(true);
    try {
      const data = await turnosService.disponibilidad(caso.estudiante_id, f);
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleFecha = (f) => {
    setFecha(f);
    setHora("");
    cargarSlots(f);
  };

  const handleSubmit = async () => {
    if (!fecha || !hora) { setErr("Elegí fecha y horario"); return; }
    setSaving(true);
    setErr("");
    try {
      await onSubmit({ fecha, hora, notas: notas || undefined });
      onSuccess?.();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${cfg.icon} ${cfg.title}`} maxWidth="480px">
      {caso?.titulo && <p style={st.sub}>{caso.titulo}</p>}

      {err && <div style={st.errBox}>{err}</div>}

      <div style={st.field}>
        <label style={st.label}>Elegí una fecha</label>
        <Calendar value={fecha} onChange={handleFecha} minDate={today} />
      </div>

      {fecha && (
        <div style={st.field}>
          <label style={st.label}>{cfg.slotsLabel}</label>
          {loadingSlots ? (
            <p style={st.muted}>Cargando horarios...</p>
          ) : (
            <div style={st.slotGrid}>
              {slots.map((sl) => (
                <button
                  key={sl.hora}
                  type="button"
                  disabled={!sl.disponible}
                  onClick={() => setHora(sl.hora)}
                  style={{ ...st.slot, ...(hora === sl.hora ? st.slotActive : {}), ...(!sl.disponible ? st.slotOcupado : {}) }}
                >
                  {sl.hora}
                  {!sl.disponible && <div style={st.slotLabel}>Ocupado</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {cfg.showNotas && (
        <div style={st.field}>
          <label style={st.label}>Notas adicionales (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Indicaciones especiales, dirección, etc."
            rows={3}
            style={st.textarea}
          />
        </div>
      )}

      <div style={st.actions}>
        <button type="button" style={st.cancelBtn} onClick={onClose}>Cancelar</button>
        <button type="button" style={st.confirmBtn} disabled={saving || !fecha || !hora} onClick={handleSubmit}>
          {saving ? cfg.confirmingLabel : cfg.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const st = {
  sub:        { fontSize: "13px", color: "var(--text-secondary)", margin: "-8px 0 16px" },
  field:      { marginBottom: "18px" },
  label:      { fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "8px" },
  muted:      { fontSize: "13px", color: "var(--text-tertiary)" },
  slotGrid:   { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" },
  slot:       { padding: "10px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-card)", fontSize: "14px", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" },
  slotActive: { border: "1px solid var(--color-primary)", background: "var(--color-info-bg)", color: "var(--color-primary)" },
  slotOcupado:{ background: "var(--bg-subtle)", color: "var(--text-tertiary)", cursor: "not-allowed" },
  slotLabel:  { fontSize: "9px", color: "var(--text-tertiary)", marginTop: "2px" },
  textarea:   { width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-primary)" },
  errBox:     { padding: "10px 14px", background: "var(--color-danger-bg)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontSize: "13px", marginBottom: "16px" },
  actions:    { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:  { padding: "10px 20px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  confirmBtn: { padding: "10px 22px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
};
