import "./style.css";
import { clamp, duration, paddleHalfWidth, paddleHeight, paddlePosition, Round, type PoseFrame } from "./game";
import { connections, createLandmarker, shoulders, visible, type landmarks } from "./pose";

const canvas = document.querySelector<HTMLCanvasElement>("#arena")!;
const ctx = canvas.getContext("2d")!;
const video = document.querySelector<HTMLVideoElement>("#camera")!;
const trackingCanvas = document.querySelector<HTMLCanvasElement>("#tracking")!;
const tracking = trackingCanvas.getContext("2d")!;
const cameraState = document.querySelector("#camera-state")!;
const cameraLabel = cameraState.querySelector("span")!;
const placeholder = document.querySelector<HTMLElement>("#preview-placeholder")!;
const overlay = document.querySelector<HTMLElement>("#overlay")!;
const title = document.querySelector("#title")!;
const message = document.querySelector("#message")!;
const action = document.querySelector<HTMLButtonElement>("#action")!;
const practice = document.querySelector<HTMLButtonElement>("#practice")!;
const end = document.querySelector<HTMLButtonElement>("#end")!;
const hint = document.querySelector("#hint")!;
const score = document.querySelector("#score")!;
const time = document.querySelector("#time")!.firstChild!;

type Phase = "idle" | "loading" | "align" | "countdown" | "play" | "paused" | "results";
let phase: Phase = "idle";
let mode: "camera" | "practice" = "camera";
let round = new Round();
let center: PoseFrame | null = null;
let stableSince: PoseFrame | null = null;
let lastPose: PoseFrame | null = null;
let lastVideoTime = -1;
let lastInference = -Infinity;
let countdownUntil = 0;
let lastTick = 0;
let pointerTarget = 0.5;
let stream: MediaStream | null = null;
let detector: Awaited<ReturnType<typeof createLandmarker>> | null = null;
let session = 0;
const keys = new Set<string>();

function show(titleText: string, body: string, button = "", showPractice = false) {
  overlay.hidden = false;
  title.textContent = titleText;
  message.textContent = body;
  action.hidden = !button;
  if (button) {
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    action.replaceChildren(button, arrow);
  }
  practice.hidden = !showPractice;
}

function cameraStatus(label: string, live = false) {
  cameraLabel.textContent = label;
  cameraState.classList.toggle("live", live);
}

function stopCamera() {
  session++;
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  lastPose = null;
  lastVideoTime = -1;
  tracking.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);
  placeholder.hidden = false;
  cameraStatus("摄像头未开启");
}

function lobby(error?: string) {
  stopCamera();
  phase = "idle";
  end.hidden = true;
  hint.textContent = "· 等待开始";
  show(error ? "摄像头暂不可用" : "准备好了吗？",
    error ?? "把手机固定在面前，退后直到双肩入镜。", error ? "重试摄像头" : "开启摄像头", true);
}

function resetRound() {
  round = new Round();
  center = stableSince = null;
  pointerTarget = 0.5;
  end.hidden = false;
  updateScore();
}

async function startCamera() {
  mode = "camera";
  resetRound();
  phase = "loading";
  const attempt = ++session;
  hint.textContent = "· 正在准备";
  cameraStatus("正在启动");
  show("正在准备摄像头", "请允许摄像头访问。首次加载识别模型可能需要几秒。");
  let step = "permission";
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      lobby("请用 HTTPS 地址或本机 localhost 打开，再试一次。");
      return;
    }
    const acquired = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    });
    if (session !== attempt) {
      acquired.getTracks().forEach(track => track.stop());
      return;
    }
    stream = acquired;
    acquired.getVideoTracks()[0].addEventListener("ended", () => {
      if (session === attempt) lobby("摄像头连接已中断，请重新开启。");
    });
    video.srcObject = stream;
    await video.play();
    if (session !== attempt) return;
    placeholder.hidden = true;
    step = "model";
    const model = detector ?? await createLandmarker();
    if (session !== attempt) {
      if (model !== detector) model.close();
      return;
    }
    detector = model;
    phase = "align";
    cameraStatus("摄像头已开启", true);
    hint.textContent = "· 正在对准";
    show("站到画面中央", "正对摄像头，让双肩入镜并站稳。");
  } catch (error) {
    if (session !== attempt) return;
    const denied = error instanceof DOMException && error.name === "NotAllowedError";
    lobby(denied ? "请在浏览器设置中允许摄像头，然后重试。"
      : step === "model" ? "识别模型加载失败，请检查网络后重试。"
        : "无法启动摄像头，请确认摄像头可用且未被其他应用占用。");
  }
}

function countdown(now: number) {
  phase = "countdown";
  countdownUntil = now + 3000;
  hint.textContent = "· 即将开始";
  show("3", mode === "camera" ? "保持双肩在画面内。" : "用 ← → 键，或在场地内拖动。");
}

function startPractice() {
  stopCamera();
  mode = "practice";
  resetRound();
  countdown(performance.now());
}

function play() {
  phase = "play";
  lastTick = 0;
  overlay.hidden = true;
  hint.textContent = mode === "camera" ? "· 左右移动身体接球" : "· 用 ← → 键或拖动接球板";
}

function pause() {
  phase = "paused";
  stableSince = null;
  hint.textContent = "· 已暂停";
  if (mode === "camera") show("追踪已暂停", "让双肩重新入镜，站稳后继续。");
  else show("游戏已暂停", "继续上一局。", "继续");
}

function finish() {
  stopCamera();
  phase = "results";
  end.hidden = true;
  hint.textContent = "· 本局完成";
  show("时间到！", `本局接住了 ${round.score} 个球。`, mode === "camera" ? "再玩一局" : "再试一次", true);
  practice.textContent = mode === "camera" ? "触屏 / 键盘试玩" : "用摄像头玩";
}

