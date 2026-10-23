import { scrollToElement } from '../lib/scroll-to.js';

let lastTabId           = null;
let lastCtaResults      = { empty: [], noLink: [], spacedUrl: [] };
let lastLinkViolations  = [];
let lastLinkSummary     = { total: 0, samsung: 0, external: 0, violations: 0 };
let ctaHighlightsActive = false;
let lnkHighlightsActive = false;

// Check My Links state
let clLastTabId       = null;
let clHighlightActive = false;
let clPollInterval    = null;

export function init() {
  document.getElementById('ca-scan').addEventListener('click', runAudit);
  document.getElementById('ca-highlight').addEventListener('click', toggleHighlights);
  document.getElementById('ca-clear').addEventListener('click', clearHighlights);
  document.getElementById('ca-copy').addEventListener('click', copyReport);
  initCheckLinks();

  document.querySelectorAll('.audit-acc-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = document.getElementById(btn.dataset.target);
      btn.classList.toggle('open');
      body.classList.toggle('open');
    });
  });
}

// ── Scan ─────────────────────────────────────────────────
async function runAudit() {
  const btn = document.getElementById('ca-scan');
  btn.disabled = true;
  setStatus('Scanning…');
  hideResults();
  hideClProgress();
  ctaHighlightsActive = false;
  lnkHighlightsActive = false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to scan.');
    lastTabId = tab.id;
    lastCtaResults     = { empty: [], noLink: [], spacedUrl: [] };
    lastLinkViolations = [];
    lastLinkSummary    = { total: 0, samsung: 0, external: 0, violations: 0 };

    const [ctaRes, lnkRes] = await Promise.all([
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: auditCtasFn }),
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scanLinksFn }),
    ]);

    if (!ctaRes?.[0]?.result) throw new Error('Could not scan CTAs. Try reloading the page.');
    if (!lnkRes?.[0]?.result) throw new Error('Could not scan links. Try reloading the page.');

    lastCtaResults     = ctaRes[0].result;
    lastLinkSummary    = lnkRes[0].result.summary;
    lastLinkViolations = lnkRes[0].result.violations;

    setStatus('Checking links…');
    // Results appear only after HTTP check completes
    runCheckLinks().catch(() => { setStatus(''); btn.disabled = false; });
  } catch (err) {
    setStatus('Error: ' + err.message);
    btn.disabled = false;
  }
}

// ── Highlight toggle ─────────────────────────────────────
async function toggleHighlights() {
  const ctaSelectors = [
    ...lastCtaResults.empty.map(v => v.selector),
    ...lastCtaResults.noLink.map(v => v.selector),
    ...lastCtaResults.spacedUrl.map(v => v.selector),
  ];
  const lnkSelectors = lastLinkViolations.map(v => v.selector);
  if (!lastTabId || (!ctaSelectors.length && !lnkSelectors.length)) return;

  const btn = document.getElementById('ca-highlight');
  const isActive = ctaHighlightsActive || lnkHighlightsActive;

  if (isActive) {
    await Promise.all([
      chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearCtaHighlightsFn }),
      chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearLinkHighlightsFn }),
    ]);
    btn.textContent = 'Highlight All';
    ctaHighlightsActive = false;
    lnkHighlightsActive = false;
  } else {
    const tasks = [];
    if (ctaSelectors.length) tasks.push(
      chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: highlightCtasFn, args: [ctaSelectors] })
    );
    if (lnkSelectors.length) tasks.push(
      chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: highlightLinksFn, args: [lnkSelectors] })
    );
    await Promise.all(tasks);
    btn.textContent = '✕ Clear highlights';
    ctaHighlightsActive = ctaSelectors.length > 0;
    lnkHighlightsActive = lnkSelectors.length > 0;
  }
}

async function clearHighlights() {
  if (!lastTabId) return;
  await Promise.all([
    chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearCtaHighlightsFn }),
    chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearLinkHighlightsFn }),
  ]);
  document.getElementById('ca-highlight').textContent = 'Highlight All';
  ctaHighlightsActive = false;
  lnkHighlightsActive = false;
}

