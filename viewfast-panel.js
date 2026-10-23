chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];

  if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('edge://')) {
    document.body.innerHTML = "<p style='color:#8E8EBA;padding:20px;text-align:center'>This page cannot be previewed.</p>";
    return;
  }

  const frame    = document.getElementById('vf-frame');
  const urlInput = document.getElementById('vf-url');

  urlInput.value = currentTab.url;
  frame.src = currentTab.url;

  function loadUrl() {
    const raw = urlInput.value.trim();
    if (!raw) return;
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    urlInput.style.borderColor = '#62A6F8';
    frame.src = url;
    frame.onload = () => { urlInput.style.borderColor = ''; };
  }

  document.getElementById('vf-search').addEventListener('click', loadUrl);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl(); });

  document.getElementById('vf-refresh').addEventListener('click', () => {
    urlInput.style.borderColor = '#62A6F8';
    frame.src = frame.src; // eslint-disable-line no-self-assign
    frame.onload = () => { urlInput.style.borderColor = ''; };
  });
});
