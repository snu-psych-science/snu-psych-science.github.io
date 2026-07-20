const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const script = (name) => fs.readFileSync(path.join(root, "_scripts", name), "utf8");
const { applyImageFallback } = require("../_scripts/image-fallback.js");

class FakeElement {
  constructor() {
    this.attributes = new Map();
    this.listeners = new Map();
    this.hidden = true;
    this.focused = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  toggleAttribute(name, force) {
    const present = force === undefined ? !this.hasAttribute(name) : Boolean(force);
    if (present) this.setAttribute(name, "");
    else this.attributes.delete(name);
    return present;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }

  focus() {
    this.focused = true;
  }
}

test("failed images switch once to their declared fallback", () => {
  const image = new FakeElement();
  image.dataset = { fallbackSrc: "/images/fallback.svg" };
  image.setAttribute("data-fallback-src", "/images/fallback.svg");
  image.src = "/images/missing.jpg";

  assert.equal(applyImageFallback(image), true);
  assert.equal(image.src, "/images/fallback.svg");
  assert.equal(image.hasAttribute("data-fallback-src"), false);

  image.dataset.fallbackSrc = "";
  assert.equal(applyImageFallback(image), false);
});

test("mobile navigation synchronizes state and closes on Escape or resize", () => {
  const header = new FakeElement();
  const toggle = new FakeElement();
  const navigation = new FakeElement();
  header.querySelector = (selector) =>
    selector === ".nav-toggle" ? toggle : selector === "#site-navigation" ? navigation : null;

  const document = new FakeElement();
  document.readyState = "complete";
  document.querySelector = (selector) => (selector === "header" ? header : null);

  const mobile = new FakeElement();
  mobile.matches = true;
  const window = { matchMedia: () => mobile };

  vm.runInNewContext(script("navigation.js"), { window, document }, {
    filename: "navigation.js",
  });

  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.ok(header.hasAttribute("data-nav-enhanced"));

  toggle.emit("click");
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.ok(header.hasAttribute("data-nav-open"));

  document.emit("keydown", { key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(toggle.focused, true);

  toggle.emit("click");
  mobile.emit("change", { matches: false });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

test("home slideshow exposes an action button and respects reduced motion", () => {
  const slideshow = new FakeElement();
  const toggle = new FakeElement();
  slideshow.querySelector = (selector) =>
    selector === ".home-slide-toggle" ? toggle : null;

  const document = new FakeElement();
  document.readyState = "complete";
  document.querySelector = (selector) =>
    selector === "[data-slideshow]" ? slideshow : null;

  const reducedMotion = new FakeElement();
  reducedMotion.matches = false;
  const window = { matchMedia: () => reducedMotion };

  vm.runInNewContext(script("home-slideshow.js"), { window, document }, {
    filename: "home-slideshow.js",
  });

  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute("aria-label"), "슬라이드 일시정지");
  assert.equal(toggle.hasAttribute("aria-pressed"), false);

  toggle.emit("click");
  assert.ok(slideshow.hasAttribute("data-slideshow-paused"));
  assert.equal(toggle.getAttribute("aria-label"), "슬라이드 재생");

  toggle.emit("click");
  assert.equal(slideshow.hasAttribute("data-slideshow-paused"), false);

  reducedMotion.emit("change", { matches: true });
  assert.ok(slideshow.hasAttribute("data-slideshow-paused"));
});

test("anchor scrolling decodes Korean fragments and honors reduced motion", () => {
  const events = new Map();
  let requestedId;
  let scrollOptions;
  const target = { getBoundingClientRect: () => ({ top: 200 }) };
  const document = {
    querySelectorAll: () => [],
    querySelector: () => ({ clientHeight: 50 }),
    getElementById: (id) => {
      requestedId = id;
      return target;
    },
  };
  const window = {
    location: { hash: `#${encodeURIComponent("행사-정보")}` },
    scrollY: 0,
    matchMedia: () => ({ matches: true }),
    scrollTo: (options) => {
      scrollOptions = options;
    },
    addEventListener: (type, listener) => {
      const listeners = events.get(type) || [];
      listeners.push(listener);
      events.set(type, listeners);
    },
  };

  vm.runInNewContext(script("anchors.js"), { window, document, console }, {
    filename: "anchors.js",
  });
  for (const listener of events.get("hashchange") || []) listener();

  assert.equal(requestedId, "행사-정보");
  assert.equal(scrollOptions.top, 150);
  assert.equal(scrollOptions.behavior, "auto");
});
