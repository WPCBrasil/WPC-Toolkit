// Video Check — content script (ported from qa-video/content.js)
// Injetado sob demanda via chrome.scripting.executeScript pelo modules/video-check.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "detect_videos") {
    const foundVideos = [];

    const getSelector = (el) => {
      if (el.id) return `#${el.id}`;
      if (el.className && typeof el.className === 'string') {
        return '.' + el.className.trim().split(/\s+/).join('.');
      }
      return null;
    };

    const brightcoveImgs = document.querySelectorAll('.Gallery_ytVideoContainer__zvfxP img, [data-video-id], iframe[src*="brightcove.net"]');
    brightcoveImgs.forEach((el, index) => {
      let videoId = el.getAttribute('alt') || el.getAttribute('data-video-id');
      let accountId = "923227797001";

      if (!videoId && el.tagName === 'IFRAME') {
        const match = el.src.match(/videoId=(\d+)/);
        if (match) videoId = match[1];
        const accMatch = el.src.match(/players\.brightcove\.net\/(\d+)/);
        if (accMatch) accountId = accMatch[1];
      }

      if (videoId && /^\d+$/.test(videoId)) {
        const targetClass = `qa-video-target-${index}`;
        el.classList.add(targetClass);

        const clickableEl = el.closest('.Gallery_ytVideoContainer__zvfxP') || el.closest('button');
        let clickableClass = null;
        if (clickableEl) {
          clickableClass = `qa-clickable-target-${index}`;
          clickableEl.classList.add(clickableClass);
        }

        foundVideos.push({
          type: 'BRIGHTCOVE',
          videoId: videoId,
          accountId: accountId,
          targetClass: targetClass,
          clickableClass: clickableClass
        });
      }
    });

    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    youtubeIframes.forEach((iframe, index) => {
      const match = iframe.src.match(/(?:embed\/|v\/|watch\?v=)([^#\&\?]{11})/);
      if (match) {
        const classId = `qa-yt-target-${index}`;
        iframe.classList.add(classId);
        foundVideos.push({
          type: 'YOUTUBE',
          videoId: match[1],
          targetClass: classId,
          clickableClass: null
        });
      }
    });

    const uniqueVideos = [];
    const seenIds = new Set();
    foundVideos.forEach(v => {
      if (!seenIds.has(v.videoId)) {
        seenIds.add(v.videoId);
        uniqueVideos.push(v);
      }
    });

    sendResponse({ videos: uniqueVideos, url: window.location.href });
  }

  if (request.action === "scroll_to_video") {
    const el = document.querySelector(`.${request.targetClass}`);
    const clickable = request.clickableClass ? document.querySelector(`.${request.clickableClass}`) : null;

    if (clickable) {
      clickable.scrollIntoView({ behavior: 'instant', block: 'center' });
      clickable.click();
      setTimeout(() => sendResponse({ scrolled: true }), 1500);
    } else if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      setTimeout(() => sendResponse({ scrolled: true }), 400);
    } else {
      sendResponse({ scrolled: false });
    }
    return true;
  }

  return true;
});
