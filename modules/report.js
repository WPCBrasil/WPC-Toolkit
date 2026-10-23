import { showToast } from '../lib/toast.js';
import {
  BASE_AUTHOR_GROUPS, buildAuthorGroups, loadCustomAuthors, syncCustomAuthors,
  addCustomAuthor, removeCustomAuthor, findDuplicate, emailOf,
} from './people.js';
import { getProfile } from './profile.js';
import { isValidCheilEmail, normalizeEmail, CHEIL_EMAIL_ERROR } from '../lib/email.js';
import { scriptPost } from '../lib/report-script.js';


// ── Authors do ticket ─────────────────────────────────────
// A lista (nome + e-mail) fica em ./people.js.
// Nome do author → coluna M · E-mail do author → coluna O
// Nome do QA     → coluna I · E-mail do QA     → coluna N

const DEFAULT_AUTHOR_GROUP = 'publisher';

// Lista usada pelo seletor: fixa + publishers cadastrados pelo usuário
let AUTHOR_GROUPS = buildAuthorGroups([]);

function applyCustomAuthors(custom) {
  AUTHOR_GROUPS = buildAuthorGroups(custom);
  renderAuthorTabs();
  if (document.getElementById('author-picker').classList.contains('open')) renderAuthorGrid();
}

// 1) mostra o cache na hora · 2) busca a lista atualizada da planilha
async function reloadAuthorGroups({ remote = true } = {}) {
  try {
    applyCustomAuthors(await loadCustomAuthors());
  } catch (err) {
    console.error('[report] cached authors', err);
    AUTHOR_GROUPS = BASE_AUTHOR_GROUPS;
  }
  if (!remote) return;
  try {
    applyCustomAuthors(await syncCustomAuthors());
  } catch (err) {
    console.warn('[report] could not sync publishers from sheet', err);
  }
}

let selectedAuthor = null;   // { name, group } confirmado no formulário
let pickerChoice   = null;   // escolha provisória dentro do seletor
let pickerGroup    = DEFAULT_AUTHOR_GROUP;
let sendAfterPick  = false;  // true quando o seletor foi aberto pelo "Send Report"

// ── Quantidade pedida no envio, conforme o Status ─────────
// REJECTED → Publisher error (coluna E) · PENDING → Pending customer (coluna F)
const COUNT_BY_STATUS = {
  REJECTED: {
    key:   'publisherError',
    cls:   's-rejected',
    title: 'How many publisher errors?',
    sub:   'This ticket is rejected. Enter how many publisher errors you found.',
  },
  PENDING: {
    key:   'pendingCustomer',
    cls:   's-pending',
    title: 'How many pending customer items?',
    sub:   'This ticket is pending. Enter how many items are waiting on the customer.',
  },
};

let countStatus = null;   // status para o qual o popup de quantidade está aberto

