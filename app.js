import { SitePage, routes } from './components.js';
import { bindHomeCarousel } from './carousel.js';

const container = document.getElementById('container');
const normalizePath = pathname => pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
let revealObserver;
let disposeCarousel = () => {};
document.documentElement.classList.add('js-enabled');

function bindDesignMotion() {
  revealObserver?.disconnect();
  const inViewTargets = container.querySelectorAll('[data-reveal="in-view"]');
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        // Exit=None: reset only after leaving view, so the next entrance
        // can replay the original 600ms opacity fade without a fade-out.
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      }
    }, { threshold: 0 });
    inViewTargets.forEach(target => revealObserver.observe(target));
  } else {
    inViewTargets.forEach(target => target.classList.add('is-visible'));
  }
  const pageLoadTargets = container.querySelectorAll('[data-reveal="page-load"]');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pageLoadTargets.forEach(target => target.classList.add('is-visible'));
  }));
}

export function scaleToViewport() {
  const scale = document.documentElement.clientWidth / 1280 * 0.9;
  document.documentElement.style.setProperty('--site-scale', String(scale));
  document.documentElement.style.setProperty('--100dvh', `${window.innerHeight / scale}px`);
  if (!CSS.supports('zoom', '1')) {
    container.style.transform = `scale(${scale})`;
    document.getElementById('scale-frame').style.height = `${container.scrollHeight * scale}px`;
  }
}

function activatePage(pathname, { scrollToTop = true } = {}) {
  scaleToViewport();
  if (scrollToTop) window.scrollTo(0, 0);
  bindDesignMotion();
  disposeCarousel = bindHomeCarousel(container);
  document.dispatchEvent(new CustomEvent('dovecot:pagechange', { detail: { path: normalizePath(pathname) } }));
}

function render(pathname, options) {
  const normalizedPath = normalizePath(pathname);
  const page = SitePage(normalizedPath);
  disposeCarousel();
  container.innerHTML = page.html;
  container.dataset.staticPath = normalizedPath;
  container.dataset.i18nPage = ({ '/': 'index', '/nextrain': 'nextrain', '/nether-portal': 'nether-portal', '/metropolis': 'metropolis' })[normalizedPath] || 'index';
  document.title = page.title;
  activatePage(normalizedPath, options);
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, location.href);
  if (link.target === '_blank' || url.origin !== location.origin || !routes.includes(normalizePath(url.pathname))) return;
  event.preventDefault();
  const nextPath = normalizePath(url.pathname);
  if (nextPath !== normalizePath(location.pathname)) history.pushState({}, '', nextPath);
  render(nextPath);
});

window.addEventListener('popstate', () => render(location.pathname));
let resizeFrame;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(scaleToViewport);
});
document.fonts.ready.then(scaleToViewport);
const initialPath = normalizePath(location.pathname);
if (container.dataset.staticPath === initialPath ||
    (container.dataset.staticPath === '/' && !routes.includes(initialPath))) {
  activatePage(initialPath, { scrollToTop: false });
} else {
  render(initialPath, { scrollToTop: false });
}
