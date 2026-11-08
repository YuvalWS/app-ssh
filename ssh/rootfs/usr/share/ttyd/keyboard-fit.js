/*
 * TEST ONLY: prototype of a Home Assistant frontend fix, not meant for a PR here.
 *
 * Phone keyboards cover the page instead of shrinking it, so the terminal's
 * bottom rows and the key bar end up under the keyboard. The page's
 * visualViewport tells how much is still visible. When the terminal runs
 * inside Home Assistant's app panel (same origin), shrink its iframe to end
 * where the keyboard starts, then refit the terminal to the new size.
 */
(() => {
  "use strict";

  let frame, viewport;
  try {
    frame = window.frameElement;
    viewport = window.parent.visualViewport;
  } catch {
    return; // not same origin
  }
  if (!frame || !viewport) return;

  const original = frame.style.height;
  const fit = () => {
    frame.style.height = original;
    const rect = frame.getBoundingClientRect();
    const covered = rect.bottom - (viewport.offsetTop + viewport.height);
    if (covered > 1) frame.style.height = `${rect.height - covered}px`;
    window.term?.fit();
  };

  viewport.addEventListener("resize", fit);
  viewport.addEventListener("scroll", fit);
})();
