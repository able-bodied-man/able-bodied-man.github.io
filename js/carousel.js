/*
 * Carousels - Embla Carousel 8.x (MIT), replacing Owl Carousel 2.x.
 *
 * Owl built its own DOM and printed its own nav/dots; Embla instead wants
 * root > track > slides and leaves the arrows to us, so this module builds that wrapper around
 * the existing markup (children are not touched) and creates the same arrow buttons the theme
 * had - same classes as before, restyled for the new markup in css/main.css.
 *
 * The three page carousels initialise here (a module script is deferred, so the DOM is ready).
 * The portfolio detail pages that load over AJAX have their own carousel; they call the factory
 * exposed as window.lmCarousel, since an injected inline script cannot import a module.
 *
 * The portfolio detail pages keep the old Owl class names on their arrows and dots (spec flag
 * legacyClasses) because css/main.css already styles that carousel through those names - cheaper
 * and lower-risk than duplicating those rules for what is demo content anyway. Everything else
 * uses the carousel-* names.
 *
 * Config per carousel mirrors what Owl was given before the swap:
 *   .text-rotation   one role word at a time, looping, fading, autoplay 3.8s
 *   .testimonials    one card below 768px, two above; arrows; no loop
 *   .clients         logos: 2 | 4 | 5 per view by breakpoint; arrows; no loop
 */
import EmblaCarousel from './embla/embla.js';

const BREAKPOINTS = { sm: '(min-width: 768px)', lg: '(min-width: 1200px)' };

function slidesPerView(spec) {
  const w = window.innerWidth;
  if (spec.perView) {
    if (w >= 1200) { return spec.perView.lg; }
    if (w >= 768) { return spec.perView.md; }
    return spec.perView.sm;
  }
  return 1;
}

function buildNav(root, legacy) {
  const nav = document.createElement('div');
  nav.className = legacy ? 'owl-nav' : 'carousel-nav';
  ['prev', 'next'].forEach((dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = legacy ? 'owl-' + dir : 'carousel-nav__btn carousel-nav__' + dir;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous slide' : 'Next slide');
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true') { return; }
      const api = root.lmCarousel;
      if (api) { dir === 'prev' ? api.scrollPrev() : api.scrollNext(); }
    });
    nav.appendChild(btn);
  });
  root.appendChild(nav);
  return nav;
}

function buildDots(root, embla, legacy) {
  const dots = document.createElement('div');
  dots.className = legacy ? 'owl-dots' : 'carousel-dots';
  const snaps = embla.scrollSnapList();
  snaps.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = legacy ? 'owl-dot' : 'carousel-dot';
    if (legacy) { dot.appendChild(document.createElement('span')); }
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.addEventListener('click', () => embla.scrollTo(i));
    dots.appendChild(dot);
  });
  root.appendChild(dots);
  const sync = () => {
    const current = embla.selectedScrollSnap();
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('is-active', i === current));
  };
  embla.on('select', sync);
  embla.on('reInit', sync);
  sync();
  return dots;
}

