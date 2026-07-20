const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSiteSearchUrl } = require("../_scripts/site-search.js");
const { resolveDarkMode } = require("../_scripts/dark-mode.js");

test("site-search URLs preserve the complete query", () => {
  const url = new URL(
    buildSiteSearchUrl("https://snu-psych-science.github.io/path", "인지 노화")
  );
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(
    url.searchParams.get("q"),
    "site:https://snu-psych-science.github.io 인지 노화"
  );
});

test("dark mode accepts only saved boolean strings", () => {
  assert.equal(resolveDarkMode("true", false), "true");
  assert.equal(resolveDarkMode("false", true), "false");
  assert.equal(resolveDarkMode("invalid", true), "true");
  assert.equal(resolveDarkMode(null, false), "false");
});
