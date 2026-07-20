const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".jekyll-cache", "_site", "vendor", "node_modules"].includes(entry.name))
      return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });

test("all browser scripts parse as JavaScript", () => {
  for (const file of walk(path.join(root, "_scripts")).filter((file) => file.endsWith(".js"))) {
    assert.doesNotThrow(
      () => new vm.Script(fs.readFileSync(file, "utf8"), { filename: file }),
      path.relative(root, file)
    );
  }
});

test("SCSS files have balanced declaration blocks", () => {
  for (const file of walk(path.join(root, "_styles")).filter((file) => file.endsWith(".scss"))) {
    const contents = fs.readFileSync(file, "utf8");
    assert.equal(
      (contents.match(/\{/g) || []).length,
      (contents.match(/\}/g) || []).length,
      path.relative(root, file)
    );
  }
});

test("interactive templates avoid inline event handlers", () => {
  const markupFiles = walk(root).filter((file) => /\.(?:html|md)$/i.test(file));
  const violations = [];
  for (const file of markupFiles) {
    const matches = fs.readFileSync(file, "utf8").match(/\bon[a-z]+\s*=/gi) || [];
    if (matches.length) violations.push(`${path.relative(root, file)}: ${matches.join(", ")}`);
  }
  assert.deepEqual(violations, []);
});

test("source image tags always declare alternative text", () => {
  const markupFiles = walk(root).filter((file) => /\.(?:html|md)$/i.test(file));
  const violations = [];
  for (const file of markupFiles) {
    const contents = fs.readFileSync(file, "utf8");
    for (const tag of contents.match(/<img\b[^>]*>/gis) || []) {
      if (!/\balt\s*=/i.test(tag)) violations.push(path.relative(root, file));
    }
  }
  assert.deepEqual(violations, []);
});

test("responsive navigation has one breakpoint and an accessible control", () => {
  const header = read("_includes/header.html");
  const styles = read("_styles/header.scss");
  assert.match(header, /<button[\s\S]*aria-controls="site-navigation"[\s\S]*aria-expanded="false"/);
  assert.match(header, /<nav id="site-navigation"[\s\S]*aria-label="주요 메뉴"/);
  assert.match(styles, /\$collapse:\s*900px/);
  assert.doesNotMatch(styles, /\$collapse:\s*700px/);
  assert.equal((styles.match(/@media \(max-width:/g) || []).length, 1);
});

test("core accessibility landmarks and status regions are present", () => {
  const layout = read("_layouts/default.html");
  assert.match(layout, /class="skip-link" href="#main-content"/);
  assert.match(layout, /<main id="main-content" tabindex="-1">/);
  assert.match(read("_includes/search-info.html"), /role="status"[\s\S]*aria-live="polite"/);
  assert.match(read("_includes/search-box.html"), /<label[\s\S]*type="search"/);
  assert.match(read("index.md"), /class="home-slide-toggle"[\s\S]*aria-controls="home-slides"/);
  assert.doesNotMatch(read("index.md"), /aria-pressed/);
});

test("theme link colors meet normal-text contrast", () => {
  const theme = read("_styles/-theme.scss");
  assert.match(theme, /\[data-dark="false"\][\s\S]*--primary:\s*#0369a1/);
  assert.match(theme, /\[data-dark="true"\][\s\S]*--primary:\s*#7dd3fc/);
  assert.doesNotMatch(walk(path.join(root, "_styles")).map((file) => fs.readFileSync(file, "utf8")).join("\n"), /#(?:0284c7|0795d9)/i);
});

test("pages previously missing a primary heading declare one", () => {
  assert.match(read("index.md"), /<h1 class="visually-hidden">/);
  assert.match(read("404.md"), /^#\s/m);
  assert.match(read("resources/links/index.md"), /^#\s/m);
  assert.match(read("_layouts/member.html"), /<h1>/);
  assert.doesNotMatch(read("resources/links/index.md"), /<h3>/);
});

test("search controls keep themed input styling and a no-JavaScript site filter", () => {
  assert.match(read("_styles/textbox.scss"), /input:is\(\[type="text"\], \[type="search"\]\)/);
  assert.doesNotMatch(read("_styles/search-box.scss"), /--black/);
  assert.match(read("_includes/site-search.html"), /name="as_sitesearch"/);
});

test("scripts use an explicit, feature-gated manifest", () => {
  const scripts = read("_includes/scripts.html");
  assert.doesNotMatch(scripts, /site\.static_files/);
  assert.match(scripts, /image-fallback\.js/);
  assert.match(scripts, /if page\.search[\s\S]*mark\.js[\s\S]*search\.js[\s\S]*fetch-tags\.js/);
});

test("image fallback behavior does not rely on inline handlers", () => {
  assert.match(read("_includes/fallback.html"), /data-fallback-src=/);
  assert.doesNotMatch(read("_includes/fallback.html"), /\bon[a-z]+\s*=/i);
  assert.match(read("_scripts/image-fallback.js"), /addEventListener\([\s\S]*"error"/);
});

test("publication years are derived from data instead of hard-coded", () => {
  const publicationList = read("_includes/publication-list.html");
  assert.match(publicationList, /group_by:\s*"year"/);
  assert.doesNotMatch(publicationList, /2026\|2025\|2024/);
});

test("tag rows and the tag-fetcher agree on the destination contract", () => {
  assert.match(read("_includes/tags.html"), /data-link=/);
  assert.match(read("_scripts/fetch-tags.js"), /row\.dataset\.link\?\.trim\(\)/);
});

test("the regulation PDF link points to a tracked file", () => {
  const pdf = "resources/rules/snu-social-sciences-research-institute-regulations.pdf";
  assert.ok(fs.existsSync(path.join(root, pdf)));
  assert.match(
    read("resources/rules/institute-operating-regulations/index.md"),
    new RegExp(pdf.replaceAll("/", "\\/"))
  );
});

test("member pages do not retain dead search links", () => {
  assert.doesNotMatch(read("_layouts/member.html"), /(?:blog|research)\/\?search=/);
});

test("pull-request code never runs with pull_request_target privileges", () => {
  const workflows = walk(path.join(root, ".github", "workflows"))
    .filter((file) => /\.ya?ml$/i.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const workflow = read(".github/workflows/on-pull-request.yaml");
  assert.doesNotMatch(workflows, /pull_request_target/);
  assert.match(workflow, /^\s*pull_request:\s*$/m);
  assert.doesNotMatch(workflow, /pull_request_target|secrets:\s*inherit/);
  assert.match(workflow, /head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /github\.actor != 'dependabot\[bot\]'/);
});
