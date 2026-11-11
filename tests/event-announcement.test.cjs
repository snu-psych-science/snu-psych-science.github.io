const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "_scripts/event-announcement.js"), "utf8");
const expiry = "2026-11-20T11:00:00+09:00";
const eventKey = "/events/yaakov-stern-special-lecture-2026/";

class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
}

function openVisit({ now = "2026-11-11T16:00:00+09:00", end = expiry, session = new Map(), local = new Map(), blockedStorage = false } = {}) {
  const clock = { now: Date.parse(now) };
  class Clock extends Date { static now() { return clock.now; } }
  const dialog = new Target();
  dialog.dataset = { eventKey, expiresAt: end };
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.emit("close"); };
  const controls = {
    "[data-close-announcement]": new Target(),
    "[data-hide-today]": new Target(),
    ".event-announcement__body": new Target(),
  };
  dialog.querySelector = (selector) => controls[selector];
  const classes = new Set();
  const document = new Target();
  document.readyState = "complete";
  document.documentElement = { classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) } };
  document.querySelector = () => dialog;
  const window = new Target();
  const storage = (data) => ({ getItem: (name) => data.get(name), setItem: (name, value) => data.set(name, value) });
  for (const [name, data] of [["sessionStorage", session], ["localStorage", local]]) {
    Object.defineProperty(window, name, { get() { if (blockedStorage) throw new Error("Storage disabled"); return storage(data); } });
  }
  const timers = new Map();
  let nextTimer = 0;
  window.setTimeout = (callback, delay) => { timers.set(++nextTimer, { callback, delay }); return nextTimer; };
  window.clearTimeout = (id) => timers.delete(id);
  vm.runInNewContext(source, { window, document, Date: Clock }, { filename: "event-announcement.js" });
  return { dialog, controls, classes, document, window, timers, clock, session, local };
}

test("announcement opens once per visit and remains a native body link", () => {
  const first = openVisit();
  assert.equal(first.dialog.open, true);
  first.controls[".event-announcement__body"].emit("click", { preventDefault() { assert.fail("native navigation must be preserved"); } });
  assert.equal(first.dialog.open, false);
  assert.equal(first.classes.size, 0);
  assert.equal(openVisit({ session: first.session, local: first.local }).dialog.open, false);
  assert.equal(openVisit({ local: first.local }).dialog.open, true);
});

test("close is independent of daily dismissal", () => {
  const visit = openVisit();
  visit.controls["[data-close-announcement]"].emit("click");
  assert.equal(visit.dialog.open, false);
  assert.equal(visit.local.size, 0);
  assert.equal(visit.timers.size, 0);
  assert.equal(visit.classes.size, 0);
});

test("today dismissal survives a new visit and resets at Korea midnight", () => {
  const visit = openVisit({ now: "2026-11-11T23:59:00+09:00" });
  visit.controls["[data-hide-today]"].emit("click");
  assert.equal(visit.dialog.open, false);
  assert.equal(openVisit({ local: visit.local, now: "2026-11-11T23:59:59+09:00" }).dialog.open, false);
  assert.equal(openVisit({ local: visit.local, now: "2026-11-12T00:00:00+09:00" }).dialog.open, true);
});

test("the popup stops at the exact lecture start, including already open tabs", () => {
  assert.equal(openVisit({ now: "2026-11-20T10:59:59+09:00" }).dialog.open, true);
  assert.equal(openVisit({ now: expiry }).dialog.open, false);
  assert.equal(openVisit({ now: "2026-11-21T10:00:00+09:00" }).dialog.open, false);
  assert.equal(openVisit({ end: "invalid" }).dialog.open, false);
  const visit = openVisit();
  visit.clock.now = Date.parse(expiry);
  [...visit.timers.values()][0].callback();
  assert.equal(visit.dialog.open, false);
  assert.equal(visit.classes.size, 0);
  const backgroundVisit = openVisit();
  backgroundVisit.clock.now = Date.parse(expiry) + 1;
  backgroundVisit.document.emit("visibilitychange");
  assert.equal(backgroundVisit.dialog.open, false);
});

test("disabled storage and native close do not strand the page behind a modal", () => {
  const visit = openVisit({ blockedStorage: true });
  assert.equal(visit.dialog.open, true);
  visit.controls["[data-hide-today]"].emit("click");
  assert.equal(visit.dialog.open, false);
  assert.equal(visit.classes.size, 0);
  const nativeClose = openVisit();
  nativeClose.dialog.close(); // The close event also covers the browser's Escape behavior.
  assert.equal(nativeClose.classes.size, 0);
  assert.equal(nativeClose.timers.size, 0);
});

test("back navigation does not restore an open announcement", () => {
  const visit = openVisit();
  visit.window.emit("pagehide");
  visit.window.emit("pageshow");
  assert.equal(visit.dialog.open, false);
  assert.equal(visit.classes.size, 0);
});

test("event labels change using Korea dates even if the browser is elsewhere", () => {
  const badges = ["2026-11-11", "2026-11-12", "2026-11-13"].map((date) => ({ dataset: { eventDate: date } }));
  const document = new Target();
  document.readyState = "complete";
  document.querySelectorAll = () => badges;
  const window = new Target();
  class Clock extends Date { static now() { return Date.parse("2026-11-11T15:00:00Z"); } }
  vm.runInNewContext(fs.readFileSync(path.join(root, "_scripts/event-status.js"), "utf8"), { document, window, Date: Clock });
  assert.deepEqual(badges.map((badge) => badge.dataset.state), ["past", "today", "upcoming"]);
  assert.deepEqual(badges.map((badge) => badge.textContent), ["지난 행사", "오늘", "예정 행사"]);
});
