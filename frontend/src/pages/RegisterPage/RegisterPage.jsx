import { useState } from "react";
import { useNavigate } from "react-router-dom";
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Checkbox from "../../components/Checkbox/Checkbox";
import { useUserType } from "../../hooks/useUserType";
import { validateForm } from "../../utils/validation";
import { authService, setSessionToken, setUser } from "../../services/api";

const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24" style={{ color: "var(--color-primary)" }}><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
const IconUser = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);

export default function RegisterPage() {
  const navigate = useNavigate();
  const userType = useUserType();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleBlur = (field) => { setTouched((prev) => ({ ...prev, [field]: true })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validation = validateForm({ name, email, password });
    const newErrors = { ...validation.errors };

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmá tu contraseña";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!acceptTerms) {
      newErrors.terms = "Debés aceptar los términos para continuar";
    }

    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    const isValid = validation.isValid && !newErrors.confirmPassword && !newErrors.terms;
    if (!isValid) return;

    setSubmitting(true);
    try {
      const role = userType || "paciente";
      const data = await authService.register(email, password, role);
      setSessionToken(data.token);
      setUser(data.user);
      navigate("/profile/edit?new=1"); // perfil obligatorio al registrarse
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const userTypeLabel = userType === "estudiante" ? "Estudiante" : "Paciente";
  const glassContent = (<><IconCalendar /><div><div style={styles.glassTitle}>Panel Digital</div><div style={styles.glassSub}>Gestión de turnos en tiempo real.</div></div><span style={{ color: "var(--color-primary)", fontSize: "20px" }}>→</span></>);

  return (
    <Layout>
      <Card title="Crear" highlight="cuenta" badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero" glassContent={glassContent}>
        {userType && (<div style={styles.userTypeBadge}><span style={styles.userTypeIcon}>{userType === "estudiante" ? "🎓" : "👤"}</span>Registrando como <strong>{userTypeLabel}</strong></div>)}
        <form onSubmit={handleSubmit} style={styles.form}>
          {serverError && <div style={styles.errorBox}>{serverError}</div>}
          <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => handleBlur("name")} error={touched.name ? errors.name : ""} placeholder="Juan Pérez" icon={<IconUser />} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} error={touched.email ? errors.email : ""} placeholder="juan@email.com" icon={<IconMail />} />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} error={touched.password ? errors.password : ""} placeholder="••••••••" icon={<IconLock />} />
          <Input label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => handleBlur("confirmPassword")} error={touched.confirmPassword ? errors.confirmPassword : ""} placeholder="••••••••" icon={<IconLock />} />

          <Checkbox
            id="accept-terms"
            checked={acceptTerms}
            onChange={setAcceptTerms}
            error={!!(errors.terms && !acceptTerms)}
            label={
              <>
                Acepto los <span style={styles.termsLink} onClick={(e) => e.stopPropagation()}>términos y condiciones</span> y la <span style={styles.termsLink} onClick={(e) => e.stopPropagation()}>política de privacidad</span>
              </>
            }
          />
          {errors.terms && <span style={styles.fieldError}>{errors.terms}</span>}

          <Button type="submit" variant="primary" fullWidth disabled={submitting} arrow={!submitting}>
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
        <p style={styles.loginLink}>¿Ya tenés cuenta? <span style={styles.link} onClick={() => navigate("/login")}>Iniciar sesión</span></p>
      </Card>
    </Layout>
  );
}

const styles = {
  userTypeBadge: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--bg-subtle)", borderRadius: "12px", border: "1px solid var(--border)", fontSize: "14px", color: "var(--text-primary)", marginBottom: "24px", fontWeight: 500, maxWidth: "fit-content" },
  userTypeIcon: { fontSize: "18px" },
  form: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" },
  errorBox: { padding: "12px 16px", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)", borderRadius: "12px", color: "var(--color-danger)", fontSize: "14px", fontWeight: 500, textAlign: "center" },
  termsLink: { color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" },
  fieldError: { fontSize: "12px", color: "var(--color-danger)", fontWeight: 500, marginTop: "-8px" },
  loginLink: { marginTop: "20px", fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" },
  link: { color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" },
  glassTitle: { fontWeight: 900, color: "var(--text-primary)", fontSize: "16px" },
  glassSub: { fontSize: "14px", color: "var(--text-secondary)", marginTop: "3px" },
};
