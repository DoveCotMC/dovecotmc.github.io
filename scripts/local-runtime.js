// Classic-script enhancement for pages opened directly with file://.
if (location.protocol === 'file:') {
  const container = document.getElementById('container');
  const scaleFrame = document.getElementById('scale-frame');

  function scaleToViewport() {
    const scale = document.documentElement.clientWidth / 1280 * 0.9;
    document.documentElement.style.setProperty('--site-scale', String(scale));
    document.documentElement.style.setProperty('--100dvh', `${window.innerHeight / scale}px`);
    if (!CSS.supports('zoom', '1')) {
      container.style.transform = `scale(${scale})`;
      scaleFrame.style.height = `${container.scrollHeight * scale}px`;
    }
  }

  scaleToViewport();
  window.addEventListener('resize', scaleToViewport);
  document.fonts.ready.then(scaleToViewport);
  bindHomeCarousel(container);
}
