/**
 * ═══════════════════════════════════════════════════════════════
 *  Material Design 3 — 设计令牌 (Design Tokens)
 *  适配微信小游戏 Canvas 2D 环境
 * ═══════════════════════════════════════════════════════════════
 */

// ============================================================
// 1. 颜色系统 (Color System)
// ============================================================

/** MD3 亮色主题 */
const LightTheme = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',

  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',

  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',

  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',

  surface: '#FEF7FF',
  onSurface: '#1D1B20',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  surfaceDim: '#DED8E1',
  surfaceBright: '#FEF7FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F2FA',
  surfaceContainer: '#F3EDF7',
  surfaceContainerHigh: '#ECE6F0',
  surfaceContainerHighest: '#E6E0E9',

  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#322F35',
  inverseOnSurface: '#F5EFF7',
  inversePrimary: '#D0BCFF',
};

/** MD3 暗色主题 */
const DarkTheme = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',

  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',

  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',

  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',

  surface: '#141218',
  onSurface: '#E6E0E9',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',

  surfaceDim: '#141218',
  surfaceBright: '#3B383E',
  surfaceContainerLowest: '#0F0D13',
  surfaceContainerLow: '#1D1B20',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  surfaceContainerHighest: '#36343B',

  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E6E0E9',
  inverseOnSurface: '#322F35',
  inversePrimary: '#6750A4',
};

/**
 * 基于品牌色生成自定义主题
 * @param {string} seedColor - 十六进制主色 如 '#FF5722'
 * @param {boolean} dark - 是否暗色主题
 * @returns {object} 完整主题对象
 */
function createCustomTheme(seedColor, dark = false) {
  const base = dark ? { ...DarkTheme } : { ...LightTheme };
  const hsl = hexToHSL(seedColor);
  // Primary 色调
  base.primary = seedColor;
  base.onPrimary = hsl.l > 50 ? '#000000' : '#FFFFFF';
  base.primaryContainer = hslToHex(hsl.h, Math.min(hsl.s, 90), dark ? 30 : 90);
  base.onPrimaryContainer = hslToHex(hsl.h, Math.min(hsl.s, 80), dark ? 90 : 10);
  return base;
}

// ============================================================
// 2. 排版系统 (Typography)
// ============================================================

const Typography = {
  displayLarge:  { size: 57, lineHeight: 64, weight: 400, tracking: -0.25 },
  displayMedium: { size: 45, lineHeight: 52, weight: 400, tracking: 0 },
  displaySmall:  { size: 36, lineHeight: 44, weight: 400, tracking: 0 },

  headlineLarge:  { size: 32, lineHeight: 40, weight: 400, tracking: 0 },
  headlineMedium: { size: 28, lineHeight: 36, weight: 400, tracking: 0 },
  headlineSmall:  { size: 24, lineHeight: 32, weight: 400, tracking: 0 },

  titleLarge:  { size: 22, lineHeight: 28, weight: 500, tracking: 0 },
  titleMedium: { size: 16, lineHeight: 24, weight: 500, tracking: 0.15 },
  titleSmall:  { size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },

  bodyLarge:  { size: 16, lineHeight: 24, weight: 400, tracking: 0.5 },
  bodyMedium: { size: 14, lineHeight: 20, weight: 400, tracking: 0.25 },
  bodySmall:  { size: 12, lineHeight: 16, weight: 400, tracking: 0.4 },

  labelLarge:  { size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },
  labelMedium: { size: 12, lineHeight: 16, weight: 500, tracking: 0.5 },
  labelSmall:  { size: 11, lineHeight: 16, weight: 500, tracking: 0.5 },
};

/**
 * 应用排版样式到 Canvas ctx
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} styleName - Typography 中的键名
 * @param {number} scale - ScreenAdapter 的缩放比例
 */
function applyTypography(ctx, styleName, scale = 1) {
  const style = Typography[styleName];
  if (!style) return;
  const weight = style.weight >= 500 ? 'bold' : 'normal';
  ctx.font = `${weight} ${Math.round(style.size * scale)}px "PingFang SC", "Helvetica Neue", sans-serif`;
  ctx.textBaseline = 'top';
}

// ============================================================
// 3. 形状系统 (Shape)
// ============================================================

const Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
};

// ============================================================
// 4. Elevation 投影
// ============================================================

const Elevation = {
  level0: { blur: 0,  spread: 0, offsetY: 0,  opacity: 0 },
  level1: { blur: 3,  spread: 1, offsetY: 1,  opacity: 0.15 },
  level2: { blur: 6,  spread: 2, offsetY: 2,  opacity: 0.15 },
  level3: { blur: 8,  spread: 3, offsetY: 4,  opacity: 0.18 },
  level4: { blur: 10, spread: 4, offsetY: 6,  opacity: 0.20 },
  level5: { blur: 16, spread: 6, offsetY: 8,  opacity: 0.22 },
};

/** Canvas 投影渲染 */
function applyShadow(ctx, level, scale = 1) {
  const e = Elevation[level] || Elevation.level0;
  ctx.shadowColor = `rgba(0,0,0,${e.opacity})`;
  ctx.shadowBlur = e.blur * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = e.offsetY * scale;
}

function clearShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// ============================================================
// 5. 动效系统 (Motion)
// ============================================================

const Duration = {
  short1: 50,   short2: 100,  short3: 150,  short4: 200,
  medium1: 250, medium2: 300, medium3: 350, medium4: 400,
  long1: 450,   long2: 500,   long3: 550,   long4: 600,
  extraLong1: 700, extraLong2: 800, extraLong3: 900, extraLong4: 1000,
};

const Easing = {
  standard:    (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  emphasized:  (t) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+1,2)/2,
  decelerate:  (t) => 1 - Math.pow(1-t, 3),
  accelerate:  (t) => t * t * t,
  linear:      (t) => t,
};

// ============================================================
// 6. 工具函数
// ============================================================

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null;
}

function hexToHSL(hex) {
  const rgb = hexToRgb(hex);
  let r = rgb.r/255, g = rgb.g/255, b = rgb.b/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k = (n + h/30) % 12; return l - a*Math.max(Math.min(k-3,9-k,1),-1); };
  const toHex = x => Math.round(x*255).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexWithAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  LightTheme, DarkTheme, createCustomTheme,
  Typography, applyTypography,
  Shape, Elevation, applyShadow, clearShadow,
  Duration, Easing,
  hexToRgb, hexToHSL, hslToHex, hexWithAlpha,
};
