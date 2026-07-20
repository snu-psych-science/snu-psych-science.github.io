/*
  Handles the Google-backed site search component.
*/

(() => {
  const buildSiteSearchUrl = (origin, query) => {
    const url = new URL("https://www.google.com/search");
    const site = new URL(origin).origin;
    url.searchParams.set("q", `site:${site} ${query.trim()}`.trim());
    return url.toString();
  };

  if (typeof module !== "undefined" && module.exports)
    module.exports = { buildSiteSearchUrl };

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const onReady = () => {
    for (const form of document.querySelectorAll("form.site-search")) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = form.elements.q.value.trim();
        if (!query) {
          form.elements.q.focus();
          return;
        }
        window.location.assign(buildSiteSearchUrl(window.location.origin, query));
      });
    }
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();
})();
