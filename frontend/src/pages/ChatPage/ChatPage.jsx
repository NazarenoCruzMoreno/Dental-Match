import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatService, getUser, casosService, turnosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import AgendarTurnoModal from "../../components/AgendarTurnoModal/AgendarTurnoModal";

export default function ChatPage() {
  const { casoId }   = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const user         = getUser();
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [caso,     setCaso]     = useState(null);
  const [sending,  setSending]  = useState(false);
  const [showProponerTurno, setShowProponerTurno] = useState(false);
  const endRef = useRef(null);

  // Agrega un mensaje evitando duplicados por id. Hace falta tanto acá como
  // en el listener de SSE porque es una carrera real: el broadcast le puede
  // llegar al propio emisor por el stream ANTES de que resuelva su POST.
  const agregarMensaje = (nuevo) => {
    setMessages((m) => (m.some((x) => x.id === nuevo.id) ? m : [...m, nuevo]));
  };

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

  // Chat en tiempo real vía SSE — reemplaza el polling de 4s. El navegador
  // reconecta solo si se corta la conexión (retry seteado por el backend).
  useEffect(() => {
    const source = new EventSource(chatService.streamUrl(casoId));

    source.addEventListener("message", (e) => agregarMensaje(JSON.parse(e.data)));

    return () => source.close();
  }, [casoId]);

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
      agregarMensaje(nuevo);
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

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <div style={s.headerInfo}>
          <div style={s.avatar}>
            {otro?.imagen_url
              ? <img src={otro.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}/>
              : otroInicial}
          </div>
          <div>
            <div style={s.headerName}>{otroNombre}</div>
            <div style={s.headerSub}>{caso?.titulo ?? "Cargando..."}</div>
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
                <div style={{ ...s.msg, ...(mio ? s.msgMine : s.msgOther) }}>
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
      <form onSubmit={handleEnviar} style={s.inputBar}>
        <input
          style={s.input}
          placeholder="Escribí un mensaje..."
          aria-label="Mensaje"
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
      {caso && (
        <AgendarTurnoModal
          open={showProponerTurno}
          caso={caso}
          mode="proponer"
          onClose={() => setShowProponerTurno(false)}
          onSubmit={({ fecha, hora }) => turnosService.proponer({ caso_id: caso.id, fecha, hora })}
          onSuccess={() => {
            setShowProponerTurno(false);
            toast.success("¡Propuesta enviada al paciente!");
            // Mandar mensaje al chat
            chatService.enviar(casoId, "📅 Te propuse un turno. Mirá en tus turnos y aceptalo o decime si querés otro horario.")
              .then(agregarMensaje)
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const s = {
  page:        { minHeight: "100vh", background: "var(--bg-page)", display: "flex", flexDirection: "column" },
  header:      { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 },
  backBtn:     { background: "none", border: "none", fontSize: "22px", color: "var(--color-primary)", cursor: "pointer", padding: "4px 8px" },
  headerInfo:  { display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 },
  avatar:      { width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px", overflow: "hidden", flexShrink: 0 },
  headerName:  { fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" },
  headerSub:   { fontSize: "12px", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" },

  messages:    { flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px" },
  empty:       { textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary)" },
  emptyText:   { fontSize: "14px", margin: 0 },

  msgRow:      { display: "flex" },
  msg:         { maxWidth: "75%", padding: "10px 14px", borderRadius: "18px", fontSize: "14px", lineHeight: "1.4", wordBreak: "break-word" },
  msgMine:     { background: "var(--color-primary)", color: "var(--color-primary-text)", borderBottomRightRadius: "4px" },
  msgOther:    { background: "var(--bg-card)", color: "var(--text-primary)", borderBottomLeftRadius: "4px", boxShadow: "var(--shadow-sm)" },
  msgTime:     { fontSize: "10px", marginTop: "4px", opacity: 0.7 },

  inputBar:    { display: "flex", gap: "8px", padding: "12px 16px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", position: "sticky", bottom: 0 },
  input:       { flex: 1, height: "44px", border: "1px solid var(--border)", borderRadius: "22px", padding: "0 16px", fontSize: "15px", outline: "none", background: "var(--bg-input)", color: "var(--text-primary)" },
  sendBtn:     { width: "44px", height: "44px", borderRadius: "50%", border: "none", background: "var(--color-primary)", color: "var(--color-primary-text)", fontSize: "20px", fontWeight: 800, cursor: "pointer", transition: "opacity .2s" },
  fabTurno:    { position: "fixed", right: "20px", bottom: "84px", width: "56px", height: "56px", borderRadius: "50%", border: "none", background: "var(--color-success)", color: "var(--color-primary-text)", fontSize: "26px", cursor: "pointer", boxShadow: "var(--shadow-md)", zIndex: 100, transition: "transform .2s" },
};
