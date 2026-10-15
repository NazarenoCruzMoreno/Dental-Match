require('./_entorno');
const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { esEndpointPermitido } = require('../src/utils/webPush');

const todosPermitidos = (urls) => urls.forEach((url) => assert.equal(esEndpointPermitido(url), true, url));
const todosRechazados = (urls) => urls.forEach((url) => assert.equal(esEndpointPermitido(url), false, String(url)));

// El endpoint de una suscripción es una URL que ESTE servidor va a llamar: si se
// aceptara cualquiera, un usuario podría apuntarla a un servicio interno (SSRF).
describe('esEndpointPermitido: lo que acepta', () => {
  test('los servicios push de los navegadores conocidos', () => {
    todosPermitidos([
      'https://fcm.googleapis.com/fcm/send/abc123',          // Chrome / Edge / Brave
      'https://updates.push.services.mozilla.com/wpush/v2/x', // Firefox
      'https://web.push.apple.com/QXYZ',                      // Safari
      'https://db5p.notify.windows.com/?token=abc',           // Windows (WNS)
    ]);
  });
});

describe('esEndpointPermitido: lo que rechaza', () => {
  test('http, aunque el host sea válido', () => {
    todosRechazados(['http://fcm.googleapis.com/fcm/send/abc']);
  });

  test('servicios internos y metadatos de la nube', () => {
    todosRechazados([
      'https://localhost/x',
      'https://127.0.0.1/x',
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.5/x',
      'https://[::1]/x',
    ]);
  });

  test('hosts que solo se parecen a uno permitido', () => {
    todosRechazados([
      'https://fcm.googleapis.com.evil.com/x',
      'https://evil-fcm.googleapis.com/x',
      'https://push.services.mozilla.com.evil.com/x',
      'https://notpush.services.mozilla.com/x',
      'https://evil.com/fcm.googleapis.com',
    ]);
  });

  test('entradas que no son una URL', () => {
    todosRechazados(['', 'no es url', undefined, null, 42, {}]);
  });
});

describe('esEndpointPermitido: PUSH_EXTRA_HOSTS (solo desarrollo)', () => {
  afterEach(() => { process.env.PUSH_EXTRA_HOSTS = ''; });

  test('permite agregar hosts propios sin abrir el resto', () => {
    assert.equal(esEndpointPermitido('https://push.local/x'), false);
    process.env.PUSH_EXTRA_HOSTS = 'push.local, otro.local';
    todosPermitidos(['https://push.local/x', 'https://otro.local/x']);
    todosRechazados(['https://evil.com/x']);
  });
});
