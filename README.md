# naeuzi — portfolio

One-page portfolio for **@naeuzi** — video editor since 2015, After Effects & Premiere Pro since 2019.
Colours and type follow [NAEUZI Studios](https://naeuzistudios.com) (deep violet `#1A0B2E`, purple `#5E2F82`, Manrope).

Plain HTML, CSS and JavaScript — no build step. Works on GitHub Pages as-is.

## Adding your edits

Every edit slot in `index.html` looks like this:

```html
<article class="edit" data-cat="phonk">
  <div class="edit__media" data-src="" data-poster="" data-link=""></div>
  <footer class="edit__meta"><span class="edit__tag">Phonk</span></footer>
</article>
```

| Attribute | What to put there |
| --- | --- |
| `data-src` | A video file, e.g. `assets/edits/anime-01.mp4`. It autoplays muted when on screen; tapping turns the sound on. |
| `data-views` | Optional view count, e.g. `24.7M` — shown as a badge on the video. |
| `data-poster` | Optional still image shown before the video loads (or on its own if there's no video). |
| `data-link` | A TikTok or Instagram post URL. With no `data-src`, the slot plays that post in its own player when tapped. With a video file, it adds a **Watch ↗** button instead. |
| `data-cat` | `viral`, `release`, `phonk`, `3d` or `anime` — drives the filter buttons. |

Empty slots show a "dropping soon" placeholder. Copy an `<article>` to add more slots, delete one to remove it.
The phone in the hero plays a film-style opening (title card, then the showreel set in `data-reel` on `.phone`), then shows a feed of every edit with a video file. Tapping one plays it in the phone. The feed builds itself from the Edits section, so new edits appear there automatically.

**Keep videos small:** vertical 9:16, 720×1280, H.264 MP4, ideally under 8 MB each (GitHub rejects files over 100 MB).

## Editing content

| What | Where |
| --- | --- |
| Stats (followers, views) | `index.html` → `.stats` — the `data-count` value and the text next to it. "Years editing" updates itself every year. |
| Store link | `index.html` → the nav (`payhip.com/naeuzi`) and the Contact socials. |
| Promote-your-track links | `index.html` → `#promo` section and `#promo-modal` (same three links in both). |
| Socials | `index.html` → `.socials` in the Contact section. |
| Colours | `assets/css/style.css` → `:root` variables. |

## Good to know

- The background is a static CSS gradient (no WebGL), so the page stays smooth. Visitors with "reduce motion" switched on get no animations.
- Fonts: Manrope (Google Fonts), Geist Mono (self-hosted, SIL Open Font License). Brand icons from Simple Icons (CC0).
