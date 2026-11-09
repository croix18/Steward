# Steward — handoff

**State: v1.2.0, November 8, 2026.** The ESE board is built and tested (345 tests), and it is the
public board at mrshaffer.org/steward/ — the door on the home page of Croix's site (Croix, 24 Oct:
"switch deckhand for steward on the public page… Keep the coolest stuff for just me" — Deckhand
moved behind the site's teacher password, /teacher/deckhand/). 1.2.0 adds read aloud, fixes the
greeting's week on days without school, brings Deckhand's fixes through 7.60.1 and its autumn theme
(Croix, 8 Nov: "Give steward the autumn theme"). It has not been in front of the ESE teacher or a
class yet; the first round of real feedback will decide what changes.

**Keeping up with Deckhand.** Steward forked at Deckhand 7.38.0. As of 1.2.0 it has every fix to
the code the two share through Deckhand **7.60.1**, and Deckhand's autumn theme. Ports are patches
of `Deckhand.html` applied to `Steward.html` (`git diff c^ c -- Deckhand.html`, filtered to the
hunks that belong, then `patch -F3`; the version-bump hunks and anything leaning on code Steward
doesn't have fail, and a fuzzed hunk is checked by eye — two landed inside the wrong CSS rule or
function this time). Ported code keeps Deckhand's own `v7.xx` notes; Deckhand's `deckhand:` events
are `steward:` here. 7.39–7.51 is the math room's (comment cards, the name picker's Refused and
board list, the slides toolbar, the wrap-up song) except 7.43 and 7.44, ported on 24 Oct. 7.41 and
7.42 (tools over staged slides, the clicker never dead) and 7.52 (the stage-only deck's way out,
which builds on them and on 7.45's bell staging) wait until she uses slides; they touch the Canvas
focus code heavily, so plan a session for them.

| Deckhand | What it is | In Steward |
| --- | --- | --- |
| 7.52 | The stage-only deck's way out (Change the link, After the bell, Remove from board) | Waits with 7.41/7.42 for slides |
| 7.53 | The name picker picks a group | Left out: the math room's |
| 7.54 | The board keeps the screen awake | Ported (1.2.0) |
| 7.55 | The audit | Ported (1.2.0): every fix to shared code, the offline worker, check.sh and push.sh, the test harness. Left out: the name picker's round, Mathle, comment cards, the wrap-up song, and the parts on 7.39–7.52 code |
| 7.56, 7.56.1 | November: leaves, lantern, geese, lunch, Thanksgiving gourds | Ported (1.2.0), without the honk |
| 7.57 | The pen: 10 colors, highlighters, a marker, shapes, a lasso, real undo | Offered, not ported — except the coral pen became red (coral is the alarms') |
| 7.58, 7.58.1, 7.58.2 | November 2.0: the branch, the beach, five sea acts, the calendar, "Harvest moon" | Ported (1.2.0), without the loon's call and the gobble, and without the branch (it is drawn on the clock card) |
| 7.59 | ♪ Keep playing: a minimized YouTube card keeps its music | Offered, not ported |
| 7.60 | The YouTube library, 186 entries | Offered, not ported (Steward's library is 7.38's; its Think Like a Coder fix doesn't apply) |
| 7.60.1 | The lasso's frame and handles sized for a finger | Goes with 7.57 |
| 7.61.0 | Nib inside the Sketch Pad and its pen (out on 8 Nov, during 1.2.0) | Not reviewed yet — look for fixes to shared code before the next port |

Deckhand has the week bug 1.2.0 fixed here (its greeting and its Home chips say Teal on a Sunday
night while its clock says Black for Monday — still so in 7.61.0); it was reported, not changed.

**The site.** `tools/sync.py` in the mrshaffer-site repo copies `Steward.html` to
`public/steward/index.html` (with the manifest and offline worker pointed at `./`); then commit
and push the site. The version regex it reads is `\b1\.\d+\.\d+`.

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

The shipped config block holds the board (four scenes), `timer.gentle`, still water, the season
on the calendar (`auto`; off in 1.0 and 1.1) and settle-in off. It never holds `support`: a fresh
device gets `SUPPORT_DEFAULT`, and `tools/check.sh` refuses a block that has the key.

Steward 1.2 adds:

- **`Speak`** (after `Sound`): read aloud. `Speak.button(getText)` makes a speaker; `say(text)`
  speaks now (a tap — always, even with the sound off); `announce(text, cls)` is Say changes out
  loud (the class's `support.aloud.say`, the sound on and primed, 0.7 s later so it never talks over
  the soft notes; a newer one replaces it, a tap wins). English voices only, ranked installed →
  en-US → the device's default; `cfg.aloud = { buttons, voice, rate }` (a voice this device lacks
  falls back to the best one). `body.spkOn` shows the speakers.
- **`supGoButton(tile, labelEl, onTap)`**: a step, a First / Then panel, a face and a choice are
  tiles (`div`s) with their tap on a transparent button stretched over them; the speaker sits above
  it. One button is never inside another.
- **`support.aloud`**: the fifth part of a class's setup (`SUP_TOOLS`), a choice with no card
  (`SUP_CARDS` is the four with one).
- **`Bell.autoPickAt(n)`**: the rotation's pick — today's week on a school day, the coming week on
  a day with no school (found by the clock's own next-class scan). Boot (`reResolve`) and the date
  change (`rolloverCheck`) use it, so Home's chips press the coming week on a weekend.
  **`Bell.greetWeekAt(d)`** is the greeting's week and when it starts.
- **`Season.guard()`**: Steward's rule for the season's pieces (see Decisions): every card's box
  and hard shadow plus `GAP` (6 px); `PAD`, how far each sand piece's motion reaches past its box;
  `SEA_REACH`, how high each seasonal sea act paints; `seaFits(name)`, which `Sea.play` asks.
  The numbers were measured; the all-cards tests fail if the art outgrows them. `seasonOn()` is
  the one-time 1.0/1.1 → auto migration.

Test hooks: `window.Steward.support`, `.today`, `.picPop`, `.supSettings`, `.pics`,
`.sanitizeSupport`, `.supportDefault`, `.speak`, `.awake`, plus Deckhand's (`shiftClock`, `now`,
`sound`, `canvas`, `season`…).

## Tests

`tests/helpers.js` writes `tmp_legacy.html` (git-ignored): the same `Steward.html` with
`tests/legacy-config.json` (Deckhand's board) as its config block. `dh.openAt()` opens that, so
the 270 inherited specs keep testing the engine against the board they were written for.
`dh.openShipped()` opens the release as it ships; `tests/steward.spec.js` (23 tests) and
`tests/steward12.spec.js` (1.2.0: the week, read aloud, the autumn theme) use it. Its all-cards
tests open the four shipped boards at 1920 × 1080 and 1280 × 800, October through Thanksgiving
week, on still and moving water, and check every seasonal element's box and painted shapes against
every card's box (with its shadow and 4 px), stepping each seasonal sea act through its whole
crossing. Because nothing seasonal may stand on a card, the inherited tests of the pieces and acts
themselves give them room: `dh.roomy()` moves the board's cards into its top 45% (a beach),
`dh.freeEdges()` into its middle (free edges for leaves). Since 1.2.0 (from
Deckhand 7.55) `openAt("")` and `openShipped("")` boot at a fixed quiet moment (`QUIET`, a September
Saturday noon) instead of the wall clock, `dh.openLive()` is the wall clock, and the store is cleared
in the top document only. Read aloud is tested with `speechSynthesis` stubbed (the test browser has
no voices): the stub records what would be said.

The suite runs with @playwright/test 1.63.0 (`npm install --no-save @playwright/test@1.63.0`; the
pinned 1.56.0's browser isn't installed in the sessions). On 8 Nov the last full run (four workers
on a two-core machine shared with other jobs) was 339 of 345. The v7.13 school-days test
(`v7115.spec.js:376`) passes only with `TZ=UTC` — it builds its end dates with
`new Date("2026-10-12")`, which is UTC midnight, the evening before in New York, so each count comes
back one short (the board's own counting is right; the test's dates are not). Three load-sensitive
tests passed alone (below). The run found two of 1.2.0's own, fixed after it and passing since: the
v7.11 spider test now puts the web back on the clock card for its mechanics, and the v7.56 gourds
test needed a beach. The windy-leaves test (`v758.spec.js`) waits for the director's first look,
which sets the period's weather, before it makes the day windy.

Load-sensitive tests that pass alone (inherited from Deckhand): v6.13 design `:343`, the embed
local page `:103`, the pin test `:423`, v7.5 boat `:112`, v7.8 dice and sketch, v7.1 Pledge `:247`,
the v6.18 sea's boat tap `:418`.

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
- **The greeting's week on a day without school** (1.2.0) is the next school day's, the one the
  clock card counts down to; a school day, a Friday evening included, keeps its own. Home's week
  chips agree (the review, 8 Nov: "on a day with no school, the coming week is the one pressed"):
  the board's own pick on such a day is the coming week (`Bell.autoPickAt`), so a board left on
  takes the new week as Friday turns into Saturday. Deckhand's rollover test (Sunday night, Black
  still picked) became Friday night → Saturday. A chip tap still picks for the day. Steward knows
  weekends and whole weeks with no school, not single days off: on 11 Nov 2026 (Veterans Day, a day
  off) it runs Black Week's Wednesday bells, and on Tuesday evening the clock says "Next: 6th Period ·
  Black Week (Wed) · Wednesday 9:20".
- **Read aloud** (1.2.0): a tap speaks what the student sees — "Now: Warm up", "Next: …", "First:
  Work", "Then: Break", "I am working for Choice time", a face's word, a choice's word — never a
  name. Speakers only on Now and Next (none before Start), never on a student's row. A tap speaks
  even with the board's sound off (it was asked for); Say changes out loud never does, and waits for
  the first tap that wakes the sound. 44 px taps, the glyph at half ink: they stay quiet.
- **The seasonal touches follow the calendar** (1.2.0). Croix, 8 Nov 2026: "Give steward the autumn
  theme." 1.0 and 1.1 shipped them off; a board saved by either that still says off became auto once
  (nobody had chosen off — the ESE teacher hasn't used Steward yet).
- **No theme sounds** (1.2.0). The geese don't honk, the loon doesn't call, the turkey doesn't gobble:
  a resource room gets no surprise sounds, so the season is visuals only. "Harvest moon" on the
  tape is fine — it plays only when chosen. Keep it so when porting Deckhand's seasons.
- **Nothing seasonal on any card** (1.2.0; the review of the screenshots, 8 Nov: "no seasonal
  piece and no falling leaf may overlap any card or widget on the board (clock, timer, every tool),
  with a margin of a few pixels"). A card is its box and its hard shadow, plus 6 px. A piece on the
  sand that would stand on a card, or move onto one (the crow's flight, the squirrel's runs, the
  turkey's strut, the campfire's smoke), steps off for that board (`.stOff`); a leaf falls only down
  an edge column with no card in it at all, and none falls when there is none; a seasonal sea act
  crosses only if it passes under every card (the bats climb 380 px above the screen's bottom, the
  ghost 84, the geese 82 — the shipped boards leave 76 under their cards' shadows and margin; the
  ducks, the loon, the trawler, Wilson and the bones fit); the fog is squashed to that room. Deckhand's branch and October's web are drawn on the
  clock card's corner, so Steward shows neither (`.w-clock .nvBranch, .w-clock .ocWeb` — one CSS
  line, if Croix wants the branch back as part of the clock card). The shipped boards run their
  cards down to the water (92 px of sea at any size), so on them nothing fits on the sand and no
  edge is free: their autumn is three leaves at rest on the water and the lantern (the flag on
  Veterans Day, the scarf from the 15th), and the fog and four acts with moving water. Not a
  seasonal piece, so not changed: with moving water Deckhand's whale breaches 96 px up and the
  serpent's attack 110 px, over the bottom edge of a card that comes down to the water.

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
7. Does she want Say changes out loud on for any group (Settings → Classes → Read aloud)? It is
   off for every class until she says. And does the computer on her panel have an English voice?

## Ideas not built

- A scene per class (the board layout itself changing with the bell).
- Steps anchored to the bell (the schedule placing itself by the clock with no taps).
- Her own photos as pictures.
- Printing a schedule or a First / Then strip.
- A second language on the labels.
- Single days without school (Veterans Day, 11 Nov 2026, is a day off): the bells and the greeting
  know weekends and whole weeks with no school only.

## Rules carried over from Deckhand

- One self-contained HTML file; no dependencies beyond Google Fonts; works from `file://` on a
  managed Chromebox and a Promethean panel.
- The public repo carries no rosters, links, free text or names. Never use real student data in
  tests or screenshots — synthetic names only. This matters more here: a name in an ESE tool says
  more than a name in a math tool.
- Push with `sh tools/push.sh "message"`. The token goes in `.github-token` (git-ignored) for the
  push and is deleted straight after; it is never committed and never in the remote URL.
- GitHub's API is not reachable from a session: no releases, no repo settings from here.
