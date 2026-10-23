let lastTabId        = null;
let lastIssues       = [];
let highlightsActive = false;
const dicCache       = {};

export function init() {
  document.getElementById('ov-scan').addEventListener('click', runScan);
  document.getElementById('ov-highlight').addEventListener('click', toggleHighlights);
  document.getElementById('ov-clear').addEventListener('click', clearHighlights);
  document.getElementById('ov-copy').addEventListener('click', copyReport);
}

// ── Scan ─────────────────────────────────────────────────
async function runScan() {
  const btn = document.getElementById('ov-scan');
  btn.disabled = true;
  setStatus('Scanning page…');
  hideResults();
  highlightsActive = false;
  document.getElementById('ov-highlight').textContent = 'Highlight All';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to scan.');
    lastTabId = tab.id;
    lastIssues = [];

    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanDomFn,
    });
    if (!res?.result) throw new Error('Could not scan page. Try reloading it.');
    const { lang, candidates } = res.result;

    if (!candidates.length) {
      lastIssues = [];
      renderSummary(0);
      renderList([]);
      showResults();
      setStatus('');
      return;
    }

    setStatus(`Loading dictionary for "${normalizeLang(lang)}"…`);

    const normalLang = normalizeLang(lang);
    const typo = await loadTypo(normalLang);

    setStatus(`Checking ${candidates.length} candidates…`);
    lastIssues = candidates
      .map(c => computeScore(c, typo, normalLang))
      .filter(c => c.confidence >= 0.70)
      .sort((a, b) => b.confidence - a.confidence);

    renderSummary(lastIssues.length);
    renderList(lastIssues);
    showResults();
    setStatus('');
  } catch (err) {
    setStatus('Erro: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Highlight toggle ──────────────────────────────────────
async function toggleHighlights() {
  if (!lastTabId || !lastIssues.length) return;
  const btn = document.getElementById('ov-highlight');

  if (highlightsActive) {
    await chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearOvHighlightsFn });
    btn.textContent = 'Highlight All';
    highlightsActive = false;
  } else {
    // Pass full texts — page function finds elements by content, not by selector
    const fullTexts = lastIssues.map(v => v.fullText);
    await chrome.scripting.executeScript({
      target: { tabId: lastTabId },
      func: highlightOvFn,
      args: [fullTexts],
    });
    btn.textContent = '✕ Clear';
    highlightsActive = true;
  }
}

async function clearHighlights() {
  if (!lastTabId) return;
  await chrome.scripting.executeScript({ target: { tabId: lastTabId }, func: clearOvHighlightsFn });
  document.getElementById('ov-highlight').textContent = 'Highlight All';
  highlightsActive = false;
}

// ── Copy report ───────────────────────────────────────────
function copyReport() {
  if (!lastIssues.length) return;
  const lines = lastIssues.map(v =>
    `• [${v.confidenceLevel}] "${v.fullText}"\n  last word: "${v.lastWord}"`
  );
  navigator.clipboard.writeText('Text Truncation Report\n\n' + lines.join('\n\n'));
}

// ── Scroll to element by text content ────────────────────
async function scrollToByText(fullText) {
  if (!lastTabId || !fullText) return;
  await chrome.scripting.executeScript({
    target: { tabId: lastTabId },
    func: scrollToTextFn,
    args: [fullText],
  });
}

// ── Spell-check pipeline ──────────────────────────────────

const SUSPICIOUS_ENDINGS = {
  'pt-BR': /[gptcqkwxb]$/i,
  'es-ES': /[gptcqkwxb]$/i,
  'en-US': /[gtcqxbvz]$/i,
};

const CONTEXT_TRIGGERS = {
  'pt-BR': new Set(['o','a','os','as','um','uma','uns','umas','de','do','da','dos','das','para','em','no','na','nos','nas','ao','aos','com','por','e','que','se','sua','seu','seus','suas']),
  'es-ES': new Set(['el','la','los','las','un','una','de','del','para','en','al','con','por','y','que','se','su','sus','lo','le','les']),
  'en-US': new Set(['a','an','the','to','for','of','in','at','with','and','or','its','their','this','that','these','those','our','your']),
};

