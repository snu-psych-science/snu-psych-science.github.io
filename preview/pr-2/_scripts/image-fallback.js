/*
  Replaces failed images with the fallback declared by data-fallback-src.
*/

(() => {
  const applyImageFallback = (image) => {
    const fallback = image?.dataset?.fallbackSrc?.trim();
    if (!fallback) return false;

    image.removeAttribute("data-fallback-src");
    image.src = fallback;
    return true;
  };

  if (typeof module !== "undefined" && module.exports)
    module.exports = { applyImageFallback };

  if (typeof document === "undefined") return;

  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (image?.matches?.("img[data-fallback-src]")) applyImageFallback(image);
    },
    true
  );
})();
