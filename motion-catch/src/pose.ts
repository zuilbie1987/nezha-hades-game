import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseFrame } from "./game";

export const connections = PoseLandmarker.POSE_CONNECTIONS;
export type landmarks = NormalizedLandmark[];

export async function createLandmarker() {
  const files = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm",
  );
  return PoseLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

export function visible(point: NormalizedLandmark | undefined) {
  return !!point && point.visibility >= 0.55 &&
    point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

export function shoulders(points: landmarks, time: number): PoseFrame | null {
  const left = points[11];
  const right = points[12];
  if (!visible(left) || !visible(right)) return null;
  const span = Math.abs(left.x - right.x);
  if (span < 0.065) return null;
  return { x: 1 - (left.x + right.x) / 2, span, time };
}
