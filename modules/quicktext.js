import { showToast } from '../lib/toast.js';

export const TEMPLATES = {
  approved: [
    { id: 'approved',  label: 'Approved',   template: '#0 - QA Checklist: passed\n#1 - Athena report: passed\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    { id: 'athena_na', label: 'Athena N/A', template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    { id: 'eol',       label: 'EOL',        template: '#0 - QA Checklist: passed\n#1 - Athena report: EOL/Redirection\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
  ],
  rejected: [
    { id: 'rejected',    label: 'Rejected',    template: '#0 - QA Checklist: rejected\n#1 - Athena report: passed\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA rejected, please fix these issues:\n\n#Comments:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    { id: 'athena_fail', label: 'Athena Fail', template: '#0 - QA Checklist: rejected\n#1 - Athena report: rejected\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA rejected, please fix these issues:\n\n#Comments:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
  ],
  shopapp: [
    { id: 'published',     label: 'Published',     template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA approved, please proceed. Updates have been published\n#4 - Screenshot:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    { id: 'non_published', label: 'Non Published', template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA approved, please proceed. No updates have been published.\n#4 - Screenshot:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    { id: 'shop_rejected', label: 'Rejected',      template: '#0 - QA Checklist: rejected\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA rejected, please fix these issues:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
  ],
};

const SECTION_LABELS = { approved: 'Approved', rejected: 'Rejected', shopapp: 'ShopApp' };

export function init() {
  const usernameInput = document.getElementById('q-username');

  chrome.storage.local.get(['wpcUsername', 'qtTemplates'], data => {
    if (data.wpcUsername) usernameInput.value = data.wpcUsername;
    renderTemplates(data.qtTemplates || {});
  });

  document.getElementById('q-save').addEventListener('click', () => {
    chrome.storage.local.set({ wpcUsername: usernameInput.value });
    const btn = document.getElementById('q-save');
    btn.style.color = 'var(--green)';
    setTimeout(() => (btn.style.color = ''), 1000);
  });

  document.getElementById('q-clear').addEventListener('click', () => {
    usernameInput.value = '';
    chrome.storage.local.remove('wpcUsername');
  });
}

// Chamado pelo settings após salvar templates — re-renderiza com os novos textos
export function refresh() {
  chrome.storage.local.get(['qtTemplates'], data => {
    renderTemplates(data.qtTemplates || {});
  });
}

function renderTemplates(overrides) {
  const container = document.getElementById('q-templates');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(TEMPLATES).forEach(([section, items]) => {
    const titleEl = document.createElement('div');
    titleEl.className = 'qt-section-title';
    titleEl.textContent = SECTION_LABELS[section] || section;
    container.appendChild(titleEl);

    items.forEach(item => {
      const templateText = overrides[item.id] ?? item.template;
      const isRejected   = item.id.includes('rejected') || item.id.includes('fail');
      const btn = document.createElement('div');
      btn.className = `qt-btn ${section}${isRejected ? ' rejected' : ''}`;
      btn.innerHTML = `
        ${item.label}
        <span class="qt-copy-icon">
          <svg viewBox="0 0 24 24" width="13" height="13">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16h13c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
          </svg>
        </span>
        <span class="qt-check">✔</span>
      `;
      btn.addEventListener('click', () => copyTemplate(btn, templateText));
      container.appendChild(btn);
    });
  });
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    if (!document.execCommand('copy')) throw new Error('execCommand copy failed');
  } finally {
    document.body.removeChild(ta);
  }
}

function copyTemplate(btn, template) {
  chrome.storage.local.get(['wpcUsername'], async data => {
    const text = template.replace(/{user_name}/g, data.wpcUsername || 'QAer');
    try {
      await copyToClipboard(text);
      const check = btn.querySelector('.qt-check');
      const icon  = btn.querySelector('.qt-copy-icon');
      check.style.display = 'block';
      icon.style.display  = 'none';
      setTimeout(() => window.close(), 1000);
    } catch (err) {
      console.error('[quicktext] clipboard failed:', err);
      btn.querySelector('.qt-copy-icon').style.opacity = '1';
    }
  });
}

export function run() {}
