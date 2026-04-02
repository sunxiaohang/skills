# 音效与动效规范

## 一、音效系统架构

### 1.1 双轨音效系统

| 轨道 | 技术 | 用途 | 格式 |
|------|------|------|------|
| 短音效（SFX） | `WebAudio API` 程序合成 | 点击/击杀/受伤/UI | 代码生成，无文件 |
| 背景音乐（BGM） | `InnerAudioContext` | 循环播放背景音乐 | WAV 文件 |

### 1.2 iOS 静音模式处理（必做）

```javascript
// 游戏启动时立即调用 — 忽略 iOS 静音开关
try { wx.setInnerAudioOption({ obeyMuteSwitch: false }); } catch (e) {}
```

### 1.3 WebAudio 上下文管理

```javascript
const SFX = {
  _ctx: null,
  _ensureContext() {
    if (!this._ctx) {
      try { this._ctx = wx.createWebAudioContext(); }
      catch (e) { console.warn('[SFX] createWebAudioContext failed:', e); return null; }
    }
    return this._ctx;
  },
  // ... 各音效方法
};
```

**关键规则**：
- WebAudio 上下文延迟创建（首次需要时才创建）
- 每个音效方法必须 try-catch（部分设备不支持 WebAudio）
- 音效方法返回前不能 await（避免阻塞游戏循环）

## 二、短音效设计指南

### 2.1 必备音效清单

每个游戏至少需要以下 8 种音效：

| 音效 | 触发时机 | 情绪 | 推荐波形 |
|------|----------|------|----------|
| 点击/选择 | UI 按钮点击 | 清脆、确认 | sine, 短促高频 |
| 攻击/瞬移 | 主要操作触发 | 力量、速度 | sine 滑频 200→1200Hz |
| 击杀/消灭 | 消灭敌人/占领 | 满足、成就 | triangle 880→1320→660Hz |
| 受伤 | 玩家受伤 | 警告、紧张 | sine 低频 180→60Hz |
| 连杀 | 连续击杀 | 激昂、递进 | 和弦 + 音调递增 |
| 道具拾取 | 拾取增益道具 | 愉悦、惊喜 | sine 高频上升 |
| 胜利 | 通关/胜利 | 欢庆、自豪 | 琶音上升和弦 |
| 失败 | Game Over | 遗憾、不甘 | 低频下降 + 衰减 |

### 2.2 程序合成音效模板

**攻击/瞬移音效**：
```javascript
playTeleport() {
  const c = this._ensureContext(); if (!c) return;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.2);
  } catch (e) {}
},
```

**击杀音效**：
```javascript
playKill() {
  const c = this._ensureContext(); if (!c) return;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.22);
  } catch (e) {}
},
```

**连杀音效（音调递增）**：
```javascript
playMultiKill(count) {
  const c = this._ensureContext(); if (!c) return;
  try {
    const now = c.currentTime;
    // 音调随连杀数递增
    const baseFreq = 440 + (count - 2) * 110; // 双杀440, 三杀550, ...
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.35);
  } catch (e) {}
},
```

### 2.3 音效参数规范

| 参数 | 推荐范围 | 说明 |
|------|----------|------|
| 音量（gain） | 0.1 - 0.3 | 避免破音，留 BGM 空间 |
| 时长 | 0.1 - 0.5 秒 | 短促有力 |
| 频率 | 60 - 2000 Hz | 低频=沉重，高频=清脆 |
| 波形 | sine/triangle | square/sawtooth 太刺耳 |

## 三、BGM 规范

### 3.1 播放控制

```javascript
playBGM() {
  this.stopBGM();
  const audio = wx.createInnerAudioContext();
  audio.src = 'voice/bgmusic.wav';
  audio.loop = true;
  audio.volume = 0.35;  // BGM 音量不超过 0.4
  audio.play();
  this._bgmAudio = audio;
  audio.onError(function(err) {
    console.warn('[SFX] BGM playback error:', err);
  });
},

stopBGM() {
  if (this._bgmAudio) {
    try { this._bgmAudio.stop(); } catch (e) {}
    try { this._bgmAudio.destroy(); } catch (e) {}
    this._bgmAudio = null;
  }
},
```

### 3.2 BGM 文件规范

| 属性 | 要求 |
|------|------|
| 格式 | WAV（兼容性最好） |
| 采样率 | 44100 Hz |
| 位深 | 16 bit |
| 声道 | 单声道（节省空间） |
| 时长 | 30-120 秒（循环播放） |
| 文件大小 | ≤ 1MB（否则影响包体） |
| 循环点 | 首尾无缝衔接 |

### 3.3 音频设置 UI

必须提供 BGM 和 SFX 的独立开关：

```javascript
// 设置界面
settingBgm: true,   // BGM 开关
settingSfx: true,   // SFX 开关

// 播放前检查开关
if (settingSfx) SFX.playKill();
if (settingBgm) SFX.playBGM();
```

## 四、视觉动效规范

### 4.1 爆炸粒子系统

击杀/消灭时的爆炸碎片效果：

```javascript
class ExplosionParticle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * force;
    this.vy = (Math.random() - 0.5) * force;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.02;
    this.radius = 2 + Math.random() * 3;
    this.color = color;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96; this.vy *= 0.96;
    this.life -= this.decay;
  }
}
```

**性能规则**：
- 使用对象池（预分配，回收复用）
- 每次爆炸粒子数 ≤ 30
- 粒子生命周期 ≤ 500ms

### 4.2 冲击波效果

```javascript
class Shockwave {
  constructor(x, y, dirX, dirY) {
    this.x = x; this.y = y;
    this.currentRadius = 0;
    this.maxRadius = 250;
    this.duration = 400; // ms
  }
  // 影响周围粒子，制造视觉冲击
}
```

### 4.3 连杀公告动画

```javascript
// 连杀公告 — 从中央弹出 + 缩放 + 淡出
function drawMultiKillAnnounce(ctx, text, progress) {
  var scale = easeOutBack(Math.min(1, progress * 3)); // 弹出效果
  var alpha = progress < 0.7 ? 1.0 : (1.0 - progress) / 0.3; // 淡出
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(screenW / 2, screenH * 0.35);
  ctx.scale(scale, scale);
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF8F00';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
```

### 4.4 数字飘字

```javascript
// 伤害/得分数字从实体位置向上飘出并淡出
class FloatingText {
  constructor(x, y, text, color) {
    this.x = x; this.y = y;
    this.text = text; this.color = color;
    this.life = 1.0;
    this.vy = -1.5; // 向上飘
  }
  update() {
    this.y += this.vy;
    this.life -= 0.02;
  }
  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
```

## 五、视觉反馈优先级

每个交互事件按以下优先级提供反馈：

| 优先级 | 反馈类型 | 响应时间 | 示例 |
|--------|----------|----------|------|
| P0 | 即时视觉变化 | ≤ 1 帧 | 按钮按下变色、角色位移 |
| P1 | 音效反馈 | ≤ 1 帧 | 点击音、击杀音 |
| P2 | 粒子/特效 | ≤ 3 帧 | 爆炸碎片、冲击波 |
| P3 | UI 公告 | ≤ 10 帧 | 连杀称号、成就弹窗 |
| P4 | 数值变化 | ≤ 10 帧 | 分数增加、血条变化 |
