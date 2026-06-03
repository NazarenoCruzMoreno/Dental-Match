import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../services/api";

export default function HomePage() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>DENTAL MATCH</div>
        <h1 style={styles.title}>
          ¡Bienvenido{user?.email ? `, ${user.email}` : ""}! 👋
        </h1>
        <p style={styles.role}>
          Rol: <strong>{user?.role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente"}</strong>
        </p>
        <p style={styles.sub}>El dashboard está en construcción. Pronto vas a poder gestionar tus turnos y conexiones.</p>
        <button style={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

const styles = {
  page: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #fff7ed 100%)" },
  card: { background: "#fff", borderRadius: "24px", padding: "60px 80px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "500px" },
  badge: { display: "inline-block", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", padding: "8px 20px", borderRadius: "999px", fontSize: "12px", fontWeight: 900, letterSpacing: "1.5px", marginBottom: "24px" },
  title: { fontSize: "32px", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", fontFamily: "'Inter', sans-serif" },
  role: { fontSize: "16px", color: "#475569", marginBottom: "16px", fontFamily: "'Inter', sans-serif" },
  sub: { fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, marginBottom: "40px", fontFamily: "'Inter', sans-serif" },
  logoutBtn: { padding: "14px 32px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
};
