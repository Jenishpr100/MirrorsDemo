# Lightweight audio and lyric prep

Run `cd app` then `bun run analyze` to decode the first 22.8 seconds with FFmpeg, estimate an onset/beat grid, and rebuild `data/audio.json` plus the aligned word/syllable JSON. The editable phrase windows and syllable counts live in `lyrics/lyrics.src.ts`.

This compact pass is intentionally cheaper than the reference project's full source-separation and forced-alignment workflow. The lyric phrase boundaries are editable estimates and should be nudged against the recording when you want tighter sync.
