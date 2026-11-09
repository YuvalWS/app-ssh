// Keeps the terminal and the touch key bar above the on-screen keyboard.
//
// Phone keyboards cover the page instead of resizing it, and Home Assistant
// shows this page in a frame that keeps its full height. Measure how much of
// the page the keyboard covers and make the page that much shorter. Home
// Assistant's page is only read, never changed.
(() => {
  "use strict";

  // Pixels hidden below the visible area. `pageBottom` is where this page
  // ends, in the coordinates of the window the keyboard shrinks. Pinch zoom
  // also shrinks the visible area, so do nothing while zoomed in.
  const coveredHeight = (pageBottom, { offsetTop, height, scale }) =>
    scale > 1 ? 0 : Math.max(0, Math.round(pageBottom - (offsetTop + height)));

  if (typeof module === "object") {
    module.exports = { coveredHeight };
    return;
  }

  // In Home Assistant's app panel the keyboard shrinks Home Assistant's
  // window, which this page can read because ingress serves both from the
  // same origin. Opened directly, it shrinks this window.
  const frame = window.frameElement;
  const host = frame ? window.parent : window;
  const viewport = host.visualViewport;
  if (!viewport) return;

  const pageBottom = () => {
    if (!frame) return window.innerHeight;
    const style = host.getComputedStyle(frame);
    return (
      frame.getBoundingClientRect().bottom -
      parseFloat(style.paddingBottom) -
      parseFloat(style.borderBottomWidth)
    );
  };

  const style = document.createElement("style");
  style.textContent = `
    html { height: calc(100% - var(--keyboard-inset, 0px)); min-height: 0; }
    .ttyd-key-bar { bottom: var(--keyboard-inset, 0px); }`;
  document.head.append(style);

  let inset = 0;
  const fit = () => {
    const covered = coveredHeight(pageBottom(), viewport);
    if (covered === inset) return;
    inset = covered;
    document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    window.term?.fit();
  };

  // Resize: the keyboard opens or closes. Scroll: the page is panned, as the
  // Companion app does. Own resize: the frame itself changed size.
  viewport.addEventListener("resize", fit);
  viewport.addEventListener("scroll", fit);
  window.addEventListener("resize", fit);
  window.addEventListener("pagehide", () => {
    viewport.removeEventListener("resize", fit);
    viewport.removeEventListener("scroll", fit);
  });
})();
