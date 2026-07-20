/*
  Filters elements on a page from the URL or page-search controls.
  Syntax: term1 term2 "full phrase" "tag: tag name"
*/

(() => {
  const elementSelector = ".card, .citation, .post-excerpt";
  const searchBoxSelector = ".search-box";
  const infoBoxSelector = ".search-info";
  const tagSelector = ".tag";

  const normalizeTag = (tag) =>
    tag.trim().toLowerCase().replaceAll(/\s+/g, "-");

  const splitQuery = (query) => {
    const parts = query.match(/"[^"]*"|\S+/g) || [];
    const terms = [];
    const phrases = [];
    const tags = [];

    for (let part of parts) {
      if (part.startsWith('"')) {
        part = part.replaceAll('"', "").trim();
        if (part.startsWith("tag:"))
          tags.push(normalizeTag(part.replace(/tag:\s*/, "")));
        else if (part) phrases.push(part.toLowerCase());
      } else terms.push(part.toLowerCase());
    }

    return { terms, phrases, tags };
  };

  if (typeof module !== "undefined" && module.exports)
    module.exports = { normalizeTag, splitQuery };

  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.normalizeTag = normalizeTag;

  const getAttr = (element, attr) =>
    [element, ...element.querySelectorAll(`[data-${attr}]`)]
      .map((child) => child.dataset[attr] || "")
      .join(" ");

  const elementMatches = (element, { terms, phrases, tags }) => {
    const tagElements = [...element.querySelectorAll(tagSelector)];
    const searchableText = (
      element.innerText +
      getAttr(element, "tooltip") +
      getAttr(element, "search")
    ).toLowerCase();
    const hasText = (string) => searchableText.includes(string);
    const hasTag = (string) =>
      tagElements.some((tag) => normalizeTag(tag.innerText) === string);

    return (
      (!terms.length || terms.every(hasText)) &&
      (!phrases.length || phrases.some(hasText)) &&
      (!tags.length || tags.some(hasTag))
    );
  };

  const filterElements = (parts) => {
    const elements = document.querySelectorAll(elementSelector);
    let matches = 0;

    for (const element of elements) {
      const match = elementMatches(element, parts);
      element.hidden = !match;
      if (match) matches++;
    }

    return [matches, elements.length];
  };

  const highlightMatches = ({ terms, phrases }) => {
    if (typeof Mark === "undefined") return;

    new Mark(document.body).unmark({
      done: () => {
        let counter = 0;
        const filter = () => counter++ < 100;
        new Mark(elementSelector)
          .mark(terms, { separateWordSearch: true, filter })
          .mark(phrases, { separateWordSearch: false, filter });
      },
    });
  };

  const updateSearchBoxes = (query = "") => {
    for (const box of document.querySelectorAll(searchBoxSelector)) {
      const input = box.querySelector("input");
      const button = box.querySelector("[data-search-clear]");
      const icon = button?.querySelector("i");
      if (!input || !button) continue;

      input.value = query;
      button.disabled = !query.length;
      if (icon)
        icon.className = query.length
          ? "icon fa-solid fa-xmark"
          : "icon fa-solid fa-magnifying-glass";
    }
  };

  const clearSearchUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("search");
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const updateInfoBoxes = (query, matches, total) => {
    for (const box of document.querySelectorAll(infoBoxSelector)) {
      box.replaceChildren();
      box.hidden = !query.trim();
      if (box.hidden) continue;

      const count = document.createElement("span");
      count.textContent = `총 ${total.toLocaleString()}개 중 ${matches.toLocaleString()}개 결과 표시`;
      const clear = document.createElement("a");
      clear.href = clearSearchUrl();
      clear.textContent = "검색 지우기";
      box.append(count, document.createElement("br"), clear);
    }
  };

  const updateTags = (query) => {
    const { tags } = splitQuery(query);
    document.querySelectorAll(tagSelector).forEach((tag) => {
      tag.toggleAttribute("data-active", tags.includes(normalizeTag(tag.innerText)));
    });
  };

  const runSearch = (query = "") => {
    const parts = splitQuery(query);
    const [matches, total] = filterElements(parts);
    updateSearchBoxes(query);
    updateInfoBoxes(query, matches, total);
    updateTags(query);
    highlightMatches(parts);
  };

  const updateUrl = (query = "") => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url);
  };

  const searchFromUrl = () => {
    const query = new URLSearchParams(window.location.search).get("search") || "";
    runSearch(query);
  };

  const debounce = (callback, delay = 250) => {
    let timeout;
    return (...args) => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => callback(...args), delay);
    };
  };

  const debouncedRunSearch = debounce(runSearch, 300);
  const attachSearchBox = (box) => {
    if (box.hasAttribute("data-search-ready")) return;
    const input = box.querySelector("input");
    const button = box.querySelector("[data-search-clear]");
    if (!input || !button) return;

    box.setAttribute("data-search-ready", "");
    input.addEventListener("input", () => {
      updateUrl(input.value);
      debouncedRunSearch(input.value);
    });
    button.addEventListener("click", () => {
      runSearch();
      updateUrl();
      input.focus();
    });
  };

  const onReady = () => {
    document.querySelectorAll(searchBoxSelector).forEach(attachSearchBox);
    searchFromUrl();
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();

  window.addEventListener("tagsfetched", searchFromUrl);
})();
