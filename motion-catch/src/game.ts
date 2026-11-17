export const duration = 30;
export const paddleHalfWidth = 0.105;
export const paddleHeight = 0.87;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type PoseFrame = { x: number; span: number; time: number };

export function paddlePosition(frame: PoseFrame, center: PoseFrame) {
  return clamp(0.5 + (frame.x - center.x) / Math.max(center.span * 1.8, 0.15),
    paddleHalfWidth, 1 - paddleHalfWidth);
}

export class Round {
  remaining = duration;
  score = 0;
  paddle = 0.5;
  balls: { x: number; y: number }[] = [];
  private nextBall = 0.25;

  step(seconds: number, target: number, random = Math.random) {
    const elapsed = Math.min(seconds, this.remaining);
    if (elapsed <= 0) return;
    this.remaining -= elapsed;
    this.paddle += (target - this.paddle) * (1 - Math.exp(-elapsed * 18));
    this.nextBall -= elapsed;
    if (this.nextBall <= 0) {
      this.balls.push({ x: 0.12 + random() * 0.76, y: -0.03 });
      this.nextBall += 0.95;
    }
    this.balls = this.balls.filter(ball => {
      const previous = ball.y;
      ball.y += elapsed * 0.55;
      if (previous < paddleHeight && ball.y >= paddleHeight &&
        Math.abs(ball.x - this.paddle) <= paddleHalfWidth + 0.015) {
        this.score++;
        return false;
      }
      return ball.y < 1.06;
    });
  }
}
