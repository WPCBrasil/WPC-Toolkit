// ── Comunicação com o Apps Script do Report ───────────────
export const DEFAULT_REPORT_URL = 'https://script.google.com/macros/s/AKfycbxjlwng2BoBO596y-BrhgVhHyrdq51WVv8rh0sVv3Rf71-LAT8y2omQYmqKQ7gGEEWD/exec';

export async function getReportScriptUrl() {
  const { reportScriptUrl } = await chrome.storage.local.get(['reportScriptUrl']);
  return reportScriptUrl || DEFAULT_REPORT_URL;
}

// Lê a resposta JSON do script; lança erro se result !== 'success'
async function parse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let body;
  try { body = await res.json(); } catch { throw new Error('Invalid response from Apps Script'); }
  if (body?.result !== 'success') {
    const err = new Error(body?.error || 'Apps Script error');
    err.fromScript = true;
    throw err;
  }
  return body;
}

export async function scriptGet(action) {
  const url = await getReportScriptUrl();
  const res = await fetch(`${url}?action=${encodeURIComponent(action)}`, { method: 'GET' });
  return parse(res);
}

export async function scriptPost(payload) {
  const url = await getReportScriptUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parse(res);
}