// ── Copy report ──────────────────────────────────────────
async function copyReport() {
  const lines = [];

  lines.push('── CTA AUDIT ──');
  const ctaSections = [
    { label: 'Empty CTAs (no accessible name)', items: lastCtaResults.empty },
    { label: 'CTAs without link (no href)',     items: lastCtaResults.noLink },
    { label: 'URLs with spaces',                items: lastCtaResults.spacedUrl },
  ];
  const totalCta = lastCtaResults.empty.length + lastCtaResults.noLink.length + lastCtaResults.spacedUrl.length;
  if (!totalCta) {
    lines.push('No CTA violations found.');
  } else {
    ctaSections.forEach(({ label, items }) => {
      if (!items.length) return;
      lines.push(`\n## ${label}`);
      items.forEach(v => lines.push(`• <${v.tag}>: ${v.text || '(no text)'}  href: "${v.href}"  |  ${v.selector}`));
    });
  }

  lines.push('\n── LINK AUDIT ──');
  if (!lastLinkViolations.length) {
    lines.push('No link violations found.');
  } else {
    lastLinkViolations.forEach(v => lines.push(
      `[${v.type}] ${v.text || '(no text)'}\n  href: ${v.href}\n  target: ${v.targetActual} → expected: ${v.targetExpected}\n  selector: ${v.selector}`
    ));
  }

  const data = await chrome.storage.local.get('checkLinks');
  const task = data.checkLinks;
  if (task?.status === 'done') {
    lines.push('\n── CHECK MY LINKS ──');
    if (!task.results.length) {
      lines.push('All links OK.');
    } else {
      task.results.forEach(r => {
        lines.push(`[${r.type.toUpperCase()}] ${r.url}`);
        if (r.finalUrl && r.finalUrl !== r.url) lines.push(`  → ${r.finalUrl}`);
        if (r.selector) lines.push(`  ${r.selector}`);
      });
    }
  } else if (task?.status === 'running') {
    lines.push('\n── CHECK MY LINKS ──');
    lines.push(`Scan in progress (${task.progress?.done ?? 0} / ${task.progress?.total ?? 0})…`);
  }

  navigator.clipboard.writeText('CTA & Link Audit Report\n\n' + lines.join('\n'));
}

// ── Render all results (called when HTTP check completes) ─
function renderAllResults(task) {
  const ctaResults  = task.ctaResults  || { empty: [], noLink: [], spacedUrl: [] };
  const violations  = task.linkViolations || [];
  const httpResults = task.results || [];

  const ctaCount  = ctaResults.empty.length + ctaResults.noLink.length + ctaResults.spacedUrl.length;
  const linkCount = violations.length;
  const httpCount = httpResults.length;

  setAccBadge('ca-cta-badge', ctaCount);
  renderCtaList(ctaResults);
  setAccordionOpen('ca-cta-body', ctaCount > 0);

  setAccBadge('ca-link-badge', linkCount);
  renderLinkList(violations);
  setAccordionOpen('ca-link-body', linkCount > 0);

  setAccBadge('cl-badge', httpCount);
  renderHttpList(httpResults);
  setAccordionOpen('cl-body', httpCount > 0);
}

function setAccBadge(id, count) {
  const el = document.getElementById(id);
  el.textContent = count;
  el.className = `audit-counter-badge ${count > 0 ? 'danger' : 'ok'}`;
}

function setAccordionOpen(bodyId, open) {
  const body   = document.getElementById(bodyId);
  const header = body.previousElementSibling;
  body.classList.toggle('open', open);
  header.classList.toggle('open', open);
}

