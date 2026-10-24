# Changelog

## 1.1.0 — October 24, 2026

Steward is the public board at **mrshaffer.org/steward/** — the door on the home page (Croix:
"switch deckhand for steward on the public page"; Deckhand went behind the teacher's password).
Two fixes from Deckhand since the fork, both felt by a finger on a panel:

- **One tap on Done closes a note, every time** (Deckhand 7.43). Done used to close the editor on
  the finger's down, so the tap's click landed on the note that slid up under it and opened it
  again; a mouse never showed it. Now the note closes when the finger lifts on Done — a tap, a
  press held, a tap that slid a little — and for half a second after, a tap where Done was does
  not reopen it. On the stage, Done sits clear of the Timer · Minimize · Exit bar.
- **The "Steward updated — your saved board and rosters were kept" banner goes away by itself**
  (Deckhand 7.44): six seconds, fifteen when it offers the new bell schedule; a touch keeps it; the
  warnings that share the banner (a newer file, an unreadable board, another window) still stay.

Not brought over: the rest of Deckhand 7.39–7.51 is the math room's — comment cards, the name
picker's Refused and board list, the slides toolbar, the wrap-up song.

Three tests added (296).

## 1.0.0 — October 5, 2026

Steward becomes an ESE board. Croix: "It's gotta be absolutely optimized for an ese classroom,
rather than my math classroom" — a resource / pull-out room, small groups rotating through,
readers who need structure, short chunks and clear timers, on a touch panel.

**Four tools**

- **Schedule**: done / now / next. A picture, a word and optional minutes per step; the current
  step is large with its time draining across it; a soft note a minute before it ends and three
  at zero; Next, Back, +1 minute, a tap on any step; Now-and-Next-only; moves on by itself if set.
  A wide card lays the steps out left to right.
- **First / Then**: two or three large panels; minutes drawn as a ring around the picture; at zero
  the next panel starts by itself; a tap changes a panel from the class's quick choices or from
  every picture; it can follow the schedule.
- **Token board**: 2 to 10 tokens in eight shapes; a tap gives, a hold takes one back; a full row
  shows the reward; one board for the group or a row per student from the roster; absent students
  are left out. Today only; survives a reload.
- **Calm**: Breathe (three patterns, a shape that grows and shrinks, word and count), Break (a
  draining disc, 1 to 15 minutes, an optional nature sound), Check in (five faces, then "What
  would help?"). Nothing a student picks is recorded.

**Classes**

- Settings → Classes: one setup for every class and, per class, its own version of any tool or
  the tool switched off. Groups that are not on the bell schedule can be added.
- The board follows the bell to the class in the room. A Class button in the dock picks one by
  hand: a bell class until the next bell, a group of her own until she picks something else. The
  pick is remembered through a reload.
- The ✎ on each card opens that tool's setup for the class in the room.

**A calmer room**

- Timers finish gently by default: three soft notes and a corner badge instead of the full-screen
  alarm (Settings → Timer).
- The timer disc drains as a true wedge.
- Still water, seasonal decorations off and no settle-in countdown in the shipped board.
- Two reading typefaces: Lexend and Atkinson Hyperlegible (Settings → General).
- The shipped board: Daily Board (schedule, First / Then, tokens, clock, timer, Calm in the dock),
  Work Time, Break, Stations.

**Taken out**

- Mathle and its dictionary, the Cadence card, comment cards (the card, the quick-draw, the bell
  reminder and the log). The file is about 110 KB smaller than Deckhand 7.38.

**Under it**

- 57 original pictures built into the file.
- Today's state lives in `steward.today`, beside the saved board, and is dropped the next day and
  on "Use this file's settings". It is never exported.
- `tools/check.sh` refuses a public copy that carries a class setup.
- A new app icon.
- 293 tests: 23 new ones against the board as it ships, 270 inherited from Deckhand running
  against the same file with Deckhand's board swapped in.
- An adversarial review before release found 20 problems in the first build; each is fixed and
  the ones that mattered have a test (the "hardening" group).

## 0.1.0 — October 5, 2026

The fork. Steward starts as a copy of Deckhand 7.38.0 (commit 411f496) and changes only what a
fork has to: renamed throughout, its own saved board (`steward.config`), no owner baked in, the
privacy guard refuses any owner name, and the pictures for the tools to come in `art/pics`.
