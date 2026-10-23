// ── Perfil obrigatório do usuário ─────────────────────────
// Na primeira vez que a extensão é aberta (ou se algum dado sumir),
// um cadastro bloqueia o popup até o usuário informar:
//   • Nome        → wpcUsername  (campos "QA Username" — Report / QuickText)
//   • ID          → qaId         (campo "QA ID" — Checklist)
//   • E-mail Cheil→ qaEmail      (enviado para a coluna N da planilha)

const PROFILE_KEYS = ['wpcUsername', 'qaId', 'qaEmail'];

import { isValidCheilEmail, normalizeEmail, CHEIL_EMAIL_ERROR } from '../lib/email.js';
export { isValidCheilEmail };

export async function getProfile() {
  const res = await chrome.storage.local.get(PROFILE_KEYS);
  return {
    name:  (res.wpcUsername || '').trim(),
    id:    (res.qaId        || '').trim(),
    email: (res.qaEmail     || '').trim(),
  };
}

export function isProfileComplete(p) {
  return !!(p.name && p.id && isValidCheilEmail(p.email));
}

// Atualiza os campos de nome/ID espalhados pelo popup
export function syncProfileInputs({ name, id, email }) {
  const set = (ids, value) => ids.forEach(elId => {
    const el = document.getElementById(elId);
    if (el) el.value = value;
  });
  set(['r-qa', 'q-username', 'set-username'], name);
  set(['c-username', 'set-qa-id'], id);
  set(['set-qa-email'], email);
}

export function init() {
  const dialog = document.getElementById('profile-dialog');
  if (!dialog) return;

  document.getElementById('pf-save').addEventListener('click', saveProfile);
  ['pf-name', 'pf-id', 'pf-email'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      document.getElementById('pf-error').textContent = '';
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); saveProfile(); }
    });
  });

  // O cadastro não pode ser fechado sem salvar
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
  });

  checkProfile();

  // Se algum dado obrigatório for apagado (ex: botão "Clear"), pede de novo
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (PROFILE_KEYS.some(k => k in changes)) checkProfile();
  });
}

async function checkProfile() {
  const profile = await getProfile();
  if (isProfileComplete(profile)) {
    closeProfileDialog();
  } else {
    openProfileDialog(profile);
  }
}

function openProfileDialog(profile) {
  const dialog = document.getElementById('profile-dialog');
  if (dialog.classList.contains('open')) return;

  // Pré-preenche com o que já existir (usuários antigos já têm nome/ID salvos)
  document.getElementById('pf-name').value  = profile.name;
  document.getElementById('pf-id').value    = profile.id;
  document.getElementById('pf-email').value = profile.email;
  document.getElementById('pf-error').textContent = '';

  dialog.classList.add('open');
  document.body.classList.add('profile-required');

  const firstEmpty = ['pf-name', 'pf-id', 'pf-email']
    .map(id => document.getElementById(id))
    .find(el => !el.value.trim()) || document.getElementById('pf-email');
  setTimeout(() => firstEmpty.focus(), 50);
}

function closeProfileDialog() {
  document.getElementById('profile-dialog').classList.remove('open');
  document.body.classList.remove('profile-required');
}

function fail(inputId, message) {
  const input = document.getElementById(inputId);
  input.classList.add('invalid');
  document.getElementById('pf-error').textContent = message;
  const card = document.querySelector('#profile-dialog .pf-card');
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  input.focus();
}

async function saveProfile() {
  const name  = document.getElementById('pf-name').value.trim().replace(/\s+/g, ' ');
  const id    = document.getElementById('pf-id').value.trim();
  const email = normalizeEmail(document.getElementById('pf-email').value);

  if (!name)  return fail('pf-name',  'Enter your name.');
  if (!id)    return fail('pf-id',    'Enter your QA ID.');
  if (!email) return fail('pf-email', 'Enter your Cheil e-mail.');
  if (!isValidCheilEmail(email)) return fail('pf-email', CHEIL_EMAIL_ERROR);

  await chrome.storage.local.set({ wpcUsername: name, qaId: id, qaEmail: email });
  syncProfileInputs({ name, id, email });
  closeProfileDialog();
}
