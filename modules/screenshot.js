const MAX_PAGE_HEIGHT  = 25000;
const LAZY_SCROLL_WAIT = 1000;
const LAZY_BACK_WAIT   = 400;

let lastDataUrl = null;

export function init() {
  document.getElementById('sc-canvas-capture').addEventListener('click', captureCanvas);
  document.getElementById('sc-pdf-capture').addEventListener('click', capturePDF);
  document.getElementById('sc-download').addEventListener('click', downloadCapture);
  document.getElementById('sc-copy').addEventListener('click', copyCapture);
}

// ── CanvasPNG — Page.captureScreenshot ────────────────────
async function captureCanvas() {
  setStatus('Starting…');
  disableButtons(true);
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
    showPreview('data:image/png;base64,' + result.data);

  } catch (err) {
    handleError(err);
  } finally {
    if (tabId) {
      try { await restoreFixedElements(tabId); } catch (_) {}
      try { await chrome.debugger.detach({ tabId }); } catch (_) {}
    }
    disableButtons(false);
  }
}

// ── PDFtoPNG — Page.printToPDF + PDF.js ──────────────────
async function capturePDF() {
  setStatus('Preparing…');
  disableButtons(true);
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
    showPreview(await pdfToImage(pdfResult.data));

  } catch (err) {
    handleError(err);
  } finally {
    if (tabId) {
      try { await chrome.debugger.detach({ tabId }); } catch (_) {}
    }
    disableButtons(false);
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
function evalInPage(tabId, expression) {
  return chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', { expression });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function handleError(err) {
  const msg = err.message ?? '';
  if (msg.includes('Another debugger') || msg.includes('already attached'))
    setStatus('Close DevTools on this tab and try again.');
  else if (msg.includes('Cannot access') || msg.includes('chrome-extension') || msg.includes('chrome://'))
    setStatus('Cannot capture system pages (chrome://, extensions, etc.).');
  else
    setStatus('Error: ' + msg);
}

// ── Download / copy ───────────────────────────────────────
function downloadCapture() {
  if (!lastDataUrl) return;
  const a = document.createElement('a');
  a.href     = lastDataUrl;
  a.download = `screenshot_${Date.now()}.png`;
  a.click();
}

async function copyCapture() {
  if (!lastDataUrl) return;
  const btn = document.getElementById('sc-copy');
  try {
    const res  = await fetch(lastDataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    btn.textContent = 'Copied ✔';
    setTimeout(() => { btn.textContent = 'Copy Image'; }, 1500);
  } catch {
    btn.textContent = 'Copy failed';
    setTimeout(() => { btn.textContent = 'Copy Image'; }, 1500);
  }
}

// ── UI helpers ────────────────────────────────────────────
function showPreview(dataUrl) {
  lastDataUrl = dataUrl;
  document.getElementById('sc-preview').style.display = '';
  document.getElementById('sc-img').src = dataUrl;
  setStatus('Captured.');
}

function setStatus(msg) {
  const el = document.getElementById('sc-status');
  el.textContent   = msg;
  el.style.display = msg ? '' : 'none';
}

function disableButtons(disabled) {
  document.getElementById('sc-canvas-capture').disabled = disabled;
  document.getElementById('sc-pdf-capture').disabled    = disabled;
}

export function run() {}
