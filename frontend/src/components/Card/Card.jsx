export default function Card({ title, highlight, description, badge, badgeText, children, imageSrc, imageAlt, glassContent }) {
  return (
    <>
      <div style={styles.left}>
        <h1 style={styles.title}>{title} <span style={styles.titleHighlight}>{highlight}</span></h1>
        <div style={styles.line}></div>
        {description && <p style={styles.desc}>{description}</p>}
        {children}
      </div>
      <div style={styles.right}>
        {badge && <div style={styles.badge}>{badgeText}</div>}
        <div style={styles.heroGlow}></div>
        <div className="blob-animated-slow" style={styles.blobHero}></div>
        <div className="blob-animated-slow" style={styles.heroBlob}>
          <img src={imageSrc} style={styles.img} alt={imageAlt || "hero"} />
        </div>
        {glassContent && (
          <div className="blob-animated-micro" style={styles.glass}>{glassContent}</div>
        )}
      </div>
    </>
  );
}

const styles = {
  left: { flex: 1.1, padding: "90px 80px", position: "relative", zIndex: 2 },
  title: { fontSize: "64px", fontWeight: 900, margin: 0, color: "#0f172a", letterSpacing: "-3px", lineHeight: "1.1", fontFamily: "'Inter', sans-serif" },
  titleHighlight: { color: "#2563eb", fontWeight: 900, textShadow: "0 2px 20px rgba(59,130,246,0.15)" },
  line: { width: "80px", height: "5px", background: "linear-gradient(90deg, #3b82f6, #60a5fa, #fdba74)", margin: "28px 0", borderRadius: "3px" },
  desc: { color: "#475569", lineHeight: "1.9", fontSize: "18px", maxWidth: "460px", marginBottom: "40px", fontWeight: 400, fontFamily: "'Inter', sans-serif" },
  right: { flex: 1, position: "relative", background: "linear-gradient(135deg, rgba(219,234,254,0.9), rgba(224,242,254,0.9), rgba(255,237,213,0.7))", backgroundSize: "200% 200%", animation: "gradientShift 8s ease infinite", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" },
  badge: { position: "absolute", top: "35px", right: "35px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", padding: "12px 24px", borderRadius: "999px", fontSize: "13px", fontWeight: 900, letterSpacing: "1.5px", boxShadow: "0 8px 25px rgba(59,130,246,0.3)" },
  heroGlow: { position: "absolute", width: "480px", height: "480px", background: "radial-gradient(circle, rgba(59,130,246,0.3), rgba(147,197,253,0.2), rgba(253,186,116,0.15), transparent)", borderRadius: "50%", pointerEvents: "none" },
  blobHero: { position: "absolute", width: "380px", height: "380px", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,197,253,0.15))", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", filter: "blur(60px)", pointerEvents: "none" },
  heroBlob: { width: "350px", height: "350px", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", overflow: "hidden", border: "8px solid rgba(255,255,255,0.95)", boxShadow: "0 40px 100px rgba(0,0,0,0.25), 0 0 60px rgba(59,130,246,0.25)", zIndex: 2, position: "relative" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  glass: { position: "absolute", bottom: "50px", left: "50px", right: "50px", display: "flex", alignItems: "center", gap: "18px", padding: "24px 28px", borderRadius: "22px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 15px 50px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)", zIndex: 3 }
};
