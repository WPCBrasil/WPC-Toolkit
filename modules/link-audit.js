import { scrollToElement, scrollToSelectorFn } from '../lib/scroll-to.js';

let lastTabId        = null;
let lastViolations   = [];
let highlightsActive = false;

export function init() {
  document.getElementById('la-scan').addEventListener('click', runAudit);
  document.getElementById('la-highlight').addEventListener('click', toggleHighlights);
  document.getElementById('la-clear').addEventListener('click', clearHighlights);
  document.getElementById('la-copy').addEventListener('click', copyReport);
}

// ── Scan ─────────────────────────────────────────────────
async function runAudit() {
  const btn = document.getElementById('la-scan');
  btn.disabled = true;
  setStatus('Scanning links…');
  hideResults();
  highlightsActive = false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to scan.');
    lastTabId = tab.id;
    lastViolations = [];

    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanLinksFn,
    });
    if (!res?.result) throw new Error('Could not scan page. Try reloading it.');
    const { summary, violations } = res.result;
    lastViolations = violations;

    renderSummary(summary);
    renderList(violations);
    showResults();
    setStatus('');
  } catch (err) {
    setStatus('Erro: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Highlight toggle ─────────────────────────────────────
async function toggleHighlights() {
  if (!lastTabId || !lastViolations.length) return;
  const btn = document.getElementById('la-highlight');

  if (highlightsActive) {
    await chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearLinkHighlightsFn });
    btn.textContent = 'Highlight';
    highlightsActive = false;
  } else {
    const selectors = lastViolations.map(v => v.selector);
    await chrome.scripting.executeScript({
      target: { tabId: lastTabId },
      func: highlightLinksFn,
      args: [selectors],
    });
    btn.textContent = '✕ Clear highlights';
    highlightsActive = true;
  }
}

async function clearHighlights() {
  if (!lastTabId) return;
  await chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearLinkHighlightsFn });
  document.getElementById('la-highlight').textContent = 'Highlight';
  highlightsActive = false;
}

// ── Copy report ──────────────────────────────────────────
function copyReport() {
  if (!lastViolations.length) return;
  const lines = lastViolations.map(v =>
    `[${v.type}] ${v.text || '(no text)'}\n  href: ${v.href}\n  target: ${v.targetActual} → expected: ${v.targetExpected}\n  selector: ${v.selector}`
  );
  navigator.clipboard.writeText('Link Audit — Violations\n\n' + lines.join('\n\n'));
}

// ── Render ───────────────────────────────────────────────
function renderSummary({ total, samsung, external, violations }) {
  const el = document.getElementById('la-summary');
  const vColor = violations > 0 ? 'danger' : 'ok';
  el.innerHTML = `
    <div class="audit-stat"><div class="audit-stat-label">Total</div><div class="audit-stat-value">${total}</div></div>
    <div class="audit-stat"><div class="audit-stat-label">Samsung</div><div class="audit-stat-value">${samsung}</div></div>
    <div class="audit-stat"><div class="audit-stat-label">External</div><div class="audit-stat-value">${external}</div></div>
    <div class="audit-stat"><div class="audit-stat-label">Violations</div><div class="audit-stat-value ${vColor}">${violations}</div></div>
  `;
}

