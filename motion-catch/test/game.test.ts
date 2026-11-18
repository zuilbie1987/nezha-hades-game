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

test("caught balls bounce upward, fall and leave without scoring twice", () => {
  const round = new Round();
  const ball = { x: 0.5, y: paddleHeight - 0.02 };
  round.balls = [ball];
  round.step(0.05, 0.5, () => 0.99);
  assert.equal(round.score, 1);
  const contactY = ball.y;
  round.step(0.1, 0.5, () => 0.99);
  assert.ok(ball.y < contactY);
  for (let frame = 0; frame < 12; frame++) round.step(0.1, 0.5, () => 0.99);
  assert.ok(ball.y > paddleHeight);
  assert.ok(!round.balls.includes(ball));
  assert.equal(round.score, 1);
});

test("caught bombs deduct one point and create a temporary explosion", () => {
  const round = new Round();
  round.balls = [{ x: 0.5, y: paddleHeight - 0.02, kind: "bomb" }];
  round.step(0.1, 0.5, () => 0.99);
  assert.equal(round.score, -1);
  assert.equal(round.balls.length, 0);
  assert.deepEqual(round.explosions, [{ x: 0.5, y: paddleHeight, age: 0 }]);
  for (let frame = 0; frame < 7; frame++) round.step(0.1, 0.5, () => 0.99);
  assert.equal(round.explosions.length, 0);
  assert.equal(round.score, -1);
});

test("missed bombs do not deduct points or explode", () => {
  const round = new Round();
  round.balls = [{ x: 0.9, y: paddleHeight - 0.02, kind: "bomb" }];
  round.step(0.1, 0.5);
  assert.equal(round.score, 0);
  assert.equal(round.explosions.length, 0);
});

test("spawning includes bombs and normal balls", () => {
  const bombRound = new Round();
  bombRound.step(0.25, 0.5, () => 0.1);
  assert.equal(bombRound.balls[0].kind, "bomb");
  const normalRound = new Round();
  normalRound.step(0.25, 0.5, () => 0.9);
  assert.equal(normalRound.balls[0].kind, "normal");
});
