// Bulk Screenshot — captura full-page em massa e em segundo plano.
// Ported from bulk-screenshot-extension (source/src/lib/screenshot.ts +
// batchScreenshot.ts + components/BatchScreenshotView.tsx), sem alterar
// nenhuma funcionalidade — apenas reescrito de React/TypeScript para o
// padrão de módulo vanilla JS usado pela WPC Hub, e integrado como um
// segundo modo dentro da aba Screenshot (Reporting).
//
// Diferença para o Screenshot atual (CanvasPNG/PDFtoPNG, modules/screenshot.js):
// aquele captura a aba ativa onde o popup foi aberto; este abre cada URL da
// lista numa aba em segundo plano (ativada só brevemente durante o
// carregamento/captura, pra garantir que imagens e conteúdo lazy-load
// rendereizem — ver nota em runBatchCapture), captura via PDF to PNG e
// entrega tudo num único .zip ao final.
//
// Limitação conhecida (documentada na extensão original): a orquestração
// roda aqui no popup — se o usuário fechar o popup no meio do lote, o
// processamento para.

const MAX_BATCH_URLS       = 50;
const TAB_LOAD_TIMEOUT_MS  = 20000;
const LAZY_BACK_WAIT       = 700;
const IMAGE_LOAD_TIMEOUT_MS = 7000;
const MAX_PAGE_HEIGHT      = 25000;

let cancelledFlag  = false;
let batchResults   = [];

export function init() {
  wireModeToggle();

  const startBtn    = document.getElementById('bs-start');
  const cancelBtn   = document.getElementById('bs-cancel');
  const downloadBtn = document.getElementById('bs-download');
  const resetBtn    = document.getElementById('bs-reset');
  if (!startBtn) return;

  startBtn.addEventListener('click', handleStart);
  cancelBtn.addEventListener('click', handleCancel);
  downloadBtn.addEventListener('click', handleDownloadZip);
  resetBtn.addEventListener('click', handleReset);

  setPhase('input');
}

// ── Modo Single Page / Bulk (dentro da mesma aba Screenshot) ────
function wireModeToggle() {
  const singleBtn   = document.getElementById('sc-mode-single');
  const bulkBtn     = document.getElementById('sc-mode-bulk');
  const singleBlock = document.getElementById('sc-single-block');
  const bulkBlock   = document.getElementById('sc-bulk-block');
  if (!singleBtn || !bulkBtn || !singleBlock || !bulkBlock) return;

  singleBtn.addEventListener('click', () => setMode('single'));
  bulkBtn.addEventListener('click', () => setMode('bulk'));

  function setMode(mode) {
    const isSingle = mode === 'single';
    singleBtn.classList.toggle('active', isSingle);
    bulkBtn.classList.toggle('active', !isSingle);
    singleBlock.style.display = isSingle ? '' : 'none';
    bulkBlock.style.display   = isSingle ? 'none' : '';
  }
}

// ── UI: fases input / running / done ─────────────────────────────
function setPhase(phase) {
  document.getElementById('bs-phase-input').style.display   = phase === 'input'   ? '' : 'none';
  document.getElementById('bs-phase-running').style.display = phase === 'running' ? '' : 'none';
  document.getElementById('bs-phase-done').style.display    = phase === 'done'    ? '' : 'none';
}

async function handleStart() {
  const textarea  = document.getElementById('bs-urls');
  const warningEl = document.getElementById('bs-warning');
  const { urls, invalidLines, truncated } = parseUrlList(textarea.value);

  if (urls.length === 0) {
    warningEl.textContent   = 'Enter at least one valid http(s) URL, one per line.';
    warningEl.style.display = '';
    return;
  }

  const warnings = [];
  if (invalidLines.length > 0) warnings.push(`${invalidLines.length} line(s) skipped (not a valid http/https URL).`);
  if (truncated) warnings.push(`List truncated to the first ${MAX_BATCH_URLS} URLs.`);
  if (warnings.length > 0) {
    warningEl.textContent   = warnings.join(' ');
    warningEl.style.display = '';
  } else {
    warningEl.style.display = 'none';
  }

  cancelledFlag = false;
  batchResults  = [];
  updateProgress({ done: 0, total: urls.length, currentUrl: '', phase: 'Starting…' });
  setPhase('running');

  batchResults = await runBatchCapture(urls, updateProgress, () => cancelledFlag);
  renderDoneState();
  setPhase('done');
}

