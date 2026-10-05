# Steward — handoff

**State: v1.0.0, October 5, 2026.** The ESE board is built, tested (293 tests) and pushed. It has
not been in front of the ESE teacher or a class yet; the first round of real feedback will decide
what changes.

## What Steward is

A fork of Deckhand (7.38.0, commit 411f496) for the ESE teacher at Windy Hill MS, who saw Deckhand
and wanted it for her room "because of the visual timers and stuff". Croix's brief: "absolutely
optimized for an ese classroom, rather than my math classroom."

His answers to the setup questions:

| Question | Answer |
| --- | --- |
| What kind of room? | **Resource / pull-out** — small groups rotating through for reading and math support; readers who need structure, short chunks, clear timers |
| Which tools matter most? | **Visual schedule, First / Then board, token board, calm-down / break** — "Make all of those settings options that can be optimized per class." |
| What screen? | **A touch panel** like his |
| Where does it live? | **A new repo**: github.com/croix18/Steward |

## How it is put together

Everything is in `Steward.html`, as in Deckhand. The Steward-specific code is marked
"Steward 1.0" and sits in these places:

- **`PICS`** (before `DEFAULT_SCENES`): the 57 pictures, `id → [label, inner SVG]`. Generated from
  `art/pics/pics.json` (`node art/pics/build.js` rebuilds the JSON, `node art/pics/render.js`
  redraws the contact sheets and reruns the checks). Outlines are `currentColor`; the filled part
  has `class="a"` and takes `--picA`. Labels the teacher types are always set with `textContent`.
- **`SUPPORT_DEFAULT`, `SUP_TEMPLATES`, `sanitizeSupport`**: the setup's defaults and whitelist.
  `cfg.support = { base: {schedule, firstThen, tokens, calm}, classes: [{name, ...overrides}] }`.
  A class entry carries a whole tool object for each tool it overrides and nothing for the rest.
- **`Today`**: today-only state in `localStorage["steward.today"]` (`sched:<class>`, `ft:<class>`,
  `tok:<class>`, `calm` for the break, `pick` for a class picked by hand). Deleted when the date
  changes. Never in `cfg`, never exported.
- **`Support`**: the class in the room (`current()` follows `currentPeriodLabel()`; `pick()` is the
  dock's Class pill), `get(tool, class)`, the schedule's state and clock (`Support.sched`), the
  break's end (`bTick`), and the `steward:support` event every card repaints on. Its 500 ms
  interval is the one clock: a step or a break ends on time whatever scene is showing.
- **`PicPop`**: the picture chooser (quick choices, all pictures, an optional minutes stepper).
- **`makeSched`, `makeFT`, `makeTokens`, `makeCalm`**: the four cards (types `sched`, `ft`,
  `tokens`, `calm`). `supCard()` gives each the ✎ and the "off for this class" state.
- **`SupSettings`**: Settings → Classes. It edits a draft; Apply runs it through
  `sanitizeSupport`; Close forgets it.
- **Sound**: `Sound.ping()` (one soft note) beside `Sound.soft()` (three). `Sound.counts()` is a
  test hook.
- **Alarm**: `cfg.timer.gentle` sends a ring straight to the corner badge with `Sound.soft()`.
- `cfg.ui.font` (`dm` / `lexend` / `atkinson`) sets `body[data-font]`.

The shipped config block holds the board (four scenes), `timer.gentle`, still water, season off
and settle-in off. It never holds `support`: a fresh device gets `SUPPORT_DEFAULT`, and
`tools/check.sh` refuses a block that has the key.

Test hooks: `window.Steward.support`, `.today`, `.picPop`, `.supSettings`, `.pics`,
`.sanitizeSupport`, `.supportDefault`, plus Deckhand's (`shiftClock`, `now`, `sound`, `canvas`…).

## Tests

`tests/helpers.js` writes `tmp_legacy.html` (git-ignored): the same `Steward.html` with
`tests/legacy-config.json` (Deckhand's board) as its config block. `dh.openAt()` opens that, so
the 270 inherited specs keep testing the engine against the board they were written for.
`dh.openShipped()` opens the release as it ships; `tests/steward.spec.js` (23 tests) uses it.

Load-sensitive tests that pass alone (inherited from Deckhand): v6.13 design `:343`, the embed
local page `:103`, the pin test `:423`, v7.5 boat `:112`, v7.8 dice and sketch, v7.1 Pledge.

## Decisions worth knowing

- **No alarm for a step or a break.** A schedule step, a First / Then panel and a break end with
  soft notes and a change on the card. Only the Timer card can ring, and it rings gently by
  default.
- **Gold, not coral, for "nearly time" and for tokens.** Coral stays the alarm's.
- **A hold takes a token back; nothing takes one away publicly.** There is no minus button.
- **Feelings are not ranked by colour**, and a check-in is not stored anywhere.
- **Today only.** No totals, no log. Deckhand's comment-card log was removed with the cards.
- **What is picked on the board is for today** (First / Then panels, the reward). The class's
  usual setup changes only in Settings.
- **A tool that is off for a class** shows a dashed outline while the board is unlocked and
  disappears when it is locked.
- **The Class pill sits after + Add** so the Add menu stays where Deckhand's tests expect it.
- **A break belongs to the board, not to a class.** A bell in the middle of one does not end it.
- **A pick by hand**: a bell class lasts until the next bell; a group that is not on the bell
  lasts until she picks something else (no bell knows when that group leaves). Either is
  remembered through a reload and forgotten the next day.
- **Locked**, a tap on a First / Then panel or the reward still opens the chooser (changing them
  is teaching), but with that class's own choices only, not every picture.
- **A tap on the step that is NOW does nothing** (it used to restart its time).

## The review before 1.0

A second pass tried to break the first build and found 20 problems; all are fixed, and the
"Steward 1.0: hardening" tests pin the ones that mattered (a break's sound that never stopped
after a bell, a hand-picked group lost at the bell or on reload, two students with one first name
sharing a row, stale flags after a step's minutes change, the chooser letting board shortcuts
through). Two small things were left as they are: two fingers landing on two tokens at the same
instant give no token, and taking a token back (a hold) has no keyboard equivalent.

## Still to ask the ESE teacher

1. Her bell schedule and lunch (the shipped one is WHMS with the 7th-grade lunch).
2. Do her groups map to periods, or does she run several groups inside one period? (If several,
   she adds them as groups and picks by hand; a faster switch may be wanted.)
3. Tokens per student or per group? Does she want a response-cost option, or is "tokens only go
   up" right for her room?
4. Is a check-in on the shared panel right for her groups, or should it be off by default?
5. Are the default steps and choices close to her routines? What pictures are missing?
6. Is the gentle timer finish loud enough to be noticed in her room?

## Ideas not built

- A scene per class (the board layout itself changing with the bell).
- Steps anchored to the bell (the schedule placing itself by the clock with no taps).
- Her own photos as pictures.
- Printing a schedule or a First / Then strip.
- A second language on the labels.

## Rules carried over from Deckhand

- One self-contained HTML file; no dependencies beyond Google Fonts; works from `file://` on a
  managed Chromebox and a Promethean panel.
- The public repo carries no rosters, links, free text or names. Never use real student data in
  tests or screenshots — synthetic names only. This matters more here: a name in an ESE tool says
  more than a name in a math tool.
- Push with `sh tools/push.sh "message"`. The token goes in `.github-token` (git-ignored) for the
  push and is deleted straight after; it is never committed and never in the remote URL.
- GitHub's API is not reachable from a session: no releases, no repo settings from here.
