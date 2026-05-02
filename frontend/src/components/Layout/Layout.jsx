import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div className="blob-animated-slow" style={styles.blobOrange1}></div>
        <div className="blob-animated-slower" style={styles.blobBlue}></div>
        <div className="pulse-glow-slow" style={styles.blobOrange2}></div>
        <div className="blob-animated-slow" style={styles.blobAmber}></div>

        <div style={styles.dotPatternTL}></div>
        <div style={styles.dotPatternBR}></div>

        {children}
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #fff7ed 100%)"
  },

  card: {
    width: "1200px",
    height: "700px",
    display: "flex",
    borderRadius: "30px",
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 40px 120px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset",
    position: "relative",
    backdropFilter: "blur(20px)"
  },

  blobOrange1: {
    position: "absolute",
    top: "-100px",
    left: "100px",
    width: "500px",
    height: "500px",
    background: "linear-gradient(135deg, #fdba74, #fed7aa)",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    filter: "blur(120px)",
    opacity: 0.35,
    pointerEvents: "none"
  },

  blobBlue: {
    position: "absolute",
    bottom: "-150px",
    right: "50px",
    width: "600px",
    height: "600px",
    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    borderRadius: "40% 60% 70% 30% / 40% 70% 30% 60%",
    filter: "blur(120px)",
    opacity: 0.35,
    pointerEvents: "none"
  },

  blobOrange2: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "400px",
    height: "400px",
    background: "linear-gradient(135deg, #fed7aa, #ffedd5)",
    borderRadius: "50%",
    filter: "blur(100px)",
    opacity: 0.25,
    pointerEvents: "none",
    transform: "translate(-50%, -50%)"
  },

  blobAmber: {
    position: "absolute",
    top: "30%",
    right: "200px",
    width: "350px",
    height: "350px",
    background: "linear-gradient(135deg, #fdba74, #fed7aa)",
    borderRadius: "50% 50% 30% 70% / 40% 60% 40% 60%",
    filter: "blur(100px)",
    opacity: 0.3,
    pointerEvents: "none"
  },

  dotPatternTL: {
    position: "absolute",
    top: "40px",
    left: "40px",
    width: "80px",
    height: "80px",
    backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.15) 2px, transparent 2px)",
    backgroundSize: "12px 12px",
    opacity: 0.6,
    pointerEvents: "none"
  },

  dotPatternBR: {
    position: "absolute",
    bottom: "40px",
    right: "40px",
    width: "80px",
    height: "80px",
    backgroundImage: "radial-gradient(circle, rgba(253,186,116,0.15) 2px, transparent 2px)",
    backgroundSize: "12px 12px",
    opacity: 0.6,
    pointerEvents: "none"
  }
};
