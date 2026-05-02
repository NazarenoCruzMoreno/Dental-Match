import { useState } from "react";
import "./Button.css";

export default function Button({ children, onClick, variant = "primary", fullWidth = false, icon, arrow = true, disabled = false }) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  const baseStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderRadius: "18px", fontWeight: 800, fontSize: "17px", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.3px", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden", width: fullWidth ? "100%" : "auto", opacity: disabled ? 0.6 : 1, transform: hovered && !disabled ? "translateY(-3px) scale(1.02)" : clicked ? "scale(0.95)" : "scale(1)", background: isPrimary ? "linear-gradient(135deg, #3b82f6, #2563eb)" : isSecondary ? "linear-gradient(135deg, #fed7aa, #ffedd5)" : "#f1f5f9", color: isSecondary ? "#1e293b" : "#fff", border: isSecondary ? "2px solid #fed7aa" : "none", boxShadow: hovered && !disabled ? isPrimary ? "0 20px 40px rgba(59,130,246,0.4)" : "0 20px 40px rgba(253,186,116,0.3)" : isPrimary ? "0 12px 30px rgba(59,130,246,0.35)" : "0 12px 30px rgba(253,186,116,0.2)"
  };

  const iconBgStyle = { width: "40px", height: "40px", borderRadius: "50%", background: isSecondary ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", boxShadow: "0 0 15px rgba(255,255,255,0.2)", transition: "all 0.3s ease", transform: hovered ? "scale(1.1)" : "scale(1)" };
  const handleMouseDown = () => !disabled && setClicked(true);
  const handleMouseUp = () => setClicked(false);

  return (
    <button style={baseStyle} onClick={disabled ? undefined : onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} disabled={disabled}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {icon && <div style={iconBgStyle}>{icon}</div>}
        <span style={{ transition: "all 0.3s ease", transform: hovered ? "translateX(4px)" : "translateX(0)" }}>{children}</span>
      </div>
      {arrow && <span style={{ fontSize: "20px", transition: "all 0.3s ease", fontWeight: 700 }}>→</span>}
    </button>
  );
}
