# Steward

A classroom board for an **ESE resource room**, in one HTML file. Steward is a fork of
[Deckhand](https://github.com/croix18/Deckhand), Mr. Shaffer's 7th-grade math board, rebuilt around
what a pull-out room needs: small groups rotating through, readers who need structure, short
chunks and clear timers, on a touch panel at the front of the room.

Version 1.0.0. Open `Steward.html` in Chrome and it runs: no server, no account, nothing to
install.

## The four tools

**Schedule.** The session as a list of steps, each a picture, a word and (if wanted) minutes.
The step that is *now* is the large one, with its time draining across it; finished steps are
checked off; the next one says "Next". A soft note sounds a minute before a step ends and three
soft notes when it does. The teacher moves it on with **Next** or by tapping any step. It can show
only Now and Next, and it can move on by itself.

**First / Then.** Two large panels (three with "Next"). First is now until it is done, then Then
is. Either can carry minutes, drawn as a ring that drains around the picture. A tap on a panel
changes it from a short list of choices for that class, or from every picture. It can also follow
the schedule: First is the current step, Then is the one after.

**Token board.** "I am working for ___" and a row of places to fill. A tap gives a token; a hold
takes one back. A full row earns the reward. It is one board for the group, or a row for each
student on the roster. Tokens are for today, and they survive a reload.

**Calm.** *Breathe*: a shape that grows as you breathe in and shrinks as you breathe out, with the
word and the count inside it. *Break*: a disc that drains, with a quiet nature sound under it if
the class has one set. *Check in*: five faces, then "What would help?" with that class's own
choices. A check-in is never recorded.

All four use the same set of 57 original pictures (`art/pics`).

## Classes

Settings → **Classes** holds one setup for every class and, for any class, its own version of any
tool: its own steps, its own First / Then pair and choices, its own number and kind of tokens and
rewards, its own breathing pattern, break length and sound, or the tool switched off.

The board follows the bell schedule. When a class comes in, its setup comes with it. The **Class**
button on the board picks a class by hand: a bell class until the next bell, a group of her own
until she picks something else. A group that is not on the bell schedule can be added by name.

## A calmer room

Steward ships quieter than Deckhand:

- A timer finishes with three soft notes and a small badge in the corner, not a full-screen alarm.
- The water at the bottom of the board is still, and the seasonal decorations are off.
- There is no settle-in countdown at the bell.
- The timer's default face is a disc that drains.
- Settings → General offers two typefaces made for reading, Lexend and Atkinson Hyperlegible.

Each of these is a setting and can be turned back.

## What it keeps

Rosters, the class setups and the board layout are saved in the browser the file is opened in,
under `steward.config`. Today's tokens, the step the schedule is on and a break in progress are
saved beside it under `steward.today` and are gone the next day. Nothing leaves the computer.
Steward keeps no history about students: no token totals, no check-in log.

An exported copy (Settings → Export a copy) carries the rosters and class setups inside it, so
keep exports in your own Drive. The copy of `Steward.html` in this repository carries none of it,
and `tools/check.sh` refuses a push that would.

## What came from Deckhand

The clock and bell schedule, timers and stopwatch, Stations, Work Mode, the noise meter, music and
nature sounds, the agenda and text box, slides and YouTube, the sketch pad, the pen, the number
line, dice, coin, spinner and cards are all here and unchanged. Mathle, the Cadence card and
comment cards were taken out.

The shipped bell schedule is Windy Hill Middle School's, with the 7th-grade lunch. Settings →
Schedules changes it.

## Develop

```
npm install
npx playwright test     # 293 tests
sh tools/check.sh       # the privacy guard
```

The suite inherited from Deckhand runs against the same `Steward.html` with Deckhand's board
swapped in (`tests/legacy-config.json`); `tests/steward.spec.js` tests the board as it ships.
Notes for whoever works on it next are in [docs/HANDOFF.md](docs/HANDOFF.md).
