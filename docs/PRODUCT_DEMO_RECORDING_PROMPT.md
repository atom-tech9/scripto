# Prompt — Record a real product demo video with scripted headless Chrome (up to 4K)

Paste this into a Claude Code session in any web-app repo. It records the **actual running app**
(no mocks, no After Effects) by driving system Chrome headlessly with `playwright-core` and
capturing the session to WebM, then embeds it as a progressive enhancement. This is exactly the
pipeline that produced Scripto's landing-hero demo.

---

## What you get

- A `demo.webm` recorded from the live app: real fonts, real rendering, human-paced typing.
- Retina-sharp output (render at 2× the capture size).
- A verification step (extract frames as PNGs and *look at them*) so you never ship a blank video.
- A hero embed pattern that never breaks: the video shows only after it actually loads; a CSS
  mock/screenshot stays as the no-JS, reduced-motion and fallback experience.

## Requirements

- The app running locally (e.g. `npm run dev` at `http://localhost:5173`).
- Google Chrome installed (no browser download needed — `channel: 'chrome'`).
- A scratch folder: `npm init -y && npm i playwright-core`.
- Optional for MP4/Safari: `ffmpeg` (`brew install ffmpeg`) to transcode WebM → H.264.

## The task

1. **Plan the choreography** (5–15 seconds total). A good demo has three beats:
   load in a meaningful state → one visible interaction (typing is ideal — outputs update live) →
   a calm hold at the end so the loop restarts gracefully.

2. **Write `record.mjs`** using this skeleton, adapting URL, seeding and interactions:

   ```js
   import { chromium } from 'playwright-core'
   import fs from 'node:fs'

   // Resolution: recordVideo.size is the OUTPUT size; deviceScaleFactor is the
   // RENDER multiplier. For true 4K: viewport 1920×1080 + deviceScaleFactor 2
   // + recordVideo size 3840×2160. For a crisp hero at sane file size:
   // viewport 1440×900 + dsf 2 + size 1440×900 (renders 2×, downsamples).
   const browser = await chromium.launch({ channel: 'chrome', headless: true })
   const context = await browser.newContext({
     viewport: { width: 1920, height: 1080 },
     deviceScaleFactor: 2,
     colorScheme: 'dark',
     recordVideo: { dir: './video-out', size: { width: 3840, height: 2160 } },
   })

   // Seed state BEFORE any page script runs: theme, dismissed tours/toasts,
   // pre-created documents — whatever makes the first frame presentation-ready.
   await context.addInitScript(() => {
     localStorage.setItem('app:theme', JSON.stringify('dark'))
     localStorage.setItem('app:onboarding', JSON.stringify({ dismissed: true }))
   })

   const page = await context.newPage()
   await page.goto('http://localhost:5173/app?template=readme', { waitUntil: 'load', timeout: 60000 })
   await page.waitForSelector('.editor-ready-selector', { timeout: 60000 })

   // Tidy the stage: close panels, wait out entrance toasts, let fonts settle.
   await page.locator('[aria-label="Settings"]').first().click().catch(() => {})
   await page.waitForTimeout(5000)

   // The beat: type something that makes the UI visibly respond.
   await page.click('.editor-content')
   await page.keyboard.press('Meta+End')
   await page.keyboard.type('\n\n## Roadmap\n', { delay: 55 })
   await page.keyboard.type('\n- Ship the thing', { delay: 48 })
   // NOTE: if the editor auto-continues lists on Enter, type subsequent items
   // WITHOUT the leading "- " or you'll get doubled markers.

   await page.waitForTimeout(2500) // calm hold for the loop
   const video = page.video()
   await context.close()
   await browser.close()
   fs.copyFileSync(await video.path(), './public/screenshots/demo.webm')
   ```

3. **Verify by looking, not hoping.** Load the WebM in a headless page served over http (file://
   video seeking hangs), seek to early/mid/end, screenshot each, and inspect the PNGs:

   ```js
   // check-video.mjs — seek via <video>.currentTime + onseeked, then page.screenshot()
   // Serve the file through your dev server (public/ → /screenshots/demo.webm).
   ```

   Check: right theme? panels closed? typing visible? no toasts mid-frame? end state calm?

4. **Safari/compat**: `ffmpeg -i demo.webm -c:v libx264 -crf 20 -pix_fmt yuv420p -an demo.mp4`.
   Ship both sources; MP4 first.

5. **Embed as progressive enhancement** (never a hard swap):

   ```html
   <div class="hero-live" hidden-until-loaded>
     <video data-hero-video muted loop playsinline autoplay preload="metadata">
       <source src="/screenshots/demo.mp4" type="video/mp4" />
       <source src="/screenshots/demo.webm" type="video/webm" />
     </video>
   </div>
   <div data-hero-fallback><!-- CSS mock or screenshot --></div>
   ```

   ```js
   // Reveal only when frames actually exist; otherwise the fallback stays.
   var v = document.querySelector('video[data-hero-video]')
   if (v) {
     var ok = function () { document.documentElement.classList.add('has-vid') }
     if (v.readyState >= 2) ok()
     else v.addEventListener('loadeddata', ok, { once: true })
   }
   ```

   ```css
   .hero-live { display: none; }
   html.has-vid .hero-live { display: block; }
   html.has-vid [data-hero-fallback] { display: none; }
   @media (prefers-reduced-motion: reduce) {
     html.has-vid .hero-live { display: none; }
     html.has-vid [data-hero-fallback] { display: block; }
   }
   ```

## Gotchas learned the hard way

- **Seed `localStorage` via `addInitScript`**, not after load — beats first-paint flashes and tours.
- **Wait out entrance toasts** (~4–5s) before typing, or they photobomb the recording.
- **Auto-continuing lists** double the bullet markers if you type them yourself.
- **file:// video seeking hangs** in headless Chrome — always verify over http.
- **Keep a fixed-duration hold at the end** — loops that cut mid-motion feel broken.
- **File size sanity**: 10–15s at 1440×900\@2x ≈ 1–2 MB WebM. 4K roughly 4–6×.
- If the recording shows a stale UI state, remember dev servers HMR — hard-reload logic doesn't
  apply headlessly; every run is a fresh context.

## Acceptance

- [ ] Frames verified visually at start / middle / end
- [ ] ≤ ~3 MB for hero use (or intentionally larger for 4K download pages)
- [ ] Autoplays muted, loops, `playsinline` (iOS)
- [ ] Fallback intact with JS disabled and with `prefers-reduced-motion`
