const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const ignoredDirectories = new Set([
  ".git",
  ".jekyll-cache",
  ".sass-cache",
  "_site",
  "vendor",
  "node_modules",
]);
const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];
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

test("interactive templates avoid inline event handlers", () => {
  const violations = [];
  for (const file of walk(root).filter((file) => /\.(?:html|md)$/i.test(file))) {
    const matches = fs.readFileSync(file, "utf8").match(/\bon[a-z]+\s*=/gi) || [];
    if (matches.length) violations.push(`${path.relative(root, file)}: ${matches.join(", ")}`);
  }
  assert.deepEqual(violations, []);
});

test("source image tags declare alternative text", () => {
  const violations = [];
  for (const file of walk(root).filter((file) => /\.(?:html|md)$/i.test(file))) {
    for (const tag of fs.readFileSync(file, "utf8").match(/<img\b[^>]*>/gis) || []) {
      if (!/\balt\s*=/i.test(tag)) violations.push(path.relative(root, file));
    }
  }
  assert.deepEqual(violations, []);
});

test("navigation exposes its observable accessibility states", () => {
  const header = read("_includes/header.html");
  const navigation = read("_scripts/navigation.js");
  assert.match(header, /class="site-header"/);
  assert.match(header, /<button[\s\S]*aria-controls="site-navigation"[\s\S]*aria-expanded="false"/);
  assert.match(header, /<nav id="site-navigation"[\s\S]*aria-label="주요 메뉴"/);
  assert.match(navigation, /document\.querySelector\("\.site-header"\)/);
  assert.doesNotMatch(navigation, /document\.querySelector\("header"\)/);
  assert.match(navigation, /setAttribute\("aria-expanded"/);
  assert.match(navigation, /event\.key === "Escape"/);
  assert.match(navigation, /toggle\.focus\(\)/);
  assert.match(navigation, /document\.activeElement === toggle[\s\S]*home\?\.focus\(\)/);
  assert.match(navigation, /\.addEventListener\?\.\("change"/);
});

test("core landmarks and progressive fallbacks are present", () => {
  const layout = read("_layouts/default.html");
  assert.match(layout, /class="skip-link" href="#main-content"/);
  assert.match(layout, /<main id="main-content" tabindex="-1">/);
  assert.match(read("_includes/site-search.html"), /name="as_sitesearch"/);
  assert.match(read("index.md"), /class="home-slide-show" aria-hidden="true"/);
});

test("semantic tokens enforce the light theme and cover focus, spacing, radius, and shadows", () => {
  const tokens = read("_styles/tokens.scss");
  assert.match(tokens, /:root\s*\{/);
  assert.match(tokens, /color-scheme:\s*light/);
  assert.doesNotMatch(tokens, /data-dark|prefers-color-scheme/);
  for (const token of [
    "color-brand",
    "color-brand-strong",
    "color-accent",
    "color-text",
    "color-text-muted",
    "color-surface",
    "color-surface-muted",
    "color-border",
    "color-focus",
    "shadow-sm",
    "shadow-md",
    "shadow-lg",
    "radius-sm",
    "radius-md",
    "radius-lg",
    "space-",
  ]) assert.match(tokens, new RegExp(`--${token}`));
});

test("header uses dedicated light-theme semantic colors", () => {
  const header = read("_includes/header.html");
  const styles = read("_styles/header.scss");
  const tokens = read("_styles/tokens.scss");
  assert.doesNotMatch(header, /data-dark=/);
  for (const token of [
    "color-header-surface",
    "color-header-text",
    "color-header-accent",
  ]) {
    assert.match(styles, new RegExp(`var\\(--${token}\\)`));
    assert.equal((tokens.match(new RegExp(`--${token}:`, "g")) || []).length, 1);
  }

  const divider = styles.match(/\.site-header\s*\{[\s\S]*?border-bottom:\s*(\d+)px solid var\(--color-border\)/);
  assert.ok(divider, "header divider uses the shared theme border color");
  assert.ok(Number(divider[1]) <= 2, "header divider stays visually lightweight");
  assert.doesNotMatch(styles, /data-dark/i);
});

test("site chrome and generated content spacing are explicitly scoped", () => {
  const header = read("_includes/header.html");
  const content = read("_includes/content.html");
  const footer = read("_includes/footer.html");
  const headerStyles = read("_styles/header.scss");
  const sectionStyles = read("_styles/section.scss");
  const anchors = read("_scripts/anchors.js");

  assert.match(header, /class="site-header"/);
  assert.match(content, /class="content-section background"/);
  assert.match(headerStyles, /^\.site-header\s*\{/m);
  assert.match(sectionStyles, /^\.content-section\s*\{/m);
  assert.doesNotMatch(headerStyles, /^\s*header(?=[\s.#:[>{])/m);
  assert.doesNotMatch(headerStyles, /data-big|\.site-header\.background/);
  assert.doesNotMatch(sectionStyles, /^\s*section(?=[\s.#:[>{])/m);
  assert.doesNotMatch([content, footer, sectionStyles].join("\n"), /data-size/);
  assert.match(anchors, /document\.querySelector\("\.site-header"\)/);
  assert.doesNotMatch(anchors, /document\.querySelector\("header"\)|removeAttribute\("id"\)|tagsfetched/);
});

test("primary content indexes use a consistent boxed page hero", () => {
  const sharedHero = read("_includes/page-hero.html");
  assert.match(sharedHero, /class="page-hero/);
  assert.match(sharedHero, /class="page-hero__title"/);
  assert.match(sharedHero, /--page-hero-image:[\s\S]*relative_url/);

  for (const relativePath of [
    "about/index.md",
    "about/history/index.md",
    "about/location/index.md",
    "about/members/index.md",
    "events/index.md",
    "research/index.md",
    "newsletters/index.md",
    "notices/index.md",
    "resources/index.md",
    "resources/rules/index.md",
    "resources/links/index.md",
    "resources/rules/institute-operating-regulations/index.md",
    "resources/rules/snu-research-ethics/index.md",
  ]) {
    const page = read(relativePath);
    assert.match(page, /include\s+page-hero\.html\b/i, `${relativePath} shared page hero`);
  }
});

test("site assets are explicit and no custom Ruby filters remain", () => {
  const config = read("_config.yaml");
  const header = read("_includes/header.html");
  const meta = read("_includes/meta.html");
  const content = read("_includes/content.html");
  const section = read("_includes/section.html");

  for (const [key, asset] of [
    ["logo", "images/logo_.png"],
    ["icon", "images/icon.png"],
    ["share_image", "images/share.png"],
  ]) {
    assert.match(config, new RegExp(`^${key}:\\s*${asset.replace(".", "\\.")}$`, "m"));
    assert.equal(fs.existsSync(path.join(root, asset)), true, asset);
  }
  assert.match(header, /assign logo = site\.logo/);
  assert.match(meta, /site\.icon \| absolute_url/);
  assert.match(meta, /site\.share_image \| absolute_url/);
  assert.doesNotMatch([header, meta, content].join("\n"), /file_exists|file_read|array_filter|regex_/);
  assert.doesNotMatch(section, /<background>|<size>/);
  assert.deepEqual(
    fs.existsSync(path.join(root, "_plugins"))
      ? fs.readdirSync(path.join(root, "_plugins")).filter((name) => name.endsWith(".rb"))
      : [],
    []
  );
});

test("collection detail and member layouts use the shared boxed page hero", () => {
  for (const relativePath of [
    "_layouts/event.html",
    "_layouts/newsletter.html",
    "_layouts/notice.html",
    "_layouts/member.html",
  ]) {
    const layout = read(relativePath);
    assert.match(layout, /class="[^"]*page-hero(?:\s|\")/i, `${relativePath} page hero`);
    assert.match(layout, /class="[^"]*page-hero__title(?:\s|\")/i, `${relativePath} hero title`);
    assert.match(layout, /class="[^"]*page-hero__description(?:\s|\")/i, `${relativePath} hero description`);
    assert.match(layout, /--page-hero-image:[\s\S]*relative_url/i, `${relativePath} baseurl-safe hero image`);
  }
});

test("light-theme text, muted text, brand links, and focus colors meet WCAG contrast", () => {
  const tokens = read("_styles/tokens.scss");
  const luminance = (hex) => {
    const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
    const linear = channels.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const contrast = (first, second) => {
    const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (bright + 0.05) / (dark + 0.05);
  };

  const block = tokens.match(/:root\s*\{([\s\S]*?)\}/)[1];
  const color = (name) => block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))[1];
  for (const foreground of ["color-text", "color-text-muted", "color-brand", "color-focus"])
    assert.ok(
      contrast(color(foreground), color("color-surface")) >= 4.5,
      `${foreground} contrast`
    );
});

test("styles use one explicit compiled entrypoint and baseurl-safe image injection", () => {
  const manifest = read("_includes/styles.html");
  const entrypoint = read("assets/css/main.scss");
  assert.doesNotMatch(manifest, /site\.static_files|for\s+style/);
  assert.equal((manifest.match(/rel="stylesheet"/g) || []).length, 1);
  assert.match(manifest, /assets\/css\/main\.css['"]?\s*\|\s*relative_url/);
  assert.match(entrypoint, /@import "tokens"/);
  assert.match(entrypoint, /@import "components"/);
  const styles = walk(path.join(root, "_styles"))
    .filter((file) => file.endsWith(".scss"))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  assert.doesNotMatch(styles, /url\(\s*["']?\/images\//i);
});

test("script manifest is explicit, deferred, and free of unused CDN libraries", () => {
  const manifest = read("_includes/scripts.html");
  assert.doesNotMatch(manifest, /site\.static_files|tippy|popper|mark(?:\.min)?\.js|fetch-tags|["'\/]search\.js/);
  for (const name of ["anchors", "image-fallback", "navigation", "tooltip"])
    assert.match(manifest, new RegExp(`${name}\\.js[^>]*defer`));
  assert.doesNotMatch(manifest, /dark-mode/i);
  assert.match(manifest, /page\.url == "\/404\.html"[\s\S]*site-search\.js[^>]*defer/);
});

test("site exposes only the light color theme", () => {
  const layout = read("_layouts/default.html");
  const footer = read("_includes/footer.html");
  const content = read("_includes/content.html");
  const entrypoint = read("assets/css/main.scss");

  for (const source of [layout, footer, content, entrypoint])
    assert.doesNotMatch(source, /data-dark|dark-toggle|dark-mode/i);
  assert.equal(fs.existsSync(path.join(root, "_scripts", "dark-mode.js")), false);
  assert.equal(fs.existsSync(path.join(root, "_styles", "dark-toggle.scss")), false);
});

test("image fallback behavior does not rely on inline handlers", () => {
  assert.match(read("_includes/fallback.html"), /data-fallback-src=/);
  assert.doesNotMatch(read("_includes/fallback.html"), /\bon[a-z]+\s*=/i);
  assert.match(read("_scripts/image-fallback.js"), /addEventListener\([\s\S]*"error"/);
});

test("member and director pages read one canonical data source", () => {
  assert.deepEqual(
    fs.existsSync(path.join(root, "_members"))
      ? fs.readdirSync(path.join(root, "_members")).filter((name) => name.endsWith(".md"))
      : [],
    []
  );
  const membersPage = read("about/members/index.md");
  assert.match(membersPage, /site\.data\.members/);
  assert.match(membersPage, /href="\{\{ member\.faculty_url \}\}"/);
  assert.match(membersPage, /href="\{\{ member\.lab_url \}\}"/);
  assert.doesNotMatch(membersPage, /member\.profile_url/);
  assert.match(read("about/greeting/index.md"), /site\.data\.members/);
  assert.match(read("_layouts/member.html"), /site\.data\.members/);
});

test("publication years are derived from canonical data", () => {
  const publicationList = read("_includes/publication-list.html");
  assert.match(publicationList, /site\.data\.psi_publications/);
  assert.match(publicationList, /group_by:\s*"year"/);
  assert.doesNotMatch(publicationList, /2026\|2025\|2024/);
});

test("template citation automation and destructive setup workflows are absent", () => {
  for (const relativePath of [
    "_data/citations.yaml",
    "_data/sources.yaml",
    "_data/orcid.yaml",
    ".github/workflows/first-time-setup.yaml",
    ".github/workflows/on-schedule.yaml",
    ".github/workflows/update-citations.yaml",
    "CITATION.cff",
  ]) assert.equal(fs.existsSync(path.join(root, relativePath)), false, relativePath);
  assert.deepEqual(
    fs.existsSync(path.join(root, "_cite")) ? walk(path.join(root, "_cite")) : [],
    [],
    "_cite must contain no pipeline files"
  );

  const searchable = walk(root)
    .filter((file) => /\.(?:md|html|ya?ml|rb|py|scss|js|json)$/i.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  assert.doesNotMatch(searchable, /Lorem ipsum|greenelab\/meta-review/i);
});

test("tracked files exclude generated artifacts and unsafe filenames", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const forbidden = tracked.filter((file) => fs.existsSync(path.join(root, file)) &&
    /(^|\/)(?:_site|\.jekyll-cache|\.sass-cache|__pycache__|\.cache)(\/|$)|cache\.db$|\.DS_Store$/i.test(file)
  );
  assert.deepEqual(forbidden, []);

  const invalidNames = walk(root)
    .map((file) => path.relative(root, file).replaceAll(path.sep, "/"))
    .filter((file) => file.split("/").some((part) => /[\s.]$|[\x00-\x1f\x7f]/.test(part)));
  assert.deepEqual(invalidNames, []);
});

test("workflow triggers avoid privileged pull request execution", () => {
  const workflows = walk(path.join(root, ".github", "workflows"))
    .filter((file) => /\.ya?ml$/i.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const pullRequest = read(".github/workflows/on-pull-request.yaml");
  assert.doesNotMatch(workflows, /pull_request_target/);
  assert.match(pullRequest, /^\s*pull_request:\s*$/m);
  assert.doesNotMatch(pullRequest, /secrets:\s*inherit/);
  assert.match(pullRequest, /head\.repo\.full_name == github\.repository/);
  assert.match(pullRequest, /github\.actor != 'dependabot\[bot\]'/);
});

test("deployment workflows minimize permissions and serialize gh-pages writes", () => {
  const testSite = read(".github/workflows/test-site.yaml");
  const live = read(".github/workflows/build-site.yaml");
  const preview = read(".github/workflows/build-preview.yaml");
  const pullRequest = read(".github/workflows/on-pull-request.yaml");
  const push = read(".github/workflows/on-push.yaml");
  const nodeVersion = read(".node-version").trim();

  assert.match(testSite, /test-site:[\s\S]*permissions:\s*\n\s+contents: read/);
  assert.equal(nodeVersion, "24");
  assert.match(testSite, /node-version-file:\s*\.node-version/);
  assert.match(testSite, /run:\s*npm ci/);
  assert.match(testSite, /ruby-version: "3\.2"/);
  assert.match(testSite, /actions\/upload-artifact@v7/);
  assert.match(testSite, /bundle exec jekyll build[\s\S]*--baseurl "\$SITE_BASEURL"/);
  for (const writer of [live, preview]) {
    assert.match(writer, /group: gh-pages-writes/);
    assert.match(writer, /cancel-in-progress: false/);
    assert.match(writer, /permissions:\s*\n\s+contents: write\s*\n\s+actions: read/);
    assert.doesNotMatch(writer, /pull-requests: write/);
    assert.match(writer, /actions\/download-artifact@v8/);
    assert.doesNotMatch(writer, /bundle exec|ruby\/setup-ruby|npm (?:ci|run)/);
  }
  assert.match(pullRequest, /group: preview-pr-/);
  assert.match(pullRequest, /cancel-in-progress: true/);
  assert.match(pullRequest, /baseurl: \/preview\/pr-/);
  assert.match(pullRequest, /artifact_name: preview-pr-/);
  assert.match(push, /group: live-main-build/);
  assert.match(push, /artifact_name: live-site-/);
  assert.match(preview, /github\.paginate\(/);
  assert.match(preview, /path\.dirname\(target\) !== previewsRoot/);
  assert.match(live, /github-pages-deploy-action@[0-9a-f]{40}/);
  assert.match(preview, /git-auto-commit-action@[0-9a-f]{40}/);
  assert.doesNotMatch([live, preview].join("\n"), />>\s*_config\.yaml|Add-Content[^\n]*_config\.yaml/i);
});
