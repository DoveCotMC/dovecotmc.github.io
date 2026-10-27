// Each page loads its own flat-key JSON file plus the shared navigation/footer file.
(() => {
  const script = document.currentScript;
  const siteRoot = new URL('.', script.src);
  const supported = new Set(['zh_CN', 'en']);
  const cache = new Map();
  const textKeys = new WeakMap();
  const attributeKeys = new WeakMap();
  const attributes = ['aria-label', 'aria-roledescription', 'alt', 'placeholder', 'title'];
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  let requestedLanguage = 'zh_CN';
  let requestNumber = 0;
  let offlineCatalogPromise;

  try {
    const saved = localStorage.getItem('dovecot-language');
    if (supported.has(saved)) requestedLanguage = saved;
  } catch { /* Storage may be unavailable. */ }
  const languageInUrl = new URL(location.href).searchParams.get('lang');
  if (supported.has(languageInUrl)) requestedLanguage = languageInUrl;

  function pageName() {
    return document.querySelector('[data-i18n-page]')?.dataset.i18nPage || 'index';
  }

  function offlineCatalog() {
    if (!offlineCatalogPromise) {
      offlineCatalogPromise = new Promise((resolve, reject) => {
        const fallbackScript = document.createElement('script');
        fallbackScript.src = new URL('lang/offline-bundle.js', siteRoot).href;
        fallbackScript.onload = () => {
          if (window.dovecotOfflineLanguages) resolve(window.dovecotOfflineLanguages);
          else reject(new Error('The offline language bundle is empty'));
        };
        fallbackScript.onerror = () => reject(new Error('Could not load the offline language bundle'));
        document.head.append(fallbackScript);
      }).catch(error => {
        offlineCatalogPromise = undefined;
        throw error;
      });
    }
    return offlineCatalogPromise;
  }

  async function loadOffline(scope, language) {
    const catalog = await offlineCatalog();
    const dictionary = catalog[scope]?.[language];
    if (!dictionary) throw new Error(`Missing offline language: ${scope}/${language}`);
    return dictionary;
  }

  function load(scope, language) {
    const path = `lang/${scope}/${language}.json`;
    if (!cache.has(path)) {
      const dictionary = location.protocol === 'file:'
        ? loadOffline(scope, language)
        : fetch(new URL(path, siteRoot)).then(response => {
          if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
          return response.json();
        }).catch(error => {
          console.warn(`Could not fetch ${path}; using the generated fallback:`, error);
          return loadOffline(scope, language);
        });
      cache.set(path, dictionary.catch(error => {
        cache.delete(path);
        throw error;
      }));
    }
    return cache.get(path);
  }

  async function dictionaries(page, language) {
    const [commonSource, pageSource, commonTarget, pageTarget] = await Promise.all([
      load('common', 'zh_CN'), load(page, 'zh_CN'),
      load('common', language), load(page, language),
    ]);
    return {
      source: { ...commonSource, ...pageSource },
      target: { ...commonTarget, ...pageTarget },
    };
  }

  function applyText(root, source, target) {
    const bySource = new Map();
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'string' && !bySource.has(normalize(value))) {
        bySource.set(normalize(value), key);
      }
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('script, style, .language-switch')) continue;
      const original = node.nodeValue;
      let binding = textKeys.get(node);
      const key = binding?.key || bySource.get(normalize(original));
      if (!key || typeof target[key] !== 'string') continue;
      if (!binding) {
        const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
        binding = { key, prefix: match[1], suffix: match[3] };
        textKeys.set(node, binding);
      }
      node.nodeValue = `${binding.prefix}${target[key]}${binding.suffix}`;
    }

    for (const element of [root, ...root.querySelectorAll('*')]) {
      let keys = attributeKeys.get(element);
      for (const attribute of attributes) {
        if (!element.hasAttribute(attribute)) continue;
        const key = keys?.[attribute] || bySource.get(normalize(element.getAttribute(attribute)));
        if (!key || typeof target[key] !== 'string') continue;
        if (!keys) {
          keys = {};
          attributeKeys.set(element, keys);
        }
        keys[attribute] = key;
        element.setAttribute(attribute, target[key]);
      }
    }
  }

  function updateControls(language) {
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
  }

  async function applyLanguage(language = requestedLanguage) {
    const currentRequest = ++requestNumber;
    const page = pageName();
    try {
      const { source, target } = await dictionaries(page, language);
      if (currentRequest !== requestNumber || page !== pageName()) return;
      applyText(document.querySelector('#container') || document.body, source, target);
      const activeSlide = document.querySelector('.home-carousel__slide:not([aria-hidden="true"])');
      const carouselStatus = document.querySelector('[data-carousel-status]');
      if (activeSlide && carouselStatus) carouselStatus.textContent = activeSlide.getAttribute('aria-label');
      const titleKey = page === 'index' ? 'index.home_page.title' : `${page}.page.title`;
      if (target[titleKey]) document.title = target[titleKey];
      const description = document.querySelector('meta[name="description"]');
      if (description && target['common.meta.description']) {
        description.content = target['common.meta.description'];
      }
      document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
      updateControls(language);
      document.dispatchEvent(new CustomEvent('dovecot:languagechange', { detail: { language, page } }));
    } catch (error) {
      console.warn('Could not load localization files:', error);
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-language]');
    if (!button || !supported.has(button.dataset.language)) return;
    requestedLanguage = button.dataset.language;
    let saved = false;
    try {
      localStorage.setItem('dovecot-language', requestedLanguage);
      saved = true;
    } catch { /* Fall back to a URL parameter when storage is unavailable. */ }
    const nextUrl = new URL(location.href);
    if (nextUrl.searchParams.has('lang') || !saved) {
      nextUrl.searchParams.set('lang', requestedLanguage);
      if (nextUrl.href !== location.href) {
        location.assign(nextUrl.href);
        return;
      }
    }
    location.reload();
  });
  document.addEventListener('dovecot:pagechange', () => applyLanguage());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLanguage(), { once: true });
  } else {
    applyLanguage();
  }
})();
