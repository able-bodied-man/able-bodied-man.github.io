# able-bodied-man.github.io

Personal site for **Able** — live at <https://able-bodied-man.github.io/>.

Built from the *BreezyCV — Dark Full Width* vCard/CV/resume template (indigo variant),
served as a plain static site by GitHub Pages from the `main` branch root.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole site — one page with six animated sub-sections (Home, About Me, Resume, Portfolio, Blog, Contact) |
| `css/` | Template styles; `css/main.css` holds the visual theme, `css/fonts/` the icon webfonts |
| `js/` | `main.js` is the site behaviour (nav, portfolio shuffle, carousels, skills bars, contact form); the rest are third-party libs |
| `img/` | Photos, portfolio thumbnails, blog images, client logos, testimonial avatars |
| `portfolio-1/2/3.html` | Detail pages opened from the portfolio grid (AJAX-loaded into the section) |
| `blog-post-1.html` | Post detail page opened from the blog cards |
| `contact_form/` | The template's PHP mailer — **unused**, GitHub Pages cannot execute PHP |
| `robots.txt`, `sitemap.xml` | Crawler hygiene |
| `.nojekyll` | Skips Jekyll processing so every file is served as-is |

## Local preview

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

The template loads all content client-side, so `file://` mostly works too, but the
portfolio shuffle and AJAX detail pages want a real HTTP server.

## Deployment

`git push origin main` → GitHub Pages rebuilds in a minute or two.
Verify with `curl -s https://able-bodied-man.github.io/ | sha256sum` against the local file.

## Decisions made

- **Contact form.** `contact_form/contact_form.php` cannot run on GitHub Pages, so the
  form no longer POSTs to it. `js/main.js` now composes a `mailto:` from the submitted
  fields and hands it to the visitor's mail client. The destination address is the
  `CONTACT_EMAIL` constant inside the form handler in `js/main.js` — change it there to
  move the inbox. Swap in a form service (Formspree, Web3Forms, …) if submissions should
  land server-side without opening the visitor's mail app.
- **reCAPTCHA removed.** The template shipped its author's reCAPTCHA site key, which is
  bound to a domain this site is not, so the widget could only ever fail. Re-add it with
  a key registered for `able-bodied-man.github.io` if you want captcha back.
- **`css/reset.css` is upstream's modern-css-reset (master = npm 1.4.0) plus a project block.** The
  vendored copy was 1.0.4 with the list reset widened; after 1.0.4 upstream scoped its list rules
  to `ul[role="list"]` and dropped the global padding/margin reset, which indents this theme's
  lists by 40px, restores 15px vertical margins and shows bullets on the portfolio filters. The
  file therefore keeps those three list rules and the article rhythm rule at the bottom, clearly
  marked - **merge that block, don't drop it, if upstream is ever re-vendored.**
- **Shuffle 7 loads as an ES module.** Upstream publishes no UMD build for 7.x, so index.html has a
  `<script type="module">` that imports `js/shuffle.esm.min.js` (minified here with terser - the
  published ESM build is unminified, 39 KB vs 15 KB minified), assigns it to `window.Shuffle` and
  fires a one-shot `shuffle:ready` event. `portfolio_init()` in `js/main.js` builds its single
  instance either immediately or when that event arrives, so the classic script can run first.
- **Carousels are Embla, not Owl.** Owl Carousel's last release was April 2018. It is replaced by
  Embla Carousel 8.6.0 (`js/embla/embla.js`, minified here from the published ESM build), driven by
  `js/carousel.js`. Embla wants a `root > track > slides` structure and leaves the arrows to the
  page, so that module builds the wrapper around the existing markup, creates the arrow buttons
  with the look the theme gave Owl's nav, and re-initialises a carousel when its section becomes
  visible (the sections start `display:none`, so a carousel measured at load sees a zero width and
  cannot scroll). The role rotation reuses the theme's own `.animated-section-scaleDown` /
  `.animated-section-scaleUp` pair — the same classes Owl was given via `animateIn`/`animateOut` — so
  its keyframes and the scale .8 crossover are unchanged, and both words animate simultaneously over
  the 1s Owl's own stylesheet forced on `.animated` (`main.css` sets that duration explicitly because
  Owl's rules are no longer loaded). Autoplay is a plain 3.8s interval with no hover pause, matching
  Owl's `autoplayTimeout: 3800` / `autoplayHoverPause: false`. Both Embla plugins were measured as
  unnecessary here and are not vendored.
  The portfolio detail fragments call the same factory through `window.lmCarousel` and keep the old
  Owl class names on their controls (`legacyClasses`) because `main.css` already styles that
  carousel through them. **To replace the three page carousel configs, edit `SPECS` in
  `js/carousel.js`.**
- **The contact form uses the browser's Constraint Validation API, not validator.js.** validator.js
  0.11.9 (final release January 2017) only ever added `.has-error` to the `.form-group` and printed
  the field's `data-error` text into the neighbouring `.help-block`, which is what this theme's CSS
  is keyed to; the native API does the checking now, with identical classes, messages and
  visibility. The form is `novalidate` so the browser's own bubbles never cover the styled messages
  (`checkValidity()` works regardless). Validation lives at the top of `js/main.js`.
- **No jQuery 3 compatibility shim any more.** One used to sit between jQuery 4 and its plugins,
  serving Owl Carousel and validator.js — the two libraries replaced above. With both gone it was
  deleted along with its tags; nothing in the tree calls the helpers jQuery 4 removed.
- **Modernizr is a custom build.** `js/modernizr.custom.js` is generated from `modernizr-config.json` (5 detects + `prefixed`, minified) with `npx modernizr -c modernizr-config.json -d js/modernizr.custom.js` - the site only needs `cssanimations` and `prefixed`, and upstream ships no prebuilt bundle.
- **`meta author`** no longer credits the template author.
- **Asset cache busting.** Every local `css/` and `js/` asset is linked with a shared
  `?v=<date>` token (currently `20261012.18`), in `index.html` and `transitions.html`. GitHub Pages
  caches assets for ~10 minutes and a normal reload happily reuses the stale file, which made
  earlier CSS fixes look like they never deployed. **Bump that token — same value
  everywhere, and **never reuse a value that has already been published** (a browser that
  cached the old bytes under that URL will keep serving them) — in the same commit whenever any local css/js file changes**, library swaps
  included, so visitors get the new bytes without a hard refresh.

## Still to do

`index.html` still carries the template's demo content — the "Alex Smith" persona, stock
testimonials, client logos, pricing table, fun-fact counters, and placeholder employment
history. All of it must be replaced with real content before the site represents Able.
