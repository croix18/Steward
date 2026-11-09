# Changelog

## 1.2.0 — November 8, 2026

**Read aloud.** So that students who can't read yet can use the board on their own, it says its
words. A small speaker sits beside what a student reads — the Now and Next steps, each First / Then
panel, what the token board is working for, the Check in faces and the "What would help?" choices.
A tap says that word ("Now: Warm up", "First: Work", "I am working for Choice time", "Worried") in a
calm voice, a little slow; it speaks even with the board's sound off, because it was asked for.
The tap that was already there still does what it did: a step still moves the schedule, a panel and
the reward still open the chooser, a hold still takes a token back, a face still answers.

- The voices are the computer's own (the browser's speech): an English voice installed on the device
  first, then any English voice. No network is needed. No English voice: no speakers, and Settings
  says so in one line.
- Settings → General → **Read aloud**: the speakers on or off, the voice, the speed, and Try it.
- Settings → Classes → Read aloud → **Say changes out loud**, per class, off unless she turns it on:
  the board says "Now: Reading" when the schedule moves on, "Then: Break" when First is done and
  "Choice time!" when a row of tokens fills. Only with the board's sound on and woken by a first tap;
  never a student's name.

**The week on a day without school.** On Sunday night the greeting said "Teal Week" while the clock
card said "Black Week" for Monday. On a weekend or in a week with no school, the greeting now names
the week of the next school day, the one the clock counts down to: "Good evening · Black Week starts
Monday" (with the date when it is more than a week off, over a break; just "Black Week" when that
would crowd a phone's banner). Home's week chips press that week too: on a day with no school the
board's own pick is the coming week, so the greeting, the chips and the clock agree, and a board left
on takes the new week as Friday turns into Saturday. A school day, a Friday evening included, keeps
its own week. A tap on a chip still picks for the day.

**The autumn theme** (Croix: "Give steward the autumn theme"), from Deckhand 7.56–7.58.2: falling
leaves, a lantern on the boat, geese, the lunch tray's pie and cider, Thanksgiving week's gourds, the
scarecrow among cornstalks with his crow and hay bale, a squirrel, the gull's scarf from the 15th,
Veterans Day's flag, feast week's turkey, the sea's November acts (fog, ducks, a loon, a trawler, a
campfire), windy days, and "Harvest moon" on the music tape.

- The seasonal touches now follow the calendar. 1.0 and 1.1 shipped them off; a board saved by
  either that still says off takes the new default once.
- **No theme sounds.** The geese don't honk, the loon doesn't call, the turkey doesn't gobble. A
  resource room gets no surprise sounds; the season is pictures only. ("Harvest moon" plays only when
  it is chosen.)
- **Nothing seasonal on any card** — the clock, the timers, every tool — nor within a few pixels of
  one (its shadow counts). A piece on the sand that would stand on a card, or move onto one (the
  crow's flight, the squirrel's runs, the turkey's strut, the campfire's smoke), steps off for that
  board; a leaf falls only down an edge with no card in it at all, and none falls when there is no
  such edge; the sea's seasonal acts cross only if they pass under every card, and the fog lies as
  low as the room under them. Deckhand's bare branch and October's web are drawn on the clock card's
  corner, so Steward has neither.
- On the four boards Steward ships, whose cards come down to the water, that leaves no room on the
  sand and no free edge: autumn there is three leaves at rest on the water and the lantern on the
  mast (with the flag on Veterans Day and the gull's scarf from the 15th), and with moving water the
  fog, the ducks, the loon and the trawler, which pass under the cards. A board whose cards stop
  higher gets the beach back.
- On still water (the shipped board) nothing moves. Never on the stage, the landing page or a phone.
  Settings → Seasonal touches → Off takes all of it.

**From Deckhand 7.52–7.60.1**

- 7.54: the board keeps the screen awake while it is showing (a Promethean no longer sleeps under a
  visual schedule).
- 7.55, the audit's fixes to code Steward shares: a deleted running timer never rings; "Regular
  times instead" on a Wednesday works; a hand-typed 13:15 bell is read as 1:15; two students with the
  same name are told apart ("Sam", "Sam (2)"); a board missing its schema version keeps its scenes;
  saving keeps trying after a full store, "Use this file's settings" works with a full store, a
  failed first save shows at once, and another window's reset is no longer undone; a board from a
  newer Steward is refused on import; the Now Playing pill never covers the alarm; the stage survives
  a bell mid-drag; new cards don't avoid cards nobody can see; a manual settle-in count no longer
  cancels the wrap-up for the period; Stations keep each class's rotation across a bell; the noise
  meter counts only time on screen; a playing YouTube card makes the passing music step aside, and a
  minimized YouTube or Slides card no longer plays at boot; http links are upgraded on the https copy;
  the pen, the number line and the sketch pad can't wedge on a lost touch; Clear mid-stroke no longer
  kills the pen; held Tab stays in Settings; the Group Maker, the spinner, the Scoreboard, Tally and
  the Countdown each lose a small bug. The offline worker caches only a real copy of Steward and opens
  the cached board after four seconds of a hung network. `tools/check.sh` scans every text file,
  refuses unreviewed images and knows more free-text fields; `push.sh` checks again after staging.
- 7.57: the coral pen is red (coral is the alarms').
- Not brought over: the name picker's group pick (7.53) and the math room's parts of 7.55; the
  stage-only deck's menu (7.52) waits with 7.41 and 7.42 for slides. Offered, not built: the pen's
  markers, shapes and lasso (7.57, 7.60.1), ♪ Keep playing for a minimized YouTube card (7.59), the
  YouTube library (7.60).

Tests: the harness boots at a fixed quiet Saturday (Deckhand 7.55) and no longer clears the store
from a deck's frame. The all-cards tests check every seasonal element against every card on the
shipped boards at 1920 × 1080 and 1280 × 800; Deckhand's tests of the pieces and acts themselves give
them a beach first (`dh.roomy()`, `dh.freeEdges()`). 345 tests.

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
