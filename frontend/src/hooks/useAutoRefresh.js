import { useEffect } from "react";

/**
 * Ejecuta `callback` cuando:
 * - La pestaña vuelve a estar visible (cambiaste de tab y volviste)
 * - La ventana recupera el foco (volvés a la app después de minimizar)
 * - La conexión se restaura (offline → online)
 *
 * Útil para refrescar datos sensibles al tiempo (turnos, notificaciones, casos).
 *
 * @param {Function} callback — función a ejecutar
 * @param {Object}   opts     — { onVisible: true, onFocus: true, onOnline: true }
 */
export function useAutoRefresh(callback, opts = {}) {
  const {
    onVisible = true,
    onFocus   = true,
    onOnline  = true,
  } = opts;

  useEffect(() => {
    if (!callback) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") callback();
    };
    const handleFocus  = () => callback();
    const handleOnline = () => callback();

    if (onVisible) document.addEventListener("visibilitychange", handleVisibility);
    if (onFocus)   window.addEventListener("focus", handleFocus);
    if (onOnline)  window.addEventListener("online", handleOnline);

    return () => {
      if (onVisible) document.removeEventListener("visibilitychange", handleVisibility);
      if (onFocus)   window.removeEventListener("focus", handleFocus);
      if (onOnline)  window.removeEventListener("online", handleOnline);
    };
  }, [callback, onVisible, onFocus, onOnline]);
}