function normalizeLang(lang) {
  const l = (lang || '').toLowerCase();
  if (l.startsWith('pt')) return 'pt-BR';
  if (l.startsWith('es')) return 'es-ES';
  if (l.startsWith('en')) return 'en-US';
  return 'pt-BR';
}

async function loadTypo(lang) {
  if (dicCache[lang]) return dicCache[lang];
  const base = chrome.runtime.getURL(`lib/dictionaries/${lang}`);
  const [affRes, dicRes] = await Promise.all([
    fetch(`${base}.aff`),
    fetch(`${base}.dic`),
  ]);
  if (!affRes.ok || !dicRes.ok) throw new Error(`Dictionary not found for ${lang}`);
  const [affText, dicText] = await Promise.all([affRes.text(), dicRes.text()]);
  dicCache[lang] = new window.Typo(lang, affText, dicText, { platform: 'any' });
  return dicCache[lang];
}

function computeScore(candidate, typo, lang) {
  if (candidate.hasEllipsis) {
    return { ...candidate, confidence: 0.90, confidenceLevel: 'HIGH' };
  }

  const { lastWord, context } = candidate;
  if (typo.check(lastWord)) return { ...candidate, confidence: 0 };

  let conf = 0.60;

  const pattern = SUSPICIOUS_ENDINGS[lang] || SUSPICIOUS_ENDINGS['en-US'];
  if (pattern.test(lastWord)) conf += 0.25;

  conf += lastWord.length <= 4 ? 0.15 : 0.05;

  const triggers = CONTEXT_TRIGGERS[lang] || CONTEXT_TRIGGERS['en-US'];
  const prevWord = (context[context.length - 1] || '').toLowerCase();
  if (prevWord && triggers.has(prevWord)) conf += 0.10;

  conf = Math.min(conf, 1.0);
  return {
    ...candidate,
    confidence: conf,
    confidenceLevel: conf >= 0.85 ? 'HIGH' : 'MEDIUM',
  };
}

// ── Render ────────────────────────────────────────────────
function renderSummary(count) {
  const el = document.getElementById('ov-summary');
  el.innerHTML = '';
  const stat = document.createElement('div');
  stat.className = 'audit-stat';
  const label = document.createElement('div');
  label.className = 'audit-stat-label';
  label.textContent = 'Potential truncations';
  const value = document.createElement('div');
  value.className = 'audit-stat-value ' + (count ? 'danger' : 'ok');
  value.textContent = String(count);
  stat.appendChild(label);
  stat.appendChild(value);
  el.appendChild(stat);
}

