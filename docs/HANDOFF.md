# Steward — handoff

**State: v0.1.0, October 5, 2026. The fork is set up and pushed; the ESE build is parked.**
Croix asked for the setup to be finished and left there while work continues on Deckhand.

## What Steward is

A fork of Deckhand for the ESE teacher at Windy Hill MS, who saw Deckhand and wanted it for her
room "because of the visual timers and stuff". Croix's brief: "absolutely optimized for an ese
classroom, rather than my math classroom."

His answers to the four setup questions:

| Question | Answer |
| --- | --- |
| What kind of room? | **Resource / pull-out** — small groups rotating through for reading and math support; readers who need structure, short chunks, clear timers |
| Which tools matter most? | **Visual schedule, First / Then board, token board, calm-down / break** — "Make all of those settings options that can be optimized per class." |
| What screen? | **A touch panel** like his |
| Where does it live? | **A new repo**: github.com/croix18/Steward |

## What is done (0.1.0)

- The tree is a copy of Deckhand 7.38.0 (commit 411f496) with fresh git history.
- Renamed everywhere (file, config block id, storage keys `steward.config` / `steward.sea`,
  events `steward:*`, test hook `window.Steward`, manifest, offline worker).
- `ownerName` is empty in the shipped config; fallbacks that said "Mr. Shaffer" are generic.
- `tools/check.sh` refuses any owner name; `tools/push.sh` stages Steward's own file list.
- The whole Deckhand suite runs against `Steward.html`.
- `art/pics/pics.json`: 57 original pictograms (schedule steps, needs and breaks, tokens, rewards,
  five feelings faces). `node art/pics/build.js` regenerates the JSON; `node art/pics/render.js`
  redraws the contact sheets and reruns the checks. Each icon is the inner markup of a
  `viewBox="0 0 48 48"` SVG: outlines in `currentColor`, accent areas with `class="a"` (style
  them with `svg .a { fill: var(--picA); stroke: none }`). They are not in `Steward.html` yet.

## What is not done — the plan when work resumes

Nothing below is built. This is the design that was settled before the work was parked.

**Take out the math room.** Mathle (and its 35,000-word dictionary, about a quarter of the file),
the Cadence card, comment cards (widget, quick-draw blob, bell reminder, `cards.log`). Keep the
timers, clock, bells, Stations, Work Mode, noise meter, music and nature sounds, agenda, text,
slides, sketch pad and the number line.

**Classes.** One place in Settings where each class (a bell period, or a named group) gets its own
version of the four tools: on or off, and tuned. A base "all classes" set, with per-class
overrides, the way `bell.settle.perPeriod` already works. The class in the room comes from the
bell (`Rosters.autoPeriod`), with a manual pick on the board.

**The four tools**, as board cards:

1. *Schedule* — steps with a picture, a word and optional minutes; done / now / next; tap to move
   on; the current step drains a time bar; a soft warning a minute before a step ends; an option
   to show only Now and Next. Steps are edited per class.
2. *First / Then* — two large panels (optionally First / Next / Then); an optional timer on First;
   Then lights when First is done; an option to follow the schedule (First = now, Then = next).
3. *Token board* — a goal of 3 to 10 tokens, a token shape, "I am working for" with a reward
   picture; one board for the group or one row per student; a tap gives, a hold takes one back; a
   gentle finish. Today-only, and it must survive a reload (kids notice lost tokens).
4. *Calm* — a breathing pacer (in / hold / out, a few patterns), a break timer with a nature sound
   under it, and an optional check-in (five faces, then "what would help?" choices). Nothing is
   recorded.

**A calmer default board.** Seasonal decorations off, motion low, a soft chime, the settle-in
countdown off, and a default layout of schedule, First / Then, a visual timer and the token board.
A reading font (Lexend or Atkinson Hyperlegible) is worth trying; test real widths first.

**Keep no history about students.** Tokens and check-ins are for today and stay on the device.

**Still to ask the ESE teacher:** her bell schedule and lunch track (the shipped one is WHMS with
the 7th-grade lunch); whether groups map to periods or she runs several groups inside a period;
whether tokens are per student or per group; whether a public feelings check-in suits her groups.

## Rules carried over from Deckhand

- One self-contained HTML file; no dependencies beyond Google Fonts; works from `file://` on a
  managed Chromebox and a Promethean panel.
- An alarm can always be dismissed. Coral is for alerts only.
- The public repo carries no rosters, links, free text or names. Never use real student data in
  tests or screenshots — synthetic names only.
- Push with `sh tools/push.sh "message"`. The token goes in `.github-token` (git-ignored) for the
  push and is deleted straight after; it is never committed, never in the remote URL.
- The app icons in `icons/` are still Deckhand's artwork under Steward's file names.
