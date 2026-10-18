// Un admin no tiene perfil de estudiante/paciente que completar: su entrada es /admin.
// Si cayera en /home, RequireProfile lo mandaría a /profile/edit, donde el guardado falla.
export const rutaInicial = (user) => (user?.role === "admin" ? "/admin" : "/home");
