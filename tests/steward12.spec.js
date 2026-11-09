/* Steward 1.2 — the week's color on a day without school, read aloud, and the autumn theme.
 * These open the release as it ships (dh.openShipped). speechSynthesis is stubbed: it records what
 * would be said (the test browser has no voices of its own). Synthetic names only. */
const { test, expect, ok } = require("./helpers");

const T2 = "#t=2026-10-05T10:30";                // a Monday, Teal Week, 2nd period (10:16–11:09)
const SUN = "#t=2026-11-08T19:40";               // Sunday night; Monday 9 Nov is a Black Week day
const VOICES = [
  { name: "Test Voice (US)", lang: "en-US", localService: true, default: true },
  { name: "Online Voice (UK)", lang: "en-GB", localService: false, default: false },
  { name: "Voz", lang: "es-ES", localService: true, default: false }
];
/* the browser's speech, recorded: what would have been said, with which voice and how fast */
const stub = (page, voices) => page.addInitScript(vs => {
  window.__said = [];
  if (vs === null){ try { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; } catch (e) {} return; }
  const fake = { speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: () => vs.slice(),
    speak(u){ window.__said.push({ text: u.text, rate: u.rate, voice: u.voice ? u.voice.name : null }); },
    cancel(){}, pause(){}, resume(){}, addEventListener(){}, removeEventListener(){} };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, get: () => fake });
  window.SpeechSynthesisUtterance = function(text){ this.text = text; this.rate = 1; this.voice = null; this.lang = ""; };
}, voices);
const said = page => page.evaluate(() => window.__said.map(u => u.text));
const lastSaid = page => page.evaluate(() => window.__said[window.__said.length - 1] || null);
const scene = async (page, name) => { await page.selectOption("#sceneSel", name); await page.waitForTimeout(250); };
const hold = async (page, loc) => {
  const b = await loc.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.waitForTimeout(750); await page.mouse.up();
  await page.waitForTimeout(80);
};
const wake = page => page.locator("#clockWidget").click({ position: { x: 30, y: 150 } });   // a first tap on nothing that matters: the sound wakes
const sayFor = async (page, cls) => {                        // Settings → Classes: Say changes out loud, for one class
  await page.click("#setBtn"); await page.evaluate(() => window.Steward.settings.showTab("classes"));
  await page.selectOption("#spClass", "c:" + cls);
  const sec = page.locator('#spTools .spTool[data-tool="aloud"]');
  await sec.locator(".fCheck", { hasText: "Different for " + cls }).click();
  await sec.locator(".fCheck", { hasText: "Say changes out loud" }).click();
  await page.click("#applyBtn");
  await expect(page.locator("#setErrors")).toHaveText("Applied.");
  await page.click("#closeBtn");
};

test.describe("Steward 1.2: the week on a day without school", () => {
  test("Sunday 8 Nov 2026, 19:40: the greeting names Black Week and when it starts, as the clock card counts down to Monday's Black Week (1st period last)", async ({ page, dh }) => {
    await dh.openShipped(SUN);
    await expect(page.locator("#greetToast")).toBeVisible();
    await expect(page.locator("#greetToast")).toHaveText(/^Good evening · Black Week starts Monday( · tap anywhere for sound)?$/);
    await expect(page.locator("#periodNow")).toHaveText("Next: 6th Period");
    await expect(page.locator("#weekTag")).toHaveText("Black Week");
    await expect(page.locator("#bellSub")).toHaveText(/^Monday 9:20/);
    const strip = await page.locator("#dayStrip .dayChip").allTextContents();
    ok(strip[0] === "6th" && strip[strip.length - 1] === "1st", "Monday's Black Week day: " + strip.join(","));
    const w = await page.evaluate(() => { const r = window.Steward.bell.greetWeekAt(window.Steward.now()); return { name: window.Steward.config.bell.groups[r.gi].name, day: r.day && r.day.toDateString() }; });
    ok(w.name === "Black Week" && w.day === "Mon Nov 09 2026", "the next school day: " + JSON.stringify(w));
    // the pick itself is the coming week, so Home presses Black Week too (no bell runs on a Sunday either way)
    ok((await page.evaluate(() => window.Steward.config.bell.groups[window.Steward.activeIndex].name)) === "Black Week", "Sunday's pick is not the coming week");
  });

  test("Home's week chips agree with the greeting and the clock: on a day with no school the coming week is pressed — a Saturday, Sunday night, Thanksgiving week and the Saturday before it — a school day presses its own, and a tap still picks", async ({ page, dh }) => {
    const pressed = async () => (await page.locator('#schedChips .chip[aria-pressed="true"]').textContent()).trim();
    for (const [t, want] of [["#t=2026-11-07T09:00", "Black Week"], [SUN, "Black Week"], ["#t=2026-11-25T10:00", "Black Week"],
                             ["#t=2026-11-21T10:00", "Black Week"], ["#t=2026-11-06T17:00", "Teal Week"], ["#t=2026-11-09T10:30", "Black Week"]]){
      await dh.openShipped(t);
      await dh.home();
      ok(await pressed() === want, t + ": Home pressed " + await pressed());
      const tag = await page.evaluate(() => window.Steward.bellStatusAt(window.Steward.now()).sched);
      if (t !== "#t=2026-11-06T17:00") ok(tag.startsWith(want), t + ": the clock says " + tag + ", Home " + want);   // (Friday evening's clock already counts to Monday)
    }
    // a tap on a weekend still picks what it says
    await dh.openShipped(SUN);
    await dh.home();
    await page.click('#schedChips .chip:text-is("Teal Week")');
    ok(await pressed() === "Teal Week", "the tap did not pick Teal: " + await pressed());
  });

  test("a school day keeps today's week — Friday 6 Nov after the last bell is still Teal, while the clock looks ahead to Monday", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-11-06T17:00");
    await expect(page.locator("#greetToast")).toHaveText(/^Good evening · Teal Week( · tap anywhere for sound)?$/);
    await expect(page.locator("#weekTag")).toHaveText("Black Week");
    await expect(page.locator("#bellSub")).toHaveText(/^Monday 9:20/);
  });

  test("a break from Steward's list: Thanksgiving week's Wednesday names the week school comes back to; the Saturday before names its date", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-11-25T10:00");       // the week of 23 Nov is a week with no school
    ok((await page.evaluate(() => window.Steward.config.bell.skipWeeks.indexOf("2026-11-23"))) !== -1, "the break week is not on the list");
    await expect(page.locator("#greetToast")).toHaveText(/^Good morning · Black Week starts Monday( · |$)/);
    await expect(page.locator("#weekTag")).toHaveText("Black Week");
    await expect(page.locator("#bellSub")).toHaveText(/^Monday 9:20/);
    await dh.openShipped("#t=2026-11-21T10:00");       // a weekend with the break still ahead: Monday is nine days off
    await expect(page.locator("#greetToast")).toHaveText(/^Good morning · Black Week starts Monday, November 30( · |$)/);
    await expect(page.locator("#weekTag")).toHaveText("Black Week");
  });

  test("at phone width \"starts Monday\" would crowd the banner: it says just Black Week, in full", async ({ page, dh }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await dh.openShipped(SUN);
    await expect(page.locator("#greetToast")).toBeVisible();
    const t = await page.locator("#greetToast").evaluate(e => {
      const tn = e.firstChild, i = tn.textContent.indexOf("Black Week"), r = document.createRange();
      if (i < 0) return { text: e.textContent, inside: false };
      r.setStart(tn, i); r.setEnd(tn, i + "Black Week".length);
      return { text: e.textContent, inside: r.getBoundingClientRect().right <= e.getBoundingClientRect().right - parseFloat(getComputedStyle(e).paddingRight) + 1 };
    });
    ok(t.inside && /^Good evening · Black Week( · |$)/.test(t.text) && !/starts|Teal/.test(t.text), "the phone's greeting: " + JSON.stringify(t));
  });
});

