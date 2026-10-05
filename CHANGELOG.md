# Changelog

## 0.1.0 — October 5, 2026

The fork. Steward starts as a copy of Deckhand 7.38.0 (commit 411f496) and changes only what a
fork has to:

- Renamed throughout: the file is `Steward.html`, the config block is `steward-config`, the test
  hooks are `window.Steward`.
- Its own saved board. Steward saves under `steward.config`, so it and Deckhand can be opened on
  the same computer without sharing or overwriting each other's boards.
- No owner baked in. The shipped copy has no teacher's name; the greeting is plain until one is
  typed into Settings.
- The privacy guard (`tools/check.sh`) now refuses any owner name in a public copy.
- 57 original pictograms for the tools to come, in `art/pics`.

Nothing has been built for the ESE room yet. Everything Deckhand 7.38.0 does, Steward 0.1.0 does,
including the math-room pieces that are due to come out.
