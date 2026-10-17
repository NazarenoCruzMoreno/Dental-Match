# Guía de traspaso de Dental Match

Esta guía sirve para que quien recibe el proyecto lo ponga a funcionar con **sus propias cuentas** y para que quien lo entrega no quede atado a ningún servicio. Está pensada para alguien con conocimientos básicos de desarrollo web; no hace falta conocer el código de antemano.

## 1. Qué es y de qué se compone

| Pieza | Tecnología | Dónde corre hoy | Carpeta |
|---|---|---|---|
| Sitio web | React + Vite | Vercel | `frontend/` |
| API | Node + Express | Render | `backend/` |
| Base de datos y archivos | PostgreSQL + Storage | Supabase | `backend/supabase_schema.sql` |
| Notificaciones push | Web Push (claves VAPID) | dentro de la API | `backend/src/utils/webPush.js` |
| Mantener despierta la API | Monitor HTTP | UptimeRobot | (solo configuración externa) |

El código vive en un repositorio de Git. Las contraseñas de los usuarios están cifradas (bcrypt) y la sesión usa JWT.

## 2. Qué se entrega

1. **El repositorio** con todo el código, el esquema de la base (`backend/supabase_schema.sql`), los tests y esta guía.
2. **La base de datos**: o bien una base vacía creada con el esquema (opción A), o bien el proyecto de Supabase actual transferido (opción B). Ver sección 5.
3. **Los despliegues** (Vercel y Render): se recomienda que el comprador cree los suyos desde el repositorio (secciones 3 y 4) en lugar de heredar los existentes.
4. **Las claves**: ninguna se entrega por el repositorio. Cada una se genera de nuevo (sección 6).

No hay dominio propio: el sitio usa la dirección gratuita de Vercel. Si el comprador quiere un dominio, lo compra y lo conecta desde el panel de Vercel (Settings → Domains) y después actualiza `FRONTEND_URL` en el backend.

## 3. Puesta en marcha paso a paso

El orden importa: la base primero, después la API y al final el sitio, porque cada pieza necesita la dirección de la anterior.

### 3.1 Base de datos (Supabase)
1. Crear un proyecto en <https://supabase.com>.
2. Abrir **SQL Editor**, pegar el contenido completo de `backend/supabase_schema.sql` y ejecutarlo. Se puede ejecutar más de una vez sin romper nada. Crea las 14 tablas, los índices y el bucket de imágenes `dental-match` (público).
3. En **Settings → API** anotar: `Project URL`, la clave `anon` y la clave `service_role` (esta última es secreta).

### 3.2 API (Render)
1. Crear un **Web Service** conectado al repositorio. Root directory: `backend`. Build: `npm install`. Start: `npm start`.
2. Cargar las variables de entorno de la sección 6.
3. Anotar la dirección que asigna Render (por ejemplo `https://mi-api.onrender.com`).

### 3.3 Sitio (Vercel)
1. Importar el repositorio. Root directory: `frontend`. (El archivo `frontend/vercel.json` ya incluye la regla para que las rutas internas como `/login` funcionen al recargar.)
2. Cargar `VITE_API_URL` (dirección de la API) y `VITE_VAPID_PUBLIC_KEY`.
3. Desplegar. **Cada vez que se cambia una variable `VITE_*` hay que volver a desplegar**: se incorporan al código al compilar, no se leen en vivo.
4. Volver a Render y poner la dirección del sitio en `FRONTEND_URL`.

### 3.4 Primer administrador
Registrar un usuario desde el sitio y, en el SQL Editor de Supabase, ejecutar:

```sql
update users set role = 'admin' where email = 'correo-del-administrador@ejemplo.com';
```

### 3.5 Mantener la API despierta (opcional)
El plan gratuito de Render duerme el servicio tras un rato sin visitas y la primera petición tarda cerca de un minuto. Para evitarlo, crear en UptimeRobot (o similar) un monitor HTTP que consulte `https://<tu-api>/api/health` cada 5 minutos. Con un plan de pago de Render esto no hace falta.

## 4. Comprobar que quedó bien

Desde la carpeta `backend`:

```bash
npm install
npm run verificar -- --api=https://mi-api.onrender.com --front=https://mi-sitio.vercel.app
```

El comando revisa, sin modificar nada:

- que la API responde y llega a la base de datos;
- que el backend acepta peticiones del sitio (CORS);
- que el sitio carga, que `/login` funciona al recargar y que apunta a la API correcta;
- que el sitio trae la clave pública de notificaciones;
- que el bucket de imágenes existe y es público;
- que hay un administrador.

Si además existe `backend/.env` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, también compara la base contra `supabase_schema.sql` (tablas y columnas). Cada problema viene con la indicación de qué corregir. El código de salida es 1 si hay alguna falla, así que sirve también en una automatización.

