/* Steward 1.0 — the ESE resource room. Croix: "It's gotta be absolutely optimized for an ese
 * classroom" — a pull-out room, small groups rotating through, readers who need structure, short
 * chunks and clear timers; a visual schedule, a First / Then board, a token board and a calm-down /
 * break tool: "Make all of those settings options that can be optimized per class."
 * These specs open the release exactly as it ships (dh.openShipped). Synthetic names only. */
const { test, expect, ok } = require("./helpers");

const T2 = "#t=2026-10-05T10:30";                // a Monday, Teal Week, 2nd period (10:16–11:09)
const counts = page => page.evaluate(() => window.Steward.sound.counts());
const shift = (page, ms) => page.evaluate(ms => window.Steward.shiftClock(ms), ms);
const hold = async (page, loc) => {
  const b = await loc.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.waitForTimeout(750); await page.mouse.up();
  await page.waitForTimeout(80);
};
const scene = async (page, name) => { await page.selectOption("#sceneSel", name); await page.waitForTimeout(250); };

test.describe("Steward 1.0: the board", () => {
  test("the shipped board is the ESE board: schedule, First / Then, tokens, a small clock, a visual timer and the calm card in the dock — and the math room is gone", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    for (const sel of [".w-sched", ".w-ft", ".w-tokens", "#clockWidget", ".w-timer"]) await expect(page.locator(sel)).toBeVisible();
    const cfg = await page.evaluate(() => window.Steward.config);
    ok(cfg.scenes.map(s => s.name).join("|") === "Daily Board|Work Time|Break|Stations", "scenes: " + cfg.scenes.map(s => s.name));
    ok(cfg.scenes[0].widgets.find(w => w.type === "calm").min === true, "the calm card should wait in the dock");
    ok(cfg.ui.season === "off" && cfg.bell.settle.on === false && cfg.timer.style === "disc", "calm defaults: " + JSON.stringify([cfg.ui.season, cfg.bell.settle.on, cfg.timer.style]));
    ok(cfg.ownerName === "", "no owner baked in");
    // the pictures: 57, every one with a filled part
    const pics = await page.evaluate(() => Object.keys(window.Steward.pics).map(k => [k, /class="a"/.test(window.Steward.pics[k][1])]));
    ok(pics.length === 57 && pics.every(p => p[1]), "pictures: " + pics.length);
    // the Add menu leads with Support; Mathle, Cadence and comment cards are gone
    await page.click("#addBtn");
    await expect(page.locator("#addMenu .menuLabel").first()).toHaveText("Support");
    for (const id of ["addSchedBtn", "addFtBtn", "addTokensBtn", "addCalmBtn"]) await expect(page.locator("#" + id)).toBeVisible();
    for (const id of ["addMathleBtn", "addCadenceBtn", "addCcardBtn", "ccBlob", "ccPop"]) ok(await page.locator("#" + id).count() === 0, id + " should be gone");
    ok(await page.evaluate(() => window.Steward.mathleWords === undefined && window.Steward.ccardPop === undefined), "math-room hooks linger");
    await page.keyboard.press("Escape");
    // October stays plain here unless she turns the season on
    ok(!(await page.evaluate(() => document.body.classList.contains("october"))), "seasonal touches should be off by default");
    // the public file never carries a class setup (tools/check.sh refuses one)
    const shipped = JSON.parse(/<script id="steward-config"[^>]*>([\s\S]*?)<\/script>/.exec(dh.SHIPPED_SRC)[1]);
    ok(!("support" in shipped) && shipped.rosters.length === 0, "the shipped config block must not carry a setup or rosters");
  });

  test("a new card of each kind can be added, minimized, restored and removed; the old boards' whitelist keeps them", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await scene(page, "Stations");
    for (const [id, cls] of [["addSchedBtn", ".w-sched"], ["addFtBtn", ".w-ft"], ["addTokensBtn", ".w-tokens"], ["addCalmBtn", ".w-calm"]]){
      await dh.addW(id);
      await expect(page.locator(cls)).toBeVisible();
    }
    const kept = await page.evaluate(() => window.Steward.sanitize(JSON.parse(JSON.stringify(window.Steward.config))).scenes[3].widgets.map(w => w.type).join());
    ok(/sched,ft,tokens,calm$/.test(kept), "sanitize dropped a support card: " + kept);
    await page.locator(".w-calm .wClose").click();
    await expect(page.locator(".w-calm")).toHaveCount(0);
  });
});

test.describe("Steward 1.0: a calmer room", () => {
  test("a timer finishes gently: three soft notes and a badge in the corner, never the coral wall; the setting brings the full alarm back; the disc is a true wedge", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    ok((await page.locator(".w-timer .visProg").evaluate(e => getComputedStyle(e).strokeLinecap)) === "butt", "the disc should drain as a wedge");
    const run3 = async () => {
      await page.locator(".w-timer .wBody").click({ position: { x: 20, y: 20 } });
      await page.keyboard.type("3"); await page.keyboard.press("Enter");
    };
    const c0 = await counts(page);
    await run3();
    await expect(page.locator("#alarm")).toHaveClass(/on/, { timeout: 8000 });
    await expect(page.locator("#alarm")).toHaveClass(/calm/);
    const box = await page.locator("#alarm").boundingBox();
    ok(box.width < 500 && box.height < 120 && box.y > 900, "the gentle finish should be a corner badge: " + JSON.stringify(box));
    await expect(page.locator("#alarmWho")).toHaveText("Timer");
    ok((await counts(page)).soft === c0.soft + 1, "three soft notes, once");
    // the board is not taken over: a token can still be given with the badge up
    await page.locator(".w-tokens .tkSlot").first().click();
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(1);
    await page.locator("#alarm").click();                              // a tap clears it
    await expect(page.locator("#alarm")).not.toHaveClass(/on/);
    // Settings → Timer turns the full alarm back on
    await page.click("#setBtn");
    await dh.tab("timer");
    await expect(page.locator("#sTimerGentle")).toBeChecked();
    await page.locator("label.fCheck", { has: page.locator("#sTimerGentle") }).click();
    await page.click("#applyBtn"); await page.click("#closeBtn");
    await run3();
    await expect(page.locator("#alarm")).toHaveClass(/on/, { timeout: 8000 });
    await expect(page.locator("#alarm")).not.toHaveClass(/calm/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#alarm")).not.toHaveClass(/on/);
  });

  test("a reading typeface is one choice away: Lexend or Atkinson Hyperlegible for the whole board, remembered; junk falls back to the standard", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await expect(page.locator("body")).toHaveAttribute("data-font", "dm");
    await page.click("#setBtn");
    await page.selectOption("#sFont", "lexend");
    await page.click("#applyBtn"); await page.click("#closeBtn");
    await expect(page.locator("body")).toHaveAttribute("data-font", "lexend");
    ok(/^"?Lexend/.test(await page.locator(".w-sched .sdLabel").first().evaluate(e => getComputedStyle(e).fontFamily)), "the cards should take the typeface");
    ok(/Lexend/.test(await page.evaluate(() => document.querySelector('link[rel="stylesheet"][href*="fonts.googleapis"]').href)), "the font link should offer Lexend");
    await dh.flush();
    await dh.reopen(T2);
    await expect(page.locator("body")).toHaveAttribute("data-font", "lexend");
    ok((await page.evaluate(() => window.Steward.sanitize({ ui: { font: "comic" } }).ui.font)) === "dm", "junk typeface kept");
    ok((await page.evaluate(() => window.Steward.sanitize({ ui: { font: "atkinson" } }).ui.font)) === "atkinson", "Atkinson dropped");
  });
});

