import { init as initProfile }       from './modules/profile.js';
import { init as initReport }        from './modules/report.js';
import { init as initChecklist }     from './modules/checklist.js';
import { init as initQuicktext }     from './modules/quicktext.js';
import { init as initSnapslide }     from './modules/snapslide.js';
import { init as initCountryscan }   from './modules/countryscan.js';
import { init as initScreenshot }    from './modules/screenshot.js';
import { init as initOverflow }      from './modules/text-overflow.js';
import { init as initCta }           from './modules/cta-audit.js';
import { init as initPageToImage }   from './modules/page-to-image.js';
import { init as initSettings }      from './modules/settings.js';
import { init as initCookieCleaner } from './modules/cookie-cleaner.js';
import { init as initAemAuthor }     from './modules/aem-author.js';
import { init as initAemPim }        from './modules/aem-pim.js';
import { init as initWordMarkdown }  from './modules/word-to-markdown.js';
import { init as initSeo }           from './modules/seo.js';
import { init as initVideoCheck }    from './modules/video-check.js';
import { init as initBulkScreenshot } from './modules/bulk-screenshot.js';
import { showToast as _showToast } from './lib/toast.js';

// ── Toast (re-exported for external callers) ─────────────
export function showToast(msg, duration = 2000) { _showToast(msg, duration); }

// ── Reporting lock ────────────────────────────────────────
const REPORTING_HASHES = [
  '2578fdf7282ac05188d716cca5ab1c2709d1836a5d06004c541a05cffe9c1688', // 2pac
  'a1d4b898884c0ef0f0cd31767b87e95b4fc99c521b8211074d52c1fac01f1ac0', // WPCBR
];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkReportingLock() {
  document.getElementById('lock-error').textContent = '';
  chrome.storage.local.get('reportingUnlocked', ({ reportingUnlocked }) => {
    if (!reportingUnlocked) {
      document.getElementById('group-reporting').classList.add('locked');
      setTimeout(() => document.getElementById('lock-input').focus(), 50);
    }
  });
}

async function tryUnlock() {
  const val = document.getElementById('lock-input').value.trim();
  if (!val) return;
  const hash = await sha256(val);
  if (REPORTING_HASHES.includes(hash)) {
    chrome.storage.local.set({ reportingUnlocked: true });
    document.getElementById('group-reporting').classList.remove('locked');
    document.getElementById('settings-panel').classList.remove('settings-locked');
    document.getElementById('lock-input').value = '';
    document.getElementById('lock-error').textContent = '';
  } else {
    document.getElementById('lock-error').textContent = 'Incorrect password';
    const card = document.querySelector('.lock-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    document.getElementById('lock-input').select();
  }
}

document.getElementById('lock-submit').addEventListener('click', tryUnlock);
document.getElementById('lock-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') tryUnlock();
});

// ── Main group switching ──────────────────────────────────
document.querySelectorAll('.main-tab').forEach(mainTab => {
  mainTab.addEventListener('click', () => {
    document.querySelectorAll('.main-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-group').forEach(g => g.classList.remove('active'));
    mainTab.classList.add('active');
    mainTab.setAttribute('aria-selected', 'true');
    document.getElementById(`group-${mainTab.dataset.group}`).classList.add('active');
    document.documentElement.scrollTop = 0;

    // Settings gear só aparece na aba Reporting
    document.body.classList.toggle('group-reporting', mainTab.dataset.group === 'reporting');

    if (mainTab.dataset.group === 'reporting') checkReportingLock();
  });
});

// ── Sub-tab navigation (scoped to each group) ────────────
const tabScrollPos = {};

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Mobile View: open Viewfast side panel and close popup
    if (tab.dataset.tab === 'viewfast' || tab.dataset.tab === 'prod-viewfast') {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
        if (t) chrome.sidePanel.open({ windowId: t.windowId });
      });
      window.close();
      return;
    }

    const group = tab.closest('.tab-group');

    // Save scroll position of the panel being left
    const leaving = group.querySelector('.tab-panel.active');
    if (leaving) tabScrollPos[leaving.id] = document.documentElement.scrollTop;

    group.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

    // Restore scroll position for the panel being entered
    const newId = `tab-${tab.dataset.tab}`;
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = tabScrollPos[newId] || 0;
    });
  });
});

// ── Theme toggle ─────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');

chrome.storage.local.get(['theme', 'easterTricolor'], ({ theme, easterTricolor }) => {
  if (easterTricolor) {
    document.documentElement.setAttribute('data-theme', 'easter-tricolor');
    const logo = document.querySelector('.logo');
    logo.innerHTML = '';
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/tricolor.jpg');
    img.style.cssText = 'width:30px;height:30px;object-fit:cover;display:block;';
    logo.appendChild(img);
    logo.style.background   = 'transparent';
    logo.style.borderRadius = '7px';
    logo.style.boxShadow    = 'none';
    logo.style.overflow     = 'hidden';
    logo.style.padding      = '0';
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
});

themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    chrome.storage.local.set({ theme: 'dark' });
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    chrome.storage.local.set({ theme: 'light' });
  }
});