async function translateText(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt|en`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error('Invalid response from translation API');
}

export function init() {
  const qaInput = document.getElementById('r-qa');

  chrome.storage.local.get(['wpcUsername'], res => {
    if (res.wpcUsername) qaInput.value = res.wpcUsername;
  });

  document.getElementById('r-save').addEventListener('click', () => {
    const name = qaInput.value.trim();
    if (!name) return;
    chrome.storage.local.set({ wpcUsername: name }, () => {
      const btn = document.getElementById('r-save');
      btn.style.color = 'var(--green)';
      setTimeout(() => (btn.style.color = ''), 1000);
    });
  });

  document.getElementById('r-clear').addEventListener('click', () => {
    qaInput.value = '';
    chrome.storage.local.remove('wpcUsername');
  });

  document.getElementById('r-cancel').addEventListener('click', () => window.close());
  document.getElementById('r-report').addEventListener('click', () => sendReport());

  initAuthorPicker();
  initNewPublisherDialog();
  initCountDialog();
  reloadAuthorGroups();

  document.getElementById('r-translate').addEventListener('click', async () => {
    const textarea = document.getElementById('r-comments');
    const text = textarea.value.trim();
    if (!text) return showToast('Type something in Comments first.');

    const btn = document.getElementById('r-translate');
    btn.disabled = true;
    btn.textContent = '…';
    try {
      textarea.value = await translateText(text);
    } catch {
      showToast('Translation failed. Check your internet connection.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Translate';
    }
  });
}

async function sendReport(counts = null) {
  const category = document.getElementById('r-category').value;
  const sub      = document.getElementById('r-sub').value;
  const status   = document.getElementById('r-status').value;
  const qa       = document.getElementById('r-qa').value.trim();

  if (!category || !sub || !status || !qa) {
    return showToast('Please fill all mandatory fields (*)');
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) return showToast('Could not detect active tab.');
  const rawUrl = tabs[0].url;

  if (!rawUrl.startsWith('https://jira.secext.samsung.net/browse/WSC')) {
    return showToast('Invalid URL. Open a WSC Jira ticket first.');
  }

  if (!selectedAuthor) {
    return openAuthorPicker({ sendAfter: true });
  }

  // REJECTED / PENDING: pede a quantidade antes de enviar
  const countCfg = COUNT_BY_STATUS[status];
  if (countCfg && !counts) {
    return openCountDialog(status);
  }

  const profile = await getProfile();
  if (!isValidCheilEmail(profile.email)) {
    return showToast('Your e-mail must be @cheil.com. Update it in Settings.');
  }

  const publisherEmail = emailOf(AUTHOR_GROUPS, selectedAuthor.name, selectedAuthor.group);
  if (!isValidCheilEmail(publisherEmail)) {
    return showToast(`${selectedAuthor.name} has no valid @cheil.com e-mail.`);
  }

  const ticketUrl    = rawUrl.split(/[?#]/)[0];
  const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  const data = {
    ticketUrl, category, sub, status,
    publisherError:  counts?.publisherError  ?? '',
    pendingCustomer: counts?.pendingCustomer ?? '',
    reason:          document.getElementById('r-reason').value,
    date:            formattedDate,
    qa,                                               // coluna I
    qaEmail:         profile.email,                   // coluna N
    comments:        document.getElementById('r-comments').value,
    publisher:       selectedAuthor.name,             // coluna M
    publisherEmail,                                   // coluna O
  };

  const btn = document.getElementById('r-report');
  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    await scriptPost(data);

    showToast('Report sent! ✓');
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    console.error('[report]', err);
    showToast(err.fromScript
      ? `Error: ${err.message}`
      : 'Error sending report. Check the Apps Script URL in Settings.');
    btn.disabled    = false;
    btn.textContent = 'Send Report';
  }
}

// ── Author picker ─────────────────────────────────────────
function groupById(id) {
  return AUTHOR_GROUPS.find(g => g.id === id);
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function initAuthorPicker() {
  const picker = document.getElementById('author-picker');
  const search = document.getElementById('ap-search');

  document.getElementById('r-author').addEventListener('click', () => openAuthorPicker());
  document.getElementById('ap-close').addEventListener('click', closeAuthorPicker);
  document.getElementById('ap-cancel').addEventListener('click', closeAuthorPicker);
  document.getElementById('ap-confirm').addEventListener('click', confirmAuthor);

  search.addEventListener('input', renderAuthorGrid);
  search.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    // Enter na busca: se sobrar só um nome, seleciona; se já houver seleção, confirma
    const cards = document.querySelectorAll('#ap-grid .ap-card');
    if (cards.length === 1) {
      pickerChoice = { name: cards[0].dataset.name, group: cards[0].dataset.group };
      renderAuthorGrid();
    } else if (pickerChoice) {
      confirmAuthor();
    }
  });

  picker.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeAuthorPicker(); }
  });

  renderAuthorTabs();
}

function renderAuthorTabs() {
  const tabs = document.getElementById('ap-tabs');
  tabs.innerHTML = '';
  AUTHOR_GROUPS.forEach(g => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ap-tab' + (g.id === pickerGroup ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(g.id === pickerGroup));
    btn.dataset.group = g.id;

    const label = document.createElement('span');
    label.textContent = g.label;
    const count = document.createElement('span');
    count.className = 'ap-tab-count';
    count.textContent = g.people.length;
    btn.append(label, count);

    btn.addEventListener('click', () => {
      pickerGroup = g.id;
      renderAuthorTabs();
      renderAuthorGrid();
    });
    tabs.appendChild(btn);
  });
}

function renderAuthorGrid() {
  const grid  = document.getElementById('ap-grid');
  const query = normalize(document.getElementById('ap-search').value.trim());
  const searching = query.length > 0;

  document.getElementById('ap-tabs').classList.toggle('searching', searching);

  // Com busca: procura em todos os grupos. Sem busca: só na aba ativa.
  const items = [];
  const groups = searching ? AUTHOR_GROUPS : [groupById(pickerGroup)];
  groups.forEach(g => g.people.forEach(({ name, email, custom }) => {
    if (!searching || normalize(name).includes(query) || normalize(email).includes(query)) {
      items.push({ name, group: g, custom: !!custom });
    }
  }));

  grid.innerHTML = '';
  items.forEach(({ name, group, custom }) => {
    const isSelected = pickerChoice && pickerChoice.name === name && pickerChoice.group === group.id;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ap-card' + (isSelected ? ' selected' : '') + (custom ? ' is-custom' : '');
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', String(!!isSelected));
    card.dataset.name  = name;
    card.dataset.group = group.id;
    card.title = name;

    const avatar = document.createElement('span');
    avatar.className = `author-avatar g-${group.id}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = initials(name);

    const text = document.createElement('span');
    text.className = 'ap-card-text';
    const nameEl = document.createElement('span');
    nameEl.className = 'ap-name';
    nameEl.textContent = name;
    text.appendChild(nameEl);
    if (searching || custom) {
      const tag = document.createElement('span');
      tag.className = 'ap-tag' + (custom ? ' ap-tag-new' : '');
      tag.textContent = [searching ? group.tag : '', custom ? 'Added' : ''].filter(Boolean).join(' · ');
      text.appendChild(tag);
    }

    card.append(avatar, text);
    card.addEventListener('click', () => {
      pickerChoice = { name, group: group.id };
      renderAuthorGrid();
      grid.querySelector('.ap-card.selected')?.focus();
    });
    card.addEventListener('dblclick', () => {
      pickerChoice = { name, group: group.id };
      confirmAuthor();
    });
    grid.appendChild(card);
  });

  document.getElementById('ap-empty').classList.toggle('show', items.length === 0);
  updatePickerFooter();
}

