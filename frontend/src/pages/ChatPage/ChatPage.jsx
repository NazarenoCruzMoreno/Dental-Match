import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatService, getUser, casosService, turnosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import Calendar from "../../components/Calendar/Calendar";

// ── Hook simple para polling cada N segundos ────────────────────────────────
function useInterval(callback, ms) {
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }, [callback, ms]);
}

export default function ChatPage() {
  const { casoId }   = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const { isDark }   = useTheme();
  const user         = getUser();
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [caso,     setCaso]     = useState(null);
  const [sending,  setSending]  = useState(false);
  const [showProponerTurno, setShowProponerTurno] = useState(false);
  const endRef = useRef(null);

  const cargar = async () => {
    try {
      const msgs = await chatService.listarMensajes(casoId);
      setMessages(msgs);
    } catch (e) {
      // Si no tiene acceso, redirige
      toast.error(e.message);
      navigate("/home");
    }
  };

  useEffect(() => {
    casosService.obtener(casoId).then(setCaso).catch(() => {});
    cargar();
  }, [casoId]);

  // Poll cada 4 segundos (chat en vivo simple sin websockets)
  useInterval(cargar, 4000);

  // Auto-scroll al final
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const nuevo = await chatService.enviar(casoId, text.trim());
      setMessages((m) => [...m, nuevo]);
      setText("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  // Identificar al "otro" (con quién estás chateando)
  const otro = user?.role === "paciente" ? caso?.estudiantes : caso?.pacientes;
  const otroNombre = otro?.nombre ?? "Usuario";
  const otroInicial = otroNombre.charAt(0).toUpperCase();

  const bg     = isDark ? "#0f172a" : "#f8fafc";
  const headBg = isDark ? "#1e293b" : "#fff";
  const txt    = isDark ? "#f1f5f9" : "#0f172a";
  const sub    = isDark ? "#94a3b8" : "#64748b";
  const otherBg= isDark ? "#1e293b" : "#fff";

  return (
    <div style={{ ...s.page, background: bg }}>
      {/* Header */}
      <header style={{ ...s.header, background: headBg, borderColor: isDark ? "#334155" : "#e2e8f0" }}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <div style={s.headerInfo}>
          <div style={s.avatar}>
            {otro?.imagen_url
              ? <img src={otro.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}/>
              : otroInicial}
          </div>
          <div>
            <div style={{ ...s.headerName, color: txt }}>{otroNombre}</div>
            <div style={{ ...s.headerSub, color: sub }}>{caso?.titulo ?? "Cargando..."}</div>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      <main style={s.messages}>
        {messages.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
            <p style={s.emptyText}>¡Es un match! Empezá a coordinar el primer turno.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mio = m.sender_id === user?.id;
            return (
              <div key={m.id} style={{ ...s.msgRow, justifyContent: mio ? "flex-end" : "flex-start" }}>
                <div style={{ ...s.msg, ...(mio ? s.msgMine : { ...s.msgOther, background: otherBg, color: txt }) }}>
                  <div>{m.content}</div>
                  <div style={s.msgTime}>{formatTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </main>

      {/* Input */}
      <form onSubmit={handleEnviar} style={{ ...s.inputBar, background: headBg, borderColor: isDark ? "#334155" : "#e2e8f0" }}>
        <input
          style={{ ...s.input, background: isDark ? "#0f172a" : "#f8fafc", color: txt, borderColor: isDark ? "#334155" : "#e2e8f0" }}
          placeholder="Escribí un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.4 }} disabled={!text.trim() || sending}>
          {sending ? "..." : "→"}
        </button>
      </form>

      {/* FAB: proponer turno (solo estudiante) */}
      {user?.role === "estudiante" && (
        <button
          style={s.fabTurno}
          onClick={() => setShowProponerTurno(true)}
          title="Proponer un turno"
          aria-label="Proponer un turno"
        >
          📅
        </button>
      )}

      {/* Modal proponer turno */}
      {showProponerTurno && caso && (
        <ProponerTurnoModal
          caso={caso}
          isDark={isDark}
          onClose={() => setShowProponerTurno(false)}
          onPropuesto={() => {
            setShowProponerTurno(false);
            toast.success("¡Propuesta enviada al paciente!");
            // Mandar mensaje al chat
            chatService.enviar(casoId, "📅 Te propuse un turno. Mirá en tus turnos y aceptalo o decime si querés otro horario.")
              .then((nuevo) => setMessages((m) => [...m, nuevo]))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

// ── Modal para proponer turno desde el chat ────────────────────────────────
function ProponerTurnoModal({ caso, isDark, onClose, onPropuesto }) {
  const [fecha,   setFecha]   = useState("");
  const [hora,    setHora]    = useState("");
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const cargarSlots = async (f) => {
    if (!f || !caso.estudiante_id) return;
    setLoading(true);
    try {
      const data = await turnosService.disponibilidad(caso.estudiante_id, f);
      setSlots(Array.isArray(data) ? data : []);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  };

  const handleFecha = (f) => { setFecha(f); setHora(""); cargarSlots(f); };

  const handleSubmit = async () => {
    if (!fecha || !hora) { setErr("Elegí fecha y horario"); return; }
    setSaving(true); setErr("");
    try {
      await turnosService.proponer({ caso_id: caso.id, fecha, hora });
      onPropuesto();
    } catch (e) { setErr(e.message); setSaving(false); }
  };

  const today  = new Date().toISOString().split("T")[0];
  const modalBg = isDark ? "#1e293b" : "#fff";
  const txt    = isDark ? "#f1f5f9" : "#0f172a";

  return (
    <div style={pt.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...pt.modal, background: modalBg }}>
        <div style={pt.header}>
          <div>
            <h2 style={{ ...pt.title, color: txt }}>📅 Proponer turno</h2>
            <p style={pt.sub}>{caso.titulo}</p>
          </div>
          <button style={pt.closeBtn} onClick={onClose}>✕</button>
        </div>

        {err && <div style={pt.errBox}>{err}</div>}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ ...pt.label, color: txt }}>Elegí una fecha</label>
          <Calendar value={fecha} onChange={handleFecha} minDate={today} />
        </div>

        {fecha && (
          <div style={{ marginBottom: "14px" }}>
            <label style={{ ...pt.label, color: txt }}>Horario propuesto</label>
            {loading ? (
              <p style={pt.muted}>Cargando horarios...</p>
            ) : (
              <div style={pt.slotGrid}>
                {slots.map((sl) => (
                  <button
                    key={sl.hora}
                    disabled={!sl.disponible}
                    onClick={() => setHora(sl.hora)}
                    style={{ ...pt.slot, ...(hora === sl.hora ? pt.slotActive : {}), ...(!sl.disponible ? pt.slotOcupado : {}) }}
                  >
                    {sl.hora}
                    {!sl.disponible && <div style={pt.slotLabel}>Ocupado</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={pt.actions}>
          <button style={pt.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={pt.confirmBtn} disabled={saving || !fecha || !hora} onClick={handleSubmit}>
            {saving ? "Enviando..." : "Enviar propuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}

const pt = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9200, backdropFilter: "blur(4px)", padding: "20px" },
  modal:      { background: "#fff", borderRadius: "20px", padding: "24px", maxWidth: "440px", width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.2)", fontFamily: "'Inter',sans-serif" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  title:      { fontSize: "18px", fontWeight: 900, margin: 0 },
  sub:        { fontSize: "13px", color: "#64748b", margin: "4px 0 0" },
  closeBtn:   { background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", color: "#64748b" },
  label:      { fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "8px" },
  muted:      { fontSize: "13px", color: "#94a3b8" },
  slotGrid:   { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" },
  slot:       { padding: "10px 6px", border: "2px solid #e2e8f0", borderRadius: "10px", background: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  slotActive: { border: "2px solid #2563eb", background: "#eff6ff", color: "#2563eb" },
  slotOcupado:{ background: "#f8fafc", color: "#cbd5e1", cursor: "not-allowed" },
  slotLabel:  { fontSize: "9px", color: "#94a3b8", marginTop: "2px" },
  errBox:     { padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontSize: "13px", marginBottom: "14px" },
  actions:    { display: "flex", gap: "10px", justifyContent: "flex-end" },
  cancelBtn:  { padding: "10px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  confirmBtn: { padding: "10px 22px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
};

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const s = {
  page:        { minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif" },
  header:      { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  backBtn:     { background: "none", border: "none", fontSize: "22px", color: "#3b82f6", cursor: "pointer", padding: "4px 8px", fontFamily: "'Inter',sans-serif" },
  headerInfo:  { display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 },
  avatar:      { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px", overflow: "hidden", flexShrink: 0 },
  headerName:  { fontSize: "14px", fontWeight: 800, color: "#0f172a" },
  headerSub:   { fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" },

  messages:    { flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px" },
  empty:       { textAlign: "center", padding: "60px 20px", color: "#94a3b8" },
  emptyText:   { fontSize: "14px", margin: 0 },

  msgRow:      { display: "flex" },
  msg:         { maxWidth: "75%", padding: "10px 14px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.4", wordBreak: "break-word" },
  msgMine:     { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", borderBottomRightRadius: "4px" },
  msgOther:    { background: "#fff", color: "#0f172a", borderBottomLeftRadius: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
  msgTime:     { fontSize: "10px", marginTop: "4px", opacity: 0.7 },

  inputBar:    { display: "flex", gap: "8px", padding: "12px 16px", background: "#fff", borderTop: "1px solid #e2e8f0", position: "sticky", bottom: 0 },
  input:       { flex: 1, height: "44px", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "0 16px", fontSize: "15px", outline: "none", fontFamily: "'Inter',sans-serif", background: "#f8fafc" },
  sendBtn:     { width: "44px", height: "44px", borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: "20px", fontWeight: 800, cursor: "pointer", transition: "opacity .2s" },
  fabTurno:    { position: "fixed", right: "20px", bottom: "84px", width: "56px", height: "56px", borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: "26px", cursor: "pointer", boxShadow: "0 8px 24px rgba(16,185,129,0.45)", zIndex: 100, transition: "transform .2s" },
};
