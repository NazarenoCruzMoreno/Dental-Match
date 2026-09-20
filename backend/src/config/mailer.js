const nodemailer = require('nodemailer');

// Si hay SMTP configurado por env vars, se usa eso (para producción real).
// Si no, se crea una cuenta de prueba de Ethereal al vuelo — no manda mail
// de verdad, pero permite ver el contenido vía una URL de preview que se
// loguea en consola. Útil mientras no haya un proveedor SMTP real elegido.
let transporterPromise = null;

function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (process.env.SMTP_HOST) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      })
    );
  } else {
    transporterPromise = nodemailer.createTestAccount().then((account) => {
      console.warn(
        '⚠️  SMTP no configurado — usando cuenta de prueba de Ethereal.\n' +
        '   Los emails NO se envían de verdad; la URL de preview sale en consola en cada envío.'
      );
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    });
  }

  return transporterPromise;
}

async function sendMail(opts, label) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Dental Match" <no-reply@dentalmatch.local>',
    ...opts,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`📧 Preview del email de ${label} (Ethereal):`, previewUrl);

  return info;
}

async function sendPasswordResetEmail(to, resetUrl) {
  return sendMail({
    to,
    subject: 'Recuperá tu contraseña — Dental Match',
    text: `Pedimos un cambio de contraseña para tu cuenta.\n\nEntrá a este link para elegir una nueva (vence en 1 hora):\n${resetUrl}\n\nSi no fuiste vos, ignorá este email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#2563eb;">Dental Match</h2>
        <p>Pedimos un cambio de contraseña para tu cuenta.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Elegir nueva contraseña</a></p>
        <p style="color:#64748b;font-size:13px;">Este link vence en 1 hora. Si no fuiste vos, ignorá este email.</p>
      </div>
    `,
  }, 'reset');
}

async function sendVerificationEmail(to, verifyUrl) {
  return sendMail({
    to,
    subject: 'Confirmá tu email — Dental Match',
    text: `¡Bienvenido a Dental Match!\n\nConfirmá tu email para poder ingresar:\n${verifyUrl}\n\nSi no creaste esta cuenta, ignorá este email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#2563eb;">Dental Match</h2>
        <p>¡Bienvenido! Confirmá tu email para poder ingresar a tu cuenta.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Confirmar email</a></p>
        <p style="color:#64748b;font-size:13px;">Si no creaste esta cuenta, ignorá este email.</p>
      </div>
    `,
  }, 'verificación');
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
