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

const routeForFile = (file) => {
  const relative = path.relative(site, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative}`;
};

const decodeEntities = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const localTargetCandidates = (pathname) => {
  let decoded = decodeURIComponent(pathname);
  if (baseurl) {
    if (decoded === baseurl || decoded === `${baseurl}/`) decoded = "/";
    else if (decoded.startsWith(`${baseurl}/`)) decoded = decoded.slice(baseurl.length);
    else return [];
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
  return candidates;
};

const localTargetExists = (pathname) =>
  localTargetCandidates(pathname).some((candidate) => fs.existsSync(candidate));

const htmlIds = new Map();
const idsForFile = (file) => {
  if (!htmlIds.has(file)) {
    const html = fs.readFileSync(file, "utf8");
    htmlIds.set(
      file,
      new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => decodeEntities(match[1])))
    );
  }
  return htmlIds.get(file);
};

test("generated internal links resolve to built files", () => {
  assert.ok(fs.existsSync(site), "_site must be built before this test runs");
  const missing = [];
  const missingFragments = [];

  for (const file of pageFiles()) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");
    const pagePath = `${baseurl}/${relative}`.replaceAll(/\/{2,}/g, "/");
    const base = new URL(pagePath, "https://site.test/");

    for (const match of html.matchAll(/\b(?:href|src|action)=["']([^"']+)["']/gi)) {
      const reference = match[1].replaceAll("&amp;", "&");
      if (!reference || reference.startsWith("data:")) continue;

      const url = new URL(reference, base);
      if (url.origin !== base.origin) continue;
      const candidates = localTargetCandidates(url.pathname);
      if (!candidates.some((candidate) => fs.existsSync(candidate))) {
        missing.push(`${relative}: ${reference}`);
        continue;
      }

      if (url.hash) {
        const targetFile = candidates.find(
          (candidate) => candidate.endsWith(".html") && fs.existsSync(candidate)
        );
        const fragment = decodeURIComponent(url.hash.slice(1));
        if (targetFile && !idsForFile(targetFile).has(fragment))
          missingFragments.push(`${relative}: ${reference}`);
      }
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
  assert.deepEqual(missingFragments, []);
});

test("generated routes exactly match the pre-refactor snapshot", () => {
  const expected = fs
    .readFileSync(path.join(__dirname, "fixtures", "routes.txt"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  const actual = walk(site)
    .filter((file) => file.endsWith(".html"))
    .map(routeForFile)
    .sort();
  assert.deepEqual(actual, expected);
});

test("generated site omits development-only files", () => {
  const excluded = [
    ".github",
    ".node-version",
    "Gemfile",
    "Gemfile.lock",
    "LICENSE.md",
    "README.md",
    "node_modules",
    "package.json",
    "package-lock.json",
    "tests",
    "tmp",
    "vendor",
  ];

  assert.deepEqual(
    excluded.filter((entry) => fs.existsSync(path.join(site, entry))),
    []
  );
});

test("generated CSS references are baseurl-safe and resolvable", () => {
  const missing = [];
  const rootLeaks = [];
  for (const file of walk(site).filter((candidate) => candidate.endsWith(".css"))) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const css = fs.readFileSync(file, "utf8");
    const cssUrl = new URL(`${baseurl}/${relative}`.replaceAll(/\/{2,}/g, "/"), "https://site.test/");
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      const reference = match[1].trim();
      if (!reference || /^(?:data:|https?:|#|var\()/i.test(reference)) continue;
      const url = new URL(reference, cssUrl);
      if (baseurl && url.pathname.startsWith("/") && !url.pathname.startsWith(`${baseurl}/`))
        rootLeaks.push(`${relative}: ${reference}`);
      if (!localTargetExists(url.pathname)) missing.push(`${relative}: ${reference}`);
    }
  }
  assert.deepEqual(rootLeaks, []);
  assert.deepEqual(missing, []);
});

test("generated pages satisfy structural contracts", async (t) => {
  assert.ok(fs.existsSync(site), "_site must be built before this test runs");

  for (const file of pageFiles()) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");

    await t.test(relative, () => {
      const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
      assert.ok(canonical, "canonical URL");
      const canonicalUrl = new URL(decodeEntities(canonical));
      assert.equal(canonicalUrl.hostname, "snu-psych-science.github.io");

      const isRedirect = /<meta\s+name="robots"\s+content="noindex"/i.test(html);
      if (isRedirect) {
        assert.match(html, /<meta\s+http-equiv="refresh"/i);
        assert.equal((html.match(/<h1\b/gi) || []).length, 1, "one redirect heading");
        assert.ok(localTargetExists(canonicalUrl.pathname), "redirect canonical target exists");
        const refreshTarget = html.match(
          /<meta\s+http-equiv="refresh"\s+content="[^"]*url=([^"]+)"/i
        )?.[1];
        assert.ok(refreshTarget, "redirect refresh target");
        assert.equal(
          new URL(decodeEntities(refreshTarget), canonicalUrl).href,
          canonicalUrl.href,
          "refresh and canonical targets agree"
        );
        return;
      }

      assert.match(html, /<html\s+lang="ko-KR"/i);
      assert.equal((html.match(/<main\b/gi) || []).length, 1, "one main landmark");
      assert.equal((html.match(/<h1\b/gi) || []).length, 1, "one primary heading");
      assert.doesNotMatch(html, /\bon[a-z]+\s*=/i, "no inline event handlers");

      const expectedPath = `${baseurl}${routeForFile(file)}`.replaceAll(/\/{2,}/g, "/");
      assert.equal(decodeURIComponent(canonicalUrl.pathname), expectedPath, "canonical path");

      for (const image of html.match(/<img\b[^>]*>/gis) || []) {
        assert.match(image, /\balt\s*=/i, `missing alt: ${image}`);
        assert.match(image, /\bwidth\s*=\s*["']\d+["']/i, `missing image width: ${image}`);
        assert.match(image, /\bheight\s*=\s*["']\d+["']/i, `missing image height: ${image}`);
      }

      for (const frame of html.match(/<iframe\b[^>]*>/gis) || [])
        assert.match(frame, /\btitle\s*=\s*["'][^"']+["']/i, `missing iframe title: ${frame}`);

      for (const link of html.match(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gis) || [])
        assert.match(link, /\brel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i, `unsafe target blank: ${link}`);

      for (const script of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
        const data = JSON.parse(decodeEntities(script[1].trim()));
        assert.equal(data["@context"], "https://schema.org", "JSON-LD context");
        assert.ok(data["@type"], "JSON-LD type");
        assert.ok(data.name || data.headline, "JSON-LD name or headline");
        assert.ok(data.url || data.mainEntityOfPage, "JSON-LD URL");
      }

      const ids = [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      assert.deepEqual([...new Set(duplicateIds)], [], "duplicate ids");
    });
  }
});

test("ordinary pages request one local compiled stylesheet", async (t) => {
  for (const file of pageFiles()) {
    const relative = path.relative(site, file).replaceAll(path.sep, "/");
    const html = fs.readFileSync(file, "utf8");
    if (/<meta\s+name="robots"\s+content="noindex"/i.test(html)) continue;
    await t.test(relative, () => {
      const localStyles = (html.match(/<link\b[^>]*>/gi) || [])
        .filter((tag) => /\brel="stylesheet"/i.test(tag))
        .map((tag) => tag.match(/\bhref="([^"]+)"/i)?.[1])
        .filter(Boolean)
        .filter((reference) => !/^https?:/i.test(reference));
      assert.deepEqual(localStyles, [`${baseurl}/assets/css/main.css`]);
    });
  }
});
