// ── Regra única de e-mail da extensão ─────────────────────
// Só são aceitos endereços @cheil.com (sem subdomínios, sem outros domínios).
// Todo lugar que recebe e-mail (cadastro do perfil, Settings,
// novo publisher e envio do report) usa estas funções.

export const CHEIL_DOMAIN = 'cheil.com';

const CHEIL_EMAIL_RE = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@cheil\.com$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidCheilEmail(email) {
  const value = normalizeEmail(email);
  return CHEIL_EMAIL_RE.test(value) && !value.includes('..');
}

export const CHEIL_EMAIL_ERROR = 'Only @cheil.com e-mails are allowed.';
