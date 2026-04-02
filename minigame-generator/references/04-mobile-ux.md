# 手机操作与横屏适配规范

## 一、横屏适配（最高优先级）

### 1.1 强制横屏配置

```json
// game.json — 必须配置
{
  "deviceOrientation": "landscape",
  "showStatusBar": false
}
```

### 1.2 横屏尺寸获取

系统 API 返回的尺寸可能是竖屏数据（热启动/旋转未完成），必须强制横屏：

```javascript
// ★ 铁律：始终保证 screenW >= screenH
var _sysInfo = wx.getWindowInfo();
var screenW = Math.max(_sysInfo.windowWidth, _sysInfo.windowHeight);
var screenH = Math.min(_sysInfo.windowWidth, _sysInfo.windowHeight);
```

### 1.3 安全区域处理（刘海屏）

安全区域坐标系可能与屏幕方向不一致，必须做映射：

```javascript
var safeArea = info.safeArea;
var isPortraitData = info.screenWidth < info.screenHeight;

if (isPortraitData) {
  // 系统给的是竖屏坐标，需要转换到横屏坐标系
  // 竖屏 top（刘海）   → 横屏 left
  // 竖屏 bottom 间距   → 横屏 right
  SAFE_LEFT  = safeArea.top;
  SAFE_RIGHT = Math.max(0, info.screenHeight - safeArea.bottom);
  SAFE_TOP   = Math.max(0, safeArea.left);
  SAFE_BOTTOM = Math.max(0, info.screenWidth - safeArea.right);
} else {
  // 已经是横屏坐标，直接用
  SAFE_LEFT  = safeArea.left;
  SAFE_RIGHT = Math.max(0, info.screenWidth - safeArea.right);
  SAFE_TOP   = safeArea.top;
  SAFE_BOTTOM = Math.max(0, info.screenHeight - safeArea.bottom);
}

// 合理性校验 — 任何边距 > 屏幕 15% 说明坐标系错误
var maxSafeX = screenW * 0.15;
var maxSafeY = screenH * 0.15;
if (SAFE_LEFT > maxSafeX)   SAFE_LEFT = 0;
if (SAFE_RIGHT > maxSafeX)  SAFE_RIGHT = 0;
if (SAFE_TOP > maxSafeY)    SAFE_TOP = 0;
if (SAFE_BOTTOM > maxSafeY) SAFE_BOTTOM = 0;
```

### 1.4 手动旋转兜底

当系统无法自动旋转到横屏时（部分 Android 机型），需要手动旋转 Canvas：

```javascript
var _needManualRotate = false;

function _applyBaseTransform() {
  if (_needManualRotate) {
    // canvas 物理像素是竖屏的 (VH*DPR × VW*DPR)
    // 顺时针旋转 90°
    ctx.setTransform(0, DPR, -DPR, 0, VH * DPR, 0);
  } else {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}

// 触摸坐标也需要旋转映射
function _transformTouch(tx, ty) {
  if (_needManualRotate) {
    return { x: ty, y: _physicalW - tx };
  }
  return { x: tx, y: ty };
}
```

### 1.5 窗口尺寸变化监听

```javascript
wx.onWindowResize(function(res) {
  handleResize(res.windowWidth, res.windowHeight);
});

// 从后台切回时强制刷新
wx.onShow(function() {
  var info = wx.getWindowInfo();
  handleResize(info.windowWidth, info.windowHeight);
});
```

## 二、DPI 适配

### 2.1 Canvas 高清设置

```javascript
var dpr = wx.getWindowInfo().pixelRatio || 2;

// 设置高清尺寸
canvas.width = screenW * dpr;
canvas.height = screenH * dpr;

// 检查是否被系统接受
var actualW = canvas.width;
if (Math.abs(actualW - screenW * dpr) > 2) {
  // 系统不接受 → 用实际尺寸反推 dpr
  dpr = actualW / screenW;
}

// dpr 接近 1 时吸附到 1
if (Math.abs(dpr - 1) < 0.05) dpr = 1;

ctx.scale(dpr, dpr);
```

### 2.2 每帧 DPI 同步

Canvas 状态可能被系统重置（后台切回），每帧开头要同步：

```javascript
function syncCanvasDpr() {
  var wantW = Math.round(screenW * dpr);
  var wantH = Math.round(screenH * dpr);
  // 仅在尺寸不匹配时重设（避免不必要的 canvas 清空）
  if (Math.abs(canvas.width - wantW) > 2 || Math.abs(canvas.height - wantH) > 2) {
    canvas.width = wantW;
    canvas.height = wantH;
  }
  var scale = canvas.width / screenW;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
```

## 三、触控交互规范

### 3.1 触控热区

| 元素 | 最小尺寸 | 说明 |
|------|----------|------|
| 按钮 | 44×44 px | Apple HIG 标准 |
| 列表项 | 44 px 高 | 可点击行高 |
| 图标按钮 | 48×48 px | 无文字标签时 |
| 按钮间距 | ≥ 8 px | 防误触 |
| 摇杆底座 | 100-120 px 直径 | 双摇杆控制 |
| 摇杆活动区 | 底座半径 + 20 px | 手指可超出底座 |

