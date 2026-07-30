const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("list-page card titles follow each page h1 with h2 headings", () => {
  const cases = [["events/index.md", "event"], ["newsletters/index.md", "newsletter"]];
  const styles = read("_styles/components.scss");

  for (const [pagePath, record] of cases) {
    const page = read(pagePath);
    assert.match(page, new RegExp(`<h2>\\{\\{ ${record}\\.title \\}\\}</h2>`), pagePath);
    assert.doesNotMatch(page, new RegExp(`<h3>\\{\\{ ${record}\\.title \\}\\}</h3>`), pagePath);
    assert.match(page, /class="collection-card__content"/);
  }
  assert.match(styles, /\.collection-card__content h2\s*\{/);
  assert.doesNotMatch(styles, /\.collection-card__content h3\s*\{/);

  const rulesPage = read("resources/rules/index.md");
  const ruleTitles = [...rulesPage.matchAll(/<h2>서울대학교 [^<]+<\/h2>/g)];
  assert.equal(ruleTitles.length, 2);
  assert.doesNotMatch(rulesPage, /<h3>서울대학교 (?:연구윤리|사회과학연구원)/);
  assert.match(read("_styles/resources.scss"), /\.resources-rule-card h2/);
});

test("member table identifies column, row, and row-group headers", () => {
  const members = read("about/members/index.md");
  assert.equal((members.match(/<th scope="col">/g) || []).length, 4);
  assert.match(members, /<th class="member-role" scope="row">\{\{ member\.role \}\}<\/th>/);
  assert.match(
    members,
    /<th class="member-role" scope="rowgroup" rowspan="\{\{ affiliated_members\.size \}\}">/
  );
  assert.doesNotMatch(members, /<td class="member-role"/);
  assert.ok((members.match(/<tbody>/g) || []).length >= 2);
});

test("mobile text adjustment remains enabled at 100 percent", () => {
  const styles = read("_styles/all.scss");
  assert.match(styles, /html\s*\{[\s\S]*text-size-adjust:\s*100%/);
  assert.doesNotMatch(styles, /text-size-adjust:\s*none/);
});
