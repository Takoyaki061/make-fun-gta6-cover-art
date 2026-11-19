# Neon Coast — GTA-style cover maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Takoyaki061/make-fun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Takoyaki061/make-fun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA-style
multi-panel poster cover art, exported as a PNG to share. Built for the
[make.fun](https://make.fun/bounty/gta6-cover-art-01) GTA 6 cover art bounty.

## What it does

- **Multi-panel covers** — four layouts (Hero + two, Four panels, Three up,
  Nine panel) with white poster gutters and a title band.
- **Any photo** — load up to four photos from your machine (they never leave
  it), fill several panels with one photo or several, and crop and position
  each panel with zoom and pan sliders. Click a panel in the preview to
  select it.
- **Vice City grade** — four colour grades (Sunset, Neon night, Vice pink,
  Midnight) with palm silhouettes, a neon slash, film grain and vignette.
- **Bold lettering** — the caption in Anton with a sunset gradient fill, the
  subtitle in Pacifico neon script. Both fonts ship under the SIL Open Font
  License in `app/fonts/`.
- **One-click export** — PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

## Try it

Serve `app/` with any static server and open `index.html`, for example:

```sh
node serve.ts
# open http://localhost:8080
```

Everything runs offline: every script, font and sample image is a file
under `app/`, and photos are read on your own machine.

## How it is built

- `app/src/cover.js` — the cover engine: layouts, grades, panel photos,
  palms, grain, title lockup.
- `app/src/main.js` — the editor wiring.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor`,
  `?shot=cover`).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`.
- `app/samples/` — three stylised sunset illustrations drawn with PIL for
  the demo; no real person, no borrowed artwork.

Everything here is original work: no Rockstar Games logo, artwork, character
or font.

## License

MIT — see [LICENSE](LICENSE). Anton and Pacifico are licensed under the SIL
Open Font License 1.1 (see `app/fonts/OFL-Anton.txt` and
`app/fonts/OFL-Pacifico.txt`).
