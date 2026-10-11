# TALA Highland Glamping: Website Sample 4

> **Fictional brand. Portfolio sample by Khael Mendoza.** TALA is not a real resort. The reviews are sample content and the booking form isn't connected to anything.

A cinematic one-page site for an imaginary glamping resort in the Philippine highlands. *Tala* is Filipino for "star."

**Live site:** https://superkhael00.github.io/tala-glamping/

## What it shows

| Feature | How it works |
|---|---|
| Full-screen video hero | Muted, looping, autoplaying 720p video with a poster image. The videos are compressed to under 2.2 MB each and re-cut as forward-and-back loops, so the loop point doesn't jump. |
| Day/Night toggle | Crossfades from the night video to the sunrise video and shifts the whole page palette with CSS custom properties: indigo and amber at night, peach, gold and cream by day. The choice is remembered on the next visit. |
| Stays | Bell Tent, A-Frame Cabin and Stargazing Dome, each with a ₱ nightly rate, guest count and inclusions. |
| Experiences | Full-bleed image panels with frosted-glass cards and gentle parallax. |
| Stay estimator | Choose a stay, dates, guests and add-ons to get a live ₱ total with a line-by-line breakdown. It validates dates, caps guests at each stay's maximum, and charges extra guests per night. |
| Book this stay | Copies the estimate (stay, dates, guests, add-ons, total) into the booking inquiry form. |
| Booking inquiry | Uses HTML5 validation, including a PH mobile-number pattern. Submitting shows "Portfolio demo — this form is not connected." |
| Reviews / FAQ / Location | Reviews are clearly labelled as samples. The FAQ is an accessible accordion. The location section has an illustrated SVG route map. |

## Performance and accessibility

- Videos load only through JavaScript, and only when the visitor allows them. On **Save-Data or 2G/3G connections**, or with **reduced motion** turned on, the visitor sees just the poster image.
- The second (sunrise) video loads once the page is idle, so it doesn't slow the first paint.
- Videos pause when the hero scrolls off-screen. A visible pause button meets WCAG 2.2.2.
- The twinkling-star canvas runs only while it's on screen and is turned off for reduced-motion users.
- Images below the hero are `loading="lazy"` JPGs at about 120–240 KB each.
- The page has a skip link, keyboard-friendly controls, `aria-expanded` on the FAQ, and live regions for the estimate and the form result.

## Tech

Plain HTML, CSS and JavaScript, with no framework and no build step. It's hosted on GitHub Pages.

```
index.html
css/style.css
js/main.js
assets/img/    hero + stay + experience images
assets/video/  hero-night.mp4, hero-sunrise.mp4
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Media compression (ffmpeg)

```bash
ffmpeg -i hero-night-original.mp4 \
  -filter_complex "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,fps=24,format=yuv420p" \
  -an -c:v libx264 -preset slow -crf 22 -movflags +faststart assets/video/hero-night.mp4
```