### 3.2 双摇杆实现规范

```javascript
// 摇杆参数
var JOY_BASE_R = 50;     // 底座半径
var JOY_KNOB_R = 22;     // 摇杆球半径
var JOY_DEAD_ZONE = 8;   // 死区半径（消除抖动）
var JOY_MAX_DIST = 45;   // 最大偏移距离

// 摇杆位置 — 避开安全区域
var L_CX = SAFE_LEFT + 80;          // 左摇杆中心X
var L_CY = screenH - SAFE_BOTTOM - 80; // 左摇杆中心Y
var R_CX = screenW - SAFE_RIGHT - 80;  // 右摇杆中心X
var R_CY = screenH - SAFE_BOTTOM - 80; // 右摇杆中心Y
```

### 3.3 触摸事件处理

```javascript
// 多点触控必须用 changedTouches 追踪每个触点
canvas.addEventListener('touchstart', function(e) {
  for (var i = 0; i < e.changedTouches.length; i++) {
    var t = e.changedTouches[i];
    var pos = _transformTouch(t.clientX, t.clientY); // ★ 必须转换坐标
    handleTouchDown(t.identifier, pos.x, pos.y);
  }
});

canvas.addEventListener('touchmove', function(e) {
  for (var i = 0; i < e.changedTouches.length; i++) {
    var t = e.changedTouches[i];
    var pos = _transformTouch(t.clientX, t.clientY);
    handleTouchMove(t.identifier, pos.x, pos.y);
  }
});

canvas.addEventListener('touchend', function(e) {
  for (var i = 0; i < e.changedTouches.length; i++) {
    var t = e.changedTouches[i];
    var pos = _transformTouch(t.clientX, t.clientY);
    handleTouchUp(t.identifier, pos.x, pos.y);
  }
});
```

### 3.4 双指缩放（地图类游戏）

```javascript
var _pinchStartDist = 0;
var _pinchStartZoom = 1;

function onPinchStart(touches) {
  var dx = touches[0].x - touches[1].x;
  var dy = touches[0].y - touches[1].y;
  _pinchStartDist = Math.sqrt(dx * dx + dy * dy);
  _pinchStartZoom = camera.zoom;
}

function onPinchMove(touches) {
  var dx = touches[0].x - touches[1].x;
  var dy = touches[0].y - touches[1].y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  var scale = dist / _pinchStartDist;
  camera.zoom = Math.max(camera.minZoom,
    Math.min(camera.maxZoom, _pinchStartZoom * scale));
}
```

### 3.5 点击 vs 拖拽判定

```javascript
var SCROLL_TAP_THRESHOLD = 10; // 移动 < 10px 视为点击

function isTap(startX, startY, endX, endY) {
  var dx = endX - startX;
  var dy = endY - startY;
  return Math.sqrt(dx * dx + dy * dy) < SCROLL_TAP_THRESHOLD;
}
```

## 四、UI 布局规范

### 4.1 HUD 位置约束

```
┌────────────────────────────────────────────┐
│ SAFE_TOP                                    │
│ ┌──────────────────────────────────────┐   │
│ │ HUD 顶栏（波次/分数/生命）          │   │← 避开右上角小程序按钮(90px)
│ └──────────────────────────────────────┘   │
│                                             │
│ SAFE_LEFT   [游戏区域]        SAFE_RIGHT   │
│                                             │
│ ┌───────┐                    ┌───────┐     │
│ │ 左摇杆 │                    │ 右摇杆 │     │
│ └───────┘                    └───────┘     │
│ SAFE_BOTTOM                                 │
└────────────────────────────────────────────┘
```

### 4.2 弹窗/对话框规范

- 最大宽度：300-340 px
- 居中显示
- 半透明黑色蒙层（`rgba(0,0,0,0.5)`）
- 圆角：12-16 px
- 按钮在弹窗底部，主按钮醒目、次按钮淡化

### 4.3 字体大小规范

| 用途 | 字号 | 字重 |
|------|------|------|
| 大标题 | 28-36 px | bold |
| 小标题 | 18-22 px | bold |
| 正文/按钮 | 14-16 px | normal/bold |
| 标签/说明 | 11-13 px | normal |
| HUD 数值 | 13-15 px | bold |
| HUD 标签 | 10-11 px | normal |

## 五、摄像机系统规范（地图类游戏）

### 5.1 Camera 类标准接口

```javascript
class Camera {
  constructor({ screenWidth, screenHeight, worldWidth, worldHeight,
                padLeft, padTop, padRight, padBottom, fitScreen }) { ... }
  centerOn(wx, wy) { ... }     // 将镜头中心移到世界坐标
  moveTo(nx, ny) { ... }       // 设置左上角
  zoomBy(factor) { ... }       // 相对缩放
  animateTo(cx, cy, zoom, duration, easeFn, onComplete) { ... }  // 平滑动画
  update(dt) { ... }           // 每帧更新动画
  _clamp() { ... }             // 限制在世界边界内
}
```

### 5.2 缩放限制

- `minZoom`：屏幕刚好能完整显示整个世界地图
- `maxZoom`：1.2（不要放太大，Canvas 2D 放大后无法增加细节）