test.describe("Steward 1.0: Schedule", () => {
  test("done / now / next: Start, the step's time drains, a soft note a minute out, three soft notes at zero (never the alarm), +1, Next, a tap jumps, Back, All done, Start over", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const step = i => page.locator(".w-sched .sdStep").nth(i);
    const next = page.locator(".w-sched .sdNext");
    await expect(page.locator(".w-sched .sdStep")).toHaveCount(6);
    await expect(next).toHaveText("Start");
    await expect(page.locator(".w-sched .sdBack")).toBeDisabled();
    await expect(step(0).locator(".sdMeta")).toHaveText("3 min");
    await next.click();
    await expect(step(0)).toHaveClass(/isNow/);
    await expect(step(0).locator(".sdTag")).toHaveText("Now");
    await expect(step(0)).toHaveAttribute("aria-current", "step");
    await expect(step(1).locator(".sdMeta")).toHaveText("Next · 5 min");
    await expect(step(0).locator(".sdTime")).toHaveText(/^(3:00|2:5\d)$/);
    await expect(next).toHaveText("Next");
    // half the time gone: half the bar
    await shift(page, 90000);
    await expect(step(0).locator(".sdTime")).toHaveText(/^1:(30|2\d)$/);
    await page.waitForTimeout(700);
    const sx = await step(0).locator(".sdFill").evaluate(e => new DOMMatrix(getComputedStyle(e).transform).a);
    ok(sx > 0.42 && sx < 0.52, "fill: " + sx);
    // one minute left: one soft note, the step turns gold (not coral)
    const c0 = await counts(page);
    await shift(page, 35000);
    await expect(step(0)).toHaveClass(/isWarn/);
    await expect.poll(async () => (await counts(page)).ping).toBe(c0.ping + 1);
    // zero: three soft notes, "Time is up", and it WAITS for the teacher — no alarm stage
    await shift(page, 60000);
    await expect(step(0)).toHaveClass(/isUp/);
    await expect(step(0).locator(".sdTime")).toHaveText("Time is up");
    await expect.poll(async () => (await counts(page)).soft).toBe(c0.soft + 1);
    await page.waitForTimeout(1200);
    ok((await counts(page)).soft === c0.soft + 1, "the soft notes repeated");
    ok(!(await page.evaluate(() => document.getElementById("alarm").classList.contains("on"))), "the alarm must not ring for a schedule step");
    await expect(step(0)).toHaveClass(/isNow/);
    // +1: a full extra minute, no second warning for it
    await page.click(".w-sched .sdMore");
    await expect(step(0)).not.toHaveClass(/isUp/);
    await expect(step(0).locator(".sdTime")).toHaveText(/^(1:00|0:5\d)$/);
    await page.waitForTimeout(700);
    ok((await counts(page)).ping === c0.ping + 1, "the extra minute rang a second warning");
    // Next; a tap on a step jumps there; Back
    await next.click();
    await expect(step(0)).toHaveClass(/isDone/);
    await expect(step(1)).toHaveClass(/isNow/);
    await step(4).click();
    await expect(step(4)).toHaveClass(/isNow/);
    await expect(step(3)).toHaveClass(/isDone/);
    await page.click(".w-sched .sdBack");
    await expect(step(3)).toHaveClass(/isNow/);
    // the last step, then All done, then over again
    await step(5).click();
    await expect(next).toHaveText("All done");
    await next.click();
    await expect(page.locator(".w-sched .sdDone")).toBeVisible();
    await expect(page.locator(".w-sched .sdList")).toBeHidden();
    await expect(next).toHaveText("Start over");
    await next.click();
    await expect(next).toHaveText("Start");
    await expect(step(0)).not.toHaveClass(/isNow|isDone/);
  });

  test("the step survives a reload and works locked; 'moves on by itself' moves on; tomorrow starts fresh", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const step = i => page.locator(".w-sched .sdStep").nth(i);
    await page.click(".w-sched .sdNext");
    await page.click(".w-sched .sdNext");
    await expect(step(1)).toHaveClass(/isNow/);
    await dh.reopen(T2);
    await dh.launch();
    await expect(step(1)).toHaveClass(/isNow/);
    await expect(step(0)).toHaveClass(/isDone/);
    // locked: moving through the day is teaching, not setup
    await page.click("#lockBtn");
    await expect(page.locator("body")).toHaveClass(/locked/);
    await page.click(".w-sched .sdNext");
    await expect(step(2)).toHaveClass(/isNow/);
    await dh.unlock();
    // auto: four seconds after the time is up, the next step is now
    await page.evaluate(() => { window.Steward.config.support.base.schedule.auto = true; window.Steward.support.changed(); });
    await shift(page, 15 * 60000 + 1000);
    await expect(step(2)).toHaveClass(/isUp/);
    await shift(page, 4500);
    await expect(step(3)).toHaveClass(/isNow/, { timeout: 4000 });
    // the next day: nothing carried over
    await shift(page, 24 * 3600000);
    await expect(page.locator(".w-sched .sdNext")).toHaveText("Start", { timeout: 4000 });
    await expect(step(3)).not.toHaveClass(/isNow/);
  });

  test("Now and Next only; a wide card runs left to right; an empty schedule says so", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await page.evaluate(() => { window.Steward.config.support.base.schedule.nowNext = true; window.Steward.support.changed(); });
    const vis = () => page.locator(".w-sched .sdStep:visible");
    await expect(vis()).toHaveCount(2);                        // before the start: the first two
    await page.click(".w-sched .sdNext"); await page.click(".w-sched .sdNext");
    await expect(vis()).toHaveCount(2);
    await expect(vis().nth(0)).toHaveClass(/isNow/);
    await expect(vis().nth(1).locator(".sdLabel")).toHaveText("With the teacher");
    // a wide card
    await page.evaluate(() => {
      const en = document.querySelector(".w-sched")._entry;
      en.cfg.x = 0; en.cfg.y = 0; en.cfg.w = 100; en.cfg.h = 30;
      Object.assign(en.el.style, { left: "0%", top: "0%", width: "100%", height: "30%" });
      window.Steward.config.support.base.schedule.nowNext = false; window.Steward.support.changed();
    });
    await page.waitForTimeout(200);
    const dir = await page.locator(".w-sched .sdList").evaluate(e => getComputedStyle(e).flexDirection);
    ok(dir === "row", "a wide schedule should run left to right: " + dir);
    const over = await page.evaluate(() => Array.from(document.querySelectorAll(".w-sched .sdStep")).filter(s => s.scrollHeight > s.clientHeight + 2).length);
    ok(over === 0, over + " steps overflow in the wide layout");
    await page.evaluate(() => { window.Steward.config.support.base.schedule.steps = []; window.Steward.support.changed(); });
    await expect(page.locator(".w-sched .sdEmpty")).toContainText("No steps yet");
    await expect(page.locator(".w-sched .sdNext")).toBeHidden();
  });
});