function setup(root, spec) {
  if (root.lmCarousel) { return root.lmCarousel; }

  const kids = Array.from(root.children).filter((el) => el.nodeType === 1 && !el.classList.contains('carousel-nav'));
  const track = document.createElement('div');
  track.className = 'carousel-track';
  kids.forEach((el) => { el.classList.add('carousel-slide'); track.appendChild(el); });
  root.classList.add('carousel');
  root.insertBefore(track, root.firstChild);

  const plugins = [];

  // Embla's first argument is the ROOT; its first element child must be the container.
  const embla = EmblaCarousel(root, {
    loop: !!spec.loop,
    align: 'start',
    containScroll: spec.loop ? false : 'trimSnaps',
    slidesToScroll: 1,
    draggable: true,
    plugins: plugins
  });

  if (spec.fade) {
    // Owl ran the theme's own animateOut/animateIn pair here: the leaving word played
    // .animated-section-scaleDown (fade to opacity 0 while shrinking to scale .8, .7s) and the
    // arriving word played .animated-section-scaleUp (from opacity 0 / scale .8, .7s). Reuse those
    // exact classes so the effect, its timing and its keyframes are the ones already in the theme.
    root.classList.add('carousel-fade');
    const sizeRoot = () => { root.style.height = kids[0].offsetHeight + 'px'; };
    let current = -1;

    const swap = () => {
      const next = embla.selectedScrollSnap();
      if (next === current) { return; }
      const prev = current;
      current = next;
      kids.forEach((el, i) => {
        el.classList.remove('animated-section-scaleUp', 'animated-section-scaleDown');
        el.classList.toggle('is-active', i === next);
        if (i === next) {
          if (prev !== -1) {
            void el.offsetWidth; // restart the animation from its first keyframe
            el.classList.add('animated-section-scaleUp');
            el.addEventListener('animationend', function done() {
              el.classList.remove('animated-section-scaleUp');
              el.removeEventListener('animationend', done);
            }, { once: true });
          }
        } else if (i === prev) {
          // the leaving word has to stay visible while it animates out
          el.classList.add('is-active', 'animated-section-scaleDown');
          el.addEventListener('animationend', function done() {
            el.classList.remove('animated-section-scaleDown', 'is-active');
            el.removeEventListener('animationend', done);
          }, { once: true });
        }
      });
    };

    embla.on('select', swap);
    embla.on('reInit', () => { sizeRoot(); swap(); });
    sizeRoot();
    swap();
    window.addEventListener('resize', sizeRoot);
  }

  if (spec.autoplay) {
    // Owl ran with autoplayTimeout: 3800 and autoplayHoverPause: false, so this is a plain
    // interval that keeps ticking - it just stands down while the section is hidden.
    const timer = setInterval(() => {
      if (root.offsetParent !== null) { embla.scrollNext(); }
    }, spec.autoplay);
    root.lmCarouselTimer = timer;
  }

  const nav = spec.arrows === false ? null : buildNav(root, spec.legacyClasses);
  const prev = nav && nav.firstChild;
  const next = nav && nav.lastChild;
  if (spec.dots) { buildDots(root, embla, spec.legacyClasses); }

  // keep the arrows in step with the scroll position, marking the ends aria-disabled so the
  // look is unchanged from Owl's version (which greyed nothing out either) but the ends do nothing
  const update = () => {
    if (!nav) { return; }
    const atStart = !embla.canScrollPrev();
    const atEnd = !embla.canScrollNext();
    prev.setAttribute('aria-disabled', spec.loop ? 'false' : String(atStart));
    next.setAttribute('aria-disabled', spec.loop ? 'false' : String(atEnd));
    root.classList.toggle('is-at-start', !spec.loop && atStart);
    root.classList.toggle('is-at-end', !spec.loop && atEnd);
  };
  embla.on('select', update);
  embla.on('reInit', update);
  update();

  root.lmCarousel = {
    embla: embla,
    scrollPrev: () => embla.scrollPrev(),
    scrollNext: () => embla.scrollNext(),
    destroy: () => { embla.destroy(); root.lmCarousel = null; }
  };
  return root.lmCarousel;
}

const SPECS = [
  // the rotation never had controls: Owl was configured with nav: false and dots: false
  { sel: '.text-rotation',   spec: { loop: true,  autoplay: 3800, fade: true, arrows: false, dots: false } },
  { sel: '.testimonials',    spec: { loop: false, perView: { sm: 1, md: 2, lg: 2 } } },
  { sel: '.clients',         spec: { loop: false, perView: { sm: 2, md: 4, lg: 5 } } }
];

function initPageCarousels() {
  SPECS.forEach(({ sel, spec }) => {
    const el = document.querySelector(sel);
    if (el) { setup(el, spec); }
  });
}

function watchSectionVisibility() {
  const sections = Array.from(document.querySelectorAll('.animated-section'));
  if (!sections.length || !window.MutationObserver) { return; }
  // the theme animates sections with inline styles, so attribute mutations fire constantly;
  // act only when a section actually crosses between hidden and visible, otherwise Embla is
  // re-initialised continuously and the autoplay timer never gets to mature
  const visible = new Map(sections.map((s) => [s, s.offsetParent !== null]));
  const refresh = (section) => {
    section.querySelectorAll('.carousel').forEach((el) => {
      if (el.lmCarousel && el.lmCarousel.embla) { el.lmCarousel.embla.reInit(); }
    });
  };
  let queued = false;
  const check = () => {
    queued = false;
    sections.forEach((section) => {
      const now = section.offsetParent !== null;
      if (now === visible.get(section)) { return; }
      visible.set(section, now);
      if (now) { refresh(section); }
    });
  };
  const observer = new MutationObserver(() => {
    if (queued) { return; }
    queued = true;
    requestAnimationFrame(check);
  });
  sections.forEach((section) => observer.observe(section, { attributes: true, attributeFilter: ['class', 'style'] }));
}


initPageCarousels();
watchSectionVisibility();

window.lmCarousel = { setup: setup, specs: SPECS, initPageCarousels: initPageCarousels };
