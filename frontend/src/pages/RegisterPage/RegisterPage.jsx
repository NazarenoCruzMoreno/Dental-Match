import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { useUserType } from "../../hooks/useUserType";
import { validateForm } from "../../utils/validation";
import { setRegistration } from "../../utils/storage";

const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#3B82F6" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
const IconUser = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";

export default function RegisterPage() {
  const navigate = useNavigate();
  const userType = useUserType();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleBlur = (field) => { setTouched((prev) => ({ ...prev, [field]: true })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm({ name, email, password });
    setErrors(validation.errors);
    setTouched({ name: true, email: true, password: true });
    if (validation.isValid) {
      setSubmitting(true);
      setTimeout(() => { setRegistration({ name, email, userType }); navigate("/login"); }, 800);
    }
  };

  const userTypeLabel = userType === "estudiante" ? "Estudiante" : "Paciente";
  const glassContent = (<><IconCalendar /><div><div style={styles.glassTitle}>Panel Digital</div><div style={styles.glassSub}>Gestión de turnos en tiempo real.</div></div><span style={{ color: "#3B82F6", fontSize: "20px" }}>→</span></>);

  return (
    <Layout>
      <Card title="Crear" highlight="cuenta" badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero" glassContent={glassContent}>
        {userType && (<div style={styles.userTypeBadge}><span style={styles.userTypeIcon}>{userType === "estudiante" ? "🎓" : "👤"}</span>Registrando como <strong>{userTypeLabel}</strong></div>)}
        <form onSubmit={handleSubmit} style={styles.form}>
          <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => handleBlur("name")} error={touched.name ? errors.name : ""} placeholder="Juan Pérez" icon={<IconUser />} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} error={touched.email ? errors.email : ""} placeholder="juan@email.com" icon={<IconMail />} />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} error={touched.password ? errors.password : ""} placeholder="••••••••" icon={<IconLock />} />
          <Button variant="primary" fullWidth disabled={submitting} arrow={!submitting}>{submitting ? "Creando cuenta..." : "Crear cuenta"}</Button>
        </form>
        <p style={styles.loginLink}>¿Ya tenés cuenta? <span onClick={() => navigate("/login")}>Iniciar sesión</span></p>
      </Card>
    </Layout>
  );
}

const styles = { userTypeBadge: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "linear-gradient(135deg, #eff6ff, #fff7ed)", borderRadius: "12px", border: "1px solid #bfdbfe", fontSize: "14px", color: "#1e293b", marginBottom: "30px", fontWeight: 500, maxWidth: "fit-content", fontFamily: "'Inter', sans-serif" }, userTypeIcon: { fontSize: "18px" }, form: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px" }, loginLink: { marginTop: "24px", fontSize: "14px", color: "#64748b", textAlign: "center", fontFamily: "'Inter', sans-serif" }, glassTitle: { fontWeight: 900, color: "#0369A1", fontSize: "16px", fontFamily: "'Inter', sans-serif" }, glassSub: { fontSize: "14px", color: "#075985", marginTop: "3px", fontFamily: "'Inter', sans-serif" } };
