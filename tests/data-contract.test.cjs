const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const files = (directory) =>
  fs.readdirSync(path.join(root, directory)).filter((name) => name.endsWith(".md"));

const scalar = (value) => {
  const trimmed = value.trim();
  if (/^(["']).*\1$/.test(trimmed)) return trimmed.slice(1, -1);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
};

const mapping = (text, indent = 0) => {
  const record = {};
  const prefix = " ".repeat(indent);
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(new RegExp(`^${prefix}([A-Za-z_][\\w-]*):(?:\\s*(.*))?$`));
    if (!match) continue;
    const [, key, raw = ""] = match;
    if (/^[>|]/.test(raw.trim())) {
      const continuation = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        index += 1;
        continuation.push(lines[index].trim());
      }
      record[key] = continuation.join(" ").trim();
    } else if (raw.trim()) record[key] = scalar(raw);
  }
  return record;
};

const sequence = (text, indent = 0) => {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const marker = new RegExp(`^${" ".repeat(indent)}-\\s+`);
  const records = [];
  let start = -1;
  for (let index = 0; index <= lines.length; index += 1) {
    if (index < lines.length && marker.test(lines[index])) {
      if (start >= 0) records.push(mapping(lines.slice(start, index).join("\n"), indent + 2));
      start = index;
      lines[index] = lines[index].replace(marker, " ".repeat(indent + 2));
    }
  }
  if (start >= 0) records.push(mapping(lines.slice(start).join("\n"), indent + 2));
  return records;
};

const nestedSequence = (text, key) => {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return [];
  let end = start + 1;
  while (end < lines.length && (!lines[end].trim() || /^\s+/.test(lines[end]))) end += 1;
  return sequence(lines.slice(start + 1, end).join("\n"), 2);
};

const frontMatter = (relativePath) => {
  const source = read(relativePath).replaceAll("\r\n", "\n");
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(match, `${relativePath}: missing front matter`);
  return { data: mapping(match[1]), raw: match[1], body: source.slice(match[0].length) };
};

const dateIsValid = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const localFileExists = (reference) => {
  if (!reference || /^(?:[a-z]+:|#)/i.test(reference)) return true;
  const pathname = reference.split(/[?#]/, 1)[0].replace(/^\/+/, "");
  return fs.existsSync(path.join(root, decodeURIComponent(pathname)));
};

test("events use one canonical, valid metadata schema", () => {
  const permalinks = new Map();
  for (const name of files("_events")) {
    const relative = `_events/${name}`;
    const { data, raw, body } = frontMatter(relative);
    assert.ok(data.title, `${relative}: title`);
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.doesNotMatch(raw, /^event_date:/m, `${relative}: duplicate date field`);
    assert.doesNotMatch(body, /^#\s+/m, `${relative}: layout owns the h1`);
    assert.doesNotMatch(body, /class=["']event-info["']/, `${relative}: layout owns metadata`);
    for (const key of ["start_time", "end_time"])
      if (data[key]) assert.match(data[key], /^(?:[01]\d|2[0-3]):[0-5]\d$/, `${relative}: ${key}`);
    for (const key of ["image", "attachment"])
      if (data[key]) assert.ok(localFileExists(data[key]), `${relative}: missing ${data[key]}`);
    for (const attachment of nestedSequence(raw, "attachments")) {
      assert.ok(attachment.url, `${relative}: attachment url`);
      assert.ok(localFileExists(attachment.url), `${relative}: missing ${attachment.url}`);
    }
    if (data.permalink) {
      assert.equal(permalinks.has(data.permalink), false, `${relative}: duplicate permalink`);
      permalinks.set(data.permalink, relative);
    }
  }
});

test("newsletters reference existing PDFs and thumbnails without repeated layout content", () => {
  const permalinks = new Set();
  for (const name of files("_newsletters")) {
    const relative = `_newsletters/${name}`;
    const { data, body } = frontMatter(relative);
    for (const key of ["title", "date", "image", "pdf"])
      assert.ok(data[key], `${relative}: ${key}`);
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.ok(localFileExists(data.pdf), `${relative}: missing ${data.pdf}`);
    if (data.image) assert.ok(localFileExists(data.image), `${relative}: missing ${data.image}`);
    assert.doesNotMatch(body, /^#\s+/m, `${relative}: layout owns the h1`);
    assert.equal(permalinks.has(data.permalink), false, `${relative}: duplicate permalink`);
    permalinks.add(data.permalink);
  }
});

test("notices have valid metadata and safe attachment records", () => {
  const permalinks = new Set();
  for (const name of files("_notices")) {
    const relative = `_notices/${name}`;
    const { data, raw } = frontMatter(relative);
    assert.ok(data.title, `${relative}: title`);
    assert.ok(dateIsValid(data.date), `${relative}: date`);
    assert.doesNotMatch(raw, /^layout:/m, `${relative}: collection default owns layout`);
    const permalink = data.permalink || `/notices/${name.slice(0, -3)}/`;
    assert.equal(permalinks.has(permalink), false, `${relative}: duplicate permalink`);
    permalinks.add(permalink);
    for (const attachment of nestedSequence(raw, "attachments")) {
      assert.ok(attachment.title, `${relative}: attachment title`);
      assert.ok(attachment.url, `${relative}: attachment url`);
      assert.ok(localFileExists(attachment.url), `${relative}: missing ${attachment.url}`);
    }
  }
});

test("members are unique, ordered, and use valid optional references", () => {
  const members = sequence(read("_data/members.yaml"));
  assert.ok(members.length > 0);
  assert.equal(new Set(members.map(({ name }) => name)).size, members.length, "duplicate member");
  assert.deepEqual(members.map(({ order }) => order), members.map((_, index) => index + 1));
  for (const member of members) {
    assert.ok(member.name, "member name");
    assert.ok(member.role, `${member.name}: role`);
    if (member.profile_url) assert.doesNotThrow(() => new URL(member.profile_url), `${member.name}: URL`);
    for (const key of ["image", "profile_image"])
      if (member[key]) assert.ok(localFileExists(member[key]), `${member.name}: missing ${member[key]}`);
  }
});

test("navigation has unique order and complete top-level records", () => {
  const navigation = sequence(read("_data/navigation.yaml"));
  assert.ok(navigation.length > 0);
  for (const item of navigation) {
    assert.ok(item.title, "navigation title");
    assert.match(item.url, /^\//, `${item.title}: internal URL`);
    assert.ok(Number.isInteger(item.order), `${item.title}: order`);
  }
  assert.equal(new Set(navigation.map(({ order }) => order)).size, navigation.length, "duplicate order");
});

test("home slides and publications have valid data references", () => {
  const slides = sequence(read("_data/home.yaml"), 2);
  assert.ok(slides.length > 1, "home slides");
  for (const slide of slides)
    assert.ok(localFileExists(slide.image), `missing home slide ${slide.image}`);

  const publications = sequence(read("_data/psi_publications.yaml"));
  assert.ok(publications.length > 0);
  for (const publication of publications) {
    for (const key of ["year", "title", "citation"])
      assert.ok(publication[key], `publication ${key}`);
    assert.match(String(publication.year), /^\d{4}$/, `${publication.title}: year`);
    if (publication.link) {
      assert.doesNotThrow(() => new URL(publication.link), `${publication.title}: link`);
      if (publication.link_label === "DOI")
        assert.equal(new URL(publication.link).hostname, "doi.org", `${publication.title}: DOI label`);
    }
  }
});