function updateScore() {
  score.textContent = String(round.score).padStart(2, "0");
  time.nodeValue = String(Math.ceil(round.remaining)).padStart(2, "0");
}

function drawSkeleton(points: landmarks) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return;
  if (trackingCanvas.width !== width || trackingCanvas.height !== height) {
    trackingCanvas.width = width;
    trackingCanvas.height = height;
  }
  tracking.clearRect(0, 0, width, height);
  tracking.strokeStyle = "#d6fa53";
  tracking.lineWidth = 2;
  tracking.beginPath();
  for (const { start, end } of connections) {
    const a = points[start];
    const b = points[end];
    if (start < 11 || end < 11 || !visible(a) || !visible(b)) continue;
    tracking.moveTo((1 - a.x) * width, a.y * height);
    tracking.lineTo((1 - b.x) * width, b.y * height);
  }
  tracking.stroke();
  tracking.fillStyle = "#d6fa53";
  for (const point of points.slice(11)) {
    if (!visible(point)) continue;
    tracking.beginPath();
    tracking.arc((1 - point.x) * width, point.y * height, 3, 0, 2 * Math.PI);
    tracking.fill();
  }
}

function readPose(now: number) {
  if (!detector || !stream || video.readyState < 2 ||
    video.currentTime === lastVideoTime || now - lastInference < 62) return;
  lastInference = now;
  lastVideoTime = video.currentTime;
  try {
    const result = detector.detectForVideo(video, now);
    const points = result.landmarks[0] ?? [];
    lastPose = shoulders(points, now);
    drawSkeleton(points);
  } catch {
    detector.close();
    detector = null;
    lobby("姿态识别已中断，请重新开启摄像头。");
  }
}

function readyPose(frame: PoseFrame | null, now: number, requireCenter: boolean) {
  if (!frame || (requireCenter && Math.abs(frame.x - 0.5) > 0.22)) {
    stableSince = null;
    return false;
  }
  if (!stableSince || Math.abs(frame.x - stableSince.x) > 0.045) stableSince = frame;
  return now - stableSince.time >= 650;
}

function draw() {
  const { clientWidth: width, clientHeight: height } = canvas;
  if (!width || !height) return;
  const scale = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#829d5945";
  for (let x = 14; x < width; x += 23) {
    for (let y = 13; y < height; y += 23) ctx.fillRect(x, y, 1.4, 1.4);
  }
  const y = paddleHeight * height;
  ctx.strokeStyle = "#d6fa534d";
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(0, y + 5);
  ctx.lineTo(width, y + 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#d6fa53";
  ctx.shadowColor = "#d6fa5370";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect((round.paddle - paddleHalfWidth) * width, y, paddleHalfWidth * 2 * width, 10, 5);
  ctx.fill();
  for (const ball of round.balls) {
    ctx.beginPath();
    ctx.arc(ball.x * width, ball.y * height, clamp(width * 0.015, 6, 10), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function tick(now: number) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  if (mode === "camera") readPose(now);
  const pose = lastPose && now - lastPose.time <= 270 ? lastPose : null;
  if (phase === "align" && readyPose(pose, now, true)) {
    center = pose;
    countdown(now);
  }
  if (phase === "paused" && mode === "camera" && readyPose(pose, now, false)) countdown(now);
  if (phase === "countdown") {
    if (mode === "camera" && !pose) pause();
    else if (now >= countdownUntil) play();
    else title.textContent = String(Math.ceil((countdownUntil - now) / 1000));
  }
  if (phase === "play") {
    if (mode === "camera" && (!pose || !center)) pause();
    else {
      const dt = lastTick ? (now - lastTick) / 1000 : 0;
      const direction = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
      pointerTarget = clamp(pointerTarget + direction * dt * 0.9, paddleHalfWidth, 1 - paddleHalfWidth);
      const target = pose && center ? paddlePosition(pose, center) : pointerTarget;
      if (dt > 0.3) pause();
      else {
        round.step(dt, target);
        updateScore();
        if (round.remaining <= 0) finish();
      }
    }
  }
  lastTick = now;
  draw();
}

action.onclick = () => {
  if (phase === "paused" && mode === "practice") countdown(performance.now());
  else if (phase === "results" && mode === "practice") startPractice();
  else void startCamera();
};
practice.onclick = () => {
  if (phase === "results" && mode === "practice") void startCamera();
  else startPractice();
};
practice.textContent = "触屏 / 键盘试玩";
end.onclick = () => {
  practice.textContent = "触屏 / 键盘试玩";
  round = new Round();
  updateScore();
  lobby();
};

function point(event: PointerEvent) {
  if (mode !== "practice" || phase !== "play") return;
  const { left, width } = canvas.getBoundingClientRect();
  pointerTarget = clamp((event.clientX - left) / width, paddleHalfWidth, 1 - paddleHalfWidth);
}

canvas.addEventListener("pointerdown", event => {
  if (mode !== "practice" || phase !== "play") return;
  canvas.setPointerCapture(event.pointerId);
  point(event);
});
canvas.addEventListener("pointermove", event => {
  if (canvas.hasPointerCapture(event.pointerId)) point(event);
});
window.addEventListener("keydown", event => {
  if (mode !== "practice" || phase !== "play" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  keys.add(event.key);
});
window.addEventListener("keyup", event => keys.delete(event.key));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  keys.clear();
  lastPose = null;
  stableSince = null;
  if (phase === "play" || phase === "countdown") pause();
});
window.addEventListener("pagehide", () => {
  if (stream || phase === "loading") lobby();
});
updateScore();
requestAnimationFrame(tick);
