import { useState } from "react";

const Star = ({ filled }) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.5l-5.9 3.1 1.3-6.6-4.9-4.6 6.6-.8L12 2.5z" />
  </svg>
);

export default function RatingStars({ value = 0, onChange, size = 22, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !readOnly && typeof onChange === "function";
  const display = interactive && hovered ? hovered : value;

  return (
    <div style={{ display: "inline-flex", gap: "4px", fontSize: `${size}px` }} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            aria-label={`${n} de 5 estrellas`}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
          >
            <Star filled={n <= display} />
          </button>
        ) : (
          <span key={n} aria-hidden="true" style={{ lineHeight: 0 }}>
            <Star filled={n <= display} />
          </span>
        )
      ))}
    </div>
  );
}
