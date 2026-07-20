const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.resolve(__dirname, "..", "_site");
const configuredBaseurl = (process.env.SITE_BASEURL || "").replace(/^\/+|\/+$/g, "");
const baseurl = configuredBaseurl ? `/${configuredBaseurl}` : "";

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });

const pageFiles = () =>
  walk(site).filter(
    (file) => file.endsWith(".html") && /<html\b/i.test(fs.readFileSync(file, "utf8"))
  );

const localTargetExists = (pathname) => {
  let decoded = decodeURIComponent(pathname);
  if (baseurl) {
    if (decoded === baseurl || decoded === `${baseurl}/`) decoded = "/";
    else if (decoded.startsWith(`${baseurl}/`)) decoded = decoded.slice(baseurl.length);
    else return false;
  }

  decoded = decoded.replace(/^\/+/, "");
  const exact = path.join(site, decoded);
  const candidates = [exact];

  if (!path.extname(decoded)) {
    candidates.push(`${exact}.html`, path.join(exact, "index.html"));
  } else if (decoded.endsWith("/")) {
    candidates.push(path.join(exact, "index.html"));
  }

  if (!decoded) candidates.push(path.join(site, "index.html"));
  return candidates.some((candidate) => fs.existsSync(candidate));
};

test("generated internal links resolve to built files", () => {
  assert.ok(fs.existsSync(site), "_site must be built before this test runs");
  const missing = [];

  for (const file of pageFiles()) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");
    const pagePath = `${baseurl}/${relative}`.replaceAll(/\/{2,}/g, "/");
    const base = new URL(pagePath, "https://site.test/");

    for (const match of html.matchAll(/\b(?:href|src|action)=["']([^"']+)["']/gi)) {
      const reference = match[1].replaceAll("&amp;", "&");
      if (!reference || reference.startsWith("#") || reference.startsWith("data:"))
        continue;

      const url = new URL(reference, base);
      if (url.origin !== base.origin) continue;
      if (!localTargetExists(url.pathname)) missing.push(`${relative}: ${reference}`);
    }

    for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
      for (const candidate of match[1].split(",")) {
        const reference = candidate.trim().split(/\s+/)[0];
        if (!reference || reference.startsWith("data:")) continue;
        const url = new URL(reference, base);
        if (url.origin === base.origin && !localTargetExists(url.pathname))
          missing.push(`${relative}: ${reference}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("generated pages satisfy structural contracts", async (t) => {
  assert.ok(fs.existsSync(site), "_site must be built before this test runs");

  for (const file of pageFiles()) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");

    await t.test(relative, () => {
      const isRedirect = /<meta\s+name="robots"\s+content="noindex"/i.test(html);
      if (isRedirect) {
        assert.match(html, /<meta\s+http-equiv="refresh"/i);
        assert.match(html, /<link\s+rel="canonical"/i);
        assert.equal((html.match(/<h1\b/gi) || []).length, 1, "one redirect heading");
        return;
      }

      assert.match(html, /<html\s+lang="ko-KR"/i);
      assert.equal((html.match(/<main\b/gi) || []).length, 1, "one main landmark");
      assert.equal((html.match(/<h1\b/gi) || []).length, 1, "one primary heading");
      assert.doesNotMatch(html, /\bon[a-z]+\s*=/i, "no inline event handlers");

      for (const image of html.match(/<img\b[^>]*>/gis) || [])
        assert.match(image, /\balt\s*=/i, `missing alt: ${image}`);

      const ids = [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      assert.deepEqual([...new Set(duplicateIds)], [], "duplicate ids");
    });
  }
});
