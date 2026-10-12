import "./Card.css";
import MatchIllustration from "../MatchIllustration/MatchIllustration";

export default function Card({ title, highlight, description, badge, badgeText, children, glassContent }) {
  return (
    <>
      <div className="dm-auth-form-panel" style={styles.left}>
        <h1 className="dm-hero-title" style={styles.title}>{title} <span style={styles.titleHighlight}>{highlight}</span></h1>
        {description && <p className="dm-hero-desc" style={styles.desc}>{description}</p>}
        {children}
      </div>
      <div className="dm-auth-visual-panel dm-auth-visual">
        {badge && <div className="dm-auth-badge">{badgeText}</div>}
        <MatchIllustration className="dm-auth-illus" />
        <p className="dm-auth-tagline">
          <strong>Práctica clínica real</strong> para estudiantes.<br />
          <strong>Atención de calidad</strong> para pacientes.
        </p>
        {glassContent && <div style={styles.infoCard}>{glassContent}</div>}
      </div>
    </>
  );
}

const styles = {
  left: { flex: 1.1, padding: "56px 64px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" },
  title: { fontSize: "32px", fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: "1.2" },
  titleHighlight: { color: "var(--color-primary)", fontWeight: 700 },
  desc: { color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "15px", maxWidth: "420px", marginBottom: "28px" },
  infoCard: { position: "relative", display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", borderRadius: "var(--radius-md)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", width: "100%", maxWidth: "280px" }
};