function renderCtaList({ empty, noLink, spacedUrl }) {
  const list = document.getElementById('ca-cta-list');
  list.innerHTML = '';

  if (!empty.length && !noLink.length && !spacedUrl.length) {
    list.innerHTML = '<div class="audit-item"><div class="audit-item-dot" style="background:var(--green)"></div><div class="audit-item-body" style="color:var(--green)">No CTA violations found.</div></div>';
    return;
  }

  const sections = [
    { label: 'Empty CTA',     color: 'var(--red)',   items: empty },
    { label: 'No link',       color: 'var(--red)',   items: noLink },
    { label: 'URL w/ spaces', color: 'var(--amber)', items: spacedUrl },
  ];
  sections.forEach(({ label, color, items }) => {
    items.forEach(v => {
      const item = document.createElement('div');
      item.className = 'audit-item violation';
      const display = (v.text || v.href || '').slice(0, 55);
      item.innerHTML = `
        <div class="audit-item-dot" style="background:${color}"></div>
        <div class="audit-item-body">
          <span class="tag" style="background:${color}20;color:${color};border-color:${color}40">${label}</span>
          <strong>&lt;${v.tag}&gt;</strong>${display ? ` "${display}"` : ''}<br>
          ${v.href ? `<span class="dim">href: "${v.href.slice(0, 60)}"</span><br>` : ''}
          <span class="dim" style="font-size:8px">${v.selector}</span>
        </div>
      `;
      list.appendChild(item);
    });
  });
}

function renderLinkList(linkViolations) {
  const list = document.getElementById('ca-link-list');
  list.innerHTML = '';

  if (!linkViolations.length) {
    list.innerHTML = '<div class="audit-item"><div class="audit-item-dot" style="background:var(--green)"></div><div class="audit-item-body" style="color:var(--green)">No link violations found.</div></div>';
    return;
  }

  linkViolations.forEach(v => {
    const item = document.createElement('div');
    item.className = 'audit-item violation';
    item.style.cursor = 'pointer';
    item.title = 'Click to scroll to this element on the page';

    const badgeColor = v.type === 'samsung-opens-new-tab' ? 'var(--amber)' : 'var(--red)';
    const typeLabel  = v.type === 'samsung-opens-new-tab' ? 'samsung → new tab' : 'external → same tab';
    const text = v.text ? v.text.slice(0, 50) + (v.text.length > 50 ? '…' : '') : '(no text)';
    const href = v.href.length > 55 ? '…' + v.href.slice(-52) : v.href;

    item.innerHTML = `
      <div class="audit-item-dot" style="background:${badgeColor}"></div>
      <div class="audit-item-body">
        <span class="tag" style="background:${badgeColor}20;color:${badgeColor};border-color:${badgeColor}40">${typeLabel}</span>
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

function renderHttpList(results) {
  const list = document.getElementById('cl-list');
  list.innerHTML = '';

  if (!results.length) {
    list.innerHTML = '<div class="audit-item"><div class="audit-item-dot" style="background:var(--green)"></div><div class="audit-item-body" style="color:var(--green)">All links are OK ✓</div></div>';
    return;
  }

  const typeConfig = {
    '404':          { label: '404 Not Found',       color: 'var(--red)' },
    'blank':        { label: 'Blank page',          color: 'var(--amber-400, #fbbf24)' },
    'geo-redirect': { label: 'Geographic redirect', color: 'var(--violet-400, #a78bfa)' },
    'timeout':      { label: 'Timeout (5s)',         color: 'var(--rose-400, #fb7185)' },
    'error':        { label: 'Connection error',    color: 'var(--red)' },
  };

  results.forEach(r => {
    const cfg = typeConfig[r.type] || { label: r.type, color: 'var(--red)' };
    const shortUrl = r.url.length > 58 ? r.url.slice(0, 55) + '…' : r.url;
    const finalUrlLine = r.finalUrl && r.finalUrl !== r.url
      ? `<span class="dim" style="font-size:10px">→ ${r.finalUrl.slice(0, 55)}…</span><br>`
      : '';

    const item = document.createElement('div');
    item.className = 'audit-item violation';
    item.innerHTML = `
      <div class="audit-item-dot" style="background:${cfg.color}"></div>
      <div class="audit-item-body">
        <span class="tag" style="background:${cfg.color}20;color:${cfg.color};border-color:${cfg.color}40">${cfg.label}</span>
        <span class="dim" style="word-break:break-all;font-size:11px">${shortUrl}</span><br>
        ${finalUrlLine}
        <span class="dim" style="font-size:8px">${r.selector || ''}</span>
      </div>
      <button class="audit-item-goto" title="Scroll to element on page">
        <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
          <circle cx="6" cy="6" r="3.5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    item.querySelector('.audit-item-goto').addEventListener('click', e => {
      e.stopPropagation();
      if (clLastTabId && r.selector) scrollToElement(clLastTabId, r.selector);
    });
    list.appendChild(item);
  });
}

