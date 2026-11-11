/* Show the home announcement once per tab visit, with a Korea-day dismissal. */
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const onReady = () => {
    const dialog = document.querySelector("#event-announcement");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const expiresAt = Date.parse(dialog.dataset.expiresAt);
    const key = `ips:announcement:${dialog.dataset.eventKey}`;
    const today = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const readStorage = (storage, name) => {
      try { return window[storage].getItem(name); } catch { return null; }
    };
    const writeStorage = (storage, name, value) => {
      try { window[storage].setItem(name, value); } catch { /* Storage may be disabled. */ }
    };

    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt ||
        readStorage("sessionStorage", key) === "seen" ||
        readStorage("localStorage", `${key}:hidden-day`) === today()) return;

    let expiryTimer;
    const release = () => {
      window.clearTimeout(expiryTimer);
      document.documentElement.classList.remove("has-event-announcement");
    };
    const close = () => {
      if (dialog.open) dialog.close();
      // Unlock immediately before navigation can freeze this page in the back cache.
      release();
    };
    const checkExpiry = () => {
      window.clearTimeout(expiryTimer);
      if (!dialog.open) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) close();
      else expiryTimer = window.setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    };

    dialog.querySelector("[data-close-announcement]").addEventListener("click", close);
    dialog.querySelector("[data-hide-today]").addEventListener("click", () => {
      writeStorage("localStorage", `${key}:hidden-day`, today());
      close();
    });
    // Keep browser navigation native, including keyboard and modified clicks.
    dialog.querySelector(".event-announcement__body").addEventListener("click", close);
    dialog.addEventListener("close", release);
    window.addEventListener("pagehide", close);
    window.addEventListener("pageshow", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);

    dialog.showModal();
    document.documentElement.classList.add("has-event-announcement");
    writeStorage("sessionStorage", key, "seen");
    checkExpiry();
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();
})();