test.describe("Steward 1.2: read aloud", () => {
  test("each speaker says its words: Now and Next, First and Then, the reward, the five faces and the choices — a little slow, in an installed English voice", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    await expect(page.locator("body")).toHaveClass(/spkOn/);
    // before Start nothing is Now: no speaker on the schedule yet
    await expect(page.locator(".w-sched .spk:visible")).toHaveCount(0);
    await page.click(".w-sched .sdNext"); await page.click(".w-sched .sdNext");
    await expect(page.locator(".w-sched .spk:visible")).toHaveCount(2);         // Now and Next only
    await page.locator(".w-sched .sdStep.isNow .spk").click();
    await page.locator(".w-sched .sdStep.isNext .spk").click();
    await page.locator(".w-ft .ft-first .spk").click();
    await page.locator(".w-ft .ft-then .spk").click();
    await page.locator(".w-tokens .tkSpk").click();
    ok((await said(page)).join("|") === "Now: Warm up|Next: With the teacher|First: Work|Then: Break|I am working for Choice time", "said: " + (await said(page)).join("|"));
    const u = await lastSaid(page);
    ok(u.rate === 0.9 && u.voice === "Test Voice (US)", "the voice and speed: " + JSON.stringify(u));
    // every speaker is a 44 px tap
    const small = await page.locator(".spk:visible").evaluateAll(els => els.map(e => e.getBoundingClientRect()).filter(r => r.width < 44 || r.height < 44).length);
    ok(small === 0, small + " speakers smaller than 44 px");
    // check in: the five faces, then the choices
    await scene(page, "Break");
    await page.click('.w-calm .cmTab[data-t="check"]');
    const faces = page.locator(".w-calm .cmFace .spk");
    await expect(faces).toHaveCount(5);
    for (let i = 0; i < 5; i++) await faces.nth(i).click();
    ok((await said(page)).slice(-5).join("|") === "Great|Okay|Tired|Worried|Upset", "faces: " + (await said(page)).slice(-5).join("|"));
    await page.locator(".w-calm .cmFace", { hasText: "Worried" }).locator(".supGo").click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("What would help?");
    await page.locator(".w-calm .cmChoice", { hasText: "Get water" }).locator(".spk").click();
    await page.locator(".w-calm .cmChoice", { hasText: "Listen quietly" }).locator(".spk").click();
    ok((await said(page)).slice(-2).join("|") === "Get water|Listen quietly", "choices: " + (await said(page)).slice(-2).join("|"));
    ok((await page.evaluate(() => window.__said.every(u => u.voice === "Test Voice (US)"))), "a non-English voice was used");
  });

  test("taps that already meant something still do: a step moves the schedule, a panel and the reward open the chooser, a hold takes a token back, a face answers — and none of them speaks", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    const step = i => page.locator(".w-sched .sdStep").nth(i);
    await page.click(".w-sched .sdNext");
    // the Next step's speaker says it and the schedule stays; a tap on the step moves it
    await step(1).locator(".spk").click();
    await expect(step(0)).toHaveClass(/isNow/);
    await step(1).click();
    await expect(step(1)).toHaveClass(/isNow/);
    await expect(step(1)).toHaveAttribute("aria-current", "step");
    await step(4).click();
    await expect(step(4)).toHaveClass(/isNow/);
    // First / Then: the speaker does not open the chooser; the panel does
    await page.locator(".w-ft .ft-then .spk").click();
    await expect(page.locator("#picPop")).toBeHidden();
    await page.locator(".w-ft .ft-then").click();
    await expect(page.locator("#picPop")).toBeVisible();
    await expect(page.locator("#picPop .ppTitle")).toHaveText("Then");
    await page.keyboard.press("Escape");
    // the reward: the same
    await page.locator(".w-tokens .tkSpk").click();
    await expect(page.locator("#picPop")).toBeHidden();
    await page.click(".w-tokens .tkGoal");
    await expect(page.locator("#picPop .ppTitle")).toHaveText("Working for");
    await page.keyboard.press("Escape");
    // tokens: a tap gives, a hold takes one back
    const slot = i => page.locator(".w-tokens .tkSlot").nth(i);
    await slot(0).click(); await slot(0).click();
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(2);
    await hold(page, slot(0));
    await expect(page.locator(".w-tokens .tkSlot.isOn")).toHaveCount(1);
    // check in: a face's speaker does not answer; the face does; a choice does its thing
    await scene(page, "Break");
    await page.click('.w-calm .cmTab[data-t="check"]');
    await page.locator(".w-calm .cmFace", { hasText: "Tired" }).locator(".spk").click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("How do you feel?");
    await page.locator(".w-calm .cmFace", { hasText: "Tired" }).click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("What would help?");
    await page.locator(".w-calm .cmChoice", { hasText: "Get water" }).click();
    await expect(page.locator(".w-calm .cmAsk")).toHaveText("Good choice.");
    ok((await said(page)).join("|") === "Next: Warm up|Then: Break|I am working for Choice time|Tired", "only the speakers spoke: " + (await said(page)).join("|"));
  });

  test("Say changes out loud: off by default; on for a class, the board says the new step, Then, and a full row — only with the sound on, and never for another class", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    await page.click(".w-sched .sdNext");                        // (a tap: the sound is awake)
    await page.waitForTimeout(1100);
    ok((await said(page)).length === 0, "said with the class setting off: " + (await said(page)).join("|"));
    await sayFor(page, "2nd");
    const saved = await page.evaluate(() => window.Steward.config.support.classes.find(c => c.name === "2nd"));
    ok(saved && saved.aloud && saved.aloud.say === true && !saved.schedule, "saved: " + JSON.stringify(saved));
    await expect(page.locator("#spClass option", { hasText: "2nd" })).toHaveCount(1);
    await page.click(".w-sched .sdNext");
    await expect.poll(() => said(page)).toEqual(["Now: Warm up"]);
    // the board's sound off (Sound Off in the dock's menu, or M): not said
    await page.evaluate(() => window.Steward.sound.toggle());
    ok(!(await page.evaluate(() => window.Steward.sound.isOn())), "the sound is still on");
    await page.click(".w-sched .sdNext");
    await page.waitForTimeout(1100);
    ok((await said(page)).length === 1, "said with the sound off: " + (await said(page)).join("|"));
    // (a speaker is asked for: it still speaks with the sound off)
    await page.locator(".w-sched .sdStep.isNow .spk").click();
    ok((await lastSaid(page)).text === "Now: With the teacher", "a tap with the sound off: " + JSON.stringify(await lastSaid(page)));
    await page.evaluate(() => window.Steward.sound.toggle());
    // First is done: Then begins
    await page.click(".w-ft .ftDone");
    await expect.poll(() => lastSaid(page).then(u => u && u.text)).toBe("Then: Break");
    // a full row
    for (let i = 0; i < 5; i++) await page.locator(".w-tokens .tkSlot").nth(i).click();
    await expect.poll(() => lastSaid(page).then(u => u && u.text)).toBe("Choice time!");
    // 3rd has it off: its schedule moves in silence
    const n = (await said(page)).length;
    await page.evaluate(() => window.Steward.support.sched.go("3rd", 0));
    await page.waitForTimeout(1100);
    ok((await said(page)).length === n, "another class's change was said");
  });

  test("Say changes out loud waits for the first tap: a change before any tap is not said", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await page.evaluate(() => { window.Steward.config.support.base.aloud.say = true; window.Steward.support.changed(); });
    ok(!(await page.evaluate(() => window.Steward.sound.primed())), "the sound was awake before any tap");
    await page.evaluate(() => window.Steward.support.sched.go("2nd", 0));
    await page.waitForTimeout(1100);
    ok((await said(page)).length === 0, "said before the first tap: " + (await said(page)).join("|"));
    await wake(page);
    await page.evaluate(() => window.Steward.support.sched.go("2nd", 1));
    await expect.poll(() => said(page)).toEqual(["Now: Warm up"]);
  });

  test("no names are spoken: a row for each student fills with the reward's word only", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    await page.evaluate(() => {
      const c = window.Steward.config;
      c.rosters = [{ period: "2nd", names: ["Ava", "Ben", "Cal"] }];
      const t = c.support.base.tokens; t.who = "each"; t.goal = 3;
      c.support.base.aloud.say = true;
      window.Steward.support.changed();
    });
    const row = n => page.locator(".w-tokens .tkRow", { hasText: n });
    await expect(page.locator(".w-tokens .tkRow")).toHaveCount(3);
    for (let i = 0; i < 3; i++) await row("Ava").click();
    await expect(row("Ava")).toHaveClass(/isWon/);
    await expect.poll(() => lastSaid(page).then(u => u && u.text)).toBe("Choice time!");
    await page.click(".w-sched .sdNext");
    await expect.poll(() => lastSaid(page).then(u => u && u.text)).toBe("Now: Check in");
    for (const sp of await page.locator(".spk:visible").all()) await sp.click();
    const all = await said(page);
    ok(all.length >= 6 && !all.some(t => /Ava|Ben|Cal/.test(t)), "a name was spoken: " + all.join("|"));
    ok(await page.locator(".w-tokens .tkRow .spk").count() === 0, "a student's row has a speaker");
  });

  test("with no voice on the device the speakers are not there, and Settings says so in one line", async ({ page, dh }) => {
    await stub(page, []);
    await dh.openShipped(T2);
    await dh.launch();
    await page.click(".w-sched .sdNext");
    await expect(page.locator("body")).not.toHaveClass(/spkOn/);
    await expect(page.locator(".spk:visible")).toHaveCount(0);
    ok(await page.locator(".spk").evaluateAll(els => els.every(e => getComputedStyle(e).display === "none")), "a speaker takes room or focus");
    await page.click("#setBtn");
    await expect(page.locator("#sAloudNone")).toBeVisible();
    await expect(page.locator("#sAloudNone")).toHaveText("This device has no English voice, so the board can’t read aloud.");
    await expect(page.locator("#sAloudCtl")).toBeHidden();
    await page.click("#closeBtn");
    // a browser with no speech at all: the same, and nothing breaks
    await stub(page, null);
    await dh.openShipped(T2);
    await dh.launch();
    await expect(page.locator(".spk:visible")).toHaveCount(0);
    ok(!(await page.evaluate(() => window.Steward.speak.has())), "claimed a voice with no speech");
  });

  test("Settings → General → Read aloud: the device's English voices, an installed one first; the speed; Try it before Apply; the speakers can be turned off", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    await page.click("#setBtn");
    await expect(page.locator("#sAloudNone")).toBeHidden();
    const opts = await page.locator("#sAloudVoice option").allTextContents();
    ok(opts.join("|") === "Automatic — Test Voice (US)|Test Voice (US)|Online Voice (UK) · online", "voices: " + opts.join("|"));
    await expect(page.locator("#sAloudRate")).toHaveValue("0.9");
    await expect(page.locator("#sAloudBtns")).toBeChecked();
    await page.selectOption("#sAloudVoice", "Online Voice (UK)");
    await page.selectOption("#sAloudRate", "0.8");
    await page.click("#sAloudTry");
    let u = await lastSaid(page);
    ok(u.text === "First: Work. Then: Break." && u.voice === "Online Voice (UK)" && u.rate === 0.8, "Try it: " + JSON.stringify(u));
    ok((await page.evaluate(() => window.Steward.config.aloud.voice)) === "", "Try it applied the voice");
    await page.click("#applyBtn"); await page.click("#closeBtn");
    ok(JSON.stringify(await page.evaluate(() => window.Steward.config.aloud)) === JSON.stringify({ buttons: true, voice: "Online Voice (UK)", rate: 0.8 }), "not applied");
    await page.locator(".w-ft .ft-first .spk").click();
    u = await lastSaid(page);
    ok(u.voice === "Online Voice (UK)" && u.rate === 0.8, "the board's speaker: " + JSON.stringify(u));
    // the speakers off
    await page.click("#setBtn");
    await page.locator("label.fCheck", { has: page.locator("#sAloudBtns") }).click();
    await page.click("#applyBtn"); await page.click("#closeBtn");
    await expect(page.locator(".spk:visible")).toHaveCount(0);
    ok((await page.evaluate(() => window.Steward.sanitize({ aloud: { buttons: "yes", voice: 7, rate: 3 } }).aloud)).rate === 0.9, "junk kept");
  });

  test("@touch a finger on the Now step's speaker says it and leaves the schedule; a finger on the step moves it", async ({ page, dh }) => {
    await stub(page, VOICES);
    await dh.openShipped(T2);
    await dh.launch();
    const step = i => page.locator(".w-sched .sdStep").nth(i);
    await page.locator(".w-sched .sdNext").tap();
    await page.locator(".w-sched .sdStep.isNow .spk").tap();
    await page.locator(".w-sched .sdStep.isNext .spk").tap();
    await expect(step(0)).toHaveClass(/isNow/);
    ok((await said(page)).join("|") === "Now: Check in|Next: Warm up", "said: " + (await said(page)).join("|"));
    await step(2).tap();
    await expect(step(2)).toHaveClass(/isNow/);
    await page.locator(".w-ft .ft-first .spk").tap();
    await expect(page.locator("#picPop")).toBeHidden();
    ok((await lastSaid(page)).text === "First: Work", "the panel's speaker");
  });
});

