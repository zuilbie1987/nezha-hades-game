export const duration = 30;
export const paddleHalfWidth = 0.105;
export const paddleHeight = 0.87;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type PoseFrame = { x: number; span: number; time: number };
export type Ball = { x: number; y: number; kind?: "normal" | "bomb"; caught?: boolean; velocityY?: number };

export function paddlePosition(frame: PoseFrame, center: PoseFrame) {
  return clamp(0.5 + (frame.x - center.x) / Math.max(center.span * 1.8, 0.15),
    paddleHalfWidth, 1 - paddleHalfWidth);
}

export class Round {
  remaining = duration;
  score = 0;
  paddle = 0.5;
  balls: Ball[] = [];
  explosions: { x: number; y: number; age: number }[] = [];
  private nextBall = 0.25;

  step(seconds: number, target: number, random = Math.random) {
    const elapsed = Math.min(seconds, this.remaining);
    if (elapsed <= 0) return;
    this.remaining -= elapsed;
    this.explosions = this.explosions.filter(explosion => {
      explosion.age += elapsed;
      return explosion.age < 0.65;
    });
    this.paddle += (target - this.paddle) * (1 - Math.exp(-elapsed * 18));
    this.nextBall -= elapsed;
    if (this.nextBall <= 0) {
      this.balls.push({ x: 0.12 + random() * 0.76, y: -0.03, kind: random() < 0.2 ? "bomb" : "normal" });
      this.nextBall += 0.95;
    }
    this.balls = this.balls.filter(ball => {
      if (ball.caught) {
        const velocity = ball.velocityY ?? -0.8;
        ball.y += velocity * elapsed + 0.5 * 2.4 * elapsed * elapsed;
        ball.velocityY = velocity + 2.4 * elapsed;
        return ball.y < 1.06;
      }
      const previous = ball.y;
      ball.y += elapsed * 0.55;
      if (previous < paddleHeight && ball.y >= paddleHeight &&
        Math.abs(ball.x - this.paddle) <= paddleHalfWidth + 0.015) {
        if (ball.kind === "bomb") {
          this.score--;
          this.explosions.push({ x: ball.x, y: paddleHeight, age: 0 });
          return false;
        }
        this.score++;
        ball.caught = true;
        const afterHit = (ball.y - paddleHeight) / 0.55;
        ball.y = paddleHeight - 0.8 * afterHit + 0.5 * 2.4 * afterHit * afterHit;
        ball.velocityY = -0.8 + 2.4 * afterHit;
      }
      return ball.y < 1.06;
    });
  }
}
