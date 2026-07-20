/* Progressive, dependency-free tooltips for hover and keyboard focus. */

(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const tooltipId = "site-tooltip";
  const describedBy = new WeakMap();
  let tooltip;
  let activeReference;

  const hide = () => {
    if (!activeReference || !tooltip) return;
    const original = describedBy.get(activeReference);
    if (original) activeReference.setAttribute("aria-describedby", original);
    else activeReference.removeAttribute("aria-describedby");
    tooltip.hidden = true;
    activeReference = undefined;
  };

  const position = (reference) => {
    const referenceBox = reference.getBoundingClientRect();
    const tooltipBox = tooltip.getBoundingClientRect();
    const gap = 10;
    const left = Math.min(
      window.innerWidth - tooltipBox.width - gap,
      Math.max(gap, referenceBox.left + referenceBox.width / 2 - tooltipBox.width / 2)
    );
    const above = referenceBox.top - tooltipBox.height - gap;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${above >= gap ? above : referenceBox.bottom + gap}px`;
  };

  const show = (reference) => {
    const content = reference.dataset.tooltip?.trim();
    if (!content) return;
    hide();
    activeReference = reference;
    describedBy.set(reference, reference.getAttribute("aria-describedby"));
    reference.setAttribute("aria-describedby", tooltipId);
    tooltip.textContent = content;
    tooltip.hidden = false;
    position(reference);
  };

  const onReady = () => {
    tooltip = document.createElement("div");
    tooltip.id = tooltipId;
    tooltip.className = "tooltip-popup";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    document.body.append(tooltip);

    for (const reference of document.querySelectorAll("[data-tooltip]")) {
      reference.addEventListener("mouseenter", () => show(reference));
      reference.addEventListener("mouseleave", hide);
      reference.addEventListener("focus", () => show(reference));
      reference.addEventListener("blur", hide);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hide();
    });
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  else onReady();
})();
