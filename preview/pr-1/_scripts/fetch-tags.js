/*
  Fetches GitHub topics for tag rows that declare data-repo and data-link.
*/

(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const headers = new Headers({ Accept: "application/vnd.github+json" });

  const fetchTags = async (repo) => {
    const repoPath = repo
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const url = `https://api.github.com/repos/${repoPath}/topics`;

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const body = await response.json();
      return Array.isArray(body.names) ? body.names : [];
    } catch (error) {
      console.warn("Unable to fetch GitHub topics.", error);
      return [];
    }
  };

  const buildTagUrl = (link, tag) => {
    const url = new URL(link, window.location.href);
    url.searchParams.set("search", `"tag: ${tag}"`);
    return url.toString();
  };

  const onLoad = async () => {
    const normalizeTag =
      window.normalizeTag || ((tag) => tag.trim().toLowerCase().replaceAll(/\s+/g, "-"));

    for (const row of document.querySelectorAll("[data-repo]")) {
      const repo = row.dataset.repo?.trim();
      const link = row.dataset.link?.trim() || window.location.pathname;
      if (!repo) continue;

      const existing = new Set(
        [...row.querySelectorAll(".tag")].map((tag) => normalizeTag(tag.innerText))
      );
      const tags = (await fetchTags(repo)).filter(
        (tag) => !existing.has(normalizeTag(tag))
      );

      for (const tag of tags) {
        const anchor = document.createElement("a");
        anchor.classList.add("tag");
        anchor.textContent = tag;
        anchor.href = buildTagUrl(link, tag);
        anchor.dataset.tooltip = `“${tag}” 태그 항목 보기`;
        row.append(anchor);
      }

      if (!row.textContent.trim()) row.remove();
    }

    window.dispatchEvent(new Event("tagsfetched"));
  };

  window.addEventListener("load", onLoad, { once: true });
})();