function handleCancel() {
  cancelledFlag = true;
}

function updateProgress(info) {
  const { done, total, currentUrl, phase } = info;
  const pct = total === 0 ? 0 : (done / total) * 100;

  document.getElementById('bs-progress-label').textContent = `${phase} ${done}/${total}`;
  document.getElementById('bs-progress-pct').textContent   = `${Math.round(pct)}%`;
  document.getElementById('bs-progress-fill').style.width  = `${pct}%`;

  const urlEl = document.getElementById('bs-progress-url');
  if (currentUrl) {
    urlEl.textContent   = currentUrl;
    urlEl.title         = currentUrl;
    urlEl.style.display = '';
  } else {
    urlEl.style.display = 'none';
  }
}

function renderDoneState() {
  const successCount = batchResults.filter(r => r.status === 'success').length;
  const errorCount   = batchResults.filter(r => r.status === 'error').length;

  const successEl = document.getElementById('bs-success-count');
  successEl.textContent = `${successCount} captured`;

  const errorCountEl = document.getElementById('bs-error-count');
  if (errorCount > 0) {
    errorCountEl.textContent   = `${errorCount} failed`;
    errorCountEl.style.display = '';
  } else {
    errorCountEl.style.display = 'none';
  }

  const listEl = document.getElementById('bs-error-list');
  listEl.innerHTML = '';
  if (errorCount > 0) {
    batchResults.filter(r => r.status === 'error').forEach(r => {
      const item = document.createElement('div');
      item.className = 'audit-item';
      item.title = r.url;
      const dot = document.createElement('span');
      dot.className = 'audit-item-dot';
      dot.style.background = 'var(--red)';
      const body = document.createElement('span');
      body.className = 'audit-item-body';
      body.textContent = r.url;
      item.appendChild(dot);
      item.appendChild(body);
      listEl.appendChild(item);
    });
    listEl.style.display = '';
  } else {
    listEl.style.display = 'none';
  }

  const downloadBtn = document.getElementById('bs-download');
  downloadBtn.disabled = successCount === 0;
}

async function handleDownloadZip() {
  const btn = document.getElementById('bs-download');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preparing ZIP…';
  try {
    const blob = await buildResultsZip(batchResults);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = buildBatchZipFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } finally {
    btn.textContent = originalText;
    btn.disabled = batchResults.filter(r => r.status === 'success').length === 0;
  }
}

function handleReset() {
  cancelledFlag = false;
  batchResults  = [];
  document.getElementById('bs-urls').value       = '';
  document.getElementById('bs-warning').style.display = 'none';
  setPhase('input');
}

// ── Parsing da lista de URLs ──────────────────────────────────────
function parseUrlList(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const seen = new Set();
  const urls = [];
  const invalidLines = [];

  for (const line of lines) {
    try {
      const parsed = new URL(line);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        invalidLines.push(line);
        continue;
      }
      const normalized = parsed.toString();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    } catch {
      invalidLines.push(line);
    }
  }

  const truncated = urls.length > MAX_BATCH_URLS;
  return {
    urls: truncated ? urls.slice(0, MAX_BATCH_URLS) : urls,
    invalidLines,
    truncated,
  };
}

// ── Orquestração do lote ──────────────────────────────────────────
function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Timed out waiting for the page to load.'));
    }, TAB_LOAD_TIMEOUT_MS);

    function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Processa a lista sequencialmente (não em paralelo). `isCancelled` é
 * checado entre cada URL para permitir cancelamento. Falha numa URL não
 * interrompe as demais.
 *
 * IMPORTANTE: cada aba é aberta em segundo plano (active: false), mas é
 * ativada brevemente (chrome.tabs.update) durante o carregamento/captura —
 * o Chrome reduz a prioridade de renderização de abas em segundo plano
 * (throttling), e sem esse "flash" imagens/lazy-load não terminam de
 * carregar. A aba original do usuário é restaurada logo em seguida.
 */