function renderList(issues) {
  const list = document.getElementById('ov-list');
  list.innerHTML = '';

  if (!issues.length) {
    const item = document.createElement('div');
    item.className = 'audit-item';
    const dot = document.createElement('div');
    dot.className = 'audit-item-dot';
    dot.style.background = 'var(--green)';
    const body = document.createElement('div');
    body.className = 'audit-item-body';
    body.style.color = 'var(--green)';
    body.textContent = 'No truncated text detected.';
    item.appendChild(dot);
    item.appendChild(body);
    list.appendChild(item);
    return;
  }

  issues.forEach(issue => {
    const item = document.createElement('div');
    item.className = 'audit-item violation';
    item.style.cursor = 'pointer';
    item.title = 'Click to scroll to this element on the page';

    const isHigh     = issue.confidenceLevel === 'HIGH';
    const badgeColor = isHigh ? 'var(--red)' : 'var(--amber)';
    const badgeLabel = isHigh ? 'HIGH' : 'MED';

    const dot = document.createElement('div');
    dot.className = 'audit-item-dot';
    dot.style.background = badgeColor;

    const body = document.createElement('div');
    body.className = 'audit-item-body';

    const badge = document.createElement('span');
    badge.className = 'tag';
    badge.style.cssText = `background:${badgeColor}20;color:${badgeColor};border-color:${badgeColor}40`;
    badge.textContent = badgeLabel;

    // Show text content — last 100 chars with truncated word highlighted
    const fullText = issue.fullText;
    const lastWord = issue.lastWord;
    const trimmed  = fullText.length > 100 ? '…' + fullText.slice(-100) : fullText;
    const splitIdx = trimmed.lastIndexOf(lastWord);

    const snippet = document.createElement('span');
    snippet.className = 'ov-snippet';

    if (splitIdx !== -1 && lastWord !== '…') {
      snippet.appendChild(document.createTextNode('"' + trimmed.slice(0, splitIdx)));
      const mark = document.createElement('span');
      mark.className = 'ov-lastword';
      mark.textContent = lastWord;
      snippet.appendChild(mark);
      snippet.appendChild(document.createTextNode(trimmed.slice(splitIdx + lastWord.length) + '"'));
    } else {
      snippet.textContent = '"' + trimmed + '"';
    }

    body.appendChild(badge);
    body.appendChild(document.createTextNode(' '));
    body.appendChild(snippet);

    const gotoBtn = document.createElement('button');
    gotoBtn.className = 'audit-item-goto';
    gotoBtn.title = 'Scroll to element on page';
    gotoBtn.innerHTML = `<svg viewBox="0 0 12 12" fill="none" width="11" height="11"><circle cx="6" cy="6" r="3.5" stroke="currentColor" stroke-width="1.2"/><path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;

    item.appendChild(dot);
    item.appendChild(body);
    item.appendChild(gotoBtn);
    item.addEventListener('click', () => scrollToByText(issue.fullText));
    list.appendChild(item);
  });
}

// ── UI helpers ────────────────────────────────────────────
function setStatus(msg) {
  const el = document.getElementById('ov-status');
  if (msg) {
    el.style.display = 'flex';
    el.innerHTML = '';
    const spinner = document.createElement('div');
    spinner.className = 'audit-spinner';
    const text = document.createElement('span');
    text.textContent = msg;
    el.appendChild(spinner);
    el.appendChild(text);
  } else {
    el.style.display = 'none';
  }
}
function showResults()  { document.getElementById('ov-results').style.display = ''; }
function hideResults()  { document.getElementById('ov-results').style.display = 'none'; }

// ── Page-context functions ────────────────────────────────

function scanDomFn() {
  function detectLang() {
    const htmlLang = (document.documentElement.lang || '').trim();
    if (htmlLang) return htmlLang;
    const meta = document.querySelector('meta[http-equiv="content-language"]');
    if (meta && meta.content) return meta.content.trim();
    return 'pt-BR';
  }

  function extractLastWord(text) {
    let t = text.replace(/\s+/g, ' ').trim();
    t = t.replace(/[.!?,;:…]+$/, '');
    const words = t.split(' ').filter(Boolean);
    if (!words.length) return null;
    const lastWord = words[words.length - 1];
    if (lastWord.length < 3) return null;
    if (!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(lastWord)) return null;
    if (/^\d+$/.test(lastWord)) return null;
    return { lastWord, context: words.slice(-3, -1) };
  }

  const SKIP_TAGS = new Set(['script','style','noscript','code','pre','textarea','input','select','option','svg','path']);
  const candidates = [];
  const seen = new Set();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = (node.textContent || '').trim();
      if (!t || t.length < 5) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;

    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;

    const hasOverflow = (
      cs.overflow === 'hidden' ||
      cs.overflowX === 'hidden' ||
      cs.overflowY === 'hidden' ||
      cs.textOverflow === 'ellipsis' ||
      (cs.webkitLineClamp && cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== 'auto')
    );
    if (!hasOverflow) continue;

    seen.add(el);

    const fullText = (el.innerText || '').trim();
    if (!fullText || fullText.length < 5) continue;

    // Trailing ellipsis = direct truncation signal (all languages)
    const hasEllipsis = fullText.endsWith('...') || fullText.endsWith('…');
    if (hasEllipsis) {
      const beforeDots = fullText.replace(/[.…]+$/, '').trim();
      const prevWords  = beforeDots.split(' ').filter(Boolean);
      candidates.push({
        fullText,
        lastWord:    '…',
        context:     prevWords.slice(-2),
        hasEllipsis: true,
      });
      continue;
    }

    const extracted = extractLastWord(fullText);
    if (!extracted) continue;

    candidates.push({
      fullText,
      lastWord:    extracted.lastWord,
      context:     extracted.context,
      hasEllipsis: false,
    });
  }

  return { lang: detectLang(), candidates };
}

// Finds element by text content (like Ctrl+F) and applies scroll + pulse
function scrollToTextFn(fullText) {
  const SKIP = new Set(['script','style','noscript','head']);
  const searchSuffix = fullText.length > 60 ? fullText.slice(-60) : fullText;
  let bestEl  = null;
  let bestLen = Infinity;

  const all = document.body.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (SKIP.has(el.tagName.toLowerCase())) continue;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const text = (el.innerText || '').trim();
    if (text.endsWith(searchSuffix) && text.length < bestLen) {
      bestLen = text.length;
      bestEl  = el;
    }
  }

  if (!bestEl) return;
  bestEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  document.getElementById('wpc-focus-style')?.remove();
  const st = document.createElement('style');
  st.id = 'wpc-focus-style';
  st.textContent = `
    @keyframes wpc-focus-pulse {
      0%   { outline-color: rgba(123,110,246,1);  box-shadow: 0 0 0 0   rgba(123,110,246,.6); }
      50%  { outline-color: rgba(123,110,246,.6); box-shadow: 0 0 0 8px rgba(123,110,246,0);  }
      100% { outline-color: rgba(123,110,246,1);  box-shadow: 0 0 0 0   rgba(123,110,246,.6); }
    }
    [data-wpc-focus] {
      outline: 2px solid #7B6EF6 !important;
      outline-offset: 4px !important;
      animation: wpc-focus-pulse 0.9s ease 3 !important;
    }
  `;
  document.head.appendChild(st);
  bestEl.setAttribute('data-wpc-focus', '1');
  setTimeout(() => {
    bestEl?.removeAttribute('data-wpc-focus');
    document.getElementById('wpc-focus-style')?.remove();
  }, 3200);
}

// Highlights elements by text content instead of CSS selector
function highlightOvFn(fullTexts) {
  document.getElementById('wpc-ov-style')?.remove();
  const st = document.createElement('style');
  st.id = 'wpc-ov-style';
  st.textContent = '[data-wpc-ov]{outline:3px solid #FF5E5E!important;outline-offset:2px!important;background:rgba(255,94,94,0.08)!important}';
  document.head.appendChild(st);

  const SKIP = new Set(['script','style','noscript','head']);
  const all  = document.body.getElementsByTagName('*');

  fullTexts.forEach(fullText => {
    const searchSuffix = fullText.length > 60 ? fullText.slice(-60) : fullText;
    let bestEl  = null;
    let bestLen = Infinity;

    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (SKIP.has(el.tagName.toLowerCase())) continue;
      const text = (el.innerText || '').trim();
      if (text.endsWith(searchSuffix) && text.length < bestLen) {
        bestLen = text.length;
        bestEl  = el;
      }
    }

    if (bestEl) bestEl.setAttribute('data-wpc-ov', '1');
  });
}

function clearOvHighlightsFn() {
  document.querySelectorAll('[data-wpc-ov]').forEach(el => el.removeAttribute('data-wpc-ov'));
  document.getElementById('wpc-ov-style')?.remove();
}

export function run() {}
