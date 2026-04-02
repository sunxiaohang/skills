# 数值设计原则与模板

## 一、核心原则

### 1.1 数值集中管理（铁律）

**所有游戏数值必须集中在 `config-data.js` 中**，禁止在逻辑代码中硬编码数字。

正确示例（ClashKing）：
```javascript
// config-data.js
module.exports = {
  MARCH: {
    speed: 620,
    cols: 5,
    rowInterval: 0.18,
  },
  COLLISION_DIST: 30,
  AI_INTERVAL: { passive: 1.2, normal: 0.8, aggressive: 0.5 },
};
```

错误示例：
```javascript
// world-map.js 内直接写死数值
if (dist < 30) { ... }  // ✗ 禁止！应引用 CFG.COLLISION_DIST
```

### 1.2 心流理论驱动难度曲线

难度曲线必须遵循心流理论（Flow Theory）：

```
挑战度
  ↑
  │         ╱ 焦虑区（太难→弃游）
  │       ╱
  │     ╱ ★ 心流区（理想难度）
  │   ╱
  │ ╱ 无聊区（太简单→弃游）
  └─────────────→ 玩家技能
```

**实现方式**：
- 每波/每关难度递增系数 ≤ 15%
- 每 5 波/5 关设置一个「喘息关」（难度略降）
- 每 5 波/10 关设置一个「Boss 波」（难度峰值 → 突破后成就感）

### 1.3 三档难度系统

每个游戏必须提供至少 3 档难度：

```javascript
const DIFFICULTY_MULTIPLIERS = {
  easy:   { enemyCount: 0.7, enemySpeed: 0.8, reward: 0.8 },
  normal: { enemyCount: 1.0, enemySpeed: 1.0, reward: 1.0 },
  hard:   { enemyCount: 1.4, enemySpeed: 1.2, reward: 1.3 },
};
```

## 二、数值设计模板

### 2.1 敌人/NPC 等级系统

采用 Tier 系统，每级属性按公式推导，不手动填表：

```javascript
function buildTier(tier, maxTier) {
  const t = (tier - 1) / (maxTier - 1); // 归一化 0~1
  return {
    tier,
    radius: Math.round(BASE_RADIUS * (1 + GROWTH * t)),
    speed: BASE_SPEED * (1 - SLOW_FACTOR * t),
    hp: tier,
    mass: Math.pow(1 + GROWTH * t, 2),
    score: tier * BASE_SCORE,
  };
}
```

**原则**：
- 属性用归一化参数 `t ∈ [0, 1]` 插值，而非逐级手填
- 关键属性（HP、速度、大小）必须有明确的数学关系
- 高等级敌人引入「质变」而非仅「量变」（如分裂、特殊技能）

### 2.2 波次/关卡递进公式

```javascript
// 波次敌人数量公式
function waveEnemyCount(wave, difficulty) {
  const base = 3 + Math.floor(wave * 1.2);
  const isBoss = (wave % BOSS_INTERVAL === 0);
  return Math.round(base * difficulty.enemyCount * (isBoss ? 2 : 1));
}

// 波次敌人等级分布
function waveTierDistribution(wave) {
  // 低波次全是 T1，随波次递增高 Tier 占比
  const maxTier = Math.min(5, 1 + Math.floor(wave / 3));
  // 高 Tier 占比随波次线性增长
  const highTierRatio = Math.min(0.5, wave * 0.02);
  return { maxTier, highTierRatio };
}
```

### 2.3 经济系统平衡

如果游戏有货币/道具经济：

```
收入源头           消耗出口
─────────         ─────────
击杀奖励   ──→    角色解锁
通关奖励   ──→    皮肤购买
成就奖励   ──→    道具消耗
广告观看   ──→    复活消耗
```

**平衡规则**：
- 免费玩家通过正常游戏，应能在 7 天内解锁第一个付费内容
- 最贵的解锁项需要 30 天的正常游戏量
- 道具掉落概率按等级递增：`dropChance[tier] = 0.10 * tier`（T1=10%, T5=50%）

### 2.4 掉落概率与权重

```javascript
// 道具掉落权重（控制稀有度）
const POWERUP_WEIGHTS = [
  { type: 'common',  weight: 40 },  // 40%
  { type: 'uncommon', weight: 30 }, // 30%
  { type: 'rare',    weight: 20 },  // 20%
  { type: 'epic',    weight: 10 },  // 10%
];

// 加权随机选择
function weightedRandom(weights) {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return weights[0].type;
}
```

### 2.5 连杀/连胜奖励曲线

连杀奖励应呈超线性增长（鼓励高技巧操作）：

```javascript
// 连杀分数倍率
function multiKillMultiplier(count) {
  if (count <= 1) return 1.0;
  if (count === 2) return 1.5;   // 双杀
  if (count === 3) return 2.2;   // 三杀
  if (count === 4) return 3.0;   // 四杀
  if (count === 5) return 4.0;   // 五杀
  return 4.0 + (count - 5) * 1.0; // 超神
}

// 连杀称号
const MULTI_KILL_TITLES = ['', '', '双杀', '三杀', '四杀', '五杀'];
function getMultiKillTitle(count) {
  return count < MULTI_KILL_TITLES.length
    ? MULTI_KILL_TITLES[count]
    : count + '连杀！';
}
```

## 三、数值调优方法论

### 3.1 关键指标监控

| 指标 | 理想范围 | 含义 |
|------|----------|------|
| 首局通过率 | 60-80% | 太低=太难，太高=无挑战 |
| 平均局时长 | 2-5 分钟 | 太短=内容不足，太长=疲劳 |
| 第 5 关/波通过率 | 40-60% | 新手期结束的筛选点 |
| 第 10 关/波通过率 | 20-35% | 核心玩家的门槛 |
| 最高连杀中位数 | 3-5 | 连杀系统的激励效果 |
| 道具使用率 | ≥ 50% | 太低=道具无用或玩家不知道 |

### 3.2 「差一点」设计

失败时必须让玩家觉得「差一点就赢了」，驱动重试：

```javascript
// 失败时展示的鼓励数据
var defeatStats = {
  enemyKilled: killed,
  totalEnemy: total,
  maxOccupancy: maxPercent,  // "你曾占领了 78% 的地图！"
  almostMsg: getAlmostMessage(killed, total),
};

function getAlmostMessage(killed, total) {
  const ratio = killed / total;
  if (ratio > 0.8) return '再坚持一下就赢了！';
  if (ratio > 0.5) return '已经消灭了大半敌人！';
  return '熟能生巧，再来一局！';
}
```

## 四、随机性设计

### 4.1 可种子随机数

关卡生成使用可种子的伪随机数（保证同一关卡布局一致）：

```javascript
var _seed = 20260329;
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 2147483647;
}
function setSeed(s) { _seed = s; }
```

### 4.2 随机事件稀有度权重

```javascript
var RARITY_WEIGHTS = { normal: 4, rare: 2, epic: 1 };
```

事件系统设计原则：
- 正面事件略多于负面事件（6:4 比例），让玩家感觉「运气站在我这边」
- 史诗级事件出现频率极低，但效果戏剧性强（火山、陨石）
- 事件间隔随机（20-40 秒），避免可预测的节奏
