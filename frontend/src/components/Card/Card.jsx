export default function Card({ title, highlight, description, badge, badgeText, children, imageSrc, imageAlt, glassContent }) {
  return (
    <>
      <div className="dm-auth-form-panel" style={styles.left}>
        <h1 style={styles.title}>{title} <span style={styles.titleHighlight}>{highlight}</span></h1>
        {description && <p style={styles.desc}>{description}</p>}
        {children}
      </div>
      <div className="dm-auth-visual-panel" style={styles.right}>
        {badge && <div style={styles.badge}>{badgeText}</div>}
        <div style={styles.imageFrame}>
          <img src={imageSrc} style={styles.img} alt={imageAlt || "hero"} />
        </div>
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
  right: { flex: 1, position: "relative", background: "var(--bg-subtle)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: "24px" },
  badge: { position: "absolute", top: "24px", right: "24px", background: "var(--color-primary)", color: "var(--color-primary-text)", padding: "6px 14px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px" },
  imageFrame: { width: "260px", height: "260px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  infoCard: { display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", borderRadius: "var(--radius-md)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", width: "100%", maxWidth: "280px" }
};