// ── Activate default group (Reporting) on open ───────────
{
  const defaultTab = document.querySelector('.main-tab[data-group="reporting"]');
  defaultTab.classList.add('active');
  defaultTab.setAttribute('aria-selected', 'true');
  document.getElementById('group-reporting').classList.add('active');
  document.body.classList.add('group-reporting');
  checkReportingLock();
}

// ── Easter Egg — triple-click logo → Timão ───────────────
{
  const LOGO = document.querySelector('.logo');
  const SVG_URL = chrome.runtime.getURL('icons/brazil_corinthians.football-logos.cc.svg');
  const ORIG_HTML = LOGO.innerHTML;
  let clicks = 0;
  let timer = null;
  let active = false;

  LOGO.style.cursor = 'pointer';
  LOGO.addEventListener('click', (e) => {
    e.stopPropagation();
    clicks++;
    clearTimeout(timer);
    if (clicks >= 3) { clicks = 0; _toggle(); return; }
    timer = setTimeout(() => { clicks = 0; }, 600);
  });

  function _toggle() {
    active = !active;
    _applyTimao(active);
  }

  async function _applyTimao(on) {
    active = on;
    if (on) {
      document.documentElement.setAttribute('data-theme', 'easter-timao');
      try {
        const res = await fetch(SVG_URL);
        const text = await res.text();
        const doc  = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg  = doc.querySelector('svg');
        svg.setAttribute('width', '30');
        svg.setAttribute('height', '30');
        LOGO.innerHTML = '';
        LOGO.appendChild(document.importNode(svg, true));
        LOGO.style.background   = 'transparent';
        LOGO.style.borderRadius = '0';
        LOGO.style.boxShadow    = 'none';
      } catch (e) { console.warn('[Easter] SVG load failed', e); }
    } else {
      chrome.storage.local.get('theme', ({ theme }) => {
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
      });
      LOGO.innerHTML          = ORIG_HTML;
      LOGO.style.background   = '';
      LOGO.style.borderRadius = '';
      LOGO.style.boxShadow    = '';
    }
  }
}

// ── Easter Egg — Tricolor (Rosa Neon) ────────────────────
{
  const TRIGGER   = document.getElementById('settings-title-icon');
  const LOGO      = document.querySelector('.logo');
  const IMG_URL   = chrome.runtime.getURL('icons/tricolor.jpg');
  const ORIG_HTML = LOGO.innerHTML;
  let clicks = 0;
  let timer  = null;
  let active = false;

  // Sincroniza estado com storage ao abrir o popup
  chrome.storage.local.get('easterTricolor', ({ easterTricolor }) => {
    if (easterTricolor) active = true;
  });

  TRIGGER.addEventListener('click', (e) => {
    e.stopPropagation();
    clicks++;
    clearTimeout(timer);
    const needed  = active ? 10 : 3;
    const timeout = active ? 1500 : 600;
    if (clicks >= needed) { clicks = 0; _toggle(); return; }
    timer = setTimeout(() => { clicks = 0; }, timeout);
  });

  function _toggle() {
    active = !active;
    _applyTricolor(active);
  }

  function _applyTricolor(on) {
    if (on) {
      chrome.storage.local.set({ easterTricolor: true });
      document.documentElement.setAttribute('data-theme', 'easter-tricolor');
      LOGO.innerHTML = '';
      const img = document.createElement('img');
      img.src = IMG_URL;
      img.style.cssText = 'width:30px;height:30px;object-fit:cover;display:block;';
      LOGO.appendChild(img);
      LOGO.style.background   = 'transparent';
      LOGO.style.borderRadius = '7px';
      LOGO.style.boxShadow    = 'none';
      LOGO.style.overflow     = 'hidden';
      LOGO.style.padding      = '0';
    } else {
      chrome.storage.local.remove('easterTricolor');
      chrome.storage.local.get('theme', ({ theme }) => {
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
      });
      LOGO.innerHTML          = ORIG_HTML;
      LOGO.style.background   = '';
      LOGO.style.borderRadius = '';
      LOGO.style.boxShadow    = '';
      LOGO.style.overflow     = '';
      LOGO.style.padding      = '';
    }
  }
}

// ── Initialize all modules ───────────────────────────────
const _modules = [
  ['Profile',      initProfile],
  ['Settings',     initSettings],
  ['Report',       initReport],
  ['Checklist',    initChecklist],
  ['Quicktext',    initQuicktext],
  ['Snapslide',    initSnapslide],
  ['Countryscan',  initCountryscan],
  ['Screenshot',   initScreenshot],
  ['TextOverflow', initOverflow],
  ['CtaAudit',     initCta],
  ['PageToImage',    initPageToImage],
  ['CookieCleaner',  initCookieCleaner],
  ['AemAuthor',      initAemAuthor],
  ['AemPim',         initAemPim],
  ['WordMarkdown',   initWordMarkdown],
  ['Seo',            initSeo],
  ['VideoCheck',     initVideoCheck],
  ['BulkScreenshot', initBulkScreenshot],
];

for (const [name, fn] of _modules) {
  try { fn(); }
  catch (err) { console.error(`[WPC Hub] ${name} init failed:`, err); }
}

// ── Documentation link ────────────────────────────────────
document.getElementById('open-docs-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('docs.html') });
});