// ── UI helpers ───────────────────────────────────────────
function setStatus(msg) {
  const el = document.getElementById('ca-status');
  if (msg) {
    el.style.display = 'flex';
    el.innerHTML = `<div class="audit-spinner"></div><span>${msg}</span>`;
  } else {
    el.style.display = 'none';
  }
}
function showResults() { document.getElementById('ca-results').style.display = ''; }
function hideResults() { document.getElementById('ca-results').style.display = 'none'; }

// ── Page-context: CTA audit ───────────────────────────────
function auditCtasFn() {
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

  function isVisible(el) {
    const s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  function hasAccessibleName(el) {
    if ((el.innerText || '').trim()) return true;
    if ((el.getAttribute('aria-label') || '').trim()) return true;
    if ((el.getAttribute('title') || '').trim()) return true;
    return [...el.querySelectorAll('img')].some(img => (img.getAttribute('alt') || '').trim());
  }

  const empty = [], noLink = [], spacedUrl = [];

  document.querySelectorAll('a, button').forEach(el => {
    if (!isVisible(el)) return;
    const tag  = el.tagName.toLowerCase();
    const href = el.getAttribute('href');
    const sel  = getCssSelector(el);
    const text = (el.innerText || '').trim().slice(0, 60);

    if (tag === 'a') {
      if (el.hasAttribute('name') && href === null) return;
      if (href === null || href === '') { noLink.push({ tag, text: text || '(no text)', href: href ?? '', selector: sel }); return; }
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (!hasAccessibleName(el)) empty.push({ tag, text: '', href, selector: sel });
      if (href.includes(' ')) spacedUrl.push({ tag, text, href, selector: sel });
    } else if (tag === 'button') {
      if (!hasAccessibleName(el)) empty.push({ tag, text: '', href: '', selector: sel });
    }
  });

  return { empty, noLink, spacedUrl };
}

function highlightCtasFn(selectors) {
  document.getElementById('wpc-cta-style')?.remove();
  const st = document.createElement('style');
  st.id = 'wpc-cta-style';
  st.textContent = `[data-wpc-cta]{outline:3px solid #FFB547!important;outline-offset:2px!important}`;
  document.head.appendChild(st);
  selectors.forEach(sel => { try { document.querySelector(sel)?.setAttribute('data-wpc-cta', '1'); } catch (_) {} });
}

function clearCtaHighlightsFn() {
  document.querySelectorAll('[data-wpc-cta]').forEach(el => el.removeAttribute('data-wpc-cta'));
  document.getElementById('wpc-cta-style')?.remove();
}

// ── Page-context: Link audit ──────────────────────────────
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

  const SAME_TAB_HOSTS = new Set(['www.samsung.com', 'p6-qa.samsung.com']);
  function isSamsungHost(hostname) { return SAME_TAB_HOSTS.has(hostname); }

  const summary    = { total: 0, samsung: 0, external: 0, violations: 0 };
  const violations = [];

  document.querySelectorAll('a[href]').forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    summary.total++;
    const target = el.getAttribute('target') || '_self';
    let samsung = false;
    try { samsung = isSamsungHost(new URL(href, location.href).hostname); } catch (_) { return; }

    if (samsung) {
      summary.samsung++;
      if (target === '_blank') {
        summary.violations++;
        violations.push({ href, selector: getCssSelector(el), text: el.innerText?.trim().slice(0, 60) || '', targetActual: '_blank', targetExpected: '_self', type: 'samsung-opens-new-tab' });
      }
    } else {
      summary.external++;
      if (target !== '_blank') {
        summary.violations++;
        violations.push({ href, selector: getCssSelector(el), text: el.innerText?.trim().slice(0, 60) || '', targetActual: target, targetExpected: '_blank', type: 'external-opens-same-tab' });
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
    [data-wpc-link]{outline:3px solid #FF5E5E!important;outline-offset:2px!important;animation:wpc-link-pulse 1.8s ease-in-out infinite!important}
    @keyframes wpc-link-pulse{0%{box-shadow:0 0 0 2px rgba(255,94,94,.8)}50%{box-shadow:0 0 0 6px rgba(255,94,94,.2)}100%{box-shadow:0 0 0 2px rgba(255,94,94,.8)}}
  `;
  document.head.appendChild(st);
  selectors.forEach(sel => { try { const el = document.querySelector(sel); if (el) el.setAttribute('data-wpc-link', '1'); } catch (_) {} });
}

function clearLinkHighlightsFn() {
  document.querySelectorAll('[data-wpc-link]').forEach(el => el.removeAttribute('data-wpc-link'));
  document.getElementById('wpc-link-style')?.remove();
}

// ══════════════════════════════════════════════════════════
// CHECK MY LINKS
// ══════════════════════════════════════════════════════════

function initCheckLinks() {
  document.getElementById('cl-highlight').addEventListener('click', toggleClHighlights);
  document.getElementById('cl-clear-hl').addEventListener('click', clearClHighlights);
  document.getElementById('cl-reset').addEventListener('click', resetCheckLinks);

  // Restore state if a task is already running or completed
  chrome.storage.local.get('checkLinks').then(data => {
    const task = data.checkLinks;
    if (!task) return;
    clLastTabId = task.tabId;
    if (task.status === 'running') {
      document.getElementById('ca-scan').disabled = true;
      showClProgress(task.progress);
      startClPolling();
    } else if (task.status === 'done') {
      chrome.action.setBadgeText({ text: '' });
      lastCtaResults     = task.ctaResults    || lastCtaResults;
      lastLinkViolations = task.linkViolations || lastLinkViolations;
      lastLinkSummary    = task.linkSummary    || lastLinkSummary;
      lastTabId = clLastTabId = task.tabId;
      renderAllResults(task);
      showResults();
    }
  });
}

// ── Run (triggered from runAudit, not a button) ───────────
async function runCheckLinks() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { document.getElementById('ca-scan').disabled = false; return; }
    clLastTabId = tab.id;

    const [{ result: links }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractLinksFn,
    });

    if (!links?.length) {
      // No links to HTTP-check — show results immediately
      renderAllResults({
        ctaResults: lastCtaResults, linkViolations: lastLinkViolations,
        linkSummary: lastLinkSummary, results: [], summary: { total: 0, ok: 0, errors: 0 }
      });
      setStatus('');
      showResults();
      document.getElementById('ca-scan').disabled = false;
      return;
    }

    setStatus('');
    showClProgress({ done: 0, total: links.length });

    chrome.runtime.sendMessage({
      action: 'startCheckLinks', links, tabId: tab.id, tabUrl: tab.url,
      ctaResults: lastCtaResults, linkViolations: lastLinkViolations, linkSummary: lastLinkSummary,
    });
    startClPolling();
  } catch (err) {
    setStatus('HTTP check error: ' + err.message);
    document.getElementById('ca-scan').disabled = false;
  }
}

// ── Polling (while popup is open) ─────────────────────────
function startClPolling() {
  if (clPollInterval) return;
  clPollInterval = setInterval(async () => {
    const data = await chrome.storage.local.get('checkLinks');
    const task = data.checkLinks;
    if (!task) { stopClPolling(); return; }

    if (task.status === 'running') {
      showClProgress(task.progress);
    } else if (task.status === 'done') {
      stopClPolling();
      chrome.action.setBadgeText({ text: '' });
      hideClProgress();
      lastCtaResults     = task.ctaResults    || lastCtaResults;
      lastLinkViolations = task.linkViolations || lastLinkViolations;
      lastLinkSummary    = task.linkSummary    || lastLinkSummary;
      lastTabId = clLastTabId = task.tabId;
      renderAllResults(task);
      showResults();
    } else if (task.status === 'error') {
      stopClPolling();
      setStatus('HTTP check failed. Please try again.');
    }
  }, 1500);
}

function stopClPolling() {
  clearInterval(clPollInterval);
  clPollInterval = null;
  document.getElementById('ca-scan').disabled = false;
}

// ── Highlight ─────────────────────────────────────────────
async function toggleClHighlights() {
  if (!clLastTabId) return;
  const data = await chrome.storage.local.get('checkLinks');
  const results = data.checkLinks?.results || [];
  if (!results.length) return;

  const btn = document.getElementById('cl-highlight');
  if (clHighlightActive) {
    await chrome.scripting.executeScript({ target: { tabId: clLastTabId }, func: clearClHighlightsFn });
    btn.textContent = 'Highlight Errors';
    clHighlightActive = false;
  } else {
    const selectors = results.map(r => r.selector).filter(Boolean);
    await chrome.scripting.executeScript({ target: { tabId: clLastTabId }, func: applyClHighlightsFn, args: [selectors] });
    btn.textContent = '✕ Clear highlights';
    clHighlightActive = true;
  }
}

async function clearClHighlights() {
  if (!clLastTabId) return;
  await chrome.scripting.executeScript({ target: { tabId: clLastTabId }, func: clearClHighlightsFn });
  document.getElementById('cl-highlight').textContent = 'Highlight Errors';
  clHighlightActive = false;
}

// ── Reset ─────────────────────────────────────────────────
async function resetCheckLinks() {
  stopClPolling();
  await chrome.storage.local.remove('checkLinks');
  chrome.action.setBadgeText({ text: '' });
  clHighlightActive = false;
  clLastTabId = null;
  lastCtaResults     = { empty: [], noLink: [], spacedUrl: [] };
  lastLinkViolations = [];
  lastLinkSummary    = { total: 0, samsung: 0, external: 0, violations: 0 };
  hideClProgress();
  hideResults();
}

// ── UI helpers ────────────────────────────────────────────
function showClProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('cl-progress').style.display = '';
  document.getElementById('cl-progress-fill').style.width = pct + '%';
  document.getElementById('cl-progress-text').textContent = `${done} / ${total} links checked`;
}

function hideClProgress() { document.getElementById('cl-progress').style.display = 'none'; }

// ── Page-context: extract links ───────────────────────────
function extractLinksFn() {
  function getCssSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let node = el;
    for (let i = 0; i < 5 && node && node !== document.body; i++) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const tag = node.tagName.toLowerCase();
      const sibs = node.parentElement
        ? Array.from(node.parentElement.children).filter(c => c.tagName === node.tagName)
        : [];
      parts.unshift(sibs.length > 1 ? `${tag}:nth-of-type(${sibs.indexOf(node) + 1})` : tag);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  const seen = new Set();
  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (!href || seen.has(href)) return;
    if (/^(javascript:|mailto:|tel:|#|data:)/.test(href)) return;
    try { new URL(href); } catch { return; }
    seen.add(href);
    links.push({ url: href, selector: getCssSelector(a) });
  });
  return links;
}

// ── Page-context: highlight broken links ──────────────────
function applyClHighlightsFn(selectors) {
  document.getElementById('wpc-cl-style')?.remove();
  const st = document.createElement('style');
  st.id = 'wpc-cl-style';
  st.textContent = `
    [data-wpc-cl]{outline:3px solid #e74c3c!important;outline-offset:2px!important;animation:wpc-cl-pulse 1.8s ease-in-out infinite!important}
    @keyframes wpc-cl-pulse{0%{box-shadow:0 0 0 2px rgba(231,76,60,.8)}50%{box-shadow:0 0 0 7px rgba(231,76,60,.15)}100%{box-shadow:0 0 0 2px rgba(231,76,60,.8)}}
  `;
  document.head.appendChild(st);
  selectors.forEach(sel => { try { document.querySelector(sel)?.setAttribute('data-wpc-cl', '1'); } catch {} });
}

function clearClHighlightsFn() {
  document.querySelectorAll('[data-wpc-cl]').forEach(el => el.removeAttribute('data-wpc-cl'));
  document.getElementById('wpc-cl-style')?.remove();
}

export function run() {}
