import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../services/api";

const IconProfile = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);

export default function HomePage() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const cards = user?.role === "estudiante"
    ? [
        { icon: "👤", title: "Mi perfil",         desc: "Completá tu universidad, materias y disponibilidad.", action: () => navigate("/profile"), label: "Ver perfil", primary: true },
        { icon: "🦷", title: "Casos clínicos",     desc: "Próximamente: explorá pacientes disponibles.", action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",         desc: "Próximamente: gestioná tus turnos asignados.",  action: null, label: "Próximamente", primary: false },
      ]
    : [
        { icon: "👤", title: "Mi perfil",         desc: "Completá tus datos para que podamos asignarte un estudiante.", action: () => navigate("/profile"), label: "Ver perfil", primary: true },
        { icon: "🔍", title: "Buscar estudiante", desc: "Próximamente: encontrá un estudiante para tu tratamiento.", action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",        desc: "Próximamente: seguí el estado de tus turnos.",  action: null, label: "Próximamente", primary: false },
      ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>DENTAL MATCH</div>
            <h1 style={styles.title}>
              Hola, <span style={styles.highlight}>{user?.email?.split("@")[0] ?? "usuario"}</span> 👋
            </h1>
            <p style={styles.sub}>
              {user?.role === "estudiante"
                ? "Conectá con pacientes y sumá experiencia clínica real."
                : "Encontrá un estudiante de odontología para tu tratamiento."}
            </p>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <IconLogout /> Salir
          </button>
        </div>

        {/* Cards de navegación */}
        <div style={styles.grid}>
          {cards.map((card, i) => (
            <div key={i} style={{ ...styles.card, ...(card.primary ? styles.cardPrimary : {}) }}>
              <div style={styles.cardIcon}>{card.icon}</div>
              <h3 style={{ ...styles.cardTitle, color: card.primary ? "#0f172a" : "#0f172a" }}>{card.title}</h3>
              <p style={styles.cardDesc}>{card.desc}</p>
              <button
                style={{ ...styles.cardBtn, ...(card.primary ? styles.cardBtnPrimary : styles.cardBtnDisabled) }}
                onClick={card.action ?? undefined}
                disabled={!card.action}
              >
                {card.primary && <IconProfile />}
                {card.label}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page:           { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #fff7ed 100%)", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  container:      { maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" },
  header:         { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" },
  badge:          { display: "inline-block", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", padding: "6px 16px", borderRadius: "999px", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", marginBottom: "12px" },
  title:          { fontSize: "36px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-1px" },
  highlight:      { color: "#2563eb" },
  sub:            { fontSize: "15px", color: "#64748b", margin: 0, lineHeight: "1.6" },
  logoutBtn:      { display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  grid:           { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" },
  card:           { background: "#fff", borderRadius: "20px", padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "12px" },
  cardPrimary:    { border: "2px solid #bfdbfe", background: "linear-gradient(135deg,#fff,#eff6ff)" },
  cardIcon:       { fontSize: "32px" },
  cardTitle:      { fontSize: "17px", fontWeight: 800, margin: 0 },
  cardDesc:       { fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0, flex: 1 },
  cardBtn:        { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "4px" },
  cardBtnPrimary: { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" },
  cardBtnDisabled:{ background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" },
};
