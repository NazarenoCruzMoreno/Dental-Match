import { Component } from "react";

// Error boundary global: si cualquier componente de la app tira un error de
// render, esto evita que la SPA quede en blanco.
//
// A propósito NO usa el <Button> ni ningún otro componente compartido de la
// app en su fallback — si el error que lo disparó viene de algo compartido
// (ej. un bug en Button/Modal), reusar esa misma pieza acá podría volver a
// romper justo la UI de rescate. Solo HTML nativo + variables CSS.
export default class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary atrapó un error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon} aria-hidden="true">🦷</div>
          <h1 style={styles.title}>Ups, algo salió mal en el consultorio</h1>
          <p style={styles.desc}>
            Encontramos un error inesperado. Recargá la página para seguir donde estabas.
          </p>
          <button type="button" style={styles.button} onClick={this.handleReload}>
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-page)",
    padding: "24px",
  },
  card: {
    maxWidth: "440px",
    width: "100%",
    textAlign: "center",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: "48px 36px",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "0 0 12px",
  },
  desc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    margin: "0 0 28px",
  },
  button: {
    padding: "12px 28px",
    background: "var(--color-primary)",
    color: "var(--color-primary-text)",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
