const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseDocument } = require("yaml");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const markdownFiles = (directory) =>
  fs.readdirSync(path.join(root, directory)).filter((name) => name.endsWith(".md"));

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const yamlDocument = (text, label) => {
  const document = parseDocument(text, {
    prettyErrors: true,
    schema: "core",
    strict: true,
    uniqueKeys: true,
  });
  const problems = [...document.errors, ...document.warnings].map(({ message }) => message);
  assert.deepEqual(problems, [], `${label}: invalid YAML`);
  return document.toJS({ maxAliasCount: 100 });
};

const yamlFile = (relativePath) => yamlDocument(read(relativePath), relativePath);

const frontMatter = (relativePath) => {
  const source = read(relativePath).replaceAll("\r\n", "\n");
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(match, `${relativePath}: missing front matter`);
  const data = yamlDocument(match[1], `${relativePath} front matter`);
  assert.ok(isRecord(data), `${relativePath}: front matter must be a mapping`);
  return { data, raw: match[1], body: source.slice(match[0].length) };
};

const assertRecordArray = (value, label) => {
  assert.ok(Array.isArray(value), `${label}: must be a sequence`);
  assert.ok(value.length > 0, `${label}: must not be empty`);
  for (const [index, entry] of value.entries())
    assert.ok(isRecord(entry), `${label}[${index}]: must be a mapping`);
  return value;
};

const assertRequiredStrings = (record, keys, label) => {
  for (const key of keys)
    assert.ok(nonEmptyString(record[key]), `${label}: ${key} must be a non-empty string`);
};

