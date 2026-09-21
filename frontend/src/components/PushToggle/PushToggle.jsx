import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { pushConfigurado, estadoPush, activarPush, desactivarPush, sincronizarPush } from "../../utils/push";

// Toggle "Activar Notificaciones de Escritorio". Vive en el panel de la campana.
export default function PushToggle() {
  const toast = useToast();
  const [estado, setEstado] = useState("cargando"); // cargando | no-soportado | bloqueado | inactivo | activo
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!pushConfigurado) {
      console.warn("Push deshabilitado: falta VITE_VAPID_PUBLIC_KEY en este build.");
      return;
    }
    estadoPush()
      .then((s) => {
        setEstado(s);
        if (s === "activo") sincronizarPush().catch(() => {});
      })
      .catch(() => setEstado("no-soportado"));
  }, []);

  // Sin clave VAPID en el build no hay nada que ofrecer: no mostrar un botón que no puede funcionar
  if (!pushConfigurado || estado === "cargando") return null;

  const activar = async () => {
    setOcupado(true);
    try {
      await activarPush();
      setEstado("activo");
      toast.success("¡Listo! Te vamos a avisar de turnos y matches.");
    } catch (e) {
      toast.error(e.message || "No se pudieron activar las notificaciones");
      setEstado(await estadoPush().catch(() => "inactivo")); // p. ej. pasó a "bloqueado"
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    setOcupado(true);
    try {
      await desactivarPush();
      setEstado("inactivo");
      toast.info("Notificaciones de escritorio desactivadas");
    } catch (e) {
      toast.error(e.message || "No se pudieron desactivar");
      setEstado(await estadoPush().catch(() => "activo"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div style={s.wrap}>
      {estado === "no-soportado" && (
        <p style={s.hint}>Tu navegador no admite notificaciones de escritorio.</p>
      )}
      {estado === "bloqueado" && (
        <p style={s.hint}>Las notificaciones están bloqueadas. Habilitalas desde el candado de la barra de direcciones.</p>
      )}
      {estado === "inactivo" && (
        <button style={s.btn} onClick={activar} disabled={ocupado}>
          {ocupado ? "Activando..." : "🔔 Activar Notificaciones de Escritorio"}
        </button>
      )}
      {estado === "activo" && (
        <div style={s.activo}>
          <span style={s.activoTxt}>✅ Notificaciones de escritorio activadas</span>
          <button style={s.link} onClick={desactivar} disabled={ocupado}>
            {ocupado ? "..." : "Desactivar"}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:      { padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" },
  hint:      { margin: 0, fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.4 },
  btn:       { width: "100%", padding: "9px 12px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
  activo:    { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  activoTxt: { fontSize: "12px", color: "var(--color-success)", fontWeight: 600 },
  link:      { background: "none", border: "none", padding: 0, fontSize: "12px", color: "var(--text-secondary)", textDecoration: "underline", cursor: "pointer", whiteSpace: "nowrap" },
};
