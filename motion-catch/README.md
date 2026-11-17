# 动感接球

用前置摄像头控制接球板，尝试在 30 秒内接住更多下落的球。

## 本地运行

```sh
npm ci
npm run dev
```

在电脑上打开终端显示的 localhost 地址。手机需要用 HTTPS 打开，例如私有部署地址。普通局域网 HTTP 地址无法调用摄像头。首次开启摄像头时浏览器需要下载 MediaPipe 的 WASM 和模型，视频帧始终在设备内处理。

把手机固定在面前，正对摄像头，让双肩入镜并站稳。倒计时结束后左右移身接球。双肩出框时本局暂停，重新入镜并站稳后恢复。也可以选择「触屏 / 键盘试玩」，在场地内拖动或用左右方向键控制。

## 部署测试站

测试站使用 Firebase 项目 `neza-draw` 下的独立 Hosting 站点。登录 Firebase CLI 后，在 Nezha 仓库根目录运行：

```sh
npm --prefix motion-catch ci
npm --prefix motion-catch run build
firebase deploy --config firebase.motion-catch.json --project neza-draw --only hosting:motion-catch
```

手机测试地址为 [neza-draw-motion-catch.web.app](https://neza-draw-motion-catch.web.app/)。

## 验证

```sh
npm test
npm run build
```

真机分别检查首次授权、左右方向、出框与恢复、切后台与恢复，以及结束本局后摄像头是否释放。

`src/pose.ts` 将 MediaPipe 结果转换成游戏需要的肩部中心、肩宽和时间戳。`src/game.ts` 负责球的位置、碰撞、计分和时间，与摄像头 API 无关。
