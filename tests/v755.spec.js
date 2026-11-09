/* Deckhand 7.55's audit, ported to Steward 1.2 — the fixes to code Steward shares: timers, the bells
   and the store, the pen and Settings. (The name picker's round, the comment cards and the 7.52 stage
   tests are the math room's and stay in Deckhand.) Names are synthetic. */
const { test, expect, ok } = require("./helpers");

test.describe("Deckhand 7.55 (audit) in Steward: timers", () => {
  test("1a: a running timer that is deleted never rings the alarm at 0:00", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-29T10:30");
    await dh.launch();
    await dh.addTimer();
    /* started and removed in one go — a slow click on a loaded machine must not let 0:00 come first */
    const ran = await page.evaluate(() => {
      const api = document.querySelector(".w-timer")._entry.api;
      api.startSeconds(1);
      const r = api.running();
      document.querySelector(".w-timer .wClose").click();
      return r;
    });
    ok(ran, "the timer did not start");
    await expect(page.locator(".w-timer")).toHaveCount(0);
    await page.waitForTimeout(1400);               // past its 0:00
    ok(!(await page.evaluate(() => document.getElementById("alarm").classList.contains("on"))), "a deleted timer rang the alarm");
  });

  test("1j: a typed \"9999\" runs as 100:39, and the running face says so", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-29T10:30");
    await dh.launch();
    await dh.addTimer();
    const face = await page.evaluate(() => {
      const api = document.querySelector(".w-timer")._entry.api;
      api.entryStart("9"); api.entryDigit("9"); api.entryDigit("9"); api.entryDigit("9");
      api.commitEntryAndStart();
      const f = document.querySelector(".w-timer .tDisplay").textContent;
      api.reset();
      return f;
    });
    ok(/^100:3\d$/.test(face), "the running face: " + face);
  });
});

test.describe("Deckhand 7.55 (audit) in Steward: the bells and the store", () => {
  test("2a: on a Wednesday, \"Regular times instead\" runs the regular blocks", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-23T10:30");        // Wednesday, Teal
    await dh.launch();
    await expect(page.locator("#weekTag")).toHaveText("Teal Week (Wed)");
    await page.evaluate(() => window.Steward.setToday("regular", []));
    await expect(page.locator("#weekTag")).toHaveText("Teal Week");
    const st = await page.evaluate(() => window.Steward.bellStatusAt("2026-09-23T10:30"));
    ok(st.sched === "Teal Week", "the status still read the Wednesday schedule: " + JSON.stringify(st));
    await dh.home();
    await expect(page.locator('#todayChips [data-today="regular"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#todayChips [data-today="regular"]')).toHaveText("Regular times instead");
  });

  test("2e: a board with no schemaVersion but the v4 shape keeps its scenes", async ({ page, dh }) => {
    const m = dh.SRC.match(/<script id="steward-config"[^>]*>([\s\S]*?)<\/script>/);
    const c = JSON.parse(m[1]);
    delete c.schemaVersion;
    c.scenes[0].name = "Kept scene";
    const pg = await dh.loadFixture("tmp_v755_nosv.html", JSON.stringify(c));
    const got = await pg.evaluate(() => ({ src: window.Steward.configSource, name: window.Steward.config.scenes[0].name }));
    ok(got.src !== "defaults" && got.name === "Kept scene", "the board reset to the defaults: " + JSON.stringify(got));
  });

  test("2i + 2d: repeated roster names are told apart; a 24-hour afternoon block is kept", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-29T10:30");
    const r = await page.evaluate(() => {
      const S = window.Steward.sanitize;
      const a = S({ rosters: [{ period: "5th", names: ["Sam", "Sam", "Ava", "Sam", "Sam (2)"] }] }).rosters[0].names;
      const b = S({ rosters: [{ period: "5th", names: a }] }).rosters[0].names;
      const blocks = S({ schemaVersion: 4, bell: { groups: [{ name: "G", regular: [{ label: "1st", start: "8:00", end: "8:50" }, { label: "6th", start: "13:15", end: "14:05" }, { label: "Bad", start: "19:00", end: "20:00" }], wednesday: [] }] } }).bell.groups[0].regular;
      return { a, b, blocks };
    });
    ok(JSON.stringify(r.a.slice(0, 4)) === JSON.stringify(["Sam", "Sam (2)", "Ava", "Sam (3)"]), "repeats not numbered: " + JSON.stringify(r.a));
    ok(new Set(r.a).size === 5, "a repeat survived: " + JSON.stringify(r.a));
    ok(JSON.stringify(r.a) === JSON.stringify(r.b), "a second pass changed the list: " + JSON.stringify(r.b));
    ok(r.blocks.length === 2 && r.blocks[1].start === "1:15" && r.blocks[1].end === "2:05", "blocks: " + JSON.stringify(r.blocks));
  });
});

test.describe("Deckhand 7.55 (audit) in Steward: the pen and Settings", () => {
  test("5a: Clear mid-stroke does not kill the pen", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-24T10:30");
    await dh.launch();
    await page.click("#inkBtn");
    await expect(page.locator("body")).toHaveClass(/inking/);
    await page.mouse.move(400, 400); await page.mouse.down();
    await page.mouse.move(500, 420); await page.mouse.move(600, 440);
    await page.evaluate(() => window.Steward.ink.clear());   // cleared under the finger
    await page.mouse.move(650, 450); await page.mouse.up();
    ok((await page.evaluate(() => window.Steward.ink.count())) === 0, "the cleared stroke came back");
    await page.mouse.move(500, 700); await page.mouse.down(); await page.mouse.move(900, 690); await page.mouse.up();
    ok((await page.evaluate(() => window.Steward.ink.count())) === 1, "the pen was dead after Clear mid-stroke");
  });

  test("5c: a held (repeating) Tab stays inside Settings", async ({ page, dh }) => {
    await dh.openAt("#t=2026-09-24T10:30");
    await dh.launch();
    await page.click("#setBtn");
    await expect(page.locator("#settingsWrap")).toBeVisible();
    await page.evaluate(() => document.activeElement.setAttribute("data-v755-first", "1"));
    await page.keyboard.down("Shift");
    await page.keyboard.down("Tab");                // the first press wraps to the end
    ok(await page.evaluate(() => document.getElementById("settingsWrap").contains(document.activeElement)), "the first Shift+Tab left Settings");
    await page.evaluate(() => document.querySelector("[data-v755-first]").focus());
    await page.keyboard.down("Tab");                // held: a repeat
    await page.keyboard.down("Tab");
    await page.keyboard.up("Tab"); await page.keyboard.up("Shift");
    ok(await page.evaluate(() => document.getElementById("settingsWrap").contains(document.activeElement)), "a repeated Tab walked out of Settings");
  });
});
