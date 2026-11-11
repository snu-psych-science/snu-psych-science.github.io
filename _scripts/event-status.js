/* Keep event labels current between static-site deployments, using Korea time. */
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const update = () => {
    const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    for (const badge of document.querySelectorAll("[data-event-date]")) {
      const date = badge.dataset.eventDate;
      const state = date > today ? "upcoming" : date === today ? "today" : "past";
      badge.dataset.state = state;
      badge.textContent = { upcoming: "예정 행사", today: "오늘", past: "지난 행사" }[state];
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", update, { once: true });
  else update();
  document.addEventListener("visibilitychange", update);
  window.addEventListener("pageshow", update);
})();
