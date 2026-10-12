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

/*
 * The role rotation is a text rotator, not a carousel anyone navigates: one word in place, no
 * dragging, no arrows. Embla positioned its slides, and that positioning showed up in the
 * animation's start transform (the words carried a slide-width translate, so they slid sideways
 * while they faded). Owl's version carried none. So this one runs without a carousel library at
 * all - just the theme's own scaleUp/scaleDown classes and a 3.8s timer, exactly as Owl did.
 */
function setupRotation(root, kids, spec) {
  root.classList.add('carousel', 'carousel-fade');
  const track = root.querySelector('.carousel-track');
  const sizeRoot = () => { root.style.height = kids[0].offsetHeight + 'px'; };
  const THRESHOLD = 40; // deliberate gesture distance, in px

  let current = 0;
  let timer = null;
  let dragging = false;
  let startX = 0;
  let dx = 0;
  // bumped on every drag start; deferred callbacks (spring-back, layout restore) capture it and
  // bail out if a newer drag has begun. Without this a stale timer fires mid-drag, drops the row
  // layout while the pointer is still moving, and the move handler then offsets the stacked
  // layout by whole slide widths - which sends every word off screen.
  let dragGeneration = 0;

  const clear = (el) => el.classList.remove('animated-section-scaleUp', 'animated-section-scaleDown');

  const play = (el, cls) => {
    void el.offsetWidth; // restart from the first keyframe
    el.classList.add(cls);
    el.addEventListener('animationend', function done() {
      el.classList.remove(cls);
      el.removeEventListener('animationend', done);
    }, { once: true });
  };

  // move one word: step is +1 for the next, -1 for the previous.
  // returns the word that arrived, so a caller can wait for its entry animation.
  const go = (step, animate) => {
    const fade = animate !== false;
    const prev = current;
    current = (current + step + kids.length) % kids.length;
    kids.forEach((el, i) => {
      clear(el);
      el.classList.toggle('is-active', i === current);
      if (i === current) {
        if (fade) { play(el, 'animated-section-scaleUp'); }
      } else if (i === prev) {
        if (!fade) { return; } // no fade: the slide carries it
        el.classList.add('is-active'); // stays visible while it animates out
        play(el, 'animated-section-scaleDown');
        el.addEventListener('animationend', function done() {
          el.removeEventListener('animationend', done);
          if (i === current) { return; } // it came back as the current word; leave it alone
          el.classList.remove('is-active');
        }, { once: true });
      }
    });
    return kids[current];
  };

  // while dragging the words are laid out side by side, so the track has to sit at the current
  // word's slot plus the drag offset; releasing returns it to the stacked fade layout
  const trackOffset = () => {
    const w = root.clientWidth || root.offsetWidth || 1;
    return 'translate3d(' + (-current * w + dx) + 'px, 0px, 0px)';
  };

  const beginDragLayout = () => {
    dragGeneration++;
    // a word caught mid-fade would otherwise drag at its animated opacity; Owl's items were
    // always fully visible while dragging, so settle the transition first
    kids.forEach((el, i) => { clear(el); el.classList.toggle('is-active', i === current); });
    root.classList.add('is-dragging', 'is-row-layout');
    track.style.transition = 'none';
    track.style.transform = trackOffset();
  };

  // back to the stacked layout the fade needs - only safe once nothing is animating, otherwise
  // a half-faded word would jump sideways when the layout changes under it
  const endDragLayout = () => {
    if (dragging) { return; } // never while the pointer is still down
    root.classList.remove('is-dragging', 'is-row-layout');
    track.style.transition = 'none';
    track.style.transform = 'translate3d(0px, 0px, 0px)';
  };

  // Owl looped by cloning the end items, so the first word arrived from the right. Without clones
  // the row can be rotated instead: move the word at the other end past the current one, shift the
  // track by the matching slot in the same frame (nothing jumps), and the wrap then travels one
  // slot like any other step.
  const syncActive = () => kids.forEach((el, i) => el.classList.toggle('is-active', i === current));

  const rotateRow = (forward) => {
    if (forward) {
      const el = kids.shift();
      kids.push(el);
      track.appendChild(el);
      current -= 1;
    } else {
      const el = kids.pop();
      kids.unshift(el);
      track.insertBefore(el, track.firstChild);
      current += 1;
    }
    syncActive();
    track.style.transition = 'none';
    track.style.transform = trackOffset();
  };

  const slideTrackTo = (index, ms) => {
    const w = root.clientWidth || root.offsetWidth || 1;
    track.style.transition = 'transform ' + ms + 'ms ease';
    track.style.transform = 'translate3d(' + (-index * w) + 'px, 0px, 0px)';
  };

  // Owl dragged on mouse and touch and moved its stage with the pointer, then snapped back
  // over ~250ms; the items themselves never moved, which is why their transform stayed at zero.
  // Same here: the translation lives on the track, so the word's own scaleUp/scaleDown - which
  // only animates scale() - resolves its start transform to none.
  const endDrag = () => {
    if (!dragging) { return; }
    dragging = false;
    if (Math.abs(dx) >= THRESHOLD) {
      // the word that was coming in from the side takes over and slides to the centre
      const step = dx < 0 ? 1 : -1;
      // stepping off either end rotates the row first, so the wrap moves one slot rather than
      // sliding the whole row back - the arriving word still comes in from the drag's direction
      if (step > 0 && current === kids.length - 1) { rotateRow(true); }
      if (step < 0 && current === 0) { rotateRow(false); }
      go(step, false); // no fade: the word slid in already and just travels to centre
      dx = 0;
      const token = dragGeneration;
      root.classList.remove('is-dragging'); // the hand relaxes, the row layout stays for the slide
      slideTrackTo(current, 300);
      const settle = () => {
        track.removeEventListener('transitionend', settle);
        if (token !== dragGeneration) { return; } // a newer drag owns the layout now
        endDragLayout();
      };
      track.addEventListener('transitionend', settle, { once: true });
      setTimeout(settle, 600); // guard if the transition never reports
    } else {
      // not far enough: spring back to the word we came from, then restore the fade layout
      const token = dragGeneration;
      track.style.transition = 'transform 0.25s ease';
      track.style.transform = 'translate3d(' + (-current * (root.clientWidth || root.offsetWidth || 1)) + 'px, 0px, 0px)';
      const done = () => {
        track.removeEventListener('transitionend', done);
        if (token !== dragGeneration) { return; } // superseded by a newer drag
        dx = 0;
        endDragLayout();
      };
      track.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 400);
    }
    restartTimer();
  };

  const restartTimer = () => {
    clearInterval(timer);
    // 3.8s between words, and never mid-drag
    timer = setInterval(() => { if (!dragging) { go(1); } }, spec.autoplay || 3800);
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== undefined && e.button !== 0) { return; }
    dragging = true;
    startX = e.clientX;
    dx = 0;
    beginDragLayout();
    if (root.setPointerCapture && e.pointerId !== undefined) {
      try { root.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety, not required */ }
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (!dragging) { return; }
    if (!root.classList.contains('is-row-layout')) {
      root.classList.add('is-row-layout');
      track.style.transition = 'none';
    }
    dx = e.clientX - startX;
    track.style.transform = trackOffset();
  });

  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // invariant guard: exactly one word carries is-active, and the track is never left offset while
  // the stacked layout is in force (that combination blanks the line until autoplay next fires).
  // Normally a no-op - it only repairs a state some race left behind.
  const guard = () => {
    if (dragging) { return; }
    const active = kids.filter((el) => el.classList.contains('is-active'));
    if (active.length !== 1) {
      kids.forEach((el, i) => el.classList.toggle('is-active', i === current));
    }
    if (!root.classList.contains('is-row-layout') && track.style.transform && track.style.transform !== 'translate3d(0px, 0px, 0px)') {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  };
  setInterval(guard, 250);

  kids.forEach((el, i) => { clear(el); el.classList.toggle('is-active', i === 0); });
  sizeRoot();
  restartTimer();
  window.addEventListener('resize', sizeRoot);

  root.lmCarousel = {
    kind: 'rotator',
    go: go,
    advance: () => go(1),
    destroy: () => { clearInterval(timer); root.lmCarousel = null; }
  };
  return root.lmCarousel;
}

function setup(root, spec) {
  if (root.lmCarousel) { return root.lmCarousel; }

  const kids = Array.from(root.children).filter((el) => el.nodeType === 1 && !el.classList.contains('carousel-nav'));
  const track = document.createElement('div');
  track.className = 'carousel-track';
  kids.forEach((el) => { el.classList.add('carousel-slide'); track.appendChild(el); });
  root.classList.add('carousel');
  root.insertBefore(track, root.firstChild);

  // the rotation is a text rotator: it gets no carousel instance at all, so nothing can
  // translate its words and the animation's start transform stays at zero
  if (spec.fade) { return setupRotation(root, kids, spec); }

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
  { sel: '.text-rotation',   spec: { fade: true, autoplay: 3800, arrows: false, dots: false } },
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
