export function bindHomeCarousel(container) {
  const carousel = container.querySelector('[data-component="home-carousel"]');
  if (!carousel) return () => {};
  const viewport = carousel.querySelector('.home-carousel__viewport');
  const slides = [...carousel.querySelectorAll('.home-carousel__slide')];
  const indicators = [...carousel.querySelectorAll('[data-carousel-index]')];
  const status = carousel.querySelector('[data-carousel-status]');
  const controller = new AbortController();
  const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: controller.signal });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let scrollFrame;
  let drag;
  let suppressClick = false;

  function updatePosition() {
    const next = Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    if (next === current) return;
    current = next;
    slides.forEach((slide, index) => {
      slide.inert = index !== current;
      if (index === current) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });
    indicators.forEach((button, index) => {
      if (index === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    status.textContent = slides[current].getAttribute('aria-label');
  }

  function goTo(index) {
    const next = (index + slides.length) % slides.length;
    viewport.scrollTo({ left: next * viewport.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  listen(viewport, 'scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updatePosition);
  }, { passive: true });
  carousel.querySelectorAll('[data-carousel-step]').forEach(button => {
    listen(button, 'click', () => goTo(current + Number(button.dataset.carouselStep)));
  });
  indicators.forEach(button => listen(button, 'click', () => goTo(Number(button.dataset.carouselIndex))));
  listen(carousel, 'keydown', event => {
    const destination = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 }[event.key];
    if (destination === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    goTo(destination);
  });

  // Trackpads and touch use native horizontal scrolling. Mouse dragging also
  // moves the same scroll container, while normal clicks retain source links.
  listen(viewport, 'dragstart', event => event.preventDefault());
  listen(viewport, 'pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, active: false };
  });
  listen(viewport, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = event.clientX - drag.x;
    if (!drag.active) {
      if (Math.abs(distance) < 6 || Math.abs(distance) <= Math.abs(event.clientY - drag.y)) return;
      drag.active = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    event.preventDefault();
    const scale = viewport.getBoundingClientRect().width / viewport.clientWidth;
    viewport.scrollLeft = drag.left - distance / scale;
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const active = drag.active;
    drag = undefined;
    if (!active) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    goTo(Math.round(viewport.scrollLeft / viewport.clientWidth));
  }
  listen(viewport, 'pointerup', finishDrag);
  listen(viewport, 'pointercancel', finishDrag);
  listen(viewport, 'pointerleave', event => { if (drag && !drag.active) drag = undefined; });
  listen(viewport, 'click', event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });

  return () => {
    controller.abort();
    cancelAnimationFrame(scrollFrame);
  };
}