test.describe("Steward 1.0: First / Then", () => {
  test("First is now; its ring drains; at zero three soft notes and Then is now with its own time; Done moves on; Start again", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const first = page.locator(".w-ft .ft-first"), then = page.locator(".w-ft .ft-then");
    const start = page.locator(".w-ft .ftStart"), done = page.locator(".w-ft .ftDone");
    await expect(first).toHaveClass(/isNow/);
    await expect(first.locator(".ftLabel")).toHaveText("Work");
    await expect(then.locator(".ftLabel")).toHaveText("Break");
    await expect(first.locator(".ftTime")).toHaveText("10 min");
    await expect(start).toHaveText("Start 10 min");
    await start.click();
    await expect(first).toHaveClass(/isRun/);
    await expect(start).toBeHidden();
    await expect(first.locator(".ftTime")).toHaveText(/^(10:00|9:5\d)$/);
    await shift(page, 5 * 60000);
    await page.waitForTimeout(1200);
    const off = await first.locator(".ftRingFg").evaluate(e => parseFloat(getComputedStyle(e).strokeDashoffset));
    ok(off > 46 && off < 54, "ring at half: " + off);
    const c0 = await counts(page);
    await shift(page, 5 * 60000 + 500);
    await expect(then).toHaveClass(/isNow/);
    await expect(then).toHaveClass(/isRun/);                   // the break began by itself
    await expect(first).toHaveClass(/isDone/);
    await expect(then.locator(".ftTime")).toHaveText(/^(3:00|2:5\d)$/);
    await expect.poll(async () => (await counts(page)).soft).toBe(c0.soft + 1);
    ok(!(await page.evaluate(() => document.getElementById("alarm").classList.contains("on"))), "the alarm must not ring for First / Then");
    await shift(page, 3 * 60000 + 500);
    await expect(done).toHaveText("Start again");
    await expect(then).toHaveClass(/isDone/);
    await expect.poll(async () => (await counts(page)).soft).toBe(c0.soft + 2);
    await done.click();
    await expect(first).toHaveClass(/isNow/);
    await expect(first).not.toHaveClass(/isRun/);
    // Done without the timer: straight to Then
    await done.click();
    await expect(then).toHaveClass(/isNow/);
    await dh.reopen(T2);
    await dh.launch();
    await expect(page.locator(".w-ft .ft-then")).toHaveClass(/isNow/);
  });

  test("a tap on a panel changes it for today: quick choices, every picture, minutes; three steps; it can follow the schedule", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const then = page.locator(".w-ft .ft-then"), first = page.locator(".w-ft .ft-first");
    await then.click();
    await expect(page.locator("#picPop")).toBeVisible();
    await expect(page.locator("#picPop .ppTitle")).toHaveText("Then");
    await expect(page.locator("#picPop .ppQuick .ppTile")).toHaveCount(8);
    await expect(page.locator("#picPop .ppQuick .ppTile.isOn .ppLabel")).toHaveText("Break");
    await page.locator("#picPop .ppQuick .ppTile", { hasText: "Computer" }).click();
    await expect(page.locator("#picPop")).toBeHidden();
    await expect(then.locator(".ftLabel")).toHaveText("Computer");
    await expect(then.locator(".ftTime")).toHaveText("3 min");                  // the minutes stay
    // minutes, and every picture
    await first.click();
    await page.click("#picPop .ppPlus");
    await expect(page.locator("#picPop .ppMin")).toHaveText("12 min");
    await page.click("#picPop .ppMinus"); await page.click("#picPop .ppMinus");
    await expect(page.locator("#picPop .ppMin")).toHaveText("9 min");
    await page.click("#picPop .ppMore");
    await expect(page.locator("#picPop .ppAll .ppTile")).toHaveCount(52);        // every picture but the five faces
    await page.locator("#picPop .ppAll .ppTile", { hasText: "Flash cards" }).click();
    await expect(first.locator(".ftLabel")).toHaveText("Flash cards");
    await expect(first.locator(".ftTime")).toHaveText("9 min");
    // Esc closes the chooser and nothing else
    await first.click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#picPop")).toBeHidden();
    // the class's usual pair is untouched — today's pick lives beside the board, not in the setup
    const base = await page.evaluate(() => window.Steward.config.support.base.firstThen);
    ok(base.first.label === "Work" && base.then.label === "Break", "the setup was edited by a tap on the board");
    // three steps
    await page.evaluate(() => { window.Steward.config.support.base.firstThen.three = true; window.Steward.support.changed(); });
    await expect(page.locator(".w-ft .ftPane")).toHaveCount(3);
    await expect(page.locator(".w-ft .ft-next .ftTag")).toHaveText("Next");
    // following the schedule: First is now, Then is next, and Done moves the schedule
    await page.evaluate(() => { const f = window.Steward.config.support.base.firstThen; f.three = false; f.follow = true; window.Steward.support.changed(); });
    await expect(first.locator(".ftLabel")).toHaveText("Check in");
    await expect(then.locator(".ftLabel")).toHaveText("Warm up");
    await expect(page.locator(".w-ft .ftDone")).toHaveText("Start");
    await page.click(".w-ft .ftDone");
    await expect(page.locator(".w-sched .sdStep").nth(0)).toHaveClass(/isNow/);
    await expect(first).toHaveClass(/isRun/);
    await page.click(".w-ft .ftDone");
    await expect(first.locator(".ftLabel")).toHaveText("Warm up");
    await expect(then.locator(".ftLabel")).toHaveText("With the teacher");
    await expect(page.locator(".w-sched .sdStep").nth(1)).toHaveClass(/isNow/);
    await first.click();
    await expect(page.locator("#picPop")).toBeHidden();                         // not changed here
  });
});

