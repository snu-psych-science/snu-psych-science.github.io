const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeTag, splitQuery } = require("../_scripts/search.js");
const { buildSiteSearchUrl } = require("../_scripts/site-search.js");
const { resolveDarkMode } = require("../_scripts/dark-mode.js");

test("search queries are split into terms, phrases, and normalized tags", () => {
  assert.deepEqual(
    splitQuery('memory aging "social network" "tag: Cognitive Science"'),
    {
      terms: ["memory", "aging"],
      phrases: ["social network"],
      tags: ["cognitive-science"],
    }
  );
});

test("tag normalization trims, lowercases, and collapses whitespace", () => {
  assert.equal(normalizeTag("  Social   Cognition "), "social-cognition");
});

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
