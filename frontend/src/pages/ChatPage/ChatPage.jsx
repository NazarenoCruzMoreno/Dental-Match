import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { chatService, getUser, casosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";

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
  const user         = getUser();
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [caso,     setCaso]     = useState(null);
  const [sending,  setSending]  = useState(false);
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

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.4 }} disabled={!text.trim() || sending}>
          {sending ? "..." : "→"}
        </button>
      </form>
    </div>
  );
}

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
};