async function runBatchCapture(urls, onProgress, isCancelled) {
  const results = [];

  const [originalActiveTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const originalActiveTabId = originalActiveTab?.id;

  for (let i = 0; i < urls.length; i++) {
    if (isCancelled()) break;
    const url = urls[i];

    let tab;
    try {
      onProgress({ done: i, total: urls.length, currentUrl: url, phase: 'Opening…' });
      tab = await chrome.tabs.create({ url, active: false });
      if (!tab.id) throw new Error('Could not open a background tab for this URL.');

      onProgress({ done: i, total: urls.length, currentUrl: url, phase: 'Loading…' });
      await waitForTabLoad(tab.id);

      if (isCancelled()) break;

      onProgress({ done: i, total: urls.length, currentUrl: url, phase: 'Rendering…' });
      await chrome.tabs.update(tab.id, { active: true });

      onProgress({ done: i, total: urls.length, currentUrl: url, phase: 'Capturing…' });
      const dataUrl = await captureFullPagePdfForTab(tab.id);
      const blob = await dataUrlToBlob(dataUrl);

      results.push({ url, status: 'success', blob });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while capturing this page.';
      results.push({ url, status: 'error', errorMessage: message });
    } finally {
      if (tab?.id) {
        try { await chrome.tabs.remove(tab.id); } catch (_) {}
      }
      if (originalActiveTabId !== undefined) {
        try { await chrome.tabs.update(originalActiveTabId, { active: true }); } catch (_) {}
      }
    }
  }

  onProgress({ done: results.length, total: urls.length, currentUrl: '', phase: 'Done' });
  return results;
}

// ── Captura full-page (PDF to PNG) numa aba específica ────────────
// Mesma técnica de modules/screenshot.js (Page.printToPDF + PDF.js), com
// o scroll incremental + espera de imagens/background-image usados pelo
// fluxo de lote (garante que lazy-load renderize antes da captura).
async function evalInPage(tabId, expression) {
  await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', { expression, awaitPromise: true });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function stepScrollThroughPage(tabId) {
  await evalInPage(tabId, `(function(){
    return new Promise(function(resolve){
      var step = Math.max(200, Math.floor(window.innerHeight * 0.8));
      var maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      var current = 0;
      function tick(){
        current += step;
        window.scrollTo(0, Math.min(current, maxScroll));
        if (current >= maxScroll) {
          setTimeout(resolve, 600);
        } else {
          setTimeout(tick, 280);
        }
      }
      if (maxScroll === 0) { resolve(); } else { tick(); }
    });
  })()`);
}

async function waitForImagesToLoad(tabId) {
  await evalInPage(tabId, `(function(){
    return new Promise(function(resolve){
      var deadline = Date.now() + ${IMAGE_LOAD_TIMEOUT_MS};
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var bg = getComputedStyle(all[i]).backgroundImage;
        if (bg && bg.indexOf('url(') !== -1) {
          var m = bg.match(/url\\((?:"|')?([^"')]+)(?:"|')?\\)/);
          if (m && m[1]) {
            var preload = new Image();
            preload.src = m[1];
          }
        }
      }
      function allImgsDone(){
        return Array.prototype.every.call(document.images, function(img){
          return img.complete;
        });
      }
      function tick(){
        if (allImgsDone() || Date.now() > deadline) {
          resolve();
        } else {
          setTimeout(tick, 150);
        }
      }
      tick();
    });
  })()`);
}

function describeError(err) {
  const msg = err && err.message ? err.message : String(err);
  if (msg.includes('Another debugger') || msg.includes('already attached')) {
    return 'Close DevTools on this tab and try again.';
  }
  if (msg.includes('Cannot access') || msg.includes('chrome-extension') || msg.includes('chrome://')) {
    return 'Cannot capture system pages (chrome://, extensions, etc.).';
  }
  return msg;
}

async function getPageDimensions(tabId) {
  const layout = await chrome.debugger.sendCommand({ tabId }, 'Page.getLayoutMetrics', {});
  const width  = Math.ceil(layout.contentSize?.width  ?? 0);
  const height = Math.min(Math.ceil(layout.contentSize?.height ?? 0), MAX_PAGE_HEIGHT);
  if (!width || !height) throw new Error('Could not determine page dimensions.');
  return { width, height };
}

async function pdfBase64ToPngDataUrl(base64Data) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js not loaded. Reload the extension.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
  const pdfData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const pdfDoc  = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page    = await pdfDoc.getPage(1);
  const vp      = page.getViewport({ scale: 1.5 });
  const canvas  = document.createElement('canvas');
  canvas.width  = Math.ceil(vp.width);
  canvas.height = Math.ceil(vp.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL('image/png');
}

async function captureFullPagePdfForTab(tabId) {
  try {
    await chrome.debugger.attach({ tabId }, '1.3');

    await stepScrollThroughPage(tabId);
    await waitForImagesToLoad(tabId);
    await evalInPage(tabId, 'window.scrollTo(0, 0)');
    await delay(LAZY_BACK_WAIT);

    const { width, height } = await getPageDimensions(tabId);

    const INCH = 96;
    const pdfResult = await chrome.debugger.sendCommand({ tabId }, 'Page.printToPDF', {
      printBackground:   true,
      paperWidth:        width / INCH,
      paperHeight:       height / INCH,
      marginTop:         0,
      marginBottom:      0,
      marginLeft:        0,
      marginRight:       0,
      scale:             1,
      preferCSSPageSize: false,
    });
    if (!pdfResult?.data) throw new Error('PDF generation returned empty data.');

    return await pdfBase64ToPngDataUrl(pdfResult.data);
  } catch (err) {
    throw new Error(describeError(err));
  } finally {
    try { await chrome.debugger.detach({ tabId }); } catch (_) {}
  }
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// ── ZIP final ──────────────────────────────────────────────────────
function sanitizeForFileName(url) {
  return url.replace(/^https?:\/\//, '').replace(/[/\\:*?"<>|\x00-\x1f]/g, '_').slice(0, 80);
}

function formatDateTimeForFileName(date) {
  const yy  = String(date.getFullYear()).slice(-2);
  const mm  = String(date.getMonth() + 1).padStart(2, '0');
  const dd  = String(date.getDate()).padStart(2, '0');
  const hh  = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yy}${mm}${dd}-${hh}${min}`;
}

function buildBatchZipFileName(date = new Date()) {
  return `batch-screenshots_${formatDateTimeForFileName(date)}.zip`;
}

/**
 * Monta um único .zip com todas as capturas bem-sucedidas (nomeadas pela
 * URL de origem) + um errors.txt listando o que falhou, se houver falha.
 * fflate (vendorizado em lib/fflate.esm.js) é carregado sob demanda, só
 * quando o usuário efetivamente baixa o resultado.
 */
async function buildResultsZip(results) {
  const { zipSync } = await import('../lib/fflate.esm.js');

  const files = {};
  const usedNames = new Set();
  let successIndex = 0;

  for (const result of results) {
    if (result.status !== 'success' || !result.blob) continue;
    successIndex += 1;
    let name = `${sanitizeForFileName(result.url)}.png`;
    if (usedNames.has(name)) {
      name = `${sanitizeForFileName(result.url)}_${successIndex}.png`;
    }
    usedNames.add(name);
    files[name] = new Uint8Array(await result.blob.arrayBuffer());
  }

  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    const report = errors.map(e => `${e.url}\n  ${e.errorMessage}`).join('\n\n');
    files['errors.txt'] = new TextEncoder().encode(report);
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped], { type: 'application/zip' });
}

export function run() {}
