import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatService, getUser } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { RowSkeleton } from "../../components/Skeleton/Skeleton";

export default function ChatsListPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    chatService.listarChats()
      .then((d) => setChats(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);
  useAutoRefresh(cargar);

  return (
    <div style={s.page}>
      <div style={s.container}>

        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate("/home")}>← Inicio</button>
          <h1 style={s.title}>💬 Mis chats</h1>
          <p style={s.sub}>Conversaciones con los matches</p>
        </header>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <RowSkeleton/><RowSkeleton/><RowSkeleton/>
          </div>
        ) : chats.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>💬</div>
            <h3 style={s.emptyTitle}>No tenés chats todavía</h3>
            <p style={s.emptyText}>
              {user?.role === "paciente"
                ? "Hacé match con un estudiante para empezar a chatear."
                : "Esperá que un paciente te elija para empezar a chatear."}
            </p>
          </div>
        ) : (
          <div style={s.list}>
            {chats.map((c) => {
              const otro = user?.role === "paciente" ? c.estudiantes : c.pacientes;
              const nombre = otro?.nombre ?? "Usuario";
              const inicial = nombre.charAt(0).toUpperCase();
              const lastMsg = c.lastMessage?.content ?? "¡Saludá para empezar!";
              const time = c.lastMessage?.created_at
                ? new Date(c.lastMessage.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div key={c.id} style={s.chatRow} onClick={() => navigate(`/chat/${c.id}`)}>
                  <div style={s.avatar}>
                    {otro?.imagen_url
                      ? <img src={otro.imagen_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }}/>
                      : inicial}
                  </div>
                  <div style={s.chatBody}>
                    <div style={s.chatTop}>
                      <span style={s.chatName}>{nombre}</span>
                      {time && <span style={s.chatTime}>{time}</span>}
                    </div>
                    <div style={s.chatBottom}>
                      <span style={s.chatPreview}>{lastMsg.slice(0, 60)}{lastMsg.length > 60 ? "…" : ""}</span>
                      {c.unread > 0 && <span style={s.unreadBadge}>{c.unread}</span>}
                    </div>
                    <div style={s.casoTitle}>📋 {c.titulo}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", padding: "36px 20px 80px", fontFamily: "'Inter',sans-serif" },
  container:   { maxWidth: "720px", margin: "0 auto" },
  header:      { background: "#fff", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: "20px" },
  backBtn:     { display: "inline-block", background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", marginBottom: "10px", padding: 0, fontFamily: "'Inter',sans-serif" },
  title:       { fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0 },
  sub:         { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
  list:        { display: "flex", flexDirection: "column", gap: "10px" },
  chatRow:     { display: "flex", gap: "14px", alignItems: "center", padding: "14px 18px", background: "#fff", borderRadius: "16px", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "transform .15s" },
  avatar:      { width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px", overflow: "hidden", flexShrink: 0 },
  chatBody:    { flex: 1, minWidth: 0 },
  chatTop:     { display: "flex", justifyContent: "space-between", alignItems: "center" },
  chatName:    { fontWeight: 800, color: "#0f172a", fontSize: "15px" },
  chatTime:    { fontSize: "11px", color: "#94a3b8" },
  chatBottom:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" },
  chatPreview: { fontSize: "13px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 },
  unreadBadge: { background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", fontWeight: 800, minWidth: "20px", textAlign: "center", marginLeft: "8px" },
  casoTitle:   { fontSize: "11px", color: "#94a3b8", marginTop: "4px" },
  empty:       { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  emptyTitle:  { fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  emptyText:   { fontSize: "14px", color: "#64748b" },
};
