// Unit tests for keeping the web terminal above the keyboard. Run with: node --test tests/*.test.js
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { coveredHeight } = require("../ssh/rootfs/usr/share/ttyd/keyboard-fit.js");

const viewport = (height, offsetTop = 0, scale = 1) => ({ height, offsetTop, scale });

test("nothing covered without a keyboard", () => {
  assert.equal(coveredHeight(800, viewport(800)), 0);
});

test("keyboard covers the bottom of the page", () => {
  assert.equal(coveredHeight(800, viewport(500)), 300);
});

test("page panned up, as the Companion app does", () => {
  assert.equal(coveredHeight(800, viewport(500, 200)), 100);
});

test("page ends above the visible area", () => {
  assert.equal(coveredHeight(400, viewport(500)), 0);
});

test("pinch zoom is ignored", () => {
  assert.equal(coveredHeight(800, viewport(400, 0, 2)), 0);
});

test("fractional sizes are rounded", () => {
  assert.equal(coveredHeight(800.4, viewport(500.1)), 300);
});
