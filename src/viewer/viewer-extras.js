export function safeFilename(value) {
  const name = String(value || 'Canvas PDF').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').slice(0,180) || 'Canvas PDF';
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

export function wireTheme({ select, root = document.documentElement, media = matchMedia('(prefers-color-scheme: dark)') }) {
  function apply() {
    root.dataset.theme = select.value === 'system' ? (media.matches ? 'dark' : 'light') : select.value;
  }
  select.addEventListener('change', apply);
  media.addEventListener('change', apply);
  apply();
}
