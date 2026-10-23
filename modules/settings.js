import { showToast } from '../lib/toast.js';
import { syncProfileInputs } from './profile.js';
import { DEFAULT_REPORT_URL } from '../lib/report-script.js';
import { isValidCheilEmail, normalizeEmail, CHEIL_EMAIL_ERROR } from '../lib/email.js';
import { TEMPLATES as QT_DEFAULTS, refresh as refreshQuicktext } from './quicktext.js';

// Default URLs — overridden by what's saved in chrome.storage.local
const DEFAULT_SNAP_URL    = 'https://script.google.com/macros/s/AKfycbzaOszSR3WDZLNM2DvsiEOBoXjT8djqY6M3UgMTyLJI6MPLZ-Kb5RB6sgzMjTkcqJRmgA/exec';
const DEFAULT_SNAP_PRES   = '1OgcvlQEXwNpE3ho--2KryxACNX_FTXiopJVLAKEQQfM';
const GAS_PREFIX          = 'https://script.google.com/';

function isValidGasUrl(url) {
  return !url || url.startsWith(GAS_PREFIX);
}

// ── QuickText template editor state ──────────────────────
// Flat map { [id]: text } with the current values shown in the editor.
// Initialized from storage when settings opens; written back on Save.
let _qtMap = {};

function buildDefaultMap() {
  const map = {};
  Object.values(QT_DEFAULTS).flat().forEach(item => { map[item.id] = item.template; });
  return map;
}

export function init() {
  migrateLegacyKeys();

  document.getElementById('settings-gear').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-save').addEventListener('click', saveSettings);

  initTemplateEditor();
}

// ── Open / close ─────────────────────────────────────────
function openSettings() {
  document.getElementById('settings-panel').classList.add('open');
  chrome.storage.local.get(
    ['wpcUsername', 'qaId', 'qaEmail', 'reportScriptUrl', 'snapGasUrl', 'snapPresId', 'qtTemplates', 'reportingUnlocked'],
    res => {
      document.getElementById('set-username').value   = res.wpcUsername     || '';
      document.getElementById('set-qa-id').value      = res.qaId            || '';
      document.getElementById('set-qa-email').value   = res.qaEmail         || '';
      document.getElementById('set-reportUrl').value  = res.reportScriptUrl || DEFAULT_REPORT_URL;
      document.getElementById('set-snapUrl').value    = res.snapGasUrl      || DEFAULT_SNAP_URL;
      document.getElementById('set-snapPresId').value = res.snapPresId      || DEFAULT_SNAP_PRES;
      _qtMap = { ...buildDefaultMap(), ...(res.qtTemplates || {}) };
      updateQtTextarea();
      document.getElementById('settings-panel')
        .classList.toggle('settings-locked', !res.reportingUnlocked);
    }
  );
}

function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
  clearSavedMsg();
}

// ── Load / save ──────────────────────────────────────────
function saveSettings() {
  const username  = document.getElementById('set-username').value.trim();
  const qaId      = document.getElementById('set-qa-id').value.trim();
  const qaEmail   = normalizeEmail(document.getElementById('set-qa-email').value);
  const reportUrl = document.getElementById('set-reportUrl').value.trim() || DEFAULT_REPORT_URL;
  const snapUrl   = document.getElementById('set-snapUrl').value.trim()   || DEFAULT_SNAP_URL;
  const snapPres  = document.getElementById('set-snapPresId').value.trim() || DEFAULT_SNAP_PRES;

  // Nome, ID e e-mail Cheil são obrigatórios
  if (!username) return showToast('QA Username is required.');
  if (!qaId)     return showToast('QA ID is required.');
  if (!isValidCheilEmail(qaEmail)) return showToast(CHEIL_EMAIL_ERROR);

  if (!isValidGasUrl(reportUrl)) {
    return showToast('Report URL must start with https://script.google.com/');
  }
  if (!isValidGasUrl(snapUrl)) {
    return showToast('SnapSlide URL must start with https://script.google.com/');
  }

  // Capture textarea value before saving (user may not have changed focus)
  const sel = document.getElementById('set-qt-select');
  if (sel) _qtMap[sel.value] = document.getElementById('set-qt-body')?.value ?? _qtMap[sel.value];

  chrome.storage.local.set({
    wpcUsername:     username,
    qaId:            qaId,
    qaEmail:         qaEmail,
    reportScriptUrl: reportUrl,
    snapGasUrl:      snapUrl,
    snapPresId:      snapPres,
    qtTemplates:     _qtMap,
  }, () => {
    syncProfileInputs({ name: username, id: qaId, email: qaEmail });

    const ssPresIdInput = document.getElementById('ss-presId');
    if (ssPresIdInput && snapPres) ssPresIdInput.value = snapPres;

    refreshQuicktext();
    showSavedMsg();
  });
}

function showSavedMsg() {
  const el = document.getElementById('settings-saved');
  el.textContent = 'Saved ✓';
  setTimeout(() => { el.textContent = ''; }, 2000);
}

function clearSavedMsg() {
  document.getElementById('settings-saved').textContent = '';
}

// ── QuickText template editor ─────────────────────────────
function initTemplateEditor() {
  const sel      = document.getElementById('set-qt-select');
  const textarea = document.getElementById('set-qt-body');
  const resetBtn = document.getElementById('set-qt-reset');
  if (!sel || !textarea || !resetBtn) return;

  // When user picks a different template, show its text
  sel.addEventListener('change', updateQtTextarea);

  // Track edits in memory
  sel.addEventListener('change', () => {
    // Save current textarea into map before switching
    const prev = sel._prevValue;
    if (prev && textarea.value !== undefined) _qtMap[prev] = textarea.value;
    sel._prevValue = sel.value;
  });
  textarea.addEventListener('input', () => { _qtMap[sel.value] = textarea.value; });

  // Reset current template to its factory default
  resetBtn.addEventListener('click', () => {
    const defaults    = buildDefaultMap();
    _qtMap[sel.value] = defaults[sel.value];
    textarea.value    = _qtMap[sel.value];
  });

  sel._prevValue = sel.value;
}

function updateQtTextarea() {
  const sel      = document.getElementById('set-qt-select');
  const textarea = document.getElementById('set-qt-body');
  if (!sel || !textarea) return;
  textarea.value = _qtMap[sel.value] ?? '';
}

// ── One-time migration from old storage keys ─────────────
function migrateLegacyKeys() {
  chrome.storage.local.get(['wpcUsername', 'qaName', 'checklistUsername'], local => {
    if (local.wpcUsername) return;

    const legacy = local.qaName || local.checklistUsername || '';
    if (!legacy) {
      chrome.storage.sync.get(['quicktextUsername'], sync => {
        if (sync.quicktextUsername) {
          chrome.storage.local.set({ wpcUsername: sync.quicktextUsername });
        }
      });
      return;
    }
    chrome.storage.local.set({ wpcUsername: legacy });
  });
}