function updatePickerFooter() {
  const label   = document.getElementById('ap-selected');
  const confirm = document.getElementById('ap-confirm');

  label.textContent = '';
  if (pickerChoice) {
    const strong = document.createElement('strong');
    strong.textContent = pickerChoice.name;
    label.append(strong, ` · ${groupById(pickerChoice.group).tag}`);
  } else {
    label.textContent = 'No author selected';
  }
  confirm.disabled = !pickerChoice;

  // "Remove" só aparece quando o selecionado foi cadastrado pelo usuário
  const chosen = pickerChoice && groupById(pickerChoice.group)?.people
    .find(p => p.name === pickerChoice.name);
  document.getElementById('ap-remove').hidden = !chosen?.custom;
  confirm.textContent = sendAfterPick ? 'Confirm & send' : 'Confirm';
}

function openAuthorPicker({ sendAfter = false } = {}) {
  sendAfterPick = sendAfter;
  pickerChoice  = selectedAuthor ? { ...selectedAuthor } : null;
  pickerGroup   = selectedAuthor ? selectedAuthor.group : DEFAULT_AUTHOR_GROUP;

  document.getElementById('ap-sub').textContent = sendAfter
    ? 'Choose the author of this ticket to send the report.'
    : 'Pick the author of the ticket.';

  const search = document.getElementById('ap-search');
  search.value = '';
  renderAuthorTabs();
  renderAuthorGrid();

  document.getElementById('author-picker').classList.add('open');
  setTimeout(() => search.focus(), 50);
}

function closeAuthorPicker() {
  const wasSending = sendAfterPick;
  document.getElementById('author-picker').classList.remove('open');
  sendAfterPick = false;
  pickerChoice  = null;

  const field = document.getElementById('r-author');
  field.focus();
  // Fechou sem escolher durante o envio: sinaliza o campo obrigatório
  if (wasSending && !selectedAuthor) {
    field.classList.remove('attention');
    void field.offsetWidth;
    field.classList.add('attention');
    showToast('Choose the ticket author to send the report.');
  }
}

