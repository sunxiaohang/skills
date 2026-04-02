# 编程约束与性能优化规则

## 一、模块系统

### 1.1 CommonJS 规范

```javascript
// 导出
module.exports = { ClassName, CONSTANT, helperFunction };

// 导入
const { ClassName, CONSTANT } = require('./module-name');
```

### 1.2 模块职责划分标准

| 文件 | 职责 | 导出 |
|------|------|------|
| `game.js` | 入口、场景系统、游戏循环、输入处理 | 无（入口文件） |
| `config-data.js` | 所有游戏数值 | 数值对象 |
| `config-text.js` | 所有显示文本 | 文本对象 |
| `player.js` | 玩家类+配置 | `Player`, `PLAYER_CONFIG` |
| `enemy.js` | 敌人类+Tier系统 | `Enemy`, `ENEMY_TIERS` |
| `scene-ui.js` / `menu.js` | UI绘制+菜单逻辑 | 绘制函数/Menu对象 |
| `camera.js` | 镜头系统 | `Camera` |
| `particle-system.js` | 布朗粒子 | `BrownianParticleSystem` |
| `sfx.js` | 音效系统 | `SFX` |
| `achievements.js` | 成就追踪 | `AchievementManager` |
| `characters.js` | 角色系统 | `CharacterManager` |
| `skins.js` | 皮肤系统 | `SkinManager` |
| `utils.js` | 工具函数 | `perfNow`, `roundRect` 等 |

**规则**：单个文件不超过 2000 行。超过时必须拆分。

## 二、命名规范

### 2.1 标识符命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 常量/配置对象 | `UPPER_SNAKE_CASE` | `PLAYER_CONFIG`, `GAME_CONFIG`, `ENEMY_TIERS` |
| 类 | `PascalCase` | `Player`, `Enemy`, `Camera`, `BrownianParticle` |
| 函数 | `camelCase` | `drawWorldMap`, `handleTouchStart` |
| 私有/内部变量 | `_camelCase` | `_charDef`, `_pendingAnnounce`, `_anim` |
| 模块级变量 | `camelCase` | `currentScene`, `gameState` |
| 事件处理函数 | `on` + `EventName` | `onTouchStart`, `onWindowResize` |
| 布尔变量 | `is/has/can/should` 前缀 | `isAlive`, `hasShield`, `canTeleport` |

### 2.2 变量声明

```javascript
// 模块级 — 用 var（兼容性，且明确表示模块作用域）
var currentScene = 'menu';
var _winStreak = 0;

// 函数内 — 用 const / let
function update(dt) {
  const now = Date.now();
  let dx = target.x - this.x;
}
```

### 2.3 存储键命名

```javascript
// 格式：游戏缩写_功能描述
const STORAGE_KEYS = {
  save: 'ck_save',        // 存档
  stars: 'ck_stars',      // 星级
  streak: 'ck_streak',    // 连胜
  times: 'ck_times',      // 通关时间
  settings: 'al_settings', // 设置
  scores: 'al_scores',     // 分数
};
```

## 三、注释规范

### 3.1 区块分隔

```javascript
// ============================================================
// 场景 & 关卡状态
// ============================================================
```

### 3.2 关键设计决策标记

```javascript
// ★ 方案2：连胜系统
// ★★★ 最可靠方案：完全基于 canvas 实际尺寸来确定 dpr
```

### 3.3 JSDoc 类型注释

```javascript
/**
 * @param {number} opts.screenWidth
 * @param {number} opts.screenHeight
 * @param {number} [opts.padLeft]   安全区左边距
 */
```

## 四、游戏循环规范

### 4.1 标准游戏循环结构

```javascript
var lastTime = Date.now();

function gameLoop() {
  try { _gameLoopInner(); }
  catch(e) { console.error('[Game] gameLoop 异常:', e); }
  requestAnimationFrame(gameLoop);
}

function _gameLoopInner() {
  const now = Date.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05); // ★ 必须有上限
  lastTime = now;

  // 1. 同步 canvas 状态（dpr、变换矩阵）
  syncCanvasDpr();

  // 2. 非游戏场景
  if (currentScene !== 'playing') {
    drawCurrentScene(dt);
    return;
  }

  // 3. 游戏逻辑更新
  updateGame(dt);

  // 4. 渲染
  renderGame(dt);
}

requestAnimationFrame(gameLoop);
```

**铁律**：
- `dt` 必须有上限：`Math.min(dt, 0.05)`（防止标签页切换回来后的巨大 dt）
- 游戏循环 try-catch 包裹（防止单帧异常导致循环停止）
- `requestAnimationFrame` 始终调用（即使出错也要继续下一帧）

### 4.2 场景系统

```javascript
let currentScene = 'menu'; // 'menu' | 'playing' | 'settings' | 'howToPlay' | ...

// 场景切换函数
function switchScene(newScene) {
  currentScene = newScene;
  // 触发场景切换动画
  _sceneTransition.active = true;
  _sceneTransition.progress = 0;
}
```

