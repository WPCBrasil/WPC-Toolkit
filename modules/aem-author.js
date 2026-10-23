const DEFAULT_REGION = 'us';

function normalizeAndCleanPath(pathname) {
  let p = pathname || '/';
  p = p.split('#')[0].split('?')[0];
  p = p.replace(/^\/?(editor(?:\.html)?|assets\.html|sites\.html)\//i, '/');
  p = p.replace(/^\/?content\/samsung/i, '');
  p = p.replace(/^\/?content\/dam\/samsung/i, '');
  p = p.replace(/\/index\.html$/i, '');
  p = p.replace(/\.html$/i, '');
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

function getCountryFromPath(path) {
  const m = path.match(/^\/([a-z]{2})(?:\/|$)/i);
  return m ? m[1].toLowerCase() : null;
}

function buildLinks(urlStr) {
  if (!urlStr || !urlStr.includes('samsung.com')) return null;
  let urlObj;
  try { urlObj = new URL(urlStr); } catch { return null; }

  const cleanPath = normalizeAndCleanPath(urlObj.pathname);
  const country   = getCountryFromPath(cleanPath) || DEFAULT_REGION;
  const pathHtml  = `${cleanPath}.html`;
  const pathSlash = cleanPath === '/' ? '/' : `${cleanPath}/`;

  return {
    country,
    author:    `https://p6-${DEFAULT_REGION}-author.samsung.com/editor.html/content/samsung${pathHtml}`,
    preview:   `https://p6-${DEFAULT_REGION}-author.samsung.com/content/samsung${pathHtml}?wcmmode=disabled`,
    assets:    `https://p6-${DEFAULT_REGION}-author.samsung.com/assets.html/content/dam/samsung/${cleanPath.replace(/^\//, '')}`,
    preQa:     `https://p6-pre-qa.samsung.com${pathSlash}`,
    qa:        `https://p6-qa.samsung.com${pathSlash}`,
    live:      `https://www.samsung.com${pathSlash}`,
    directory: `https://p6-${DEFAULT_REGION}-author.samsung.com/sites.html/content/samsung${cleanPath}`,
  };
}

function flashCopied(btn) {
  const orig = btn.textContent;
  btn.textContent = '✓';
  setTimeout(() => { btn.textContent = orig; }, 1400);
}

export function init() {
  const panel = document.getElementById('tab-aem-author');
  if (!panel) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const links     = buildLinks(tabs?.[0]?.url || '');
    const countryEl = document.getElementById('aem-country-badge');

    ['author', 'preview', 'assets', 'preQa', 'qa', 'live', 'directory'].forEach(key => {
      const a   = document.getElementById(`aem-link-${key}`);
      const url = links?.[key];
      if (!a) return;
      if (url) {
        a.href = url;
        a.classList.remove('aem-link-disabled');
      } else {
        a.removeAttribute('href');
        a.classList.add('aem-link-disabled');
      }
    });

    if (countryEl && links) {
      countryEl.textContent = links.country.toUpperCase();
      countryEl.style.display = 'inline-flex';
    } else if (countryEl) {
      countryEl.style.display = 'none';
    }
  });

  panel.querySelectorAll('[data-aem-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a    = document.getElementById(`aem-link-${btn.dataset.aemCopy}`);
      const href = a?.getAttribute('href');
      if (!href) return;
      navigator.clipboard.writeText(href).then(() => flashCopied(btn));
    });
  });
}
