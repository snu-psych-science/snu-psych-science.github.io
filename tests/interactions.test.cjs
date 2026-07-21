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

test("home slideshow autoplays without playback controls and respects reduced motion", () => {
  const homepage = fs.readFileSync(path.join(root, "index.md"), "utf8");
  const styles = fs.readFileSync(path.join(root, "_styles", "home.scss"), "utf8");
  const homeData = fs.readFileSync(path.join(root, "_data", "home.yaml"), "utf8");

  assert.doesNotMatch(homepage, /home-slide-toggle|data-slideshow/);
  assert.match(homepage, /for slide in site\.data\.home\.slides/);
  assert.match(homepage, /class="home-slide-show" aria-hidden="true"/);
  const slideImages = [...homeData.matchAll(/^\s+- image:\s*(\S+)/gm)].map(
    (match) => match[1]
  );
  assert.ok(slideImages.length > 1, "slideshow needs multiple configured images");
  for (const image of slideImages) {
    assert.match(image, /^\/images\//);
    assert.ok(fs.existsSync(path.join(root, image.slice(1))), `missing slide image: ${image}`);
  }
  assert.match(styles, /animation:\s*homeSlideFade\b/);
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.home-slide-item\s*{[\s\S]*animation:\s*none/
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.home-slide-item:first-child[\s\S]*opacity:\s*1/
  );

  const duration = Number(styles.match(/animation:\s*homeSlideFade\s+(\d+)s/)[1]);
  const delays = [...styles.matchAll(/animation-delay:\s*(\d+)s/g)].map((match) => Number(match[1]));
  const interval = delays[1] - delays[0];
  assert.ok(interval >= 5 && interval <= 7, "each slide should remain visible for 5-7 seconds");
  assert.equal(duration, interval * slideImages.length);
  assert.deepEqual(delays, slideImages.map((_, index) => index * interval));
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