function confirmAuthor() {
  if (!pickerChoice) return;
  const shouldSend = sendAfterPick;

  selectedAuthor = { ...pickerChoice };
  renderAuthorField();

  sendAfterPick = false;
  document.getElementById('author-picker').classList.remove('open');
  pickerChoice = null;

  if (shouldSend) sendReport();
}

function renderAuthorField() {
  const field  = document.getElementById('r-author');
  const avatar = document.getElementById('r-author-avatar');
  const name   = document.getElementById('r-author-name');
  const role   = document.getElementById('r-author-role');
  const action = document.getElementById('r-author-action');

  field.classList.remove('attention');

  if (!selectedAuthor) {
    field.classList.add('is-empty');
    avatar.className = 'author-avatar';
    avatar.textContent = '?';
    name.textContent = 'Choose who made this ticket';
    role.textContent = '';
    action.textContent = 'Choose';
    return;
  }

  const group = groupById(selectedAuthor.group);
  field.classList.remove('is-empty');
  avatar.className = `author-avatar g-${group.id}`;
  avatar.textContent = initials(selectedAuthor.name);
  name.textContent = selectedAuthor.name;
  role.textContent = group.tag;
  action.textContent = 'Change';
}

// ── Novo publisher (cadastrado pelo usuário) ──────────────
const NAME_PART_RE = /^[\p{L}][\p{L}'’\- ]*$/u;

function cleanName(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function initNewPublisherDialog() {
  const dialog = document.getElementById('np-dialog');

  document.getElementById('ap-add').addEventListener('click', openNewPublisherDialog);
  document.getElementById('np-cancel').addEventListener('click', closeNewPublisherDialog);
  document.getElementById('np-save').addEventListener('click', saveNewPublisher);
  document.getElementById('ap-remove').addEventListener('click', removeSelectedCustom);

  ['np-first', 'np-last', 'np-email'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      document.getElementById('np-error').textContent = '';
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); saveNewPublisher(); }
    });
  });

  // Aviso em tempo real se o domínio digitado não for @cheil.com
  document.getElementById('np-email').addEventListener('blur', e => {
    const value = normalizeEmail(e.target.value);
    if (value && !isValidCheilEmail(value)) npFail('np-email', CHEIL_EMAIL_ERROR, false);
  });

  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeNewPublisherDialog(); }
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) closeNewPublisherDialog(); });
}

function openNewPublisherDialog() {
  ['np-first', 'np-last', 'np-email'].forEach(id => {
    const input = document.getElementById(id);
    input.value = '';
    input.classList.remove('invalid');
  });
  document.getElementById('np-error').textContent = '';

  // Se o usuário buscou um nome que não existe, já sugere no formulário
  const query = cleanName(document.getElementById('ap-search').value);
  if (query && !query.includes('@')) {
    const parts = query.split(' ');
    document.getElementById('np-first').value = parts.shift() || '';
    document.getElementById('np-last').value  = parts.join(' ');
  }

  document.getElementById('np-dialog').classList.add('open');
  setTimeout(() => document.getElementById('np-first').focus(), 50);
}

function closeNewPublisherDialog() {
  document.getElementById('np-dialog').classList.remove('open');
  document.getElementById('ap-search').focus();
}

