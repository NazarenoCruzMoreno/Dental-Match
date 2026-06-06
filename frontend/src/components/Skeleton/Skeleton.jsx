// ── Skeleton loaders reutilizables ──────────────────────────────────────────
// Se usan en lugar de spinners para dar sensación de velocidad y estructura.

/**
 * Skeleton primitivo — un bloque con shimmer.
 * Props: width, height, borderRadius, style
 */
export function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", style = {} }) {
  return (
    <div
      style={{
        width, height, borderRadius,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/** Skeleton para una tarjeta tipo paciente/caso del marketplace */
export function CardSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
      <Skeleton width="100%" height="160px" borderRadius="0" />
      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Skeleton width="36px" height="36px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="13px" />
            <Skeleton width="40%" height="11px" style={{ marginTop: "4px" }} />
          </div>
        </div>
        <Skeleton width="85%" height="14px" />
        <Skeleton width="100%" height="11px" />
        <Skeleton width="70%" height="11px" />
        <Skeleton width="100%" height="36px" borderRadius="10px" style={{ marginTop: "4px" }} />
      </div>
    </div>
  );
}

/** Skeleton para una fila tipo turno/asignación */
export function RowSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: "16px", alignItems: "center", border: "1px solid #f1f5f9" }}>
      <Skeleton width="52px" height="68px" borderRadius="12px" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="14px" />
        <Skeleton width="40%" height="11px" style={{ marginTop: "6px" }} />
        <Skeleton width="80%" height="11px" style={{ marginTop: "4px" }} />
      </div>
    </div>
  );
}

/** Grid de skeletons para listas — N cantidad de cards */
export function GridSkeleton({ count = 6, type = "card" }) {
  const Comp = type === "row" ? RowSkeleton : CardSkeleton;
  return (
    <div style={{
      display: type === "row" ? "flex" : "grid",
      flexDirection: type === "row" ? "column" : undefined,
      gridTemplateColumns: type === "card" ? "repeat(auto-fill, minmax(260px, 1fr))" : undefined,
      gap: type === "row" ? "12px" : "20px",
    }}>
      {Array.from({ length: count }).map((_, i) => <Comp key={i} />)}
    </div>
  );
}
