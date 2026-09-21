import { clearAuth } from "../services/api";
import { desactivarPush } from "./push";

// Único camino para cerrar sesión (UserMenu, HomePage y ProfilePage lo usan).
// Antes de borrar el token hay que dar de baja el push de este dispositivo,
// porque el DELETE al backend necesita estar autenticado: si no, en una
// computadora compartida los avisos de quien se fue seguirían llegando.
export async function logout() {
  // Best-effort y con tope de tiempo: un backend lento o caído nunca puede
  // impedir que alguien cierre sesión.
  await Promise.race([
    desactivarPush().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  clearAuth();
}
