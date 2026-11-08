/*
 * Touch key bar for the ttyd web terminal.
 *
 * Soft keyboards have no Esc, Tab, Ctrl, Alt or arrow keys, so this adds them
 * below the terminal on touch devices, laid out like the Termux extra keys.
 * CTRL and ALT are one-shot: tap one, then a key on the soft keyboard or bar.
 * It relies only on what ttyd provides (`window.term`), so it works with any
 * ttyd.
 */
(() => {
  "use strict";

  const ROW_HEIGHT = 40; // px

  // Two rows of seven, as in Termux.
  const KEYS = [
    ["ESC", "esc"], ["/", "/"], ["-", "-"], ["HOME", "home"], ["↑", "up"], ["END", "end"], ["PGUP", "pgup"],
    ["TAB", "tab"], ["CTRL", "ctrl"], ["ALT", "alt"], ["←", "left"], ["↓", "down"], ["→", "right"], ["PGDN", "pgdn"],
  ];

  const CHARS = { esc: "\x1b", tab: "\t", "/": "/", "-": "-" };
  const CURSOR = { up: "A", down: "B", right: "C", left: "D", home: "H", end: "F" };
  const PAGE = { pgup: 5, pgdn: 6 };

  // Ctrl turns @, letters and [\]^_ into control codes, space into NUL and
  // ? into DEL. Alt prefixes ESC.
  const modifyChar = (data, { ctrl, alt }) => {
    if (data.length !== 1) return data;
    if (ctrl) {
      const code = data.toUpperCase().charCodeAt(0);
      if (code >= 64 && code <= 95) data = String.fromCharCode(code - 64);
      else if (data === " ") data = "\0";
      else if (data === "?") data = "\x7f";
    }
    return alt ? "\x1b" + data : data;
  };

  // The bytes a bar key sends. Unmodified arrows, Home and End follow the
  // cursor key mode the program asked for (less, vim, tmux use application
  // mode); modified ones use the xterm form ESC [ 1 ; mod X.
  const keySequence = (id, { appCursor = false, ctrl = false, alt = false } = {}) => {
    const mod = 1 + (alt ? 2 : 0) + (ctrl ? 4 : 0);
    if (id in CHARS) return modifyChar(CHARS[id], { ctrl, alt });
    if (id in CURSOR) {
      if (mod > 1) return `\x1b[1;${mod}${CURSOR[id]}`;
      return (appCursor ? "\x1bO" : "\x1b[") + CURSOR[id];
    }
    if (id in PAGE) return `\x1b[${PAGE[id]}${mod > 1 ? ";" + mod : ""}~`;
    return null;
  };

  if (typeof module === "object") {
    module.exports = { KEYS, keySequence, modifyChar };
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .ttyd-key-bar { display: none; }
    @media (pointer: coarse) {
      #terminal-container { height: calc(100% - ${2 * ROW_HEIGHT}px); }
      .ttyd-key-bar {
        display: grid; grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: ${ROW_HEIGHT}px;
        position: fixed; left: 0; right: 0; bottom: 0; background: #000;
      }
      .ttyd-key-bar button {
        min-width: 0; border: 0; padding: 0; background: none; color: #fff;
        font: 15px sans-serif; touch-action: manipulation; user-select: none;
        -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
      }
      .ttyd-key-bar button:active { background: #333; }
      .ttyd-key-bar button.on { color: #4fc3f7; }
    }`;
  document.head.append(style);

  const mods = { ctrl: false, alt: false };
  const modButtons = {};

  const setMod = (name, on) => {
    mods[name] = on;
    modButtons[name].classList.toggle("on", on);
    modButtons[name].setAttribute("aria-pressed", on);
  };

  // Apply a pending CTRL or ALT to the next key typed on the soft keyboard.
  // xterm.js has no public hook for this, so wrap its internal data event.
  // ttyd replaces the terminal when it reconnects, so this runs on each tap.
  const hook = (term) => {
    const core = term?._core?.coreService;
    if (!core || core.keyBarHooked) return;
    const trigger = core.triggerDataEvent.bind(core);
    core.triggerDataEvent = (data, wasUserInput) => {
      if (mods.ctrl || mods.alt) {
        data = modifyChar(data, mods);
        setMod("ctrl", false);
        setMod("alt", false);
      }
      trigger(data, wasUserInput);
    };
    core.keyBarHooked = true;
  };

  const bar = document.createElement("div");
  bar.className = "ttyd-key-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Terminal keys");
  // Do not take focus from the terminal, so the soft keyboard stays open.
  bar.addEventListener("pointerdown", (e) => e.preventDefault());
  bar.addEventListener("mousedown", (e) => e.preventDefault());

  for (const [label, id] of KEYS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (id in mods) {
      modButtons[id] = button;
      button.setAttribute("aria-pressed", false);
    }
    button.addEventListener("click", () => {
      const term = window.term;
      hook(term);
      if (id in mods) return setMod(id, !mods[id]);
      const seq = keySequence(id, { ...mods, appCursor: term?.modes.applicationCursorKeysMode });
      setMod("ctrl", false);
      setMod("alt", false);
      term?.input(seq, true);
    });
    bar.append(button);
  }

  document.body.append(bar);
  // The bar makes the terminal area smaller.
  requestAnimationFrame(() => window.term?.fit());
})();
