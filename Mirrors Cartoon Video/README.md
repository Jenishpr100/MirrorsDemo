# Mirrors — illustrated lyric film

A standalone TypeScript + Three.js project for an original 16:9 cartoon lyric animation. It uses the first 22 seconds of `audio/mirrors-demo.mp3`; the final 0.8 seconds hold on black after the audio has faded out.

The implementation follows the reference project’s production structure: Vite runs a TypeScript app, a data-driven timeline lazy-loads scene classes, lyric and audio JSON drive the edit, Three.js composites deterministic scene layers, and a headless Chromium/FFmpeg renderer writes an H.264 MP4. The scenes and art direction here are original. The shared render engine and bundled font files carry their upstream MIT and font licenses in `LICENSE` and `app/public/fonts/src/OFL.txt`.

## Run

Install [Bun](https://bun.sh), Node.js 20+, Google Chrome, and FFmpeg. Then:

1. Double-click `Start Preview.bat` to launch the live preview, or run `cd app` and `bun install` followed by `bun run dev`.
2. Open `http://localhost:5173`.
3. Press Space or Play. Use the slider to scrub. The ½ Slow and 2× Fast buttons change the whole animation and audio playback speed.

The app keeps its render resolution at 1920×1080 even when the window is resized. `[` and `]` are not needed: scene markers on the timeline seek directly to each plate.

## Render an MP4

From the `app` folder, run:

```text
bun run render
```

The default export is a 1920×1080, 60 fps MP4 at `out/mirrors.mp4`, with the first 22 seconds of audio, an ending fade, and 0.8 seconds of silent black. The default uses four shutter samples per output frame to keep the render practical on a GTX 1660 Super. For a faster draft:

```text
bun scripts/render.ts video --from 0 --to 22.8 --fps 30 --samples 1 --speed 1 --preset ultrafast --out ../out/mirrors-draft.mp4
```

For a slow-motion version to retime or use in an editor:

```text
bun scripts/render.ts video --from 0 --to 22.8 --fps 60 --samples 4 --speed 0.5 --out ../out/mirrors-slow.mp4
```

`--speed 0.5` renders twice the duration with the animation and song slowed together. Use `--speed 2` for a double-speed render. Render quality and processing time scale with `--fps` and `--samples`; 4K is intentionally not the default.

## Edit the sync or art

- `lyrics/lyrics.src.ts` contains the phrase windows and syllable counts. Their initial positions are estimates; move the phrase boundaries after listening if this particular recording differs.
- `app/scripts/prepare-data.ts` expands those phrase anchors into word/syllable times and analyzes the excerpt’s amplitude/onset grid. Run `bun run analyze` after editing the source timings.
- `data/lyrics.json` and `data/audio.json` are the generated files loaded by the renderer.
- `app/src/timeline.ts` derives scene boundaries from lyric lines.
- `app/src/scenes/` contains the independent mirrors, phone, flaws/question, couch, and black-out plates.
- `app/src/engine/` contains the deterministic render, lyric, audio-grid, type, compositor, and post-processing code.

All scene drawing is a function of song time. Scrubbing, paused frames, and offline renders therefore use the same picture at the same timestamp. Karaoke reveals the active word and advances through each word’s syllable timing; the current lyric remains readable when paused.
