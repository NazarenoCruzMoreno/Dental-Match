import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { validateEmail, validatePassword } from "../../utils/validation";

const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#3B82F6" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
const IconMail = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleBlur = (field) => { setTouched((prev) => ({ ...prev, [field]: true })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    const newErrors = {};
    if (!emailResult.valid) newErrors.email = emailResult.error;
    if (!passwordResult.valid) newErrors.password = passwordResult.error;

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (emailResult.valid && passwordResult.valid) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setLoginError("Credenciales incorrectas. Intentá de nuevo.");
      }, 1000);
    }
  };

  const glassContent = (<><IconCalendar /><div><div style={styles.glassTitle}>Panel Digital</div><div style={styles.glassSub}>Gestión de turnos en tiempo real.</div></div><span style={{ color: "#3B82F6", fontSize: "20px" }}>→</span></>);

  return (
    <Layout>
      <Card title="Bienvenido" highlight="de vuelta" badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero" glassContent={glassContent}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {loginError && <div style={styles.loginError}>{loginError}</div>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} error={touched.email ? errors.email : ""} placeholder="juan@email.com" icon={<IconMail />} />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} error={touched.password ? errors.password : ""} placeholder="••••••••" icon={<IconLock />} />
          <Button variant="primary" fullWidth disabled={submitting} arrow={!submitting}>{submitting ? "Ingresando..." : "Iniciar sesión"}</Button>
        </form>
        <p style={styles.registerLink}>¿No tenés cuenta? <span onClick={() => navigate("/")}>Crear cuenta</span></p>
      </Card>
    </Layout>
  );
}

const styles = { form: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px" }, loginError: { padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", fontSize: "14px", fontWeight: 500, fontFamily: "'Inter', sans-serif", textAlign: "center" }, registerLink: { marginTop: "24px", fontSize: "14px", color: "#64748b", textAlign: "center", fontFamily: "'Inter', sans-serif" }, glassTitle: { fontWeight: 900, color: "#0369A1", fontSize: "16px", fontFamily: "'Inter', sans-serif" }, glassSub: { fontSize: "14px", color: "#075985", marginTop: "3px", fontFamily: "'Inter', sans-serif" } };