Los tests del proyecto se ejecutan desde la raíz con `npm test` y no tocan ninguna base real.

## 5. Datos existentes

- **Opción A, empezar limpio** (la más simple): usar una base nueva con `supabase_schema.sql`. Los usuarios y casos actuales no se trasladan.
- **Opción B, conservar los datos**: transferir el proyecto de Supabase a la organización del comprador (Supabase permite transferir proyectos entre organizaciones desde la configuración del proyecto; conviene confirmar el procedimiento vigente en su documentación) o exportar con `pg_dump` e importar en el proyecto nuevo. Las imágenes del bucket `dental-match` hay que copiarlas aparte.

Si hay datos de personas reales, el traspaso es una cesión de datos personales: conviene avisar a los usuarios y revisar la normativa de protección de datos que corresponda antes de entregarlos.

## 6. Variables de entorno

### API (Render / `backend/.env`)

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `SUPABASE_URL` | Sí | Dirección del proyecto de Supabase |
| `SUPABASE_ANON_KEY` | Sí | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave secreta de Supabase. Solo en el servidor |
| `JWT_SECRET` | Sí | Firma de las sesiones. Texto largo y aleatorio |
| `FRONTEND_URL` | Sí | Dirección del sitio para CORS. Varias, separadas por coma |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Para push | Notificaciones. `VAPID_SUBJECT` es `mailto:` con un correo real |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | **Para enviar correos** | Verificación de correo y recuperación de contraseña |
| `PORT` | No | Render lo define solo |

### Sitio (Vercel)

| Variable | Para qué sirve |
|---|---|
| `VITE_API_URL` | Dirección de la API |
| `VITE_VAPID_PUBLIC_KEY` | La misma `VAPID_PUBLIC_KEY` del backend |

Generar secretos nuevos:

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Par VAPID (ejecutar una sola vez)
node backend/scripts/generate-vapid.js
```

## 7. Cosas a resolver por quien recibe el proyecto

1. **Correo saliente.** Si no se configuran las variables `SMTP_*`, la API usa una cuenta de prueba que **no entrega correos reales**: la verificación de correo y la recuperación de contraseña no llegarían a nadie. Hay que contratar un servicio de envío (el que prefiera: Brevo, Resend, Gmail con contraseña de aplicación, etc.) y cargar los datos.
2. **Términos y privacidad.** El sitio guarda datos personales y fotos clínicas de pacientes. Hacen falta términos de uso y política de privacidad revisados por quien corresponda legalmente, y definir quién es responsable de esos datos.
3. **Límites de los planes gratuitos.** Render duerme el servicio, Supabase pausa proyectos inactivos y ambos tienen cuotas. Para uso real conviene revisar los planes.
4. **Moderación.** Los pacientes suben imágenes y los estudiantes aplican a casos clínicos: definir quién modera y con qué criterio.

## 8. Qué puede hacer quien entrega para desvincularse

Hacerlo **después** de que el comprador confirme que todo funciona con sus cuentas (sección 4):

- [ ] Transferir o ceder el repositorio de Git (o añadir al comprador como propietario y salir).
- [ ] Si el comprador usó el proyecto de Supabase actual (opción B): transferirlo a su organización, o dejar a su cuenta como propietaria.
- [ ] Si el comprador creó servicios propios: **eliminar** el proyecto de Vercel, el servicio de Render y el monitor de UptimeRobot propios (si no, la API actual seguirá encendida y apuntando a una base que ya no es del vendedor).
- [ ] **Rotar los secretos** que conocía el vendedor: `JWT_SECRET`, claves de Supabase (service role), par VAPID y credenciales SMTP. Rotar `JWT_SECRET` cierra todas las sesiones abiertas; cambiar el par VAPID obliga a los usuarios a reactivar las notificaciones.
- [ ] Revocar accesos: colaboradores del repositorio, tokens de acceso personales, integraciones de GitHub con Vercel y Render.
- [ ] Revisar la cuenta de correo del vendedor: los avisos de Vercel, Render, Supabase y UptimeRobot llegan ahí. Cambiar el correo de contacto de cada servicio o borrar la cuenta del servicio.
- [ ] Borrar los archivos `.env` locales y cualquier copia de claves en notas o chats.

## 9. Qué no se pudo verificar desde el repositorio

`backend/supabase_schema.sql` se construyó leyendo la base real y se comprobó que reproduce exactamente las 14 tablas y 109 columnas (tipos, obligatoriedad, valores por defecto, claves primarias y foráneas). Lo que la API de Supabase no permite leer, y por eso queda documentado en comentarios del propio archivo en lugar de copiado:

- restricciones `CHECK` de algunas tablas;
- el comportamiento `ON DELETE` de las claves foráneas;
- los índices de producción (el esquema define los 15 que el código necesita).

Ninguno impide que la aplicación funcione; conviene tenerlo presente si se compara byte a byte con la base original.
