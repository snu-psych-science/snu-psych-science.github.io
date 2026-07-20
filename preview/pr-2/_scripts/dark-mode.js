/*
  Manages light/dark mode and keeps the switch in sync with the active mode.
*/

(() => {
  const storageKey = "dark-mode";
  const resolveDarkMode = (storedValue, prefersDark = false) =>
    storedValue === "true" || storedValue === "false"
      ? storedValue
      : String(prefersDark);

  if (typeof module !== "undefined" && module.exports)
    module.exports = { resolveDarkMode };

  if (typeof window === "undefined" || typeof document === "undefined") return;

  const preference = window.matchMedia?.("(prefers-color-scheme: dark)");
  let storedValue = null;

  try {
    storedValue = window.localStorage.getItem(storageKey);
  } catch (error) {
    console.warn("Unable to read the saved color mode.", error);
  }

  let hasSavedMode = storedValue === "true" || storedValue === "false";
  document.documentElement.dataset.dark = resolveDarkMode(
    storedValue,
    preference?.matches
  );

  const setMode = (isDark, save = false) => {
    const value = String(isDark);
    document.documentElement.dataset.dark = value;

    const toggle = document.querySelector(".dark-toggle");
    if (toggle) toggle.checked = isDark;

    if (!save) return;
    hasSavedMode = true;
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
      console.warn("Unable to save the color mode.", error);
    }
  };

  const onReady = () => {
    const toggle = document.querySelector(".dark-toggle");
    if (!toggle) return;

    toggle.checked = document.documentElement.dataset.dark === "true";
    toggle.addEventListener("input", () => setMode(toggle.checked, true));
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();

  preference?.addEventListener?.("change", (event) => {
    if (!hasSavedMode) setMode(event.matches);
  });
})();