test.describe("Steward 1.0: Token board", () => {
  test("a tap gives, a hold takes one back; a full row earns the reward with three soft notes; today's tokens survive a reload and are gone tomorrow", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const slot = i => page.locator(".w-tokens .tkSlot").nth(i), on = () => page.locator(".w-tokens .tkSlot.isOn");
    await expect(page.locator(".w-tokens .tkSlot")).toHaveCount(5);
    await expect(page.locator(".w-tokens .tkRewLabel")).toHaveText("Choice time");
    await slot(3).click(); await slot(0).click();
    await expect(on()).toHaveCount(2);
    await expect(slot(1)).toHaveClass(/isOn/);                    // they fill from the left wherever the finger lands
    await hold(page, slot(0));
    await expect(on()).toHaveCount(1);
    await dh.reopen(T2);
    await dh.launch();
    await expect(on()).toHaveCount(1);
    // locked: giving a token is teaching
    await page.click("#lockBtn");
    const c0 = await counts(page);
    for (let i = 0; i < 4; i++) await slot(4).click();
    await expect(on()).toHaveCount(5);
    await expect(page.locator(".w-tokens .tkWin")).toBeVisible();
    await expect(page.locator(".w-tokens .tkWinMsg")).toHaveText("You earned it!");
    await expect(page.locator(".w-tokens .tkWinLabel")).toHaveText("Choice time");
    ok((await counts(page)).soft === c0.soft + 1, "the reward should chime softly, once");
    // the fifth was a slip: a hold on the banner takes it back
    await hold(page, page.locator(".w-tokens .tkWin"));
    await expect(page.locator(".w-tokens .tkWin")).toBeHidden();
    await expect(on()).toHaveCount(4);
    await slot(0).click();
    await expect(page.locator(".w-tokens .tkWin")).toBeVisible();
    await page.click(".w-tokens .tkAgain");
    await expect(on()).toHaveCount(0);
    await slot(0).click();
    await dh.unlock();
    // what they are working for: a tap offers this class's rewards, for today
    await page.click(".w-tokens .tkGoal");
    await expect(page.locator("#picPop .ppTitle")).toHaveText("Working for");
    await page.locator("#picPop .ppQuick .ppTile", { hasText: "Game" }).click();
    await expect(page.locator(".w-tokens .tkRewLabel")).toHaveText("Game");
    // tomorrow
    await shift(page, 24 * 3600000);
    await expect(on()).toHaveCount(0, { timeout: 4000 });
    await expect(page.locator(".w-tokens .tkRewLabel")).toHaveText("Choice time");
  });

  test("a row for each student: names from the roster, absent students left out, a full row earns it, a tap on it starts that student over (with Undo); eight tokens sit in two rows", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await page.evaluate(() => {
      const c = window.Steward.config;
      c.rosters = [{ period: "2nd", names: ["Ava", "Ben", "Cal"] }];
      c.support.base.tokens.who = "each"; c.support.base.tokens.token = "paw"; c.support.base.tokens.goal = 3;
      window.Steward.support.changed();
    });
    const row = n => page.locator(".w-tokens .tkRow", { hasText: n });
    await expect(page.locator(".w-tokens .tkRow")).toHaveCount(3);
    await expect(page.locator(".w-tokens .tkSlots")).toBeHidden();
    await row("Ava").click(); await row("Ava").click(); await row("Ben").click();
    await expect(row("Ava").locator(".tkDot.isOn")).toHaveCount(2);
    await hold(page, row("Ben"));
    await expect(row("Ben").locator(".tkDot.isOn")).toHaveCount(0);
    const c0 = await counts(page);
    await row("Ava").click();
    await expect(row("Ava")).toHaveClass(/isWon/);
    await expect(row("Ava").locator(".tkRowWin svg")).toHaveCount(1);
    ok((await counts(page)).soft === c0.soft + 1, "a full row should chime softly");
    await row("Ava").click();                                       // the reward was taken: a new board for Ava
    await expect(row("Ava").locator(".tkDot.isOn")).toHaveCount(0);
    await expect(page.locator("#undoToast")).toBeVisible();
    await page.click("#undoToast button");
    await expect(row("Ava")).toHaveClass(/isWon/);
    // absent today: no row
    await page.evaluate(() => { window.Steward.absent.toggle("2nd", "Cal"); window.Steward.support.changed(); });
    await expect(page.locator(".w-tokens .tkRow")).toHaveCount(2);
    // no names for the class: one board, and it says why
    await page.evaluate(() => { window.Steward.config.rosters = []; window.Steward.support.changed(); });
    await expect(page.locator(".w-tokens .tkSlots")).toBeVisible();
    await expect(page.locator(".w-tokens .tkEmpty")).toContainText("No names for 2nd yet");
    // eight tokens: two rows of four
    await page.evaluate(() => { const t = window.Steward.config.support.base.tokens; t.who = "group"; t.goal = 8; window.Steward.support.changed(); });
    await expect(page.locator(".w-tokens .tkSlot")).toHaveCount(8);
    const ys = await page.locator(".w-tokens .tkSlot").evaluateAll(els => Array.from(new Set(els.map(e => Math.round(e.getBoundingClientRect().top)))).length);
    ok(ys === 2, "eight tokens should sit in two rows: " + ys);
    const box = await page.evaluate(() => { const w = document.querySelector(".w-tokens .wBody").getBoundingClientRect(); return Array.from(document.querySelectorAll(".w-tokens .tkSlot")).every(s => { const r = s.getBoundingClientRect(); return r.left >= w.left && r.right <= w.right && r.top >= w.top && r.bottom <= w.bottom; }); });
    ok(box, "tokens overflow the card");
  });

  test("@touch a finger gives a token and a held finger takes it back", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const s0 = page.locator(".w-tokens .tkSlot").first();
    await s0.tap(); await s0.tap();
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(2);
    const b = await s0.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const pt = [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt });
    await page.waitForTimeout(750);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(1);
  });
});

