// Unit tests for the web terminal key bar. Run with: node --test tests/*.test.js
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { KEYS, keySequence, modifyChar } = require("../ssh/rootfs/usr/share/ttyd/key-bar.js");

const seqs = (ids, opts) => ids.map((id) => keySequence(id, opts));

test("plain keys send their bytes", () => {
  assert.deepEqual(seqs(["esc", "tab", "/", "-"]), ["\x1b", "\t", "/", "-"]);
  assert.deepEqual(seqs(["pgup", "pgdn"]), ["\x1b[5~", "\x1b[6~"]);
});

test("arrows, Home and End follow the cursor key mode", () => {
  const ids = ["up", "down", "right", "left", "home", "end"];
  assert.deepEqual(seqs(ids), ["\x1b[A", "\x1b[B", "\x1b[C", "\x1b[D", "\x1b[H", "\x1b[F"]);
  assert.deepEqual(seqs(ids, { appCursor: true }), ["\x1bOA", "\x1bOB", "\x1bOC", "\x1bOD", "\x1bOH", "\x1bOF"]);
});

test("modified cursor and page keys use the xterm modifier form", () => {
  assert.equal(keySequence("left", { ctrl: true, appCursor: true }), "\x1b[1;5D");
  assert.equal(keySequence("up", { alt: true }), "\x1b[1;3A");
  assert.equal(keySequence("end", { ctrl: true, alt: true }), "\x1b[1;7F");
  assert.equal(keySequence("pgdn", { ctrl: true }), "\x1b[6;5~");
});

test("Ctrl and Alt modify typed characters", () => {
  assert.equal(modifyChar("c", { ctrl: true }), "\x03");
  assert.equal(modifyChar("C", { ctrl: true }), "\x03");
  assert.equal(modifyChar("[", { ctrl: true }), "\x1b");
  assert.equal(modifyChar(" ", { ctrl: true }), "\0");
  assert.equal(modifyChar("?", { ctrl: true }), "\x7f");
  assert.equal(modifyChar("b", { alt: true }), "\x1bb");
  assert.equal(modifyChar("x", { ctrl: true, alt: true }), "\x1b\x18");
  assert.equal(modifyChar("1", { ctrl: true }), "1");
  assert.equal(modifyChar("ls", { ctrl: true }), "ls");
});

test("every bar key except the modifiers has a sequence", () => {
  for (const [label, id] of KEYS) {
    if (id === "ctrl" || id === "alt") continue;
    assert.notEqual(keySequence(id), null, label);
  }
  assert.equal(KEYS.length, 14);
});