function npFail(inputId, message, shake = true) {
  const input = document.getElementById(inputId);
  input.classList.add('invalid');
  document.getElementById('np-error').textContent = message;
  if (shake) {
    const card = document.querySelector('#np-dialog .np-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    input.focus();
  }
}

async function saveNewPublisher() {
  const first = cleanName(document.getElementById('np-first').value);
  const last  = cleanName(document.getElementById('np-last').value);
  const email = normalizeEmail(document.getElementById('np-email').value);

  if (!first) return npFail('np-first', 'Enter the first name.');
  if (!NAME_PART_RE.test(first)) return npFail('np-first', 'First name can only contain letters.');
  if (!last)  return npFail('np-last', 'Enter the last name.');
  if (!NAME_PART_RE.test(last))  return npFail('np-last', 'Last name can only contain letters.');
  if (!email) return npFail('np-email', 'Enter the e-mail.');
  if (!isValidCheilEmail(email)) return npFail('np-email', CHEIL_EMAIL_ERROR);

  const name = `${first} ${last}`;
  await reloadAuthorGroups();   // pega cadastros recentes de outros QAs antes de checar duplicado
  const dup = findDuplicate(AUTHOR_GROUPS, { name, email });
  if (dup?.field === 'name')  return npFail('np-first', `${dup.person.name} is already in ${dup.group.label}.`);
  if (dup?.field === 'email') return npFail('np-email', `This e-mail belongs to ${dup.person.name}.`);

  const btn = document.getElementById('np-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const profile = await getProfile();
    applyCustomAuthors(await addCustomAuthor({
      name, email, addedBy: profile.name, addedByEmail: profile.email,
    }));
  } catch (err) {
    console.error('[report] add publisher', err);
    return npFail('np-email', err.fromScript
      ? err.message
      : 'Could not save. Check your connection and try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add publisher';
  }

  // Volta ao seletor com o novo publisher já selecionado
  document.getElementById('np-dialog').classList.remove('open');
  pickerGroup  = 'publisher';
  pickerChoice = { name, group: 'publisher' };
  document.getElementById('ap-search').value = '';
  renderAuthorTabs();
  renderAuthorGrid();
  document.querySelector('#ap-grid .ap-card.selected')?.scrollIntoView({ block: 'nearest' });
  showToast(`${name} added ✓`);
}

async function removeSelectedCustom() {
  if (!pickerChoice) return;
  const { name } = pickerChoice;
  if (!confirm(`Remove ${name} from the publisher list for the whole team?`)) return;

  try {
    applyCustomAuthors(await removeCustomAuthor(name));
  } catch (err) {
    console.error('[report] remove publisher', err);
    return showToast(err.fromScript ? `Error: ${err.message}` : 'Could not remove. Check your connection.');
  }
  if (selectedAuthor?.name === name) {
    selectedAuthor = null;
    renderAuthorField();
  }
  pickerChoice = null;
  renderAuthorTabs();
  renderAuthorGrid();
  showToast(`${name} removed`);
}

// ── Popup de quantidade (REJECTED / PENDING) ──────────────
function initCountDialog() {
  const dialog = document.getElementById('count-dialog');
  const input  = document.getElementById('cd-input');

  const step = delta => {
    const current = parseInt(input.value, 10) || 0;
    input.value = Math.max(1, current + delta);
    document.getElementById('cd-error').textContent = '';
    input.focus();
  };

  document.getElementById('cd-minus').addEventListener('click', () => step(-1));
  document.getElementById('cd-plus').addEventListener('click', () => step(1));
  document.getElementById('cd-cancel').addEventListener('click', closeCountDialog);
  document.getElementById('cd-confirm').addEventListener('click', confirmCount);

  input.addEventListener('input', () => { document.getElementById('cd-error').textContent = ''; });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmCount(); }
  });

  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCountDialog(); }
  });
  // Clique fora do card fecha
  dialog.addEventListener('click', e => { if (e.target === dialog) closeCountDialog(); });
}

function openCountDialog(status) {
  const cfg = COUNT_BY_STATUS[status];
  countStatus = status;

  const badge = document.getElementById('cd-status');
  badge.className = `cd-status ${cfg.cls}`;
  badge.textContent = status;
  document.getElementById('cd-title').textContent = cfg.title;
  document.getElementById('cd-sub').textContent   = cfg.sub;
  document.getElementById('cd-error').textContent = '';

  const input = document.getElementById('cd-input');
  input.value = '';

  document.getElementById('count-dialog').classList.add('open');
  setTimeout(() => input.focus(), 50);
}

function closeCountDialog() {
  document.getElementById('count-dialog').classList.remove('open');
  countStatus = null;
  document.getElementById('r-report').focus();
}

function confirmCount() {
  if (!countStatus) return;
  const input = document.getElementById('cd-input');
  const raw   = input.value.trim();
  const value = Number(raw);

  if (!raw || !Number.isInteger(value) || value < 1) {
    document.getElementById('cd-error').textContent = 'Enter a whole number of 1 or more.';
    const card = document.querySelector('#count-dialog .cd-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    input.focus();
    return;
  }

  const cfg = COUNT_BY_STATUS[countStatus];
  document.getElementById('count-dialog').classList.remove('open');
  countStatus = null;
  sendReport({ [cfg.key]: String(value) });
}

export function run() {}