test.describe("Steward 1.0: Calm", () => {
  test("Breathe: the shape grows on the in-breath and shrinks on the out-breath, the word and the count inside it; it ends by itself with one soft note", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await scene(page, "Break");
    const word = page.locator(".w-calm .cmWord"), orb = page.locator(".w-calm .cmOrb");
    const size = () => orb.evaluate(e => new DOMMatrix(getComputedStyle(e).transform).a);
    await expect(word).toHaveText("Ready?");
    await expect(page.locator(".w-calm .cmSub")).toHaveText("5 slow breaths · in 4, out 6");
    ok(Math.abs(await size() - 0.5) < 0.01, "the shape should rest small");
    await page.click(".w-calm .cmGo");
    await expect(word).toHaveText("Breathe in");
    await expect(page.locator(".w-calm .cmCount")).toHaveText(/^[34]$/);
    await expect(page.locator(".w-calm .cmSub")).toHaveText("Breath 1 of 5");
    await shift(page, 3800);
    await expect.poll(size).toBeGreaterThan(0.95);
    await shift(page, 1000);
    await expect(word).toHaveText("Breathe out");
    await shift(page, 4000);
    await expect.poll(size).toBeLessThan(0.75);
    await shift(page, 14000);
    await expect(page.locator(".w-calm .cmSub")).toHaveText("Breath 3 of 5");
    const c0 = await counts(page);
    await shift(page, 31000);
    await expect(word).toHaveText("Well done");
    await expect(page.locator(".w-calm .cmGo")).toHaveText("Start");
    ok((await counts(page)).ping === c0.ping + 1, "one soft note at the end");
    // box breathing holds
    await page.evaluate(() => { window.Steward.config.support.base.calm.breath = "box"; window.Steward.support.changed(); });
    await page.click(".w-calm .cmGo");
    await shift(page, 4500);
    await expect(word).toHaveText("Hold");
    await expect.poll(size).toBeGreaterThan(0.99);
    await page.click(".w-calm .cmGo");                              // Stop
    await expect(word).toHaveText("Ready?");
  });

  test("Break: a disc that drains, shorter or longer by a minute, still running after a reload, three soft notes and a welcome back; Check in: five faces, 'What would help?', nothing recorded", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await scene(page, "Break");
    await page.click('.w-calm .cmTab[data-t="break"]');
    const digits = page.locator(".w-calm .cmDigits"), go = page.locator(".w-calm .cmBreakGo");
    await expect(digits).toHaveText("3:00");
    await page.click(".w-calm .cmMinus");
    await expect(digits).toHaveText("2:00");
    await go.click();
    await expect(go).toHaveText("End break");
    await expect(page.locator(".w-calm .cmMinus")).toBeDisabled();
    await shift(page, 60000);
    await expect(digits).toHaveText(/^(1:00|0:5\d)$/);
    const d = await page.locator(".w-calm .cmDiscFg").getAttribute("d");
    ok(/^M50 50L50 4A46 46 0 [01] 1 /.test(d), "the disc should be a wedge: " + d);
    await dh.reopen(T2);
    await dh.launch();
    await scene(page, "Break");
    await expect(page.locator('.w-calm .cmTab[data-t="break"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".w-calm .cmBreakGo")).toHaveText("End break");
    const c0 = await counts(page);
    await shift(page, 3 * 60000);
    await expect(page.locator(".w-calm .cmBreakMsg")).toHaveText("Break is over. Welcome back.");
    await expect(page.locator(".w-calm .cmBreakGo")).toHaveText("Start break");
    ok((await counts(page)).soft === c0.soft + 1, "three soft notes at the end of the break, once");
    ok(!(await page.evaluate(() => document.getElementById("alarm").classList.contains("on"))), "the alarm must not ring for a break");
    // check in
    await page.click('.w-calm .cmTab[data-t="check"]');
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("How do you feel?");
    await expect(page.locator(".w-calm .cmFace")).toHaveCount(5);
    ok((await page.locator(".w-calm .cmFaceLabel").allTextContents()).join() === "Great,Okay,Tired,Worried,Upset", "faces");
    await page.locator(".w-calm .cmFace", { hasText: "Worried" }).click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("What would help?");
    await expect(page.locator(".w-calm .cmChoice")).toHaveCount(6);
    await page.locator(".w-calm .cmChoice", { hasText: "Get water" }).click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("Good choice.");
    await expect(page.locator(".w-calm .cmOk b")).toHaveText("Get water");
    await page.click(".w-calm .cmBackBtn");
    await expect(page.locator(".w-calm .cmFaces")).toBeVisible();
    // "Breathe" opens the breathing and starts it
    await page.locator(".w-calm .cmFace", { hasText: "Upset" }).click();
    await page.locator(".w-calm .cmChoice", { hasText: "Breathe" }).click();
    await expect(page.locator('.w-calm .cmTab[data-t="breathe"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".w-calm .cmWord")).toHaveText("Breathe in");
    // a check-in leaves nothing behind: not in today's store, not in the saved board
    await dh.flush();
    const left = await page.evaluate(() => [localStorage.getItem("steward.today"), localStorage.getItem("steward.config")]);
    ok(!/Worried|Upset|feel|water|check/i.test(left[0]), "a check-in was recorded for today: " + left[0]);
    ok(!/Worried|Upset|feel-/.test(left[1]), "a check-in reached the saved board");
    // a class with the check-in off has no such tab
    await page.evaluate(() => { window.Steward.config.support.base.calm.checkin = false; window.Steward.support.changed(); });
    await expect(page.locator('.w-calm .cmTab[data-t="check"]')).toBeHidden();
  });

  test("a break can have a nature sound under it: it reports to Now Playing and stops with the break", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await scene(page, "Break");
    await page.evaluate(() => { window.Steward.config.support.base.calm.sound = "brook"; window.Steward.support.changed(); });
    await page.click('.w-calm .cmTab[data-t="break"]');
    await page.click(".w-calm .cmBreakGo");
    await expect(page.locator("#nowPlaying")).toBeHidden();          // the card is on screen: End break is right there
    // put away, the sound keeps a pause within reach
    await page.evaluate(() => window.Steward.canvas.minimize(document.querySelector(".w-calm")));
    await expect(page.locator("#nowPlaying")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("#nowPlaying")).toContainText("Break \u00b7 Babbling brook");
    await page.click("#nowPlaying");                                   // the pill stops the sound, not the break
    await expect(page.locator("#nowPlaying")).toBeHidden({ timeout: 3000 });
    ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("steward.today")).d.calm; return !!s && s.end > window.Steward.now().getTime(); }), "stopping the sound ended the break");
    // and the sound ends with the break
    await page.evaluate(() => window.Steward.canvas.restore(document.querySelector(".w-calm")));
    await page.click(".w-calm .cmBreakGo");                            // End break
    await page.click(".w-calm .cmBreakGo");                            // a new one: the sound again
    await page.evaluate(() => window.Steward.canvas.minimize(document.querySelector(".w-calm")));
    await expect(page.locator("#nowPlaying")).toBeVisible({ timeout: 3000 });
    await page.evaluate(() => window.Steward.shiftClock(3 * 60000 + 1000));
    await expect(page.locator("#nowPlaying")).toBeHidden({ timeout: 4000 });
  });
});

