/*
  Enhances the responsive site navigation without hiding it when JavaScript is
  unavailable.
*/

(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const onReady = () => {
    const header = document.querySelector("header");
    const toggle = header?.querySelector(".nav-toggle");
    const navigation = header?.querySelector("#site-navigation");
    if (!header || !toggle || !navigation) return;

    const mobile = window.matchMedia("(max-width: 900px)");
    const setOpen = (open, returnFocus = false) => {
      header.toggleAttribute("data-nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      if (returnFocus) toggle.focus();
    };

    header.setAttribute("data-nav-enhanced", "");
    toggle.hidden = false;
    setOpen(false);

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
      if (mobile.matches && event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true")
        setOpen(false, true);
    });

    mobile.addEventListener?.("change", (event) => {
      if (!event.matches) setOpen(false);
    });
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();
})();
