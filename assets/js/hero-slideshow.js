(() => {
  const slides = [...document.querySelectorAll('.hero--slideshow .hero__slide')];
  if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pendingLoads = new Map();
  const loadSlide = index => {
    const slide = slides[index];
    if (!slide.dataset.src || slide.dataset.loaded === 'true') return Promise.resolve();
    if (pendingLoads.has(index)) return pendingLoads.get(index);
    const pending = new Promise(resolve => {
      const done = () => { slide.dataset.loaded = 'true'; resolve(); };
      slide.addEventListener('load', done, { once: true });
      slide.addEventListener('error', done, { once: true });
      slide.src = slide.dataset.src;
    });
    pendingLoads.set(index, pending);
    return pending;
  };

  let current = 0;
  const advance = async () => {
    const next = (current + 1) % slides.length;
    await loadSlide(next);
    slides[current].classList.remove('is-active');
    slides[next].classList.add('is-active');
    current = next;
    loadSlide((current + 1) % slides.length);
    window.setTimeout(advance, 3000);
  };

  window.addEventListener('load', () => {
    loadSlide(1);
    window.setTimeout(advance, 3000);
  }, { once: true });
})();
