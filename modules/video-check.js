// Video Check — valida status de vídeos Brightcove/YouTube e gera evidência
// carimbada para QA. Ported from qa-video (popup.js + content.js + background.js),
// sem alterar nenhuma funcionalidade — apenas integrado ao layout/módulos da WPC Hub.

const CONTENT_SCRIPT_FILE = 'scripts/video-check-content.js';

let vcImages = []; // stamped dataURLs from the last run, indexed like the cards

export function init() {
  const btn = document.getElementById('vc-scan');
  if (!btn) return;
  btn.addEventListener('click', runVideoCheck);

  const resultsEl = document.getElementById('vc-results');
  if (resultsEl) resultsEl.addEventListener('click', onResultsClick);
}

function onResultsClick(e) {
  const copyBtn = e.target.closest('.vc-copy');
  if (copyBtn) copyEvidence(copyBtn);
}

async function runVideoCheck() {
  const statusEl   = document.getElementById('vc-status');
  const statusText = document.getElementById('vc-status-text');
  const resultsEl  = document.getElementById('vc-results');

  statusText.textContent = 'Analyzing page and generating evidence...';
  statusEl.style.display = '';
  resultsEl.innerHTML = '';
  vcImages = [];

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [CONTENT_SCRIPT_FILE]
  });

  chrome.tabs.sendMessage(tab.id, { action: "detect_videos" }, async (response) => {
    if (!response || !response.videos || response.videos.length === 0) {
      statusEl.style.display = 'none';
      resultsEl.innerHTML = `<div class="vc-empty">No videos found on this page.</div>`;
      return;
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
    let htmlResults = '';

    for (let i = 0; i < response.videos.length; i++) {
      const video = response.videos[i];
      let statusInfo = {};

      if (video.type === 'BRIGHTCOVE') {
        statusInfo = await checkBrightcoveStatus(video.accountId, video.videoId);
      } else if (video.type === 'YOUTUBE') {
        statusInfo = await checkYouTubeStatus(video.videoId);
      }

      if (video.targetClass) {
        await new Promise((res) => {
          chrome.tabs.sendMessage(tab.id, {
            action: "scroll_to_video",
            targetClass: video.targetClass,
            clickableClass: video.clickableClass
          }, res);
        });
      }

      const extraBuffer = video.clickableClass ? 2500 : 500;
      await new Promise(r => setTimeout(r, extraBuffer));

      const rawScreenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      const stampedImage = await addWatermarkSingle(rawScreenshot, timestamp, response.url, video, statusInfo);

      const isOk = statusInfo.available;
      const badgeClass = isOk ? 'badge-success' : 'badge-error';
      const badgeText = isOk ? '✅ PUBLIC / ACTIVE' : '❌ UNAVAILABLE / PRIVATE';

      vcImages[i] = stampedImage;

      htmlResults += `
        <div class="vc-card">
          <div class="vc-card-head">
            <strong>Video ${i + 1} of ${response.videos.length}</strong>
            <span class="status-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="vc-card-body">
            <strong>Platform:</strong> ${video.type}<br>
            <strong>Video ID:</strong> <code>${video.videoId}</code>
            <div class="meta-text">
              <strong>Checked at:</strong> ${timestamp}<br>
              <strong>API Status:</strong> ${statusInfo.code}
            </div>
            <img id="vc-previewImg_${i}" class="vc-preview" src="${stampedImage}" />
            <div class="vc-actions-row">
              <a href="${stampedImage}" download="evidence-${video.type}-${video.videoId}.png" class="btn-ghost vc-download">Download PNG</a>
              <button type="button" class="btn-ghost vc-copy" data-index="${i}">Copy Image</button>
            </div>
          </div>
        </div>
      `;
    }

    statusEl.style.display = 'none';
    resultsEl.innerHTML = htmlResults;
  });
}

async function copyEvidence(btn) {
  const idx = Number(btn.dataset.index);
  const dataUrl = vcImages[idx];
  if (!dataUrl) return;

  const originalLabel = 'Copy Image';
  try {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    btn.textContent = 'Copied ✔';
    setTimeout(() => { btn.textContent = originalLabel; }, 1500);
  } catch {
    btn.textContent = 'Copy failed';
    setTimeout(() => { btn.textContent = originalLabel; }, 1500);
  }
}

function checkBrightcoveStatus(accountId, videoId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "check_brightcove", accountId, videoId },
      (response) => resolve(response || { available: false, code: 'BG_ERROR' })
    );
  });
}

function checkYouTubeStatus(videoId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "check_youtube", videoId },
      (response) => resolve(response || { available: false, code: 'BG_ERROR' })
    );
  });
}

function addWatermarkSingle(dataUrl, dateText, pageUrl, video, statusInfo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);

      const bannerHeight = 90;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, bannerHeight);

      const statusColor = statusInfo.available ? '#00FF66' : '#FF3333';
      const statusText = statusInfo.available ? 'ACTIVE / PUBLIC' : 'UNAVAILABLE / PRIVATE';

      ctx.fillStyle = statusColor;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`[QA EVIDENCE]: VIDEO ${statusText}`, 20, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Platform: ${video.type}  |  ID: ${video.videoId}  |  API Status: ${statusInfo.code}`, 20, 54);

      ctx.fillStyle = '#CCCCCC';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Date/Time: ${dateText}  |  URL: ${pageUrl.substring(0, 90)}...`, 20, 75);

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export function run() {}
