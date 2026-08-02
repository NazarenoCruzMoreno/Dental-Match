import { useState } from "react";
import "./Button.css";

export default function Button({ children, onClick, variant = "primary", fullWidth = false, icon, arrow = true, disabled = false, type = "button" }) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";

  const baseStyle = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    padding: "13px 22px", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "15px",
    letterSpacing: "-0.1px", cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
    width: fullWidth ? "100%" : "auto", opacity: disabled ? 0.55 : 1,
    background: isPrimary ? (hovered && !disabled ? "var(--color-primary-hover)" : "var(--color-primary)")
      : isSecondary ? "var(--bg-card)"
      : isGhost ? "transparent" : "var(--bg-subtle)",
    color: isPrimary ? "var(--color-primary-text)" : "var(--text-primary)",
    border: isSecondary ? "1px solid var(--border-strong)" : isGhost ? "1px solid transparent" : "none",
    boxShadow: isPrimary && hovered && !disabled ? "var(--shadow-md)" : "none",
  };

  const iconWrapStyle = { display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.9 };

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
    >
      {icon && <span style={iconWrapStyle}>{icon}</span>}
      <span>{children}</span>
      {arrow && <span style={{ fontSize: "16px", opacity: 0.85 }}>→</span>}
    </button>
  );
}
