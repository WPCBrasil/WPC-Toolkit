const TYPE_LABEL = { domain: 'domain', path: 'path', session: 'session', all: '' };

export function init() {
  const btn      = document.getElementById('cookie-cleaner-btn');
  const dropdown = document.getElementById('cookie-dropdown');
  const toast    = document.getElementById('ck-toast');
  const toastMsg = document.getElementById('ck-toast-msg');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) toast.classList.remove('show');
  });

  document.addEventListener('mousedown', (e) => {
    if (!dropdown.hidden && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  dropdown.querySelectorAll('.ck-item').forEach(item => {
    item.addEventListener('click', async () => {
      const type = item.dataset.ck;
      let count = 0;
      try { count = await clearCookies(type); } catch (e) { console.warn('[CookieCleaner]', e); }
      const label = TYPE_LABEL[type] ? `${TYPE_LABEL[type]} ` : '';
      const noun  = count === 1 ? 'cookie' : 'cookies';
      toastMsg.textContent = `${count} ${label}${noun} deleted — click to reload`;
      toast.classList.add('show');
    });
  });

  toast.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.reload(tab.id);
  });
}

async function clearCookies(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/.test(tab.url)) return 0;

  const url      = new URL(tab.url);
  const hostname = url.hostname;

  // Busca todos os cookies do domínio (não filtrado por path)
  const all = await chrome.cookies.getAll({ domain: hostname });

  const targets = all.filter(c => {
    if (type === 'path')    return c.path === url.pathname;
    if (type === 'session') return c.session === true;
    return true; // 'domain' e 'all': todos do domínio
  });

  await Promise.all(targets.map(c => {
    // Constrói URL de remoção a partir do próprio cookie
    const scheme    = c.secure ? 'https' : 'http';
    const removeUrl = `${scheme}://${c.domain.replace(/^\./, '')}${c.path}`;
    return chrome.cookies.remove({ url: removeUrl, name: c.name, storeId: c.storeId });
  }));

  return targets.length;
}