## 五、性能优化规则

### 5.1 热路径禁止操作

在每帧执行的代码中（update/draw），**禁止**：

```javascript
// ✗ 禁止：在热路径中创建对象/数组
for (var i = 0; i < enemies.length; i++) {
  var pos = { x: enemies[i].x, y: enemies[i].y }; // ✗ 每帧创建临时对象
}

// ✓ 正确：复用预分配对象
var _tempPos = { x: 0, y: 0 };
for (var i = 0; i < enemies.length; i++) {
  _tempPos.x = enemies[i].x;
  _tempPos.y = enemies[i].y;
}

// ✗ 禁止：热路径中字符串拼接颜色
ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; // 每帧创建新字符串

// ✓ 正确：缓存颜色字符串，仅在属性变化时重新计算
this.color = 'rgba(...)'; // 仅在构造时或属性变化时计算
ctx.fillStyle = this.color; // 每帧直接用缓存值
```

### 5.2 空间哈希（大量实体碰撞检测）

```javascript
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.grid = {};
  }
  rebuild(entities) {
    this.grid = {};
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      var key = ((e.x * this.invCellSize) | 0) + ',' + ((e.y * this.invCellSize) | 0);
      if (this.grid[key]) this.grid[key].push(e);
      else this.grid[key] = [e];
    }
  }
  query(x, y, radius, outArr) { /* ... */ }
}
```

### 5.3 对象池（爆炸粒子）

```javascript
var _pool = [];
var _poolSize = 200;

function getParticle() {
  return _pool.length > 0 ? _pool.pop() : new ExplosionParticle();
}

function releaseParticle(p) {
  if (_pool.length < _poolSize) _pool.push(p);
}
```

### 5.4 Canvas 绘制优化

```javascript
// ✓ 批量绘制同类型对象时，减少状态切换
ctx.fillStyle = enemyColor; // 设置一次
for (var i = 0; i < enemies.length; i++) {
  ctx.beginPath();
  ctx.arc(enemies[i].x, enemies[i].y, enemies[i].radius, 0, Math.PI * 2);
  ctx.fill();
}

// ✓ 使用 save/restore 包裹需要临时改变状态的绘制
ctx.save();
ctx.globalAlpha = 0.5;
ctx.shadowBlur = 10;
// ... 特效绘制
ctx.restore();

// ✓ 视口裁剪 — 不在屏幕内的对象不绘制
function isInView(x, y, r) {
  return x + r > camera.x && x - r < camera.x + screenW / camera.zoom &&
         y + r > camera.y && y - r < camera.y + screenH / camera.zoom;
}
```

## 六、Storage 操作规范

```javascript
// ★ 所有 Storage 操作必须 try-catch

// 读取
function loadData(key, defaultValue) {
  try {
    var data = wx.getStorageSync(key);
    return data || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// 写入
function saveData(key, value) {
  try { wx.setStorageSync(key, value); }
  catch (e) { console.warn('[Storage] save failed:', key, e); }
}
```

## 七、跨平台兼容

### 7.1 平台 API 隔离

微信版和抖音版的差异仅在：
- `wx.*` ↔ `tt.*`（全局 API 命名空间）
- 云函数 ↔ Express 后端
- `config.js`（抖音版独有，配置服务器地址）

### 7.2 抖音移植检查清单

- [ ] `wx.createCanvas()` → `tt.createCanvas()`
- [ ] `wx.getWindowInfo()` → `tt.getSystemInfoSync()`
- [ ] `wx.getStorageSync()` → `tt.getStorageSync()`
- [ ] `wx.setStorageSync()` → `tt.setStorageSync()`
- [ ] `wx.createWebAudioContext()` → `tt.createWebAudioContext()`
- [ ] `wx.createInnerAudioContext()` → `tt.createInnerAudioContext()`
- [ ] `wx.setInnerAudioOption()` → `tt.setInnerAudioOption()`
- [ ] `wx.onWindowResize()` → `tt.onWindowResize()`
- [ ] `wx.onShow()` → `tt.onShow()`
- [ ] `wx.shareAppMessage()` → `tt.shareAppMessage()`
- [ ] `wx.cloud.init()` → 移除，改用 HTTP API
- [ ] 云函数调用 → HTTP fetch 调用

## 八、调试与日志

### 8.1 日志格式

```javascript
console.log('[ModuleName] 描述: ' + value);
console.warn('[ModuleName] 警告描述:', error);
console.error('[ModuleName] 错误描述:', error);
```

### 8.2 开发模式开关

```javascript
const IS_DEV = false; // ★ 发布前改为 false
// IS_DEV = true 时的行为：
// - 自由选关（跳过解锁限制）
// - 显示 FPS
// - 显示碰撞框
// - 显示详细日志
```

### 8.3 测试模式标记

```javascript
// 每个有解锁机制的系统都需要测试模式开关
const CHAR_TEST_MODE = false;  // ★ 发布前改为 false
const SKIN_TEST_MODE = false;  // ★ 发布前改为 false
```
