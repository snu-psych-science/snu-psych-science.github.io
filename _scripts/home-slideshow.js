/*
  Adds a pause control to the decorative home-page slideshow.
*/

(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const onReady = () => {
    const slideshow = document.querySelector("[data-slideshow]");
    const toggle = slideshow?.querySelector(".home-slide-toggle");
    if (!slideshow || !toggle) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setPaused = (paused) => {
      slideshow.toggleAttribute("data-slideshow-paused", paused);
      toggle.toggleAttribute("data-paused", paused);
      toggle.setAttribute(
        "aria-label",
        paused ? "슬라이드 재생" : "슬라이드 일시정지"
      );
    };

    toggle.hidden = false;
    slideshow.setAttribute("data-slideshow-ready", "");
    setPaused(reducedMotion.matches);

    toggle.addEventListener("click", () => {
      setPaused(!slideshow.hasAttribute("data-slideshow-paused"));
    });

    reducedMotion.addEventListener?.("change", (event) => setPaused(event.matches));
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();
})();
