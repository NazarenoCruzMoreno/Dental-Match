import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="dm-auth-shell" style={styles.page}>
      <div className="dm-auth-card" style={styles.card}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bg-page)",
  },
  card: {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-lg)",
  },
};
