import { useEffect } from "react";

const KEY = "dm-motion";
const MIN_FPS = 20;

// Cuadros por segundo a partir de los timestamps de requestAnimationFrame
export function fpsDeFrames(ts) {
  if (ts.length < 2) return 0;
  return ((ts.length - 1) * 1000) / (ts[ts.length - 1] - ts[0]);
}

function medir(ms) {
  return new Promise((resolve) => {
    const ts = [];
    const tick = (t) => {
      ts.push(t);
      if (t - ts[0] < ms) requestAnimationFrame(tick);
      else resolve(fpsDeFrames(ts));
    };
    requestAnimationFrame(tick);
  });
}

// Si el navegador no sostiene la animación (celular lento, vista previa embebida),
// apaga los movimientos decorativos infinitos: data-motion="lite" en <html>.
// Se mide con las animaciones corriendo y dos veces seguidas, para que un tirón
// puntual al cargar no alcance para desactivarlas.
export default function useMotionGuard() {
  useEffect(() => {
    const root = document.documentElement;
    try {
      if (sessionStorage.getItem(KEY) === "lite") { root.dataset.motion = "lite"; return; }
    } catch { /* sin storage: se mide igual */ }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const arrancar = async () => {
      await new Promise((r) => setTimeout(r, 1500));
      for (let i = 0; i < 2; i++) {
        if (cancelled || document.hidden) return;
        const fps = await medir(1200);
        if (cancelled || document.hidden) return; // en segundo plano el navegador frena solo
        if (fps >= MIN_FPS) return;
      }
      root.dataset.motion = "lite";
      try { sessionStorage.setItem(KEY, "lite"); } catch { /* ignorar */ }
    };

    if (document.readyState === "complete") arrancar();
    else window.addEventListener("load", arrancar, { once: true });
    return () => { cancelled = true; };
  }, []);
}
