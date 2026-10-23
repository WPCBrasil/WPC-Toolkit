let _data = { url: '', title: '', description: '', keywords: '', headings: [] };

export function init() {
  document.getElementById('seo-btn').addEventListener('click', openSeo);
  document.getElementById('seo-close').addEventListener('click', closeSeo);
  document.getElementById('seo-rescan').addEventListener('click', runScan);
  document.getElementById('seo-search-input').addEventListener('input', (e) => {
    renderAll(e.target.value.trim());
  });
}

function openSeo() {
  document.getElementById('seo-panel').classList.add('open');
  runScan();
}

function closeSeo() {
  document.getElementById('seo-panel').classList.remove('open');
}

async function runScan() {
  setStatus('Scanning…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to scan.');

    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: seoScanFn });
    if (!res?.result) throw new Error('Could not scan this page. Try reloading it.');

    _data = res.result;
    setStatus('');
    renderAll(document.getElementById('seo-search-input').value.trim());
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
}

function setStatus(msg) {
  const el = document.getElementById('seo-status');
  document.getElementById('seo-status-text').textContent = msg;
  el.style.display = msg ? 'flex' : 'none';
}

function renderAll(query) {
  const urlEl = document.getElementById('seo-url');
  urlEl.textContent = '';
  const a = document.createElement('a');
  a.href = _data.url || '#';
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = _data.url || '(no url)';
  urlEl.appendChild(a);

  let matchTotal = 0;
  matchTotal += renderHighlighted(document.getElementById('seo-title'),    _data.title,       query);
  matchTotal += renderHighlighted(document.getElementById('seo-desc'),     _data.description, query);
  matchTotal += renderHighlighted(document.getElementById('seo-keywords'), _data.keywords,    query);

  const list = document.getElementById('seo-headings-list');
  list.textContent = '';
  document.getElementById('seo-headings-empty').style.display = _data.headings.length ? 'none' : '';

  _data.headings.forEach(h => {
    const row = document.createElement('div');
    row.className = 'seo-heading-row';

    const pill = document.createElement('span');
    pill.className = 'seo-tag-pill';
    pill.textContent = `<${h.tag}>`;

    const textSpan = document.createElement('span');
    textSpan.className = 'seo-heading-text';

    row.appendChild(pill);
    row.appendChild(textSpan);
    list.appendChild(row);

    matchTotal += renderHighlighted(textSpan, h.text, query);
  });

  const badge = document.getElementById('seo-match-count');
  if (!query) {
    badge.textContent = '';
    badge.classList.remove('has-matches');
  } else {
    badge.textContent = `${matchTotal} match${matchTotal === 1 ? '' : 'es'}`;
    badge.classList.toggle('has-matches', matchTotal > 0);

    if (matchTotal > 0) {
      requestAnimationFrame(() => {
        document.querySelector('#seo-panel mark.seo-mark')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }
}

// Safe highlight renderer — DOM API only, never innerHTML (source text is untrusted page content).
// Returns the number of matches found.
function renderHighlighted(el, text, query) {
  el.textContent = '';
  const value = text || '';

  if (!value) {
    const span = document.createElement('span');
    span.style.color = 'var(--muted)';
    span.textContent = '(not found)';
    el.appendChild(span);
    return 0;
  }

  if (!query) {
    el.appendChild(document.createTextNode(value));
    return 0;
  }

  const lowerVal   = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let matches = 0;
  let cursor  = 0;
  let idx     = lowerVal.indexOf(lowerQuery, cursor);

  if (idx === -1) {
    el.appendChild(document.createTextNode(value));
    return 0;
  }

  while (idx !== -1) {
    if (idx > cursor) el.appendChild(document.createTextNode(value.slice(cursor, idx)));
    const mark = document.createElement('mark');
    mark.className = 'seo-mark';
    mark.textContent = value.slice(idx, idx + query.length);
    el.appendChild(mark);
    matches++;
    cursor = idx + query.length;
    idx = lowerVal.indexOf(lowerQuery, cursor);
  }
  if (cursor < value.length) el.appendChild(document.createTextNode(value.slice(cursor)));

  return matches;
}

// Page-context scan — self-contained, serialized by chrome.scripting.executeScript.
function seoScanFn() {
  const description =
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content ||
    '';
  const keywords = document.querySelector('meta[name="keywords"]')?.content || '';

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
    tag: h.tagName,
    text: (h.textContent || '').trim().replace(/\s+/g, ' '),
  }));

  return {
    url: window.location.href,
    title: document.title || '',
    description,
    keywords,
    headings,
  };
}