function renderList(violations) {
  const list = document.getElementById('la-list');
  list.innerHTML = '';

  if (!violations.length) {
    list.innerHTML = '<div class="audit-item"><div class="audit-item-dot" style="background:var(--green)"></div><div class="audit-item-body" style="color:var(--green)">No violations found.</div></div>';
    return;
  }

  violations.forEach(v => {
    const item = document.createElement('div');
    item.className = 'audit-item violation';
    item.style.cursor = 'pointer';
    item.title = 'Click to scroll to this element on the page';

    const badgeColor = v.type === 'samsung-opens-new-tab' ? 'var(--amber)' : 'var(--red)';
    const typeLabel  = v.type === 'samsung-opens-new-tab' ? 'samsung → new tab' : 'external → same tab';
    const text       = v.text ? v.text.slice(0, 50) + (v.text.length > 50 ? '…' : '') : '(no text)';
    const href       = v.href.length > 55 ? '…' + v.href.slice(-52) : v.href;

    item.innerHTML = `
      <div class="audit-item-dot" style="background:${badgeColor}"></div>
      <div class="audit-item-body">
        <span class="tag danger">${typeLabel}</span>
        <strong>${text}</strong><br>
        <span class="dim">${href}</span><br>
        <span class="dim">target: <strong>${v.targetActual || '_self'}</strong> → expected: <strong>${v.targetExpected}</strong></span><br>
        <span class="dim" style="font-size:8px">${v.selector}</span>
      </div>
      <button class="audit-item-goto" title="Scroll to element on page">
        <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
          <circle cx="6" cy="6" r="3.5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    item.addEventListener('click', () => scrollToElement(lastTabId, v.selector));
    list.appendChild(item);
  });
}

// ── UI helpers ───────────────────────────────────────────
function setStatus(msg) {
  const el = document.getElementById('la-status');
  if (msg) {
    el.style.display = 'flex';
    el.innerHTML = `<div class="audit-spinner"></div><span>${msg}</span>`;
  } else {
    el.style.display = 'none';
  }
}
function showResults()  { document.getElementById('la-results').style.display = ''; }
function hideResults()  { document.getElementById('la-results').style.display = 'none'; }

// ── Page-context functions ────────────────────────────────
function scanLinksFn() {
  function getCssSelector(el) {
    if (el.id) return '#' + el.id;
    const path = [];
    let node = el;
    while (node && node !== document.body && path.length < 5) {
      let seg = node.tagName.toLowerCase();
      if (node.id) { seg = '#' + node.id; path.unshift(seg); break; }
      const sibs = node.parentElement
        ? Array.from(node.parentElement.children).filter(c => c.tagName === node.tagName)
        : [];
      if (sibs.length > 1) seg += ':nth-of-type(' + (sibs.indexOf(node) + 1) + ')';
      path.unshift(seg);
      node = node.parentElement;
    }
    return path.join(' > ');
  }

  // Regra: apenas www.samsung.com e p6-qa.samsung.com abrem na mesma aba.
  // Todos os outros (incluindo shop.samsung.com) abrem em nova aba.
  const SAME_TAB_HOSTS = new Set(['www.samsung.com', 'p6-qa.samsung.com']);

  function isSamsungHost(hostname) {
    return SAME_TAB_HOSTS.has(hostname);
  }

  const summary    = { total: 0, samsung: 0, external: 0, violations: 0 };
  const violations = [];

  document.querySelectorAll('a[href]').forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    if (
      href.startsWith('#') || href.startsWith('javascript:') ||
      href.startsWith('mailto:') || href.startsWith('tel:')
    ) return;

    summary.total++;
    const target = el.getAttribute('target') || '_self';

    let samsung = false;
    try { samsung = isSamsungHost(new URL(href, location.href).hostname); }
    catch (_) { return; }

    if (samsung) {
      summary.samsung++;
      if (target === '_blank') {
        summary.violations++;
        violations.push({
          href, selector: getCssSelector(el),
          text: el.innerText?.trim().slice(0, 60) || '',
          targetActual: '_blank', targetExpected: '_self',
          type: 'samsung-opens-new-tab',
        });
      }
    } else {
      summary.external++;
      if (target !== '_blank') {
        summary.violations++;
        violations.push({
          href, selector: getCssSelector(el),
          text: el.innerText?.trim().slice(0, 60) || '',
          targetActual: target, targetExpected: '_blank',
          type: 'external-opens-same-tab',
        });
      }
    }
  });

  return { summary, violations };
}

function highlightLinksFn(selectors) {
  document.getElementById('wpc-link-style')?.remove();
  const st = document.createElement('style');
  st.id = 'wpc-link-style';
  st.textContent = `
    [data-wpc-link] {
      outline: 3px solid #FF5E5E !important;
      outline-offset: 2px !important;
      animation: wpc-link-pulse 1.8s ease-in-out infinite !important;
    }
    @keyframes wpc-link-pulse {
      0%   { box-shadow: 0 0 0 2px rgba(255,94,94,.8); }
      50%  { box-shadow: 0 0 0 6px rgba(255,94,94,.2); }
      100% { box-shadow: 0 0 0 2px rgba(255,94,94,.8); }
    }
  `;
  document.head.appendChild(st);
  selectors.forEach(sel => {
    try {
      const el = document.querySelector(sel);
      if (el) el.setAttribute('data-wpc-link', '1');
    } catch (_) {}
  });
}

function clearLinkHighlightsFn() {
  document.querySelectorAll('[data-wpc-link]').forEach(el => el.removeAttribute('data-wpc-link'));
  document.getElementById('wpc-link-style')?.remove();
}

export function run() {}
