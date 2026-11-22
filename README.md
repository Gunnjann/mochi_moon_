# Mochi Moon: premium restaurant site

A calm, editorial one-page restaurant website. It's a portfolio demo you can reskin for real clients.

The art direction follows the client's reference video ("Modern Asian Cuisine Menu"):
- Warm white background, near-black text, one burnt-orange accent.
- Thin elegant serif headlines, with small tracked uppercase labels.
- Round, overhead dish photos, including a column of dishes scrolling on an orange panel.
- Muted green price tags.

**Stack:** HTML, CSS (design tokens), vanilla JS, GSAP 3.12 + ScrollTrigger, Lenis 1.1. Everything is in `js/vendor/`, so there's no build step and no CDN.

## Run

ES modules don't load from `file://`, so serve the folder:

```bash
npx serve .
```

To deploy, upload the folder to Netlify, Vercel, Cloudflare Pages or any static host.

## Files

```
index.html          content, SEO, Open Graph, JSON-LD
css/styles.css      tokens at the top, then sections in page order
js/main.js          all motion + interactions
js/vendor/          gsap, ScrollTrigger, lenis
assets/icons/       favicon
```

## Motion

| Feature | How |
|---|---|
| Loader (~2s) | A thin ring draws while an ember "soup" fills the moon and a counter runs 00→100. Then the curtain lifts. |
| Hero | The headline's characters rise out of masked lines. An infinite column of round dish photos scrolls on the orange panel. The hero bowl rotates slowly and tilts with the mouse, with soft steam. |
| Scroll story | The hero pins and the panel wipes away. The bowl spins and shrinks, flies past the story section, and lands in the menu header. On phones it fades during the flight so it doesn't cover text. |
| Headings | Words are grouped into lines that slide up when the heading enters view. |
| Images | Curtain (clip-path) reveals and gentle parallax. |
| Menu | Category tabs with an underline. Cards tilt up to 8° (perspective 1000px), the round dish lifts out and turns, and steam appears on hover. |
| Section transition | The dark Chef's Special rises with a curved edge that flattens as it scrolls in. |
| Chef's Special | The section pins while the overhead steamer photo turns 360° with scroll. Ingredient labels appear in sequence. |
| Gallery | Pinned horizontal scroll with parallax inside each frame and a 01/05 counter. The cursor shows "View" over images. |
| Reviews | Crossfading quotes with word-by-word entry and a timed progress line. Pause, previous and next are included. |
| Reservation | Floating-label fields with validation. On success a little mochi hops and fine confetti falls. |
| Buttons | Pill shape, text roll and ember fill on hover, a subtle squish on press, magnetic hover. |
| Nav | Blurs when scrolled, hides when scrolling down and returns when scrolling up. Full-screen menu on mobile. |
| Reduced motion | No smooth scroll, pins, travelling bowl or autoplay. Everything is shown statically. |

## Menu structure

- **Home page = vegetarian only.** The hero bowl, the dish column, the Veg Menu (`#menu`, with sub-tabs) and the Chef's Special all show vegetarian food only.
- **Non-Veg** (`#nonveg`) has its own section with a beige background and maroon price tags.
- **Fast Food** (`#fastfood`) has its own section on the orange background, with veg and non-veg items marked.
- Each section is linked in the nav. To add a dish, copy an `<article class="dish">` into the right section. Only the Veg Menu has filter tabs, so `data-category` only matters there.

## Photos

All photos are **real food, plate and restaurant photos from Unsplash**, free to use under the Unsplash License. They load straight from Unsplash, so the folder has no image files.

**How they're linked:**
- Each `<img>` points to a photo's download address, `https://unsplash.com/photos/<ID>/download?w=…`.
- It also lists two backup photos in `data-fallback`.
- A tiny script in `<head>` swaps in the next backup if a photo fails, so no image slot is ever left empty.

