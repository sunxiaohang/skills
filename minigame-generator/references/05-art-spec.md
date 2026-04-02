# 美术设计与 Canvas 绘制规范

## 一、视觉风格定位

### 1.1 纯程序化绘制（铁律）

**禁止依赖任何外部图片资源**。所有视觉效果通过以下方式实现：
- Canvas 2D API（圆形、矩形、路径、渐变、阴影）
- Emoji 字符（图标、装饰）
- 程序化粒子系统

### 1.2 风格选择

每个游戏必须从以下两种 UI 风格中选择一种：

**A. Material Design 浅色方案**（适合休闲/动作游戏）
```javascript
const COLORS = {
  bg: '#FAFAFA',               // Grey 50 背景
  surface: '#FFFFFF',          // 卡片表面
  primary: '#009688',          // Teal 500 主色
  primaryLight: '#4DB6AC',     // Teal 300
  primaryDark: '#00796B',      // Teal 700
  title: '#212121',            // Grey 900
  subtitle: '#757575',         // Grey 600
  accent: '#FF8F00',           // Amber 800 强调
  error: '#F44336',            // Red 500
  divider: 'rgba(0,0,0,0.08)',
};
```

**B. Material Design 深色沉浸方案**（适合策略/冒险游戏）
```javascript
var MD = {
  primary: '#D4A843',             // 暖金色
  onPrimary: '#1A1208',
  secondary: '#78B0A8',           // 冷青色
  surface: '#0E0E12',             // 深色背景
  surfaceContainer: '#16161E',
  onSurface: '#E8E0D0',           // 主文字
  onSurfaceVariant: '#A09888',    // 次文字
  outline: '#585048',
  error: '#F05545',
  success: '#5CB85C',
  warning: '#E8A020',
};
```

## 二、布朗粒子背景系统（项目标配）

**每个游戏必须包含布朗粒子背景**，这是项目的视觉标识。

### 2.1 标准实现

```javascript
class BrownianParticleSystem {
  constructor({ worldWidth, worldHeight, particleCount,
                minRadius, maxRadius, brownianForce, damping, colors }) { ... }
  update(dt) {
    const sqrtDt = Math.sqrt(dt * 60); // 归一化到 60fps
    for (const p of this.particles) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = (Math.random() + Math.random() + Math.random()) / 3;
      p.vx = (p.vx + Math.cos(angle) * magnitude * force * sqrtDt) * damping;
      p.vy = (p.vy + Math.sin(angle) * magnitude * force * sqrtDt) * damping;
      p.x += p.vx;
      p.y += p.vy;
      // 边界软碰撞
      if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
      // ...
    }
  }
  draw(ctx) {
    for (const p of this.particles) {
      // 绘制光晕
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = /* 极低透明度 */;
      ctx.fill();
      // 绘制核心
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
  }
}
```

### 2.2 三层粒子系统

| 层 | 用途 | 数量 | 参数 |
|----|------|------|------|
| 世界粒子 | 跟随镜头，地图装饰 | 200-600 | brownianForce=0.5, damping=0.98 |
| 屏幕粒子 | 不跟随镜头，全屏装饰 | 60-100 | brownianForce=0.2, damping=0.97 |
| 菜单粒子 | 菜单背景装饰 | 30-60 | brownianForce=0.15, damping=0.96 |

### 2.3 粒子颜色规范

- 浅色方案：使用低透明度的主题色（`rgba(r,g,b,0.06~0.18)`）
- 深色方案：使用低透明度的灰色/金色（`rgba(r,g,b,0.06~0.12)`）
- 粒子颜色池至少 4-5 种颜色，增加视觉层次

## 三、绘制规范

### 3.1 圆角矩形

标准圆角矩形绘制函数（每个游戏都需要）：

```javascript
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
```

### 3.2 同心圆环绘制（游戏对象标准外观）

