const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSiteSearchUrl } = require("../_scripts/site-search.js");

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
