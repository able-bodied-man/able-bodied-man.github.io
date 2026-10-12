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
- **`meta author`** no longer credits the template author.
- **Asset cache busting.** Every local `css/` and `js/` asset is linked with a shared
  `?v=<date>` token (currently `20261012.3`), in `index.html` and `transitions.html`. GitHub Pages
  caches assets for ~10 minutes and a normal reload happily reuses the stale file, which made
  earlier CSS fixes look like they never deployed. **Bump that token — same value
  everywhere — in the same commit whenever any local css/js file changes**, library swaps
  included, so visitors get the new bytes without a hard refresh.

## Still to do

`index.html` still carries the template's demo content — the "Alex Smith" persona, stock
testimonials, client logos, pricing table, fun-fact counters, and placeholder employment
history. All of it must be replaced with real content before the site represents Able.