test.describe("Steward 1.0: Classes", () => {
  test("Settings → Classes: a class gets its own version of a tool; the board follows the bell to it; the Class pill picks by hand until the next bell", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await expect(page.locator("#clsBtn .clsName")).toHaveText("2nd");
    await page.click("#setBtn");
    await dh.tab("classes");
    await expect(page.locator("#secClasses")).toBeVisible();
    const opts = await page.locator("#spClass option").allTextContents();
    ok(opts[0] === "All classes" && opts.includes("1st") && opts.includes("HOWL Time") && opts.includes("6th"), "classes on offer: " + opts);
    await expect(page.locator("#spTools .spTool")).toHaveCount(4);
    // 3rd: its own token board — three paws
    await page.selectOption("#spClass", "c:3rd");
    const tok = page.locator('#spTools .spTool[data-tool="tokens"]');
    await expect(tok.locator(".spSame")).toHaveText("Uses the All classes setup.");
    await tok.locator(".fCheck", { hasText: "Different for 3rd" }).click();
    const goal = tok.locator(".fField", { hasText: "Tokens to earn" }).locator("input");
    await expect(goal).toHaveValue("5");
    await goal.fill("3"); await goal.blur();
    await tok.locator('.spTok[aria-label="Paw"]').click();
    // the other three tools still follow All classes
    await expect(page.locator("#spTools .spSame")).toHaveCount(3);
    // Close forgets; Apply keeps
    await page.click("#closeBtn");
    ok((await page.evaluate(() => window.Steward.config.support.classes.length)) === 0, "Close kept a draft");
    await page.click("#setBtn");
    await page.selectOption("#spClass", "c:3rd");
    await tok.locator(".fCheck", { hasText: "Different for 3rd" }).click();
    await goal.fill("3"); await goal.blur();
    await tok.locator('.spTok[aria-label="Paw"]').click();
    await page.click("#applyBtn");
    await expect(page.locator("#setErrors")).toHaveText("Applied.");
    await expect(page.locator("#spClass option", { hasText: "3rd" })).toHaveText(/its own tool/);
    await page.click("#closeBtn");
    const cls = await page.evaluate(() => window.Steward.config.support.classes);
    ok(cls.length === 1 && cls[0].name === "3rd" && cls[0].tokens.goal === 3 && cls[0].tokens.token === "paw" && !cls[0].schedule, "saved: " + JSON.stringify(cls).slice(0, 200));
    // 2nd is in the room: five stars
    await expect(page.locator(".w-tokens .tkSlot")).toHaveCount(5);
    await page.locator(".w-tokens .tkSlot").first().click();
    // the bell brings 3rd in: three, and its own count
    await shift(page, 80 * 60000);                                  // 11:50
    await expect(page.locator("#clsBtn .clsName")).toHaveText("3rd", { timeout: 4000 });
    await expect(page.locator(".w-tokens .tkSlot")).toHaveCount(3);
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(0);
    // by hand: All classes (five, and 2nd's token is not theirs)
    await page.click("#clsBtn");
    await expect(page.locator("#clsMenu .clsItem").first()).toHaveAttribute("aria-pressed", "true");   // Follow the bell
    await page.locator("#clsMenu .clsItem", { hasText: "2nd" }).click();
    await expect(page.locator("#clsBtn .clsName")).toHaveText("2nd");
    await expect(page.locator("#clsBtn")).toHaveClass(/byHand/);
    await expect(page.locator(".w-tokens .tkSlot")).toHaveCount(5);
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(1);
    // the next bell takes the board back
    await shift(page, 90 * 60000);                                  // 1:20 — 4th
    await expect(page.locator("#clsBtn .clsName")).toHaveText("4th", { timeout: 4000 });
    await expect(page.locator("#clsBtn")).not.toHaveClass(/byHand/);
    // the setup is saved with the board
    await dh.flush();
    ok((await dh.stored()).cfg.support.classes[0].tokens.goal === 3, "the class setup was not saved");
  });

  test("a group that is not on the bell; a tool switched off for a class leaves the students' board; ✎ on a card opens its setup for the class in the room", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    // the pencil goes straight to the tool, for 2nd
    await page.locator(".w-tokens .wEdit").click();
    await expect(page.locator("#secClasses")).toBeVisible();
    await expect(page.locator("#spClass")).toHaveValue("c:2nd");
    // a group of her own
    await page.fill("#spNewName", "Group A");
    await page.click("#spAddBtn");
    await expect(page.locator("#spClass")).toHaveValue("c:Group A");
    await expect(page.locator("#spRemoveBtn")).toBeVisible();
    const sch = page.locator('#spTools .spTool[data-tool="schedule"]');
    await sch.locator(".fCheck", { hasText: "Different for Group A" }).click();
    await sch.locator("select").selectOption("short");
    await expect(sch.locator(".spList .spRow")).toHaveCount(4);
    // edit a step: its word and minutes; add one from the pictures; move and remove
    const r0 = sch.locator(".spList .spRow").nth(1);
    await r0.locator(".spLabel").fill("Read with Ms. T");
    await r0.locator(".spMin input").fill("7"); await r0.locator(".spMin input").blur();
    await sch.locator(".spAdd").click();
    await page.locator("#picPop .ppAll .ppTile", { hasText: "Snack" }).click();
    await expect(sch.locator(".spList .spRow")).toHaveCount(5);
    await sch.locator(".spList .spRow").nth(4).locator('.spBtn[aria-label="Move up"]').click();
    await sch.locator(".spList .spRow").nth(0).locator(".spX").click();
    await expect(sch.locator(".spList .spRow")).toHaveCount(4);
    // 2nd: no calm card
    await page.selectOption("#spClass", "c:2nd");
    const calm = page.locator('#spTools .spTool[data-tool="calm"]');
    await calm.locator(".fCheck", { hasText: "Different for 2nd" }).click();
    await calm.locator(".fCheck", { hasText: "Show the calm card" }).click();
    await page.click("#applyBtn");
    await expect(page.locator("#setErrors")).toHaveText("Applied.");
    await page.click("#closeBtn");
    const saved = await page.evaluate(() => window.Steward.config.support.classes);
    const ga = saved.find(c => c.name === "Group A");
    ok(ga && ga.schedule.steps.map(s => s.label + ":" + s.min).join("|") === "Read with Ms. T:7|On my own:8|Snack:5|Pack up:2", "Group A: " + JSON.stringify(ga && ga.schedule.steps));
    ok(saved.find(c => c.name === "2nd").calm.on === false, "2nd's calm card should be off");
    // the calm card: a dashed note while unlocked, gone from the board when locked
    await scene(page, "Break");
    await expect(page.locator(".w-calm")).toHaveClass(/supOff/);
    await expect(page.locator(".w-calm .supOffNote")).toHaveText("Calm is off for 2nd.");
    await page.click("#lockBtn");
    ok((await page.locator(".w-calm").evaluate(e => getComputedStyle(e).visibility)) === "hidden", "an off tool should leave the locked board");
    await dh.unlock();
    // Group A by hand: its schedule
    await scene(page, "Daily Board");
    await page.click("#clsBtn");
    await page.locator("#clsMenu .clsItem", { hasText: "Group A" }).click();
    await expect(page.locator(".w-sched .sdStep")).toHaveCount(4);
    await expect(page.locator(".w-sched .sdStep").nth(0).locator(".sdLabel")).toHaveText("Read with Ms. T");
    // removing the group
    await page.click("#setBtn");
    await dh.tab("classes");
    await page.selectOption("#spClass", "c:Group A");
    await page.click("#spRemoveBtn");
    await page.click("#applyBtn");
    await page.click("#closeBtn");
    ok(!(await page.evaluate(() => window.Steward.config.support.classes.some(c => c.name === "Group A"))), "the group was not removed");
    await expect(page.locator(".w-sched .sdStep")).toHaveCount(6, { timeout: 4000 });
  });

  test("the whitelist: a hand-edited setup degrades field by field; an exported copy carries the setup and never today's tokens", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const out = await page.evaluate(() => window.Steward.sanitizeSupport({
      base: { tokens: { goal: 99, token: "skull", who: "all", reward: { pic: "nope", label: "  A   very long label that goes on and on  " } },
              schedule: { steps: [{ pic: "read", min: 500 }, {}, 7, { pic: "<svg onload=alert(1)>", label: "<b>x</b>" }], warn: -3 },
              calm: { breath: "hyper", breaths: 0, breakMin: 99, sound: "sirens" } },
      classes: [{ name: "2nd", calm: { breath: "box" } }, { name: "__proto__" }, { name: "2nd" }, { name: "   " }, "x", { name: "A".repeat(40) }]
    }));
    ok(out.base.tokens.goal === 10 && out.base.tokens.token === "star" && out.base.tokens.who === "group", "tokens: " + JSON.stringify(out.base.tokens).slice(0, 120));
    ok(out.base.tokens.reward.pic === "choice" && out.base.tokens.reward.label.length <= 24, "reward: " + JSON.stringify(out.base.tokens.reward));
    ok(out.base.schedule.steps.length === 3 && out.base.schedule.steps[0].min === 90 && out.base.schedule.steps[2].pic === "done" && out.base.schedule.warn === 0, "steps: " + JSON.stringify(out.base.schedule.steps));
    ok(out.base.calm.breath === "balloon" && out.base.calm.breaths === 3 && out.base.calm.breakMin === 15 && out.base.calm.sound === "", "calm: " + JSON.stringify(out.base.calm).slice(0, 120));
    ok(out.base.firstThen.first.label === "Work" && out.base.firstThen.choices.length === 8, "a missing tool should take the defaults");
    ok(out.classes.map(c => c.name).join("|") === "2nd|" + "A".repeat(20) && out.classes[0].calm.breath === "box" && !out.classes[0].tokens, "classes: " + JSON.stringify(out.classes).slice(0, 160));
    // a hostile label can only ever be text
    await page.evaluate(() => { window.Steward.config.support.base.schedule.steps[0].label = "<img src=x onerror=window.__x=1>"; window.Steward.support.changed(); });
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => !window.__x && !document.querySelector(".w-sched img")), "a label was parsed as markup");
    // export: the setup rides along, today's tokens do not
    await page.evaluate(() => { const c = window.Steward.config; c.rosters = [{ period: "2nd", names: ["Ava"] }]; c.support.base.tokens.who = "each"; window.Steward.support.changed(); });
    await page.locator(".w-tokens .tkRow").first().click();
    await page.click("#setBtn");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#dlBtn")]);
    const text = require("fs").readFileSync(await dl.path(), "utf8");
    const cfg = JSON.parse(/<script id="steward-config"[^>]*>([\s\S]*?)<\/script>/.exec(text)[1]);
    ok(cfg.support && cfg.support.base.tokens.who === "each", "the export lost the setup");
    ok(!/"tok:2nd"|steward\.today"\s*:/.test(/<script id="steward-config"[^>]*>([\s\S]*?)<\/script>/.exec(text)[1]) && !("today" in cfg), "today's tokens leaked into the export");
  });
});

