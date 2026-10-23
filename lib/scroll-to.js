// scrollToSelectorFn — injected into page context via chrome.scripting.executeScript
// Must be self-contained (no outer-scope references)
export function scrollToSelectorFn(sel) {
  try {
    const el = document.querySelector(sel);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.getElementById('wpc-focus-style')?.remove();
    const st = document.createElement('style');
    st.id = 'wpc-focus-style';
    st.textContent = `
      @keyframes wpc-focus-pulse {
        0%   { outline-color: rgba(123,110,246,1);  box-shadow: 0 0 0 0   rgba(123,110,246,.6); }
        50%  { outline-color: rgba(123,110,246,.6); box-shadow: 0 0 0 8px rgba(123,110,246,0);  }
        100% { outline-color: rgba(123,110,246,1);  box-shadow: 0 0 0 0   rgba(123,110,246,.6); }
      }
      [data-wpc-focus] {
        outline: 2px solid #7B6EF6 !important;
        outline-offset: 4px !important;
        animation: wpc-focus-pulse 0.9s ease 3 !important;
      }
    `;
    document.head.appendChild(st);
    el.setAttribute('data-wpc-focus', '1');

    setTimeout(() => {
      el.removeAttribute('data-wpc-focus');
      document.getElementById('wpc-focus-style')?.remove();
    }, 3200);
  } catch (_) {}
}

// Popup-side helper — calls the page-context function
export async function scrollToElement(tabId, selector) {
  if (!tabId || !selector) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: scrollToSelectorFn,
      args: [selector],
    });
  } catch (_) {}
}
