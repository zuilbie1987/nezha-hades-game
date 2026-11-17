import assert from "node:assert/strict";
import { test } from "node:test";
import { duration, paddleHalfWidth, paddleHeight, paddlePosition, Round } from "../src/game.ts";

test("calibrated movement preserves direction and stays inside the arena", () => {
  const center = { x: 0.58, span: 0.22, time: 1 };
  assert.equal(paddlePosition(center, center), 0.5);
  assert.ok(paddlePosition({ ...center, x: 0.5 }, center) < 0.5);
  assert.equal(paddlePosition({ ...center, x: 1 }, center), 1 - paddleHalfWidth);
});

test("balls crossing the paddle score once and misses do not score", () => {
  const round = new Round();
  round.balls = [{ x: 0.5, y: paddleHeight - 0.02 }, { x: 0.85, y: paddleHeight - 0.02 }];
  round.step(0.1, 0.5);
  assert.equal(round.score, 1);
  round.step(0.1, 0.5);
  assert.equal(round.score, 1);
});

test("a round ends at thirty seconds and ignores later input", () => {
  const round = new Round();
  for (let frame = 0; frame < duration * 10; frame++) round.step(0.1, 0.5);
  round.step(0.1, 0.5);
  assert.equal(round.remaining, 0);
  const snapshot = JSON.stringify(round);
  round.step(1, 0.9);
  assert.equal(JSON.stringify(round), snapshot);
});