const dateIsValid = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const timeInMinutes = (value, label) => {
  assert.match(value, /^(?:[01]\d|2[0-3]):[0-5]\d$/, label);
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const assertSafeWebUrl = (value, label) => {
  assert.ok(nonEmptyString(value), `${label}: URL`);
  let url;
  assert.doesNotThrow(() => {
    url = new URL(value);
  }, `${label}: valid URL`);
  assert.ok(["http:", "https:"].includes(url.protocol), `${label}: HTTP(S) URL`);
  assert.equal(url.username, "", `${label}: URL must not include credentials`);
  assert.equal(url.password, "", `${label}: URL must not include credentials`);
  return url;
};

const localPath = (reference, label) => {
  assert.ok(nonEmptyString(reference), `${label}: local reference`);
  assert.match(reference, /^\//, `${label}: root-relative reference`);
  assert.doesNotMatch(reference, /\\/, `${label}: URL-style separators`);
  const pathname = reference.split(/[?#]/, 1)[0];
  let decoded;
  assert.doesNotThrow(() => {
    decoded = decodeURIComponent(pathname);
  }, `${label}: URL encoding`);
  const target = path.resolve(root, decoded.replace(/^\/+/, ""));
  const rootPrefix = `${root}${path.sep}`.toLowerCase();
  assert.ok(
    target.toLowerCase().startsWith(rootPrefix),
    `${label}: reference must stay inside the repository`
  );
  return target;
};

const assertLocalFile = (reference, label) => {
  const target = localPath(reference, label);
  assert.ok(fs.existsSync(target), `${label}: missing ${reference}`);
};

const assertReference = (reference, label) => {
  if (reference.startsWith("/")) assertLocalFile(reference, label);
  else assertSafeWebUrl(reference, label);
};

const assertPositiveInteger = (value, label) => {
  assert.ok(Number.isInteger(value) && value > 0, `${label}: positive integer`);
};

const assertImageMetadata = (record, imageKey, label) => {
  if (!record[imageKey]) return;
  assertLocalFile(record[imageKey], `${label}: ${imageKey}`);
  const widthKey = `${imageKey}_width`;
  const heightKey = `${imageKey}_height`;
  if (record[widthKey] === undefined && record[heightKey] === undefined) return;
  assertPositiveInteger(record[widthKey], `${label}: ${widthKey}`);
  assertPositiveInteger(record[heightKey], `${label}: ${heightKey}`);
};

const assertPermalink = (value, prefix, label) => {
  assert.ok(nonEmptyString(value), `${label}: permalink`);
  assert.ok(value.startsWith(prefix), `${label}: permalink must start with ${prefix}`);
  assert.match(value, /^\/[^?#\\]*\/$/, `${label}: canonical directory permalink`);
  assert.doesNotMatch(value, /\/{2,}|\.\./, `${label}: safe permalink`);
};

const assertAttachments = (value, label, { requireTitle = false } = {}) => {
  if (value === undefined) return;
  const attachments = assertRecordArray(value, `${label}: attachments`);
  for (const [index, attachment] of attachments.entries()) {
    const attachmentLabel = `${label}: attachments[${index}]`;
    if (requireTitle)
      assert.ok(nonEmptyString(attachment.title), `${attachmentLabel}: title`);
    assert.ok(nonEmptyString(attachment.url), `${attachmentLabel}: url`);
    assertReference(attachment.url, `${attachmentLabel}: url`);
  }
};

test("events use one canonical, valid metadata schema", () => {
  const names = markdownFiles("_events");
  assert.ok(names.length > 0, "_events must not be empty");
  const permalinks = new Set();

  for (const name of names) {
    const relative = `_events/${name}`;
    const { data, raw, body } = frontMatter(relative);
    assertRequiredStrings(data, ["title", "date", "speaker", "summary", "permalink"], relative);
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.equal(name.slice(0, 10), data.date, `${relative}: filename date`);
    assertPermalink(data.permalink, "/events/", relative);
    assert.equal(permalinks.has(data.permalink), false, `${relative}: duplicate permalink`);
    permalinks.add(data.permalink);

    assert.doesNotMatch(raw, /^event_date:/m, `${relative}: duplicate date field`);
    assert.doesNotMatch(body, /^#\s+/m, `${relative}: layout owns the h1`);
    assert.doesNotMatch(body, /class=["']event-info["']/, `${relative}: layout owns metadata`);

    const start = data.start_time
      ? timeInMinutes(data.start_time, `${relative}: start_time`)
      : undefined;
    const end = data.end_time
      ? timeInMinutes(data.end_time, `${relative}: end_time`)
      : undefined;
    if (start !== undefined && end !== undefined)
      assert.ok(end >= start, `${relative}: end_time must not precede start_time`);

    assertImageMetadata(data, "image", relative);
    if (data.attachment) assertReference(data.attachment, `${relative}: attachment`);
    assertAttachments(data.attachments, relative);
  }
});

test("newsletters reference existing PDFs and thumbnails without repeated layout content", () => {
  const names = markdownFiles("_newsletters");
  assert.ok(names.length > 0, "_newsletters must not be empty");
  const permalinks = new Set();

  for (const name of names) {
    const relative = `_newsletters/${name}`;
    const { data, body } = frontMatter(relative);
    assertRequiredStrings(
      data,
      ["title", "date", "volume", "summary", "image", "pdf", "permalink"],
      relative
    );
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.equal(name.slice(0, 10), data.date, `${relative}: filename date`);
    assertPermalink(data.permalink, "/newsletters/", relative);
    assert.equal(permalinks.has(data.permalink), false, `${relative}: duplicate permalink`);
    permalinks.add(data.permalink);
    assertImageMetadata(data, "image", relative);
    assertLocalFile(data.pdf, `${relative}: pdf`);
    assert.doesNotMatch(body, /^#\s+/m, `${relative}: layout owns the h1`);
  }
});

test("notices have valid metadata and safe attachment records", () => {
  const names = markdownFiles("_notices");
  assert.ok(names.length > 0, "_notices must not be empty");
  const permalinks = new Set();

  for (const name of names) {
    const relative = `_notices/${name}`;
    const { data, raw } = frontMatter(relative);
    assertRequiredStrings(data, ["title", "date", "category"], relative);
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.equal(name.slice(0, 10), data.date, `${relative}: filename date`);
    assert.doesNotMatch(raw, /^layout:/m, `${relative}: collection default owns layout`);
    const permalink = data.permalink || `/notices/${name.slice(0, -3)}/`;
    assertPermalink(permalink, "/notices/", relative);
    assert.equal(permalinks.has(permalink), false, `${relative}: duplicate permalink`);
    permalinks.add(permalink);
    assertAttachments(data.attachments, relative, { requireTitle: true });
  }
});

test("members are unique, ordered, and separate faculty profiles from lab homepages", () => {
  const members = assertRecordArray(yamlFile("_data/members.yaml"), "_data/members.yaml");
  assert.deepEqual(
    members.map(({ order }) => order),
    members.map((_, index) => index + 1),
    "member order"
  );

  const ids = new Set();
  const names = new Set();
  const facultyUrls = new Set();
  for (const member of members) {
    const label = member.name || member.id || "member";
    assertRequiredStrings(
      member,
      ["id", "name", "role", "group", "research_area", "faculty_url", "lab_label"],
      label
    );
    assert.match(member.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${label}: stable id`);
    assert.equal(ids.has(member.id), false, `${label}: duplicate id`);
    assert.equal(names.has(member.name), false, `${label}: duplicate name`);
    ids.add(member.id);
    names.add(member.name);
    assert.equal(typeof member.active, "boolean", `${label}: active boolean`);

    const facultyUrl = assertSafeWebUrl(member.faculty_url, `${label}: faculty URL`);
    assert.equal(facultyUrl.hostname, "psych.snu.ac.kr", `${label}: official faculty host`);
    assert.equal(facultyUrl.pathname, "/bbs/board.php", `${label}: faculty page path`);
    assert.equal(facultyUrl.searchParams.get("tbl"), "bbs21", `${label}: faculty board`);
    assert.equal(facultyUrl.searchParams.get("mode"), "VIEW", `${label}: faculty view mode`);
    assert.match(facultyUrl.searchParams.get("num") || "", /^\d+$/, `${label}: faculty record`);
    assert.equal(facultyUrls.has(member.faculty_url), false, `${label}: duplicate faculty URL`);
    facultyUrls.add(member.faculty_url);

    if (member.lab_url) {
      const labUrl = assertSafeWebUrl(member.lab_url, `${label}: lab URL`);
      const pathParts = labUrl.pathname.split("/").filter(Boolean);
      const isGoogleSiteRoot =
        labUrl.hostname === "sites.google.com" &&
        pathParts.length === 2 &&
        pathParts[0] === "view";
      assert.ok(pathParts.length === 0 || isGoogleSiteRoot, `${label}: lab homepage root`);
    }

    if (member.email)
      assert.match(member.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/, `${label}: email`);
    assert.equal(member.profile_url, undefined, `${label}: legacy profile URL`);
    assert.equal(member.profile_label, undefined, `${label}: legacy profile label`);
    assertImageMetadata(member, "image", label);
    assertImageMetadata(member, "profile_image", label);
  }

  assert.equal(
    members.filter(({ group }) => group === "director").length,
    1,
    "exactly one director"
  );
});

test("navigation has unique routes and complete ordered records", () => {
  const navigation = assertRecordArray(yamlFile("_data/navigation.yaml"), "_data/navigation.yaml");
  assert.deepEqual(
    navigation.map(({ order }) => order),
    navigation.map((_, index) => index + 1),
    "navigation order"
  );

  const routes = new Set();
  const visit = (item, label) => {
    assertRequiredStrings(item, ["title", "url"], label);
    assertPermalink(item.url, "/", label);
    assert.equal(routes.has(item.url), false, `${label}: duplicate route`);
    routes.add(item.url);
    if (item.icon !== undefined)
      assert.ok(nonEmptyString(item.icon), `${label}: icon must be a non-empty string`);
    if (item.description !== undefined)
      assert.ok(
        nonEmptyString(item.description),
        `${label}: description must be a non-empty string`
      );
    if (item.children !== undefined) {
      const children = assertRecordArray(item.children, `${label}: children`);
      for (const [index, child] of children.entries())
        visit(child, `${label}: children[${index}]`);
    }
  };

  for (const [index, item] of navigation.entries())
    visit(item, `_data/navigation.yaml[${index}]`);
});

test("home slides and publications have valid data references", () => {
  const home = yamlFile("_data/home.yaml");
  assert.ok(isRecord(home), "_data/home.yaml: mapping");
  const slides = assertRecordArray(home.slides, "_data/home.yaml: slides");
  assert.ok(slides.length > 1, "home slides");
  const slideImages = new Set();
  for (const [index, slide] of slides.entries()) {
    const label = `_data/home.yaml: slides[${index}]`;
    assertRequiredStrings(slide, ["image", "position"], label);
    assertLocalFile(slide.image, `${label}: image`);
    assert.equal(slideImages.has(slide.image), false, `${label}: duplicate image`);
    slideImages.add(slide.image);
  }

  const publications = assertRecordArray(
    yamlFile("_data/psi_publications.yaml"),
    "_data/psi_publications.yaml"
  );
  const identities = new Set();
  const links = new Set();
  let previousYear = Number.POSITIVE_INFINITY;

  for (const [index, publication] of publications.entries()) {
    const label = `_data/psi_publications.yaml[${index}]`;
    assertRequiredStrings(publication, ["year", "type", "title", "citation"], label);
    assert.match(String(publication.year), /^(?:\d{4}|In press)$/, `${label}: year`);
    const currentYear =
      publication.year === "In press" ? Number.POSITIVE_INFINITY : Number(publication.year);
    assert.ok(currentYear <= previousYear, `${label}: descending year order`);
    previousYear = currentYear;

    const identity = `${publication.year}\u0000${publication.title.trim().toLowerCase()}`;
    assert.equal(identities.has(identity), false, `${label}: duplicate publication`);
    identities.add(identity);

    const hasLink = publication.link !== undefined;
    const hasLabel = publication.link_label !== undefined;
    assert.equal(hasLink, hasLabel, `${label}: link and link_label must appear together`);
    if (hasLink) {
      assert.ok(nonEmptyString(publication.link_label), `${label}: link_label`);
      const publicationUrl = assertSafeWebUrl(publication.link, `${label}: link`);
      assert.equal(links.has(publication.link), false, `${label}: duplicate link`);
      links.add(publication.link);
      if (publication.link_label === "DOI") {
        assert.equal(publicationUrl.hostname, "doi.org", `${label}: DOI host`);
        assert.match(publicationUrl.pathname, /^\/10\./, `${label}: DOI path`);
      }
    }
  }
});