/* The adversarial review before 1.0 shipped: each of these was a real failure in the first build. */
test.describe("Steward 1.0: hardening", () => {
  test("a break belongs to the board: a bell in the middle does not end it, its sound stops when it does, the notes come even with the card on another scene, and a new length from Settings shows at once", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-10-05T11:07");               // 2nd, two minutes before its bell
    await dh.launch();
    await page.evaluate(() => { window.Steward.config.support.base.calm.sound = "rain"; window.Steward.support.changed(); });
    await scene(page, "Break");
    await page.click('.w-calm .cmTab[data-t="break"]');
    await page.click(".w-calm .cmBreakGo");
    await shift(page, 150000);                                  // 11:09:30 — the bell rang; HOWL Time is coming in
    await expect(page.locator("#clsBtn .clsName")).toHaveText("HOWL Time", { timeout: 4000 });
    await expect(page.locator(".w-calm .cmBreakGo")).toHaveText("End break");
    // the card rebuilt on another scene still shows the break; away from every calm card it still ends on time
    const c0 = await counts(page);
    await scene(page, "Stations");
    await shift(page, 40000);
    await expect.poll(async () => (await counts(page)).soft, { timeout: 4000 }).toBe(c0.soft + 1);
    await scene(page, "Break");
    await page.click('.w-calm .cmTab[data-t="break"]');
    await expect(page.locator(".w-calm .cmBreakMsg")).toHaveText("Break is over. Welcome back.");
    await page.evaluate(() => window.Steward.canvas.minimize(document.querySelector(".w-calm")));
    await page.waitForTimeout(1200);
    await expect(page.locator("#nowPlaying")).toBeHidden();     // no sound left running
    await page.evaluate(() => window.Steward.canvas.restore(document.querySelector(".w-calm")));
    // Settings: seven minutes, now
    await page.evaluate(() => { window.Steward.config.support.base.calm.breakMin = 7; window.Steward.support.changed(); });
    await expect(page.locator(".w-calm .cmDigits")).toHaveText("7:00");
  });

  test("a pick by hand is remembered through a reload; a group that is not on the bell holds through a bell, a bell class does not; removing the picked group sends the board back to the bell; yesterday's store is deleted", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-10-05T10:05");               // 1st period, eight minutes before its bell
    await dh.launch();
    await page.evaluate(() => { window.Steward.config.support.classes.push({ name: "Group A" }); window.Steward.support.changed(); });
    await page.click("#clsBtn");
    await page.locator("#clsMenu .clsItem", { hasText: "Group A" }).click();
    await page.locator(".w-tokens .tkSlot").first().click();
    await page.locator(".w-tokens .tkSlot").first().click();
    await dh.flush();
    await dh.reopen("#t=2026-10-05T10:05");
    await dh.launch();
    await expect(page.locator("#clsBtn .clsName")).toHaveText("Group A");
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(2);
    await shift(page, 15 * 60000);                              // 10:20 — 2nd's bell has rung
    await page.waitForTimeout(1200);
    await expect(page.locator("#clsBtn .clsName")).toHaveText("Group A");      // her own group: it stays until she says
    // a bell class picked by hand goes back to the bell
    await page.click("#clsBtn");
    await page.locator("#clsMenu .clsItem", { hasText: "5th" }).click();
    await expect(page.locator("#clsBtn")).toHaveClass(/byHand/);
    await shift(page, 55 * 60000);                              // 11:15 — HOWL Time
    await expect(page.locator("#clsBtn .clsName")).toHaveText("HOWL Time", { timeout: 4000 });
    await expect(page.locator("#clsBtn")).not.toHaveClass(/byHand/);
    // Esc closes the Class menu and nothing else
    await page.click("#clsBtn");
    await page.keyboard.press("Escape");
    await expect(page.locator("#clsMenu")).toBeHidden();
    // the picked group is removed in Settings: no ghost class
    await page.click("#clsBtn");
    await page.locator("#clsMenu .clsItem", { hasText: "Group A" }).click();
    await page.click("#setBtn"); await dh.tab("classes");
    await page.selectOption("#spClass", "c:Group A");
    await page.click("#spRemoveBtn"); await page.click("#applyBtn"); await page.click("#closeBtn");
    await expect(page.locator("#clsBtn .clsName")).toHaveText("HOWL Time");
    // tomorrow: the pick, the tokens and the stored names are gone from the browser, not just ignored
    await page.evaluate(() => { const c = window.Steward.config; c.rosters = [{ period: "HOWL Time", names: ["Ana"] }]; c.support.base.tokens.who = "each"; window.Steward.support.changed(); });
    await page.locator(".w-tokens .tkRow").first().click();
    ok(/Ana/.test(await page.evaluate(() => localStorage.getItem("steward.today"))), "today's token should be stored");
    await shift(page, 24 * 3600000);
    await expect(page.locator(".w-tokens .tkDot.isOn")).toHaveCount(0, { timeout: 4000 });
    ok(!/Ana/.test(String(await page.evaluate(() => localStorage.getItem("steward.today")))), "yesterday's names stayed in the browser");
  });

  test("tokens: two students with one first name each have a row; odd names are only names; a board with no bells finds its roster; ten tokens keep the names; a slow press on Start again is Start again", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await page.evaluate(() => {
      const c = window.Steward.config;
      c.rosters = [{ period: "2nd", names: ["Sam", "Sam", "__proto__", "constructor", "<b>Bo</b>"] }];
      c.support.base.tokens.who = "each"; c.support.base.tokens.goal = 3;
      window.Steward.support.changed();
    });
    const row = i => page.locator(".w-tokens .tkRow").nth(i), on = i => row(i).locator(".tkDot.isOn");
    await expect(page.locator(".w-tokens .tkRow")).toHaveCount(5);
    await row(0).click(); await row(0).click(); await row(1).click();
    await expect(on(0)).toHaveCount(2);
    await expect(on(1)).toHaveCount(1);
    await row(2).click(); await row(3).click(); await row(3).click();
    await expect(on(2)).toHaveCount(1);
    await expect(on(3)).toHaveCount(2);
    await expect(row(4).locator(".tkName")).toHaveText("<b>Bo</b>");
    ok(await page.evaluate(() => ({}).polluted === undefined && !document.querySelector(".w-tokens .tkName b")), "a name was treated as more than a name");
    await dh.reopen(T2); await dh.launch();
    await expect(on(0)).toHaveCount(2);
    await expect(on(2)).toHaveCount(1);
    // ten tokens: the names still have room
    await page.evaluate(() => { window.Steward.config.support.base.tokens.goal = 10; window.Steward.support.changed(); });
    const w = await page.locator(".w-tokens .tkName").evaluateAll(els => Math.min(...els.map(e => e.getBoundingClientRect().width)));
    ok(w >= 48, "a name was squeezed to " + w + "px");
    const clipped = await page.evaluate(() => Array.from(document.querySelectorAll(".w-tokens .tkRow")).some(r => { const b = r.getBoundingClientRect(), d = r.querySelector(".tkDot:last-child").getBoundingClientRect(); return d.right > b.right + 1; }));
    ok(!clipped, "the tenth token is clipped");
    // no bells at all: the one roster is the class
    await page.evaluate(() => { window.Steward.setSchedule(-1); window.Steward.support.changed(); });
    // (the schedule is still in Settings — a board with no week types is the case the picker handles)
    await page.evaluate(() => { const c = window.Steward.config; c.bell.groups = []; c.rosters = [{ period: "Class", names: ["Ava", "Ben"] }]; c.support.base.tokens.goal = 3; window.Steward.support.changed(); });
    await expect(page.locator("#clsBtn .clsName")).toHaveText("All classes", { timeout: 4000 });
    await expect(page.locator(".w-tokens .tkRow")).toHaveCount(2);
    // the group board: a slow press on Start again starts again
    await page.evaluate(() => { window.Steward.config.support.base.tokens.who = "group"; window.Steward.support.changed(); });
    for (let i = 0; i < 3; i++) await page.locator(".w-tokens .tkSlot").first().click();
    await expect(page.locator(".w-tokens .tkWin")).toBeVisible();
    await hold(page, page.locator(".w-tokens .tkAgain"));
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(0);
  });

  test("schedule and First / Then under change: a tap on NOW does not restart it; raised minutes ring again; ten steps fit; Now / Next keeps whole words; minutes changed on a running panel start it over quietly; the chooser keeps the keyboard", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    const step = i => page.locator(".w-sched .sdStep").nth(i);
    await page.click(".w-sched .sdNext");
    await shift(page, 2 * 60000);
    await step(0).click();                                      // NOW, tapped
    await page.waitForTimeout(700);
    await expect(step(0).locator(".sdTime")).toHaveText(/^(1:00|0:5\d)$/);
    // it runs out; she gives it ten minutes in Settings; it is a running step again and will ring again
    const c0 = await counts(page);
    await shift(page, 61000);
    await expect(step(0)).toHaveClass(/isUp/);
    await page.evaluate(() => { window.Steward.config.support.base.schedule.steps[0].min = 10; window.Steward.support.changed(); });
    await expect(step(0)).not.toHaveClass(/isUp/, { timeout: 3000 });
    await page.evaluate(() => { window.Steward.config.support.base.schedule.auto = true; window.Steward.support.changed(); });
    await page.waitForTimeout(1200);
    await expect(step(0)).toHaveClass(/isNow/);                 // "moves on by itself" must not skip a step with time left
    await shift(page, 8 * 60000);
    await expect.poll(async () => (await counts(page)).soft, { timeout: 4000 }).toBe(c0.soft + 2);
    // ten steps, two-line words: nothing clipped
    await page.evaluate(() => {
      const s = window.Steward.config.support.base.schedule; s.auto = false;
      s.steps = Array.from({ length: 10 }, (_, i) => ({ pic: "teacher", label: "With the teacher " + (i + 1), min: 5 }));
      window.Steward.support.changed();
    });
    await page.click(".w-sched .sdNext");
    await page.waitForTimeout(300);
    const clip = await page.evaluate(() => Array.from(document.querySelectorAll(".w-sched .sdStep")).map(s => { const t = s.querySelector(".sdTxt"); return Math.round(t.scrollHeight - s.clientHeight); }).filter(d => d > 2));
    ok(clip.length === 0, "steps clipped by " + clip.join());
    // Now / Next: whole words
    await page.evaluate(() => {
      const s = window.Steward.config.support.base.schedule; s.nowNext = true;
      s.steps = [{ pic: "read", label: "Read together", min: 15 }, { pic: "teacher", label: "Work with teacher", min: 10 }];
      window.Steward.support.changed();
    });
    await page.waitForTimeout(300);
    const cut = await page.locator(".w-sched .sdStep:visible .sdLabel").evaluateAll(els => els.filter(e => e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2).map(e => e.textContent));
    ok(cut.length === 0, "labels cut: " + cut.join());
    // First / Then: ten minutes running, four gone; she steps it down to three — it starts over at three, no ring
    const first = page.locator(".w-ft .ft-first");
    await page.click(".w-ft .ftStart");
    await shift(page, 4 * 60000);
    const c1 = await counts(page);
    await first.click();
    for (let i = 0; i < 7; i++) await page.click("#picPop .ppMinus");
    await expect(page.locator("#picPop .ppMin")).toHaveText("3 min");
    await page.waitForTimeout(1200);
    ok((await counts(page)).soft === c1.soft, "stepping the minutes down rang behind the chooser");
    await expect(first).toHaveClass(/isNow/);
    // the keyboard belongs to the chooser: Space and R do nothing to the board, Tab stays inside
    await page.keyboard.press("r"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
    ok(await page.evaluate(() => !!document.activeElement.closest("#picPop")), "Tab left the chooser");
    await page.keyboard.press("Escape");
    await expect(first).toHaveClass(/isRun/);
    await expect(first.locator(".ftTime")).toHaveText(/^(3:00|2:5\d)$/);
    // three panels switched on mid-run: it starts over rather than land somewhere wrong
    await page.click(".w-ft .ftDone");
    await expect(page.locator(".w-ft .ft-then")).toHaveClass(/isNow/);
    await page.evaluate(() => { window.Steward.config.support.base.firstThen.three = true; window.Steward.support.changed(); });
    await expect(first).toHaveClass(/isNow/);
    // locked: this class's choices, not the whole picture set
    await page.click("#lockBtn");
    await first.click();
    await expect(page.locator("#picPop .ppMore")).toBeHidden();
    await expect(page.locator("#picPop .ppAll")).toBeHidden();
    await page.keyboard.press("Escape");
    await dh.unlock();
  });

  test("Settings → Classes says when twelve classes are full, and a bell class with nothing of its own is not one of them", async ({ page, dh }) => {
    await dh.openShipped(T2);
    await dh.launch();
    await page.click("#setBtn"); await dh.tab("classes");
    for (let i = 1; i <= 12; i++){ await page.fill("#spNewName", "G" + i); await page.click("#spAddBtn"); }
    await expect(page.locator("#spCapNote")).toBeHidden();
    await page.fill("#spNewName", "G13"); await page.click("#spAddBtn");
    await expect(page.locator("#spCapNote")).toContainText("Twelve classes");
    await page.selectOption("#spClass", "c:3rd");
    const box = page.locator('#spTools .spTool[data-tool="calm"] .fCheck', { hasText: "Different for 3rd" });
    await box.click();
    await expect(page.locator("#spCapNote")).toContainText("Twelve classes");
    await expect(box.locator("input")).not.toBeChecked();
    // a class name with two spaces matches its bell label exactly
    const two = await page.evaluate(() => window.Steward.sanitizeSupport({ classes: [{ name: " Group  B ", tokens: { goal: 9 } }] }).classes[0].name);
    ok(two === "Group  B", "class names must be trimmed the way bell labels are: " + JSON.stringify(two));
    // ticking and unticking leaves no stub behind
    await page.selectOption("#spClass", "c:G1"); await page.click("#spRemoveBtn");
    await page.selectOption("#spClass", "c:3rd");
    for (let i = 0; i < 3; i++){ await box.click(); await box.click(); }
    ok((await page.evaluate(() => window.Steward.supSettings.draft().classes.filter(c => c.name === "3rd").length)) === 0, "an empty bell-class entry was left in the draft");
  });
});
