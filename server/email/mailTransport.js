import nodemailer from 'nodemailer';

let cachedTransport = null;

const isTrue = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

export function getMailRuntimeConfig(env = process.env) {
  return {
    appUrl: (env.APP_URL || env.FRONTEND_URL || '').trim(),
    discordUrl: (env.DISCORD_INVITE_URL || '').trim(),
    fromAddress: (env.MAIL_FROM_ADDRESS || '').trim(),
    fromName: (env.MAIL_FROM_NAME || 'Rada Arcymistrzów • Twierdza Magii Durmstrang').trim(),
    replyTo: (env.MAIL_REPLY_TO || '').trim(),
    transportMode: (env.MAIL_TRANSPORT || 'smtp').trim().toLowerCase(),
    smtp: {
      host: (env.SMTP_HOST || '').trim(),
      port: Number(env.SMTP_PORT || 587),
      secure: isTrue(env.SMTP_SECURE),
      user: (env.SMTP_USER || '').trim(),
      pass: env.SMTP_PASS || ''
    }
  };
}

export function createMailTransport(config = getMailRuntimeConfig()) {
  if (config.transportMode === 'json') {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const missing = [];
  if (!config.smtp.host) missing.push('SMTP_HOST');
  if (!config.smtp.port) missing.push('SMTP_PORT');
  if (!config.fromAddress) missing.push('MAIL_FROM_ADDRESS');
  if (missing.length) {
    throw new Error(`Brak konfiguracji wysyłki e-mail: ${missing.join(', ')}`);
  }

  const auth = config.smtp.user
    ? { user: config.smtp.user, pass: config.smtp.pass }
    : undefined;

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth
  });
}

export function getMailTransport() {
  if (!cachedTransport) cachedTransport = createMailTransport();
  return cachedTransport;
}

export function resetMailTransportForTests() {
  cachedTransport = null;
}
