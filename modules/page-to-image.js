import { showToast } from '../lib/toast.js';

const MAX_PAGE_HEIGHT  = 25000;
const LAZY_SCROLL_WAIT = 1000;
const LAZY_BACK_WAIT   = 400;

let lastDataUrl = null;

export function init() {
  document.getElementById('pi-canvas-capture').addEventListener('click', captureCanvas);
  document.getElementById('pi-pdf-capture').addEventListener('click', capturePDF);
  document.getElementById('pi-download').addEventListener('click', downloadImage);
  document.getElementById('pi-copy-btn').addEventListener('click', copyImage);
}

// ── CanvasPNG — Page.captureScreenshot ────────────────────
async function captureCanvas() {
  setStatus('Starting…');
  disableCapture(true);
  document.getElementById('pi-preview').style.display = 'none';

  let tabId = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to capture.');
    tabId = tab.id;
    await chrome.debugger.attach({ tabId }, '1.3');

    setStatus('Loading page…');
    await evalInPage(tabId, 'window.scrollTo(0, document.body.scrollHeight)');
    await delay(LAZY_SCROLL_WAIT);
    await evalInPage(tabId, 'window.scrollTo(0, 0)');
    await delay(LAZY_BACK_WAIT);

    const { contentSize } = await chrome.debugger.sendCommand({ tabId }, 'Page.getLayoutMetrics', {});
    const finalW = Math.ceil(contentSize?.width  ?? 0);
    const finalH = Math.min(Math.ceil(contentSize?.height ?? 0), MAX_PAGE_HEIGHT);
    if (!finalW || !finalH) throw new Error('Could not determine page dimensions.');

    setStatus('Preparing capture…');
    try { await hideFixedElements(tabId); } catch (_) {}

    setStatus('Capturing…');
    const result = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: finalW, height: finalH, scale: 1 },
    });
    if (!result?.data) throw new Error('Screenshot returned empty data.');

    lastDataUrl = 'data:image/png;base64,' + result.data;
    showPreview(lastDataUrl);
    setStatus('Captured.');

  } catch (err) {
    handleError(err);
  } finally {
    if (tabId) {
      try { await restoreFixedElements(tabId); } catch (_) {}
      try { await chrome.debugger.detach({ tabId }); } catch (_) {}
    }
    disableCapture(false);
  }
}

// ── PDFtoPNG — Page.printToPDF + PDF.js ──────────────────
async function capturePDF() {
  setStatus('Preparing…');
  disableCapture(true);
  document.getElementById('pi-preview').style.display = 'none';

  let tabId = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab to capture.');
    tabId = tab.id;
    await chrome.debugger.attach({ tabId }, '1.3');

    setStatus('Analyzing page…');
    const { contentSize } = await chrome.debugger.sendCommand({ tabId }, 'Page.getLayoutMetrics', {});
    const finalW = Math.ceil(contentSize?.width  ?? 0);
    const finalH = Math.min(Math.ceil(contentSize?.height ?? 0), MAX_PAGE_HEIGHT);
    if (!finalW || !finalH) throw new Error('Could not determine page dimensions.');

    setStatus('Generating PDF…');
    const INCH = 96;
    const pdfResult = await chrome.debugger.sendCommand({ tabId }, 'Page.printToPDF', {
      printBackground:   true,
      paperWidth:        finalW / INCH,
      paperHeight:       finalH / INCH,
      marginTop:         0,
      marginBottom:      0,
      marginLeft:        0,
      marginRight:       0,
      scale:             1,
      preferCSSPageSize: false,
    });
    if (!pdfResult?.data) throw new Error('PDF generation returned empty data.');

    setStatus('Converting to image…');
    lastDataUrl = await pdfToImage(pdfResult.data);
    showPreview(lastDataUrl);
    setStatus('Captured.');

  } catch (err) {
    handleError(err);
  } finally {
    if (tabId) {
      try { await chrome.debugger.detach({ tabId }); } catch (_) {}
    }
    disableCapture(false);
  }
}

// ── PDF.js rendering ──────────────────────────────────────
async function pdfToImage(base64Data) {
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

// ── Hide / restore fixed elements ─────────────────────────
async function hideFixedElements(tabId) {
  await evalInPage(tabId, `(function(){
    var els=Array.from(document.querySelectorAll('*')).filter(function(el){
      var p=getComputedStyle(el).position;return p==='fixed'||p==='sticky';
    });
    els.forEach(function(el){
      el.setAttribute('data-wpc-vis',el.style.visibility||'');
      el.style.setProperty('visibility','hidden','important');
    });
  })()`);
}

async function restoreFixedElements(tabId) {
  await evalInPage(tabId, `(function(){
    document.querySelectorAll('[data-wpc-vis]').forEach(function(el){
      el.style.visibility=el.getAttribute('data-wpc-vis');
      el.removeAttribute('data-wpc-vis');
    });
  })()`);
}

// ── Helpers ───────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function evalInPage(tabId, expression) {
  await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', { expression, silent: true });
}

function handleError(err) {
  const msg = err.message ?? '';
  if (msg.includes('Another debugger') || msg.includes('already attached'))
    setStatus('Close DevTools on this tab first.');
  else if (msg.includes('Cannot access') || msg.includes('chrome://'))
    setStatus('Cannot capture system pages (chrome://, etc.).');
  else
    setStatus('Error: ' + msg);
}

// ── Preview buttons ───────────────────────────────────────
function downloadImage() {
  if (!lastDataUrl) return;
  const now = new Date();
  const ts  = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  chrome.downloads.download({ url: lastDataUrl, filename: `screenshot-${ts}.png`, saveAs: false })
    .catch(err => showToast('Download failed: ' + err.message));
}

async function copyImage() {
  if (!lastDataUrl) return;
  const btn = document.getElementById('pi-copy-btn');
  try {
    const res  = await fetch(lastDataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    btn.textContent = 'Copied ✔';
    setTimeout(() => { btn.textContent = 'Copy Image'; }, 1500);
  } catch {
    btn.textContent = 'Copy failed';
    setTimeout(() => { btn.textContent = 'Copy Image'; }, 1500);
  }
}

// ── UI helpers ────────────────────────────────────────────
function showPreview(dataUrl) {
  document.getElementById('pi-preview').style.display = '';
  document.getElementById('pi-img').src = dataUrl;
}

function setStatus(msg) {
  const el = document.getElementById('pi-status');
  el.textContent   = msg;
  el.style.display = msg ? '' : 'none';
}

function disableCapture(disabled) {
  document.getElementById('pi-canvas-capture').disabled = disabled;
  document.getElementById('pi-pdf-capture').disabled    = disabled;
}

export function run() {}
