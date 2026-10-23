export function init() {
  const panel = document.getElementById('tab-word-markdown');
  if (!panel) return;

  const inputEl  = panel.querySelector('#wm-input');
  const outputEl = panel.querySelector('#wm-output');
  const statusEl = panel.querySelector('#wm-status');
  const badgesEl = panel.querySelector('#wm-badges');

  let richHtml = '';

  inputEl.addEventListener('paste', (e) => {
    e.preventDefault();
    richHtml = '';
    const html  = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    if (html) {
      richHtml      = html;
      inputEl.value = plain || stripTags(html);
      statusEl.textContent = '✓ HTML rico detectado — links e negrito serão preservados';
      statusEl.className   = 'wm-status ok';
    } else {
      inputEl.value        = plain;
      statusEl.textContent = '⚠ Apenas texto simples detectado (sem formatação)';
      statusEl.className   = 'wm-status warn';
    }
  });

  panel.querySelector('#wm-convert').addEventListener('click', () => {
    const source = richHtml || inputEl.value.trim();
    if (!source) { outputEl.value = ''; badgesEl.innerHTML = ''; return; }

    let text, linkCount = 0, boldCount = 0;
    if (richHtml) {
      const res = htmlToMarkdown(richHtml);
      text = res.text; linkCount = res.linkCount; boldCount = res.boldCount;
    } else {
      text = inputEl.value.trim();
    }

    outputEl.value = text;

    let html = '';
    if (linkCount > 0) html += `<span class="wm-badge wm-badge-link">🔗 ${linkCount} link${linkCount > 1 ? 's' : ''}</span>`;
    if (boldCount > 0) html += `<span class="wm-badge wm-badge-bold"><b>B</b> ${boldCount} negrito${boldCount > 1 ? 's' : ''}</span>`;
    if (!linkCount && !boldCount && richHtml) html = '<span class="wm-badge wm-badge-warn">nenhuma formatação encontrada</span>';
    badgesEl.innerHTML = html;
  });

  panel.querySelector('#wm-copy').addEventListener('click', () => {
    const val = outputEl.value;
    if (!val) return;
    const btn = panel.querySelector('#wm-copy');
    navigator.clipboard.writeText(val).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado!';
      setTimeout(() => { btn.textContent = orig; }, 1800);
    });
  });

  panel.querySelector('#wm-clear').addEventListener('click', () => {
    inputEl.value  = '';
    outputEl.value = '';
    richHtml       = '';
    badgesEl.innerHTML   = '';
    statusEl.textContent = '';
    statusEl.className   = 'wm-status';
  });
}

function stripTags(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || '';
}

function htmlToMarkdown(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  let linkCount = 0, boldCount = 0;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag      = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(walk).join('');

    if (tag === 'a') {
      let href = node.getAttribute('href') || '';
      try {
        const u = new URL(href);
        if (u.hostname.includes('safelinks.protection.outlook.com')) {
          href = u.searchParams.get('url') || href;
        }
      } catch (_) {}
      if (href && !href.startsWith('javascript') && children.trim()) {
        linkCount++;
        return `[${children.trim()}](${href})`;
      }
      return children;
    }

    if (tag === 'b' || tag === 'strong') {
      const inner = children.trim();
      if (inner) { boldCount++; return `**${inner}**`; }
      return children;
    }

    if (tag === 'span') {
      const style  = (node.getAttribute('style') || '').toLowerCase();
      const isBold = style.includes('font-weight:700')  || style.includes('font-weight: 700') ||
                     style.includes('font-weight:bold') || style.includes('font-weight: bold') ||
                     style.includes('mso-bidi-font-weight:bold') || style.includes('mso-bidi-font-weight: bold');
      if (isBold && children.trim()) {
        const already = children.trim().startsWith('**') && children.trim().endsWith('**');
        if (!already) { boldCount++; return `**${children.trim()}**`; }
      }
      return children;
    }

    if (tag === 'p' || tag === 'div') return children + '\n';
    if (tag === 'br')  return '\n';
    if (tag === 'li')  return '- ' + children.trim() + '\n';
    if (tag === 'h1')  return '# '   + children.trim() + '\n';
    if (tag === 'h2')  return '## '  + children.trim() + '\n';
    if (tag === 'h3')  return '### ' + children.trim() + '\n';

    return children;
  }

  const body   = doc.body || doc.documentElement;
  const result = walk(body)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*\s*\*\*/g, '')
    .trim();

  return { text: result, linkCount, boldCount };
}