| Slot | Unsplash photo IDs (primary → backups) |
|---|---|
| Hero bowl / menu dock (veg) | PRQmXA5RtvY → AXWXzGUdLLo → NDX6Hr95dtQ |
| Veg dishes | z9JWq7pr5QE, g7ue2JBhDro, PRQmXA5RtvY, NDX6Hr95dtQ (+ mochi & drinks below) |
| Fast food | 7YnVp6VLa0g, broMfoJ0Emg, TYtaOzUBWsY, 60WT-38Mrwo (each with 2 backups) |
| Midnight Tonkotsu | YFU0AvczmLk → l3Mr7vSdmd4 → egzPIj_8MFA |
| Spicy Miso Moon | qom5MPOER-I → vPMQl71yFDI → lbxLlgi_8_w |
| Moonlight Gyoza | klTf2RN37Ts → gBPN0pnMU9s → NxEUXcWd01w |
| Crystal Har Gow | YHSeJVrqW58 → NxEUXcWd01w → idUSfFfqLmw |
| Strawberry Daifuku | fuC3jLQ7elM → MeOcZyu5BM0 → 3euVhAK8iUs |
| Moon Dango Trio | 3euVhAK8iUs → TgF9mRE3TL4 → fuC3jLQ7elM |
| Matcha Latte | 3MiakfkKOLc → P_n-YjsgWhM → 3CzGKfWfYEk |
| Brown Sugar Boba | s9EVOBtiYQc → y8rjmtsq0lE → aJpTyG2pkJ4 |
| Chef's Special steamer | j9fy7p_hcpM → idUSfFfqLmw → YHSeJVrqW58 |
| Chef | zlZ_O2Vjhw0 → yRnOQOyWfHI → COP9_g8aXFU |
| Gallery 1–5 | COP9_g8aXFU, yRnOQOyWfHI, vajkZSrqB3o, b_topcKbWu8, acI3WlNJe7k (each with 2 backups) |

You can see any photo at `https://unsplash.com/photos/<ID>`.

**To change a photo:**
1. Find one on unsplash.com and copy the ID at the end of its page URL.
2. Put it in the `src` (and `data-fallback`) of that `<img>`.

**For a real client launch, host the photos yourself.** It's faster, needs no third-party request, and suits a client's own photography:
1. Download each photo.
2. Grade them all the same way: warm, gentle contrast.
3. Export as WebP or JPG at quality 75–80.
4. Save them in `assets/img/` and change each `src` to the local file.

## Re-skin for a new client

1. **Name, copy, SEO:** search and replace `Mochi Moon` in `index.html`. Update the `<title>`, description, `og:*`, the JSON-LD and the canonical URL.
2. **Colours:** edit the tokens at the top of `css/styles.css` (`--paper`, `--ink`, `--ember`, `--sage`…). Keep `--stone` at 4.5:1 contrast or better on `--paper`.
3. **Fonts:** Cormorant Garamond + Inter from Google Fonts.
   - For Adobe Fonts, replace the `<link>` with your kit's `https://use.typekit.net/xxxx.css`.
   - Then change `--serif` and `--sans`. Good Adobe pairs: Freight Display + Neue Haas Unica, or Orpheus Pro + Proxima Nova.
4. **Logo:** replace `<symbol id="logo-mark">` in `index.html` and update `assets/icons/favicon.svg`.
5. **Menu:** each dish is an `<article class="dish" data-category="…">`. The category must match a tab's `data-filter`.
6. **Map:** change the `q=` value in the Google Maps iframe `src`. No API key is needed.
7. **Hours:** update the `<dl>` in `#visit`, the `HOURS` object and `TZ` in `main.js`, and `openingHours` in the JSON-LD.
8. **Reservations:** find `// ➜ Connect a real backend` in `main.js`. Use a Formspree `fetch` with `new FormData(form)`, or open `https://wa.me/<number>?text=…`.
9. **Reviews:** these are clearly labelled samples. Replace them with real reviews, with permission.

## Accessibility & performance

- **Accessibility:**
  - semantic landmarks and a skip link
  - visible focus styles
  - menu tabs follow the ARIA tabs pattern with arrow keys
  - the carousel can be paused
  - form errors are linked to their fields with `aria-describedby`
  - the mobile menu closes with Esc
  - `prefers-reduced-motion` is respected
- **Performance:**
  - no WebGL and no heavy libraries; total JS is about 130 KB before gzip
  - images are lazy-loaded with explicit sizes
  - the grain overlay is an inline SVG

## Licences

- GSAP: free "Standard" licence, which allows commercial use.
- Lenis: MIT.
- Fonts: SIL Open Font License.
- "Mochi Moon" is a fictional brand.
