import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { authService } from "../../services/api";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("checking"); // checking | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Este link no es válido.");
      return;
    }
    authService.verifyEmail(token)
      .then(() => setStatus("ok"))
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "No pudimos confirmar tu email.");
      });
  }, [token]);

  return (
    <Layout>
      <Card title="Confirmar" highlight="email" badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero">
        <div style={styles.state}>
          {status === "checking" && (
            <>
              <div style={styles.spinner} />
              <p style={styles.text}>Confirmando tu email...</p>
            </>
          )}
          {status === "ok" && (
            <>
              <div style={styles.icon}>✅</div>
              <p style={styles.text}>¡Listo! Tu email quedó confirmado. Ya podés iniciar sesión.</p>
              <Button variant="primary" arrow={false} onClick={() => navigate("/login")}>Ir al login</Button>
            </>
          )}
          {status === "error" && (
            <>
              <div style={styles.icon}>⚠️</div>
              <p style={styles.text}>{message}</p>
              <Button variant="primary" arrow={false} onClick={() => navigate("/login")}>Volver al login</Button>
            </>
          )}
        </div>
      </Card>
    </Layout>
  );
}

const styles = {
  state:   { textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  icon:    { fontSize: "48px" },
  text:    { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0, maxWidth: "420px" },
  spinner: { width: "36px", height: "36px", border: "3px solid var(--border)", borderTop: "3px solid var(--color-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};
