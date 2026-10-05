# Steward

A classroom board for an **ESE resource room**, in one HTML file. Steward is a fork of
[Deckhand](https://github.com/croix18/Deckhand) (Mr. Shaffer's 7th-grade math board), forked at
Deckhand 7.38.0.

**Status: v0.1.0 — the fork is set up; the ESE work has not started.** Today Steward is Deckhand
under a new name with its own saved board. What it is meant to become is in
[docs/HANDOFF.md](docs/HANDOFF.md).

## What it is for

A resource / pull-out room: small groups rotating through for reading and math support, readers
who need structure, short chunks and clear timers, on a touch panel at the front of the room.
The plan is to build the board around four tools, each one switchable and tunable per class:

- a **visual schedule** (done / now / next)
- a **First / Then** board with a visual timer
- a **token board**
- a **calm-down / break** tool

A set of 57 original pictograms for those tools is already drawn: [art/pics](art/pics).

## Use it

Open `Steward.html` in Chrome. That is the whole install: no server, no account, no dependencies
beyond Google Fonts. The board saves itself to the browser it is opened in, under its own key
(`steward.config`), so it never touches a Deckhand board on the same computer.

## Privacy

Rosters, links and anything typed into the board stay in the browser. The public copy of
`Steward.html` in this repository carries none of it, and `tools/check.sh` refuses a push that
would. Student names in an ESE tool say more than names in a math tool do, so this rule matters
more here than it did in Deckhand.

## Develop

```
npm install
npx playwright test     # the Deckhand suite, running against Steward.html
sh tools/check.sh       # the privacy guard
```
