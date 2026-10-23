import { showToast } from '../lib/toast.js';

let fileBlob = null;
let fileName = null;

export function init() {
  const usernameInput = document.getElementById('c-username');

  chrome.storage.local.get(['qaId'], res => {
    if (res.qaId) usernameInput.value = res.qaId;
  });

  document.getElementById('c-save').addEventListener('click', () => {
    const v = usernameInput.value.trim();
    if (!v) return showToast('Enter a QA ID');
    chrome.storage.local.set({ qaId: v });
    const btn = document.getElementById('c-save');
    btn.style.color = 'var(--green)';
    setTimeout(() => (btn.style.color = ''), 1000);
  });

  document.getElementById('c-clear').addEventListener('click', () => {
    usernameInput.value = '';
    chrome.storage.local.remove('qaId');
  });

  // Single-select checkboxes
  document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(o => {
        if (o !== cb) o.checked = false;
      });
    });
  });

  document.getElementById('c-generate').addEventListener('click', generateChecklist);
  document.getElementById('c-download').addEventListener('click', downloadChecklist);
}

async function generateChecklist() {
  const usernameInput = document.getElementById('c-username');
  const username = usernameInput.value.trim();
  if (!username) return showToast('Enter a QA ID');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) return showToast('Could not detect active tab.');
  const ticket = extractTicket(tabs[0].url);
  if (!ticket) return showToast('Could not extract ticket from URL. Open a WSC Jira ticket first.');

  const selected = [...document.querySelectorAll('#tab-checklist input[type="checkbox"]')].find(cb => cb.checked);
  if (!selected) return showToast('Select a template');

  const modelName = selected.dataset.model;
  const modelPath = `models/QA_Prod_${modelName}_userName_DATE.xlsx`;
  fileName = `QA_Prod_${ticket}_${username}_${getDateYYMMDD()}.xlsx`;

  try {
    const response = await fetch(chrome.runtime.getURL(modelPath));
    if (!response.ok) throw new Error('Model not found');
    fileBlob = await response.blob();
    document.getElementById('c-download').style.display = 'flex';
  } catch (err) {
    showToast('Error loading template');
    fileBlob = null;
    document.getElementById('c-download').style.display = 'none';
    console.error(err);
  }
}

async function downloadChecklist() {
  if (!fileBlob || !fileName) return showToast('Error: file not prepared');

  const btn = document.getElementById('c-download');
  const originalText = btn.textContent;
  btn.textContent = 'Downloading…';
  btn.disabled = true;

  try {
    const sanitized = sanitizeFilename(fileName);
    const blobUrl = URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = sanitized;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      btn.textContent = 'Downloaded ✓';
      btn.style.background = 'var(--green)';
      btn.style.color = '#0a0a0f';
      document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(cb => cb.checked = false);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        fileBlob = null;
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.display = 'none';
        btn.disabled = false;
      }, 2000);
    }, 500);
  } catch (err) {
    showToast('Error: ' + err.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function extractTicket(url) {
  const match = url ? url.match(/WSC\d{8}-\d{5}/) : null;
  return match ? match[0] : null;
}

function getDateYYMMDD() {
  const d = new Date();
  return String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
}

function sanitizeFilename(filename) {
  return filename.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').substring(0, 200);
}

export function run() {}
