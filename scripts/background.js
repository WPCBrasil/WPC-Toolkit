// WPC Hub — background.js (Service Worker)

// Primeira instalação: avisa o usuário para completar o cadastro obrigatório
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason !== 'install') return;
  chrome.notifications.create('wpc-profile-setup', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'WPC Hub installed',
    message: 'Click the WPC Hub icon to set up your Name, QA ID and Cheil e-mail.',
  });
});

// Strip X-Frame-Options / CSP headers so Viewfast side panel can iframe any page
const VIEWFAST_RULE_ID = 100;
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [VIEWFAST_RULE_ID],
    addRules: [{
      id: VIEWFAST_RULE_ID,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'X-Frame-Options',       operation: 'remove' },
          { header: 'Content-Security-Policy', operation: 'remove' },
          { header: 'Frame-Options',           operation: 'remove' },
        ],
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['sub_frame'],
        initiatorDomains: [chrome.runtime.id],
      },
    }],
  }).catch(err => console.error('[WPC] Rules install failed:', err));
});

// ── Check My Links ────────────────────────────────────────
const CL_TIMEOUT_MS = 5000;
const CL_BATCH_SIZE = 6;
const CL_COUNTRY_CODES = ['br','co','cl','mx','pe','ar','uy','py','latin','latin-en','us','ca','de','fr','uk','au'];

function clExtractCountry(url) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    for (const cc of CL_COUNTRY_CODES) {
      if (path === `/${cc}/` || path.startsWith(`/${cc}/`) || path.includes(`/${cc}/`)) return cc;
    }
  } catch {}
  return null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'startCheckLinks') {
    runCheckLinks(msg.links, msg.tabId, msg.tabUrl, msg.ctaResults, msg.linkViolations, msg.linkSummary);
    sendResponse({ ok: true });
    return true;
  }
});

async function runCheckLinks(links, tabId, tabUrl, ctaResults, linkViolations, linkSummary) {
  const total = links.length;
  const results = [];
  const originCountry = clExtractCountry(tabUrl);
  const startTime = Date.now();

  await chrome.storage.local.set({
    checkLinks: {
      tabId, tabUrl, status: 'running', startTime,
      ctaResults, linkViolations, linkSummary,
      links, progress: { done: 0, total }, results, summary: null
    }
  });

  // Keep SW alive: Chrome API call every 20s while processing
  const keepAlive = setInterval(() => chrome.storage.local.get('checkLinks'), 20000);

  try {
    for (let i = 0; i < total; i += CL_BATCH_SIZE) {
      const batch = links.slice(i, i + CL_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(({ url, selector }) => clCheckSingleLink(url, selector, originCountry))
      );
      batchResults.filter(r => r.type !== 'ok').forEach(r => results.push(r));

      await chrome.storage.local.set({
        checkLinks: {
          tabId, tabUrl, status: 'running', startTime,
          ctaResults, linkViolations, linkSummary,
          links, progress: { done: Math.min(i + CL_BATCH_SIZE, total), total },
          results, summary: null,
        }
      });
    }

    const summary = { total, ok: total - results.length, errors: results.length };
    await chrome.storage.local.set({
      checkLinks: {
        tabId, tabUrl, status: 'done', startTime,
        ctaResults, linkViolations, linkSummary,
        links, progress: { done: total, total }, results, summary
      }
    });

    chrome.action.setBadgeText({ text: results.length > 0 ? String(results.length) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });

    chrome.notifications.create('cl-done', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'WPC Hub — Check My Links',
      message: results.length > 0
        ? `${results.length} erro(s) em ${total} links.`
        : `Todos os ${total} links estão OK.`,
    });

  } catch (err) {
    console.error('[WPC] checkLinks error:', err);
    await chrome.storage.local.set({
      checkLinks: {
        tabId, tabUrl, status: 'error', startTime,
        ctaResults, linkViolations, linkSummary,
        links, progress: { done: 0, total }, results, summary: null
      }
    });
  } finally {
    clearInterval(keepAlive);
  }
}

async function clCheckSingleLink(url, selector, originCountry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      credentials: 'omit',
    });
    clearTimeout(timer);

    const finalUrl = response.url;
    const status = response.status;

    if (status === 404) return { url, finalUrl, status, type: '404', selector };

    if (originCountry && finalUrl !== url) {
      const finalCountry = clExtractCountry(finalUrl);
      if (finalCountry && finalCountry !== originCountry) {
        return { url, finalUrl, status, type: 'geo-redirect', selector };
      }
    }

    if (status === 200) {
      const text = await response.text();
      if (text.trim().length < 500) {
        return { url, finalUrl, status, type: 'blank', selector };
      }
    }

    return { url, finalUrl, status, type: 'ok', selector };

  } catch (err) {
    clearTimeout(timer);
    return { url, finalUrl: null, status: 0, type: err.name === 'AbortError' ? 'timeout' : 'error', selector, error: err.message };
  }
}

// ── Video Check (ported from qa-video/background.js) ─────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "check_brightcove") {
    const url = `https://players.brightcove.net/${request.accountId}/default_default/index.html?videoId=${request.videoId}`;

    fetch(url, { method: 'GET' })
      .then(res => {
        if (res.ok || res.status === 200) {
          sendResponse({ available: true, code: '200 OK' });
        } else {
          sendResponse({ available: false, code: `HTTP ${res.status}` });
        }
      })
      .catch(err => {
        sendResponse({ available: false, code: 'NETWORK_ERROR' });
      });

    return true;
  }

  if (request.action === "check_youtube") {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${request.videoId}&format=json`;

    fetch(url)
      .then(res => {
        if (res.status === 200) {
          sendResponse({ available: true, code: '200 OK' });
        } else {
          sendResponse({ available: false, code: `HTTP ${res.status}` });
        }
      })
      .catch(err => {
        sendResponse({ available: false, code: 'NETWORK_ERROR' });
      });

    return true;
  }
});
