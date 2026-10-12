import "./AuroraBackground.css";
import useMotionGuard from "./useMotionGuard";

// Fondo ambiental de toda la app: manchas de luz que derivan muy despacio.
// Va detrás de todo (z-index -1), así que las páginas deben tener fondo transparente.
export default function AuroraBackground() {
  useMotionGuard();
  return (
    <div className="dm-aurora" aria-hidden="true">
      <span className="dm-aurora-blob dm-aurora-blob--a" />
      <span className="dm-aurora-blob dm-aurora-blob--b" />
      <span className="dm-aurora-blob dm-aurora-blob--c" />
      <span className="dm-aurora-blob dm-aurora-blob--d" />
      <span className="dm-aurora-dots" />
      <span className="dm-aurora-grain" />
    </div>
  );
}
