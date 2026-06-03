import { useState } from "react";
import { useNavigate } from "react-router-dom";
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { validateEmail, validatePassword } from "../../utils/validation";
import { authService, setSessionToken, setUser } from "../../services/api";

const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#3B82F6" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
const IconMail = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleBlur = (field) => { setTouched((prev) => ({ ...prev, [field]: true })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const newErrors = {};
    if (!emailResult.valid) newErrors.email = emailResult.error;
    if (!passwordResult.valid) newErrors.password = passwordResult.error;
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    if (!emailResult.valid || !passwordResult.valid) return;

    setSubmitting(true);
    try {
      const data = await authService.login(email, password);
      setSessionToken(data.token);
      setUser(data.user);
      navigate("/home");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const result = validateEmail(resetEmail);
    if (!result.valid) return;
    setResetLoading(true);
    try {
      await authService.resetPassword(resetEmail);
      setResetSent(true);
    } catch {
      setResetSent(true); // igual mostramos éxito por seguridad
    } finally {
      setResetLoading(false);
    }
  };

  const glassContent = (<><IconCalendar /><div><div style={styles.glassTitle}>Panel Digital</div><div style={styles.glassSub}>Gestión de turnos en tiempo real.</div></div><span style={{ color: "#3B82F6", fontSize: "20px" }}>→</span></>);

  return (
    <Layout>
      <Card
        title={resetMode ? "Recuperar" : "Bienvenido"}
        highlight={resetMode ? "contraseña" : "de vuelta"}
        badge={true} badgeText="DENTAL MATCH"
        imageSrc={imagenInicio} imageAlt="hero"
        glassContent={glassContent}
      >
        {!resetMode ? (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              {serverError && <div style={styles.errorBox}>{serverError}</div>}
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} error={touched.email ? errors.email : ""} placeholder="juan@email.com" icon={<IconMail />} />
              <div>
                <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} error={touched.password ? errors.password : ""} placeholder="••••••••" icon={<IconLock />} />
                <p style={styles.forgotLink} onClick={() => setResetMode(true)}>¿Olvidaste tu contraseña?</p>
              </div>
              <Button variant="primary" fullWidth disabled={submitting} arrow={!submitting}>
                {submitting ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>
            <p style={styles.registerLink}>¿No tenés cuenta? <span style={styles.link} onClick={() => navigate("/")}>Crear cuenta</span></p>
          </>
        ) : (
          <>
            {!resetSent ? (
              <form onSubmit={handleReset} style={styles.form}>
                <p style={styles.resetDesc}>Ingresá tu email y te enviamos un link para restablecer tu contraseña.</p>
                <Input label="Email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="juan@email.com" icon={<IconMail />} />
                <Button variant="primary" fullWidth disabled={resetLoading} arrow={!resetLoading}>
                  {resetLoading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            ) : (
              <div style={styles.resetSuccess}>
                <div style={styles.resetIcon}>📬</div>
                <p style={styles.resetSuccessText}>¡Listo! Si el email existe, vas a recibir un link para restablecer tu contraseña.</p>
              </div>
            )}
            <p style={styles.registerLink}>
              <span style={styles.link} onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(""); }}>← Volver al login</span>
            </p>
          </>
        )}
      </Card>
    </Layout>
  );
}

const styles = {
  form: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" },
  errorBox: { padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", fontSize: "14px", fontWeight: 500, fontFamily: "'Inter', sans-serif", textAlign: "center" },
  forgotLink: { fontSize: "13px", color: "#3b82f6", fontWeight: 600, cursor: "pointer", textAlign: "right", margin: "8px 0 0", fontFamily: "'Inter', sans-serif" },
  registerLink: { marginTop: "20px", fontSize: "14px", color: "#64748b", textAlign: "center", fontFamily: "'Inter', sans-serif" },
  link: { color: "#3b82f6", fontWeight: 600, cursor: "pointer" },
  resetDesc: { fontSize: "15px", color: "#475569", lineHeight: "1.6", fontFamily: "'Inter', sans-serif", marginBottom: "8px" },
  resetSuccess: { textAlign: "center", padding: "24px 0" },
  resetIcon: { fontSize: "48px", marginBottom: "16px" },
  resetSuccessText: { fontSize: "15px", color: "#475569", lineHeight: "1.7", fontFamily: "'Inter', sans-serif" },
  glassTitle: { fontWeight: 900, color: "#0369A1", fontSize: "16px", fontFamily: "'Inter', sans-serif" },
  glassSub: { fontSize: "14px", color: "#075985", marginTop: "3px", fontFamily: "'Inter', sans-serif" },
};