```javascript
// 所有游戏对象（玩家/敌人）使用同心圆环绘制
function drawEntity(ctx, x, y, radius, colors, ringCount) {
  for (var i = ringCount - 1; i >= 0; i--) {
    var t = ringCount > 1 ? i / (ringCount - 1) : 0;
    var r = radius * (1 - t * 0.55);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
```

### 3.3 颜色插值（生命值视觉反馈）

```javascript
// 根据生命比例在两种颜色间线性插值
function lerpColor(healthy, damaged, ratio) {
  return {
    r: Math.round(healthy.r + (damaged.r - healthy.r) * ratio),
    g: Math.round(healthy.g + (damaged.g - healthy.g) * ratio),
    b: Math.round(healthy.b + (damaged.b - healthy.b) * ratio),
  };
}
```

### 3.4 脉动动画

```javascript
// 呼吸效果
var breathAmplitude = 1.0;
var breathPhase = 0;
breathPhase += 0.003; // 每帧递增
var breathScale = 1 + breathAmplitude * Math.sin(breathPhase) * 0.03;
```

### 3.5 渐变背景

```javascript
// 暖色调渐变背景（策略游戏推荐）
var grad = ctx.createLinearGradient(0, 0, 0, screenH);
grad.addColorStop(0, '#F5F0E8');
grad.addColorStop(0.35, '#F2ECE0');
grad.addColorStop(0.65, '#EBE2D2');
grad.addColorStop(1.0, '#DED4C0');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, screenW, screenH);
```

## 四、Emoji 使用规范

### 4.1 适用场景

| 用途 | 示例 | 说明 |
|------|------|------|
| 菜单按钮图标 | 🎮 🏆 🔧 📖 | 增加可识别性 |
| 成就图标 | 🌱 ⚔️ 🏅 👑 💀 | 表达成就主题 |
| 地形/状态标记 | 🌾 🏰 🌿 🗼 🌫 🧨 | 直观传达信息 |
| 道具图标 | ⚡ 🔮 🛡 💥 | 快速识别道具类型 |
| 角色/皮肤图标 | 🥷 👻 🦏 ⏳ 🪞 | 角色身份标识 |

### 4.2 Emoji 绘制注意事项

- Emoji 的 `textAlign` 和 `textBaseline` 在不同平台表现不一致
- 推荐使用 `ctx.textAlign = 'center'` + `ctx.textBaseline = 'middle'`
- Emoji 大小通过 `ctx.font` 的字号控制
- 部分 Emoji 在 Android 和 iOS 上外观差异较大，选择差异小的

## 五、动画系统

### 5.1 缓动函数库

每个游戏应包含以下标准缓动函数：

```javascript
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function easeOutBack(t) { var c = 1.70158; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); }
function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
}
```

### 5.2 场景切换动画

```javascript
var _sceneTransition = {
  active: false,
  progress: 0,
  duration: 0.35,
  type: 'fade',   // 'fade' | 'slideLeft' | 'slideRight'
};
```

- 场景切换必须有过渡动画（≥ 0.3 秒）
- 菜单→游戏用 `fade`
- 菜单项之间用 `slideLeft/slideRight`

## 六、HUD 设计规范

### 6.1 胶囊形 HUD 条

```javascript
// 标准 HUD 样式
var HUD = {
  barH: 30,          // 条高
  barR: 15,          // 圆角（barH/2 = 胶囊形）
  padX: 14,          // 左右内边距
  topMargin: 8,      // 距顶边距
  rightSafe: 90,     // 右侧预留小程序胶囊按钮区域
  panelBg: 'rgba(255,255,255,0.88)',
  panelBorder: 'rgba(0,0,0,0.08)',
  panelShadow: 'rgba(0,0,0,0.12)',
};
```

### 6.2 小地图（地图类游戏）

- 固定在屏幕左下或右下角
- 尺寸 80-100 px
- 半透明背景
- 显示玩家位置、敌方位置、已占领区域