test.describe("Steward 1.2: the autumn theme", () => {
  const SCENES = ["Daily Board", "Work Time", "Break", "Stations"];
  const PIECES = ["nvScarecrow", "nvSquirrel", "nvTurkey", "nvGourds", "sea-campfire", "ocPumpkins", "sea-fog"];
  /* every seasonal element that must clear every card: the pieces on the sand, the leaves at rest,
     the boat's lantern, flag and scarf and the sea's seasonal acts. October's web and November's
     branch hang ON the clock card's corner (they clear its text and controls instead), and a
     falling leaf falls BEHIND the cards — each has its own test below. */
  const SEASONAL = "#ocPumpkins, #nvScarecrow, #nvSquirrel, #nvTurkey, #nvGourds, #sea-campfire, .nvLeaf.nvRest, " +
                   "#boat .nvLantern, #boat .nvFlag, #boat .nvScarf, #sea-bats, #sea-ghost, #sea-castaway, #sea-bones, " +
                   "#sea-geese, #sea-fog, #sea-ducks, #sea-loon, #sea-trawler";
  /* in the page: window.__over(roots) — each root's box and each of its painted shapes, against
     every card on the board: the card's box and its hard shadow, and 4 px around both (Season
     keeps 6). An element hidden, see-through or a bare tap target is not painted. */
  const probe = page => page.evaluate(() => {
    const clear = v => !v || v === "none" || v === "transparent" || /rgba\([^)]*,\s*0\)$/.test(v);
    const painted = e => {
      const c = getComputedStyle(e);
      if (c.visibility !== "visible") return false;
      if (e instanceof SVGGeometryElement && clear(c.fill) && clear(c.stroke)) return false;
      let op = 1;
      for (let n = e; n && n.nodeType === 1; n = n.parentElement){ const k = getComputedStyle(n); if (k.display === "none") return false; op *= +k.opacity; }
      return op > .02;
    };
    window.__cards = () => Array.from(document.querySelectorAll("#canvas .widget")).map(w => {
      const c = getComputedStyle(w); if (c.display === "none" || c.visibility === "hidden") return null;
      const r = w.getBoundingClientRect(); if (!r.width || !r.height) return null;
      const m = /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(c.boxShadow.replace(/rgba?\([^)]*\)/g, "")) || [0, 0, 0], sx = +m[1], sy = +m[2];
      return { card: (w.className.match(/\bw-(\w+)/) || [])[1] || w.id,
               l: r.left + Math.min(0, sx) - 4, t: r.top + Math.min(0, sy) - 4, r: r.right + Math.max(0, sx) + 4, b: r.bottom + Math.max(0, sy) + 4 };
    }).filter(Boolean);
    window.__over = roots => {
      const cards = window.__cards(), out = new Set();
      for (const root of roots){
        const parts = [root].concat(Array.from(root.querySelectorAll("path, circle, ellipse, rect, polygon, polyline, line, use, image, text")),
          Array.from(root.querySelectorAll("div")).filter(d => { const k = getComputedStyle(d); return k.backgroundImage !== "none" || !clear(k.backgroundColor); }));
        for (const p of parts){
          if (!painted(p)) continue;
          const b = p.getBoundingClientRect();
          if (b.width < .5 && b.height < .5) continue;
          const c = cards.find(c => b.left < c.r && b.right > c.l && b.top < c.b && b.bottom > c.t);
          if (c) out.add((root.id || root.getAttribute("class")) + (p === root ? "" : " ." + (p.getAttribute("class") || p.tagName)) + " over the " + c.card + " [" + [b.left, b.top, b.right, b.bottom].map(Math.round) + "]");
        }
      }
      return [...out];
    };
  });
  const over = page => page.evaluate(sel => window.__over(Array.from(document.querySelectorAll(sel))), SEASONAL);
  /* a seasonal act, forced: when it crosses, its painted shapes through the whole crossing (paused
     and stepped, 48 looks) */
  const sweep = (page, name) => page.evaluate(name => {
    const M = window.Steward.seaModule; M.clear();
    if (!window.Steward.sea(name)) return { played: false, hits: [] };
    const th = document.getElementById("sea-" + name), an = th.getAnimations({ subtree: true });
    an.forEach(a => a.pause());
    const end = Math.max(1000, ...an.map(a => { const t = a.effect.getComputedTiming(), e = (t.delay || 0) + t.activeDuration; return isFinite(e) ? e : 0; }));
    let hits = [];
    for (let i = 0; i <= 48; i++){ an.forEach(a => { a.currentTime = end * i / 48; }); hits = hits.concat(window.__over([th])); }
    M.clear();
    return { played: true, hits: [...new Set(hits)] };
  }, name);
  const moving = async page => { await page.click("#setBtn"); await page.selectOption("#sMotion", "on"); await page.click("#applyBtn"); await page.click("#closeBtn"); };
  /* falling leaves (two down the edges, three where Season places them): wherever one crosses a
     card, the card is what shows there — never the leaf (n: the points looked at) */
  const leavesBehind = page => page.evaluate(() => {
    const S = window.Steward.season, out = new Set();
    S.leaves.clear(true);
    [{ side: "left", at: .3 }, { side: "right", at: .5 }, { at: .25 }, { at: .45 }, { at: .65 }].forEach(o => S._leaf(o));
    const cards = Array.from(document.querySelectorAll("#canvas .widget")).map(w => w.getBoundingClientRect()).filter(r => r.width && r.height);
    let n = 0;
    document.querySelectorAll("#nvLeaves .nvLeaf:not(.nvRest):not(.nvGone)").forEach(l => {
      const b = l.getBoundingClientRect();
      for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++){
        const x = b.left + b.width * i / 6, y = b.top + b.height * j / 6;
        if (!cards.some(r => x > r.left && x < r.right && y > r.top && y < r.bottom)) continue;
        n++;
        const top = document.elementFromPoint(x, y);
        if (top && top.closest("#nvLeaves")) out.add("[" + [x, y].map(Math.round) + "]");
      }
    });
    return { n, out: [...out] };
  });
  /* the clock card's text and its controls — Season keeps the corner ornaments clear of the same list */
  const KEEP = ["#dateline", "#clock", "#clockSub", "#periodNow", "#weekTag", "#bellSub", "#bellBar", "#dayStrip", "#bathPill", "#lunchArt",
                "#fsBtn", "#clockWidget .strip button", "#clockWidget .spk"];
  /* the web or the branch: on the clock card's corner? and its painted shapes, through every motion
     and then a gust (the branch) or the spider's drop (the web), against KEEP */
  const corner = (page, root) => page.evaluate(async ([root, KEEP]) => {
    const el = document.querySelector(root), card = el && el.closest(".widget"), cb = card && card.getBoundingClientRect();
    if (!cb || !cb.width || !cb.height || getComputedStyle(el).display === "none") return { clock: false };
    const keep = [], out = new Set();
    KEEP.forEach(s => document.querySelectorAll(s).forEach(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e);
      if (r.width && r.height && c.visibility !== "hidden" && c.display !== "none") keep.push({ s, r }); }));
    const look = () => el.querySelectorAll("path, circle, ellipse, line, rect, polygon, polyline").forEach(q => {
      const c = getComputedStyle(q);
      if (c.visibility !== "visible" || (c.fill === "none" && (c.stroke === "none" || /rgba\([^)]*,\s*0\)$/.test(c.stroke)))) return;
      let op = 1; for (let n = q; n && n !== document.body; n = n.parentElement){ const k = getComputedStyle(n); if (k.display === "none") return; op *= +k.opacity; }
      if (op < .03) return;
      const r = q.getBoundingClientRect(); if (r.width < .5 && r.height < .5) return;
      keep.forEach(k => { if (r.left < k.r.right && r.right > k.r.left && r.top < k.r.bottom && r.bottom > k.r.top)
        out.add(k.s + " by ." + (q.getAttribute("class") || q.tagName) + " [" + [r.left, r.top, r.right, r.bottom].map(Math.round) + "]"); });
    });
    const sweep = () => {
      const an = el.getAnimations({ subtree: true }); an.forEach(a => a.pause());
      const end = Math.max(2000, ...an.map(a => { const t = a.effect.getComputedTiming(), e = (t.delay || 0) + t.activeDuration; return isFinite(e) ? e : (t.delay || 0) + t.duration; }));
      for (let i = 0; i <= 60; i++){ an.forEach(a => { try { a.currentTime = end * i / 60; } catch (e) {} }); look(); }
      an.forEach(a => a.play());
    };
    sweep();
    if (root === "#nvBranch"){ document.body.dataset.sea = "windy"; window.Steward.season.branch.gust(); }
    else el.querySelector(".ocSpider").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await new Promise(r => setTimeout(r, 30));
    sweep();
    const b = el.getBoundingClientRect();
    return { clock: true, shown: !el.classList.contains("stOff") && getComputedStyle(el).visibility === "visible",
             corner: Math.abs(b.right - cb.right) < 2 && b.top >= cb.top && b.top - cb.top < 160, box: [b.left, b.top, b.right, b.bottom].map(Math.round), hits: [...out] };
  }, [root, KEEP]);
  /* the pieces on the sand: Season's scale, the lowest card (its shadow and Season's 6 px), the
     dock's right edge, and each piece's box and envelope (it and all it does) */
  const sand = (page, ids) => page.evaluate(ids => {
    const S = window.Steward.season, lo = Math.max(...S.cardRects().map(r => r.bottom)), d = document.getElementById("dock").getBoundingClientRect(), p = {};
    for (const id of ids){
      const el = document.getElementById(id), b = el.getBoundingClientRect();
      p[id] = { off: el.classList.contains("stOff"), scale: getComputedStyle(el).scale, l: b.left, t: b.top, r: b.right, b: b.bottom, env: S.envelope(id) };
    }
    return { s: S.scale(), lo, dock: d.right, p };
  }, ids);
  /* the cards along the bottom of the board, d % of the board longer — down into the sand, over
     the pieces — and Season looks again */
  const lower = (page, d) => page.evaluate(d => {
    const ws = Array.from(document.querySelectorAll("#canvas .widget")).filter(w => w._entry && w._entry.cfg && w.getBoundingClientRect().width);
    const lo = Math.max(...ws.map(w => w.getBoundingClientRect().bottom));
    ws.filter(w => w.getBoundingClientRect().bottom >= lo - 2).forEach(w => { const en = w._entry; en.cfg.h += d; w.style.height = en.cfg.h + "%"; });
    window.Steward.season.guard();
    return window.Steward.season.scale();
  }, d);

  test("the season is on by default: an ordinary November school day on still water — three leaves at rest and the lantern on the mast, the branch on the clock card's corner, and the scarecrow and the squirrel drawn small on the sand under the cards", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-11-09T10:30");
    await dh.launch();
    ok((await page.evaluate(() => window.Steward.config.ui.season)) === "auto", "the shipped season");
    await expect(page.locator("body")).toHaveClass(/november/);
    await expect(page.locator("body")).not.toHaveClass(/waveMotion/);
    await expect(page.locator("#nvLeaves .nvLeaf.nvRest")).toHaveCount(3);
    await expect(page.locator("#boat .nvLantern")).toBeVisible();
    await expect(page.locator("#clockWidget #nvBranch")).toBeVisible();
    for (const id of ["nvScarecrow", "nvSquirrel"]){
      await expect(page.locator("#" + id)).toBeVisible();
      await expect(page.locator("#" + id)).not.toHaveClass(/stOff/);
    }
    ok(await page.evaluate(() => window.Steward.season.scale() < 1), "the pieces on the sand at Deckhand's size, where the cards come down to it");
    await probe(page);
    const h = await over(page);
    ok(h.length === 0, "over a card: " + h.join("; "));
  });

  test("a board saved by 1.1 with the season off takes the new default once; a board saved by 1.2 keeps its off", async ({ page, dh }) => {
    await dh.openShipped("#t=2026-11-09T10:30");
    const seed = v => page.evaluate(v => {
      const c = JSON.parse(JSON.stringify(window.Steward.config));
      c.ui.season = "off"; c.ownerName = "";
      localStorage.setItem("steward.config", JSON.stringify({ v: 1, savedAt: new Date().toISOString(), fileVersion: v, cfg: c }));
    }, v);
    await seed("1.1.0");
    await dh.reopen("#t=2026-11-09T10:30");
    ok((await page.evaluate(() => [window.Steward.configSource, window.Steward.config.ui.season].join())) === "device,auto", "a 1.1 board's off was kept");
    await expect(page.locator("body")).toHaveClass(/november/);
    await seed("1.0.0");
    await dh.reopen("#t=2026-11-09T10:30");
    ok((await page.evaluate(() => window.Steward.config.ui.season)) === "auto", "a 1.0 board's off was kept");
    await seed("1.2.0");
    await dh.reopen("#t=2026-11-09T10:30");
    ok((await page.evaluate(() => [window.Steward.configSource, window.Steward.config.ui.season].join())) === "device,off", "a 1.2 board's choice was overridden");
    await expect(page.locator("body")).not.toHaveClass(/november/);
  });

  for (const [W, H] of [[1920, 1080], [1280, 800]]){
    test(`every seasonal element clears every card on the four shipped boards at ${W} × ${H} — October, an ordinary November day, Veterans Day, feast week and its feast, Thanksgiving week; still water and moving, each seasonal act through its whole crossing`, async ({ page, dh }) => {
      test.setTimeout(240000);
      await page.setViewportSize({ width: W, height: H });
      const DAYS = [["#t=2026-10-15T13:00", ["bats", "ghost", "castaway", "bones"]], ["#t=2026-11-09T09:00", ["fog", "geese", "ducks", "loon", "trawler"]],
                    ["#t=2026-11-11T10:30", []], ["#t=2026-11-18T14:40", ["campfire"]], ["#t=2026-11-20T12:50", []], ["#t=2026-11-24T10:00", []]];
      const played = new Set();
      for (const [t, acts] of DAYS){
        await dh.openShipped(t);
        await dh.launch();
        await probe(page);
        for (const sc of SCENES){
          await scene(page, sc);
          const h = await over(page);
          ok(h.length === 0, t + " " + sc + ", still water: " + h.join("; "));
        }
        await moving(page);
        for (const sc of SCENES){
          await scene(page, sc);
          if (t.indexOf("-11-") > 0){                 // November: the leaves fall behind the cards
            const lb = await leavesBehind(page);
            ok(lb.n > 0 && lb.out.length === 0, t + " " + sc + ": a falling leaf shows over a card at " + lb.out.join(" ") + " (" + lb.n + " points looked at)");
          }
          for (const a of acts){
            const r = await sweep(page, a);
            if (r.played) played.add(a);
            ok(r.hits.length === 0, t + " " + sc + ", " + a + ": " + r.hits.join("; "));
          }
          const h = await over(page);
          ok(h.length === 0, t + " " + sc + ", moving water: " + h.join("; "));
        }
      }
      /* not an empty sea: the acts low enough to pass under the cards do cross */
      for (const a of ["castaway", "bones", "fog", "ducks", "loon", "trawler"]) ok(played.has(a), a + " never crossed: " + [...played].join());
    });
  }

  test("a piece's motions stay inside the room Season keeps clear for it — the crow's flight, the squirrel's runs, the turkey's strut and fan, the campfire's smoke on a windy day — at Deckhand's size on a beach and drawn smaller on the shipped boards, at 1920 × 1080 and 1280 × 800", async ({ page, dh }) => {
    test.setTimeout(300000);
    for (const [W, H] of [[1920, 1080], [1280, 800]]){
      await page.setViewportSize({ width: W, height: H });
      for (const [t, ids] of [["#t=2026-11-18T14:40", ["nvScarecrow", "nvSquirrel", "nvTurkey", "sea-campfire"]], ["#t=2026-11-24T10:00", ["nvGourds", "nvSquirrel"]], ["#t=2026-10-15T10:30", ["ocPumpkins"]]])
      for (const beach of [true, false]){
        await dh.openShipped(t);
        await dh.launch();
        await moving(page);
        if (beach) await dh.roomy();
        const s = await page.evaluate(() => window.Steward.season.scale());
        ok(beach ? s === 1 : s < 1, W + " " + t + (beach ? " on a beach" : " on the shipped board") + ": the pieces drawn at " + s);
        for (const id of ids){
          const r = await page.evaluate(async id => {
            const S = window.Steward, el = document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
            document.body.dataset.sea = "windy";                // the windy keyframes lean furthest (the shipped sea is calm)
            if (id === "sea-campfire") S.sea("campfire");
            if (id === "nvScarecrow") S.season.scarecrow.crow();
            if (id === "nvTurkey") S.season.turkey.tap();
            if (id === "nvGourds") el.querySelectorAll(".nvGourd").forEach(g => g.classList.add("wob"));
            await wait(60);
            const env = S.season.envelope(id), vis = getComputedStyle(el).visibility, out = new Set();
            const look = () => el.querySelectorAll("path, circle, ellipse, rect, polygon, polyline, line").forEach(p => {
              const c = getComputedStyle(p);
              if (c.visibility !== "visible" || (c.fill === "none" && c.stroke === "none")) return;
              let op = 1; for (let n = p; n && n !== el.parentElement; n = n.parentElement){ const k = getComputedStyle(n); if (k.display === "none") return; op *= +k.opacity; }
              if (op < .02) return;
              const b = p.getBoundingClientRect();
              if (b.width < .5 && b.height < .5) return;
              if (b.left < env.left - 1 || b.top < env.top - 1 || b.right > env.right + 1 || b.bottom > env.bottom + 8)
                out.add((p.getAttribute("class") || p.tagName) + " [" + [b.left, b.top, b.right, b.bottom].map(Math.round) + "] outside [" + [env.left, env.top, env.right, env.bottom].map(Math.round) + "]");
            });
            const through = () => {
              const an = el.getAnimations({ subtree: true }); an.forEach(a => a.pause());
              const end = Math.max(1000, ...an.map(a => { const t = a.effect.getComputedTiming(), e = (t.delay || 0) + t.activeDuration; return isFinite(e) ? e : (t.delay || 0) + t.duration; }));
              for (let i = 0; i <= 96; i++){ an.forEach(a => { a.currentTime = end * i / 96; }); look(); }
              an.forEach(a => a.play());
            };
            through();
            if (id === "nvSquirrel") for (const dx of [-80, 0]){   // a run to its farthest spot, and home
              await wait(5600);
              S.season.squirrel.dig(dx); await wait(60); through();
            }
            return { vis, out: [...out] };
          }, id);
          ok(r.vis === "visible", W + " " + t + " " + id + " is not on the sand" + (beach ? " of a beach" : ""));
          ok(r.out.length === 0, W + " " + t + " " + id + ": " + r.out.join("; "));
        }
      }
    }
  });

  test("on the shipped boards the pieces on the sand are drawn smaller — one scale for them all, at most Deckhand's size, keeping their proportions — and stand right of the dock and apart, each with all it does under the lowest card; a card brought lower shrinks them, and only where even the smallest can't stand do they step off", async ({ page, dh }) => {
    test.setTimeout(120000);
    for (const [W, H] of [[1920, 1080], [1280, 800]]){
      await page.setViewportSize({ width: W, height: H });
      for (const [t, ids] of [["#t=2026-11-18T14:40", ["sea-campfire", "nvTurkey", "nvSquirrel", "nvScarecrow"]], ["#t=2026-11-24T10:00", ["nvSquirrel", "nvGourds", "nvScarecrow"]], ["#t=2026-10-15T13:00", ["sea-campfire", "ocPumpkins"]]]){
        await dh.openShipped(t);
        await dh.launch();
        for (const sc of SCENES){
          await scene(page, sc);
          const r = await sand(page, ids), where = W + " " + t + " " + sc + ": ";
          ok(r.s >= .25 && r.s < 1, where + "drawn at " + r.s);
          ok(r.lo <= H - 70, where + "the free sand under the cards is " + Math.round(H - r.lo) + " px — not the shipped boards' 76");
          const boxes = ids.map(id => Object.assign({ id }, r.p[id])).sort((a, b) => a.l - b.l);
          for (const b of boxes){
            ok(!b.off, where + b.id + " stepped off");
            ok(b.scale === String(r.s), where + b.id + " is not drawn at the pieces' one scale: " + b.scale);
            ok(b.env.top >= r.lo - .5, where + b.id + " reaches the lowest card: " + Math.round(b.env.top) + " < " + Math.round(r.lo));
            ok(b.env.left >= r.dock + 6, where + b.id + " is not right of the dock: " + Math.round(b.env.left) + " vs " + Math.round(r.dock));
          }
          for (let i = 1; i < boxes.length; i++) ok(boxes[i].l >= boxes[i - 1].r + 12, where + boxes[i - 1].id + " and " + boxes[i].id + " are not apart: " + JSON.stringify([boxes[i - 1], boxes[i]].map(b => [b.l, b.r].map(Math.round))));
        }
      }
    }
    // a beach: Deckhand's size. A card brought a little lower: smaller, all still standing; into the sand: none
    await page.setViewportSize({ width: 1920, height: 1080 });
    await dh.openShipped("#t=2026-11-18T14:40");
    await dh.launch();
    const s0 = await page.evaluate(() => window.Steward.season.scale());
    await dh.roomy();
    ok((await page.evaluate(() => window.Steward.season.scale())) === 1, "a beach: the pieces are not at Deckhand's size");
    await dh.openShipped("#t=2026-11-18T14:40");
    await dh.launch();
    const s1 = await lower(page, .5);
    ok(s1 < s0 && s1 >= .25, "a card brought 5 px lower: " + s0 + " → " + s1);
    const ids = ["nvScarecrow", "nvSquirrel", "nvTurkey", "sea-campfire"], r1 = await sand(page, ids);
    for (const id of ids) ok(!r1.p[id].off && r1.p[id].env.top >= r1.lo - .5, "a card brought lower: " + id + " " + JSON.stringify(r1.p[id]));
    await lower(page, 6);
    for (const id of ids) await expect(page.locator("#" + id), "no room at all: " + id).toHaveClass(/stOff/);
    await probe(page);                            // (the leaves at rest are behind the cards come down to the water)
    const h = await page.evaluate(ids => window.__over(ids.map(id => document.getElementById(id))), ids);
    ok(h.length === 0, "over a card: " + h.join("; "));
    // the fog lies under the cards — on the shipped board it is squashed to the room left
    await dh.openShipped("#t=2026-11-09T09:00");
    await dh.launch();
    await moving(page);
    ok(await page.evaluate(() => window.Steward.sea("fog")), "the fog did not come on the shipped board");
    const f = await page.evaluate(() => ({ fog: Math.min(...Array.from(document.querySelectorAll("#sea-fog .fgLobe")).map(l => l.getBoundingClientRect().top)),
                                            cards: Math.max(...Array.from(document.querySelectorAll("#canvas .widget")).map(w => w.getBoundingClientRect().bottom)) }));
    ok(f.fog >= f.cards + 14, "the fog stands over the cards: " + JSON.stringify(f));
  });

  test("the leaves fall behind the cards, anywhere across the board — most down the gaps and the margins, where they show — and every one comes to rest on the sand and the water; a tap on the board where one shows spins it away", async ({ page, dh }) => {
    test.setTimeout(120000);
    for (const [W, H] of [[1920, 1080], [1280, 800]]){
      await page.setViewportSize({ width: W, height: H });
      await dh.openShipped("#t=2026-11-18T14:40");
      await dh.launch();
      await moving(page);
      // the layer: under the cards, over the board's background (the board itself is clear), the whole width
      const z = await page.evaluate(() => {
        const l = document.getElementById("nvLeaves"), c = document.getElementById("canvas"), b = l.getBoundingClientRect(), k = getComputedStyle(c);
        return { leaves: +getComputedStyle(l).zIndex, canvas: +k.zIndex, siblings: l.parentElement === c.parentElement, bg: k.backgroundColor, img: k.backgroundImage, l: b.left, r: b.right, W: innerWidth };
      });
      ok(z.siblings && z.canvas > z.leaves && /rgba\(0, 0, 0, 0\)|transparent/.test(z.bg) && z.img === "none" && z.l === 0 && z.r === z.W, W + ": the leaves' layer " + JSON.stringify(z));
      for (const sc of SCENES){
        await scene(page, sc);
        const p = await page.evaluate(() => {
          const S = window.Steward.season, rs = S.cardRects(), y = innerHeight * .5, xs = [];
          for (let i = 0; i < 600; i++) xs.push(S.leaves.place(56) + 28);
          const clear = x => !rs.some(r => x > r.left && x < r.right && y > r.top && y < r.bottom);
          let free = 0; for (let x = 28; x <= innerWidth - 28; x++) if (clear(x)) free++;
          return { lo: Math.min(...xs), hi: Math.max(...xs), inGap: +(xs.filter(clear).length / xs.length).toFixed(3), share: +(free / (innerWidth - 55)).toFixed(3) };
        });
        ok(p.lo < W * .08 && p.hi > W * .92, W + " " + sc + ": the leaves do not fall across the board: " + JSON.stringify(p));
        ok(p.inGap >= .1 && p.inGap > p.share * 3, W + " " + sc + ": the leaves do not favor the gaps: " + JSON.stringify(p));
        const lb = await leavesBehind(page);
        ok(lb.n > 0 && lb.out.length === 0, W + " " + sc + ": a falling leaf shows over a card at " + lb.out.join(" ") + " (" + lb.n + " points looked at)");
      }
      // every one comes to rest on the water, under the cards, where it shows
      const rest = await page.evaluate(async () => {
        const S = window.Steward.season; S.leaves.clear(true);
        const lo = Math.max(...S.cardRects().map(r => r.bottom)), ls = [0, 1, 2].map(() => S._leaf({ at: 1 }));
        await new Promise(r => setTimeout(r, 100));
        return ls.map(l => { if (!l) return null; const b = l.getBoundingClientRect(); return { afloat: l.classList.contains("nvAfloat"), cy: Math.round((b.top + b.bottom) / 2), lo: Math.round(lo) }; });
      });
      ok(rest.every(r => r && r.afloat && r.cy > r.lo && r.cy < H), W + ": a leaf did not come to rest on the water under the cards: " + JSON.stringify(rest));
      // a leaf in a gap between cards: the board takes the tap there, and the leaf spins away
      const t = await page.evaluate(() => {
        const S = window.Steward.season; S.leaves.clear(true);
        const rs = S.cardRects(), y = Math.round(innerHeight * .45);
        let gx = null; for (let x = 60; x < innerWidth - 60 && gx == null; x += 2) if (!rs.some(r => x > r.left && x < r.right && y > r.top && y < r.bottom)) gx = x;
        const l = S._leaf({ side: "left", at: .5, size: 56 }); if (!l || gx == null) return { gx, leaf: !!l };
        l.getAnimations().forEach(a => a.cancel());
        l.style.transform = "translate(" + (gx - 28) + "px," + (y - 28) + "px)";
        const top = document.elementFromPoint(gx, y);
        return { gx, y, leaf: true, top: top && top.id };
      });
      ok(t.leaf && t.gx != null && t.top === "canvas", W + ": no leaf in a gap: " + JSON.stringify(t));
      await page.mouse.click(t.gx, t.y);
      await expect(page.locator("#nvLeaves .nvLeaf.nvGone"), W + ": the tap in the gap did not spin the leaf away").toHaveCount(1);
    }
  });

  test("the branch (November) and the web (October) hang on the clock card's corner and clear its text and its controls — at 1920 × 1080 and 1280 × 800, editing and locked, through a gust and the spider's drop, after every scene switch", async ({ page, dh }) => {
    test.setTimeout(180000);
    for (const [W, H] of [[1920, 1080], [1280, 800]]){
      await page.setViewportSize({ width: W, height: H });
      for (const [t, root] of [["#t=2026-11-09T09:05", "#nvBranch"], ["#t=2026-10-14T10:30", "#ocWeb"]]){
        await dh.openShipped(t);
        await dh.launch();
        await moving(page);
        let seen = 0;
        for (const locked of [false, true]){
          if (locked) await page.click("#lockBtn");
          for (const sc of ["Daily Board", "Stations", "Work Time", "Break", "Daily Board"]){
            await scene(page, sc);
            const r = await corner(page, root), where = W + " " + t + " " + (locked ? "locked" : "editing") + ", " + sc + ": " + root;
            if (!r.clock) continue;                   // no clock card on this board
            seen++;
            ok(r.shown && r.corner, where + " is not on the clock card's corner: " + JSON.stringify(r));
            ok(r.hits.length === 0, where + " over the card's " + r.hits.join("; "));
          }
        }
        ok(seen >= 6, W + " " + t + ": the clock card on " + seen + " boards");
      }
    }
  });

  test("nothing seasonal on a phone", async ({ page, dh }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await dh.openShipped("#t=2026-11-18T14:40");
    const shown = await page.evaluate(ids => ids.concat(["nvLeaves", "nvBranch"]).filter(id => { const e = document.getElementById(id); return e && getComputedStyle(e).display !== "none"; }), PIECES.filter(id => id !== "sea-fog"));
    ok(shown.length === 0, "on a phone: " + shown.join(","));
  });

  test("no theme sound in Steward, even with the sound on: the geese, the loon and the turkey are silent", async ({ page, dh }) => {
    test.setTimeout(90000);
    await page.addInitScript(() => {
      window.__voices = 0;
      const count = (proto, name) => { const f = proto[name]; proto[name] = function(){ window.__voices++; return f.apply(this, arguments); }; };
      count(AudioContext.prototype, "createOscillator"); count(AudioContext.prototype, "createBufferSource");
      count(HTMLMediaElement.prototype, "play");
    });
    await dh.openShipped("#t=2026-11-18T14:40");                // feast week: the turkey is on the sand
    await dh.launch();
    await moving(page);
    await scene(page, "Stations");
    await dh.roomy();                                          // a beach, so every act and piece is out
    await expect(page.locator("#soundBtn")).toHaveText("Sound On");
    ok(await page.evaluate(() => window.Steward.sound.primed()), "the sound is not awake");
    ok(await page.evaluate(() => ["honk", "loon", "gobble"].every(k => !(k in window.Steward.sound))), "a theme sound is still in the file");
    const before = await page.evaluate(() => window.__voices);
    const went = await page.evaluate(() => ["geese", "loon", "ducks", "trawler", "campfire"].filter(a => !window.Steward.sea(a)));
    ok(went.length === 0, "these did not play: " + went.join());
    await page.evaluate(() => { const S = window.Steward.season; S.turkey.tap(); S.squirrel.dig(0); S.scarecrow.crow(); });
    await page.waitForTimeout(21500);                          // past the honk (9 s) and the loon's call (20.2 s) in Deckhand
    ok((await page.evaluate(() => window.__voices)) === before, "a theme made a sound: " + (await page.evaluate(() => window.__voices) - before));
  });
});
