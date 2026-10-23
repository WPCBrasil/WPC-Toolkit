import { showToast } from '../lib/toast.js';

const DEFAULT_GAS_URL  = 'https://script.google.com/macros/s/AKfycbzaOszSR3WDZLNM2DvsiEOBoXjT8djqY6M3UgMTyLJI6MPLZ-Kb5RB6sgzMjTkcqJRmgA/exec';
const DEFAULT_PRES_ID  = '1OgcvlQEXwNpE3ho--2KryxACNX_FTXiopJVLAKEQQfM';

async function translateText(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt|en`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error('Invalid response from translation API');
}

export function init() {
  const canvas      = document.getElementById('ss-canvas');
  const ctx         = canvas.getContext('2d');
  const placeholder = document.getElementById('ss-placeholder');
  const wrap        = document.getElementById('ss-canvasWrap');

  // Restore saved presentation ID (lastId takes precedence, then settings snapPresId, then default)
  chrome.storage.local.get(['lastId', 'snapPresId'], res => {
    document.getElementById('ss-presId').value = res.lastId || res.snapPresId || DEFAULT_PRES_ID;
  });

  // Paste listener — works in popup context
  document.addEventListener('paste', e => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const blob   = item.getAsFile();
      const reader = new FileReader();
      reader.onload = evt => {
        const img = new Image();
        img.onload = () => {
          canvas.width  = img.width;
          canvas.height = img.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          placeholder.style.display = 'none';
        };
        img.onerror = () => showToast('Invalid image data. Try copying again.');
        img.src = evt.target.result;
      };
      reader.onerror = () => showToast('Failed to read image from clipboard.');
      reader.readAsDataURL(blob);
      break;
    }
  });

  document.getElementById('ss-clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width  = 0;
    canvas.height = 0;
    placeholder.style.display = '';
    document.getElementById('ss-pageType').value   = '';
    document.getElementById('ss-errorDesc').value  = '';
  });

  document.getElementById('ss-slides').addEventListener('click', () => {
    const presId = document.getElementById('ss-presId').value.trim() || DEFAULT_PRES_ID;
    chrome.tabs.create({ url: `https://docs.google.com/presentation/d/${presId}/edit` });
  });

  document.getElementById('ss-send').addEventListener('click', () => sendToSlides(canvas));

  document.getElementById('ss-translate').addEventListener('click', async () => {
    const textarea = document.getElementById('ss-errorDesc');
    const text = textarea.value.trim();
    if (!text) return showToast('Type something in Error description first.');

    const btn = document.getElementById('ss-translate');
    btn.disabled = true;
    btn.textContent = '…';
    try {
      textarea.value = await translateText(text);
    } catch {
      showToast('Translation failed. Check your internet connection.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Translate';
    }
  });

  // Focus wrap on click so paste events land on document while tab is active
  wrap.addEventListener('click', () => wrap.focus());
}

async function sendToSlides(canvas) {
  const presId = document.getElementById('ss-presId').value.trim();

  if (!presId || canvas.width === 0) {
    return showToast('Paste an image and fill in the Presentation ID.');
  }

  // Persist presId for next session (same key as original extension)
  chrome.storage.local.set({ lastId: presId });

  const payload = {
    presentationId: presId,
    pageType:    document.getElementById('ss-pageType').value.trim() || 'N/A',
    category:    document.getElementById('ss-errorCat').value,
    description: document.getElementById('ss-errorDesc').value.trim() || 'Sem descrição',
    image:       canvas.toDataURL('image/png'),
  };

  const btn = document.getElementById('ss-send');
  btn.disabled    = true;
  btn.textContent = 'Sending…';

  try {
    const { snapGasUrl } = await chrome.storage.local.get(['snapGasUrl']);
    const gasUrl = snapGasUrl || DEFAULT_GAS_URL;
    const res  = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();

    if (text.trim() === 'OK') {
      document.getElementById('ss-errorDesc').value = '';
      showToast('Sent successfully! ✓');
      setTimeout(() => window.close(), 1200);
    } else {
      showToast('Send error: ' + text.slice(0, 80));
    }
  } catch (err) {
    console.error('[snapslide]', err);
    showToast('Error sending data. Check the Apps Script URL in Settings.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Send to Slides';
  }
}

export function run() {}
