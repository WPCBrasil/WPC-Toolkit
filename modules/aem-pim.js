function flashCopied(btn) {
  const orig = btn.textContent;
  btn.textContent = '✓';
  setTimeout(() => { btn.textContent = orig; }, 1400);
}

export function init() {
  const panel = document.getElementById('tab-aem-pim');
  if (!panel) return;

  panel.querySelectorAll('[data-pim-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.pimCopy).then(() => flashCopied(btn));
    });
  });
}
