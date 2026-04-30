---
name: minigame-generator
description: >
  This skill provides comprehensive standards and constraints for generating WeChat/Douyin mini-game projects.
  It covers gameplay feasibility, numerical design, human psychology exploitation, mobile UX, user retention,
  art direction, audio/VFX specs, coding conventions, and common bug prevention.
  This skill should be used whenever the user wants to create a new mini-game, review an existing mini-game,
  or discuss game design decisions for Canvas 2D based mini-game projects targeting WeChat or Douyin platforms.
---

# 微信/抖音小游戏生成规范（MinigameCollection 专用）

本 Skill 为「MinigameCollection」项目量身定制，基于 AssassinLines（双摇杆动作生存）和 ClashKing（六边形策略征服）两款已上线游戏的实战经验提炼而成。

---

## 一、适用范围

本规范适用于以下场景：
- 从零创建一款新的微信/抖音小游戏
- 为现有游戏新增核心系统（角色/敌人/关卡/成就等）
- 审查和优化现有游戏的数值/体验/代码质量
- 跨平台移植（微信 ↔ 抖音）

---

## 二、技术栈约束（不可违反）

| 层面 | 规范 |
|------|------|
| 渲染引擎 | **原生 Canvas 2D**，禁止引入第三方游戏引擎 |
| 模块系统 | **CommonJS**（`require` / `module.exports`） |
| 视觉资源 | **纯程序化绘制 + Emoji 图标**，禁止依赖外部图片资源 |
| 平台 API | 微信用 `wx.*`，抖音用 `tt.*`，通过入口文件隔离 |
| 音效方案 | **WebAudio API 程序合成**短音效 + `InnerAudioContext` 播放 BGM |
| 存储方案 | `wx.getStorageSync` / `wx.setStorageSync`，必须 try-catch |
| 屏幕方向 | **强制横屏**（`game.json: deviceOrientation: "landscape"`） |
| 高 DPI | `ctx.scale(dpr, dpr)` 或 `ctx.setTransform`，逻辑坐标与物理像素分离 |
| 字体 | 仅使用系统 `sans-serif`，禁止引入自定义字体文件 |
| 包体大小 | 主包 ≤ 4MB（微信限制），总包 ≤ 20MB |

---

## 三、项目结构规范

每个新游戏必须遵循以下目录结构：

```
GameName/
├── game.js                    # 入口文件（场景系统 + 游戏循环 + 输入处理）
├── game.json                  # 小游戏配置（横屏 + 网络超时）
├── project.config.json        # 项目配置
├── code.fortify.config.json   # 代码保护配置（水印/混淆/防注入/平台锁）
├── js/
│   ├── config-data.js         # ★ 数值配置中心（所有游戏数值集中管理）
│   ├── config-text.js         # ★ 文本配置中心（所有显示文本集中管理）
│   ├── [gameplay-modules].js  # 核心玩法模块（每模块职责单一）
│   ├── particle-system.js     # 布朗粒子背景系统（项目标配）
│   ├── sfx.js                 # 音效系统
│   └── utils.js               # 工具函数
├── voice/                     # 音频资源（仅 BGM）
│   └── bgmusic.wav
└── cloudfunctions/            # 微信云函数（如有排行榜）
    ├── submitScore/
    └── getLeaderboard/
```

**核心原则**：（小游戏生存法则）

> 小游戏 ≠ 小型独立游戏。小游戏是零食，独立游戏是私厨，3A是自助餐。理解定位差异，才能做对设计决策。

| 编号 | 原则 | 说明 |
|------|------|------|
| **SKL-01** | 零食定位 | 不求营养均衡，只求一口够爽、够冲、有记忆点。对抗的不是其他游戏，是用户的“无聊时间缝隙”（等电梯、蹲厕所、排队、摸鱼）。 |
| **SKL-02** | 3秒上手 | 不给教学关。用直觉操作（点、拖、划、点按）替代多步骤指令。任何需要文字解释的机制都是失败的。 |
| **SKL-03** | 15-45秒单局 | 一局必须在这个区间内完成闭环。超过45秒，用户会焦虑并退出。 |
| **SKL-04** | 立即重试 | 失败后点一下（或自动）重置，零等待。任何“重新开始”按钮超过一次点击都是罪过。 |
| **SKL-05** | 一次操作一个决策 | 不要让玩家在一局内做多个复杂选择。操作链越短越好。 |
| **SKL-06** | 操作即直觉 | 操作符合常识和直觉 无需额外学习 |
| **SKL-07** | 反常理 = 可传播 | 机制不是“好”，是“反常”。用脸弹射 > 精准蓄力；打喷嚏推进 > 平滑加速。反常理的事故瞬间最容易截图传播。 |
| **SKL-08** | 截图即传播 | 任何一个游戏截图单独放朋友圈/小红书，必须有人问“这是什么游戏”。做不到就说明没有传播基因。 |
| **SKL-09** | 结果即梗 | 用户分享的不是“我赢了”，而是“你看这发生了什么”——离谱、荒诞、意料之外的瞬间。分享动机 = 社交货币。 |
| **SKL-10** | 3秒视频测试 | 给路人看3秒无声画面，他必须能说出“这游戏在干什么”。说不出的，砍掉重做。 |
| **SKL-11** | 必须有进度感 | 即使数字也好。金币/分数/段位/皮肤碎片——给一个“我在积累”的错觉。 |
| **SKL-12** | 5局法则 | 玩5局之后，玩家必须能看到新东西（随机事件/新皮肤提示/更高目标）。否则流失。 |
| **SKL-13** | 每日仪式 | 用“每日随机挑战”（3个即可）替代复杂关卡地图。每天3分钟，养成习惯。 |
| **SKL-14** | 失败测试 | 玩家输了之后，第一反应是“再来一局”还是“算了”？后者超过30%即有问题。 |

---

## 四、核心规范模块

以下每个模块的详细规范见 `references/` 目录。在创建新游戏时，必须按顺序逐项检查：

### 4.1 玩法可行性评估（创建前必做）

详见 → `references/01-gameplay-feasibility.md`

核心检查项：
- 核心循环是否能在 30 秒内让玩家理解？
- 单局时长是否适合碎片化（2-5 分钟最佳）？
- Canvas 2D 能否实现所需的视觉效果？
- 操作是否适合手机横屏触控（≤2 根手指）？

### 4.2 数值设计

详见 → `references/02-numerical-design.md`

核心原则：
- 所有数值必须集中在 `config-data.js`，禁止硬编码在逻辑中
- 难度曲线遵循「心流理论」— 挑战略高于玩家当前能力
- 必须提供至少 3 档难度（简单/普通/困难）或自适应难度

### 4.3 人性弱点与用户粘性

详见 → `references/03-human-psychology.md`

必须包含的粘性系统（至少实现 4 个）：
- 成就系统（里程碑追踪）
- 排行榜（社交比较）
- 角色/皮肤解锁（收集欲）
- 分享复活（病毒传播）
- 连胜/连杀系统（动量激励）
- 每日挑战/赛季系统（日活回流）

### 4.4 手机操作规范

详见 → `references/04-mobile-ux.md`

不可违反的规则：
- 触控热区 ≥ 44×44 px
- 按钮间距 ≥ 8 px
- 刘海屏/安全区域必须完整处理
- 支持竖屏数据到横屏的坐标系转换
- 手动旋转兜底（`_needManualRotate`）

### 4.5 美术设计规范

详见 → `references/05-art-spec.md`

核心约束：
- 不使用外部图片，纯 Canvas 2D 程序化绘制
- 必须有布朗粒子背景系统（项目视觉标识）
- UI 遵循 Material Design 风格（浅色或深色方案）
- 颜色系统完整定义（primary/secondary/surface/error 等）

### 4.6 音效与动效规范

详见 → `references/06-audio-vfx.md`

核心约束：
- 短音效全部 WebAudio API 程序合成，禁止加载音频文件
- BGM 使用 `InnerAudioContext` + WAV 文件
- iOS 静音模式必须处理（`wx.setInnerAudioOption({ obeyMuteSwitch: false })`）
- 每个关键交互必须有音效反馈（点击/击杀/受伤/胜利/失败）

### 4.7 编程约束规则

详见 → `references/07-code-conventions.md`

命名规范：
- 常量：`UPPER_SNAKE_CASE`（`PLAYER_CONFIG`、`GAME_CONFIG`）
- 类：`PascalCase`（`Player`、`Enemy`、`Camera`）
- 私有变量：`_camelCase`（`_charDef`、`_pendingAnnounce`）
- 模块级变量：`var` 声明；函数内用 `const` / `let`

性能规范：
- 游戏循环必须用 `requestAnimationFrame`
- deltaTime 必须有上限（`Math.min(dt, 0.05)`）
- 粒子系统用空间哈希/对象池优化
- 避免每帧 GC — 禁止在热路径中创建临时对象/数组

### 4.8 常见 Bug 检查清单

详见 → `references/08-bug-checklist.md`

每次提交前必须检查的 Top 20 Bug：
1. DPI 不匹配导致模糊/偏移
2. 横屏旋转未完成时的竖屏数据
3. safeArea 坐标系不匹配
4. 热启动 canvas 状态重置
5. 触摸坐标未做手动旋转映射
6. Storage 读写未 try-catch
7. 音效上下文未延迟创建
8. 分享复活后状态未正确恢复
9. ... （完整清单见参考文档）

---

## 五、新游戏创建 SOP（标准操作流程）

### Phase 1 — 概念验证（30 分钟）

1. 用一句话描述核心玩法
2. 检查 `references/01-gameplay-feasibility.md` 中的可行性清单
3. 确定游戏类型（动作/策略/益智/休闲）
4. 确定核心循环（输入→反馈→奖励）
5. 手绘操作示意（几根手指、哪些手势）

### Phase 2 — 数值原型（1 小时）

1. 创建 `config-data.js` — 定义所有核心数值
2. 创建 `config-text.js` — 定义所有显示文本
3. 设计难度曲线（3 档或自适应）
4. 设计经济系统（如有：货币/道具/解锁）

### Phase 3 — 核心框架搭建

1. 创建标准目录结构
2. 实现 `game.js` 骨架（Canvas 初始化 + DPI + 安全区域 + 游戏循环 + 场景系统）
3. 实现布朗粒子背景
4. 实现基础 UI 框架（菜单/设置/玩法说明）
5. 实现音效系统骨架

### Phase 4 — 核心玩法实现

1. 实现核心游戏对象（玩家/敌人/地图等）
2. 实现核心交互（触控输入 → 游戏响应）
3. 实现碰撞检测
4. 实现胜负判定
5. 实现 HUD（体力量/分数/进度等）

### Phase 5 — 粘性系统

1. 实现成就系统
2. 实现排行榜（本地 + 云端）
3. 实现角色/皮肤解锁
4. 实现分享复活
5. 实现难度设置

### Phase 6 — 质量保证

1. 跑 `references/08-bug-checklist.md` 全部检查项
2. 在真机（iPhone + Android）上测试横屏/刘海/安全区域
3. 测试从后台切回的热启动恢复
4. 测试弱网/断网场景
5. 配置代码保护（`code.fortify.config.json`）

### Phase 7 — 跨平台移植（如需抖音版）

1. 复制整个目录为 `douyin-minigame/`
2. 全局替换 `wx.` → `tt.`
3. 云函数替换为自建 Express + SQLite 后端
4. 新增 `config.js`（服务器地址配置）
5. 调整平台特定 API 差异

---

## 六、代码审查触发规则

在以下场景中，自动应用本 Skill 的规范进行审查：

1. 新建 `.js` 文件时 → 检查模块结构、命名规范
2. 修改 `config-data.js` 时 → 检查数值合理性
3. 修改触控/输入相关代码时 → 检查安全区域、坐标转换
4. 修改音效代码时 → 检查 iOS 兼容性
5. 修改 Canvas 绘制代码时 → 检查 DPI 处理
6. 提交/发布前 → 完整 Bug Checklist

---

## 七、参考文档索引

所有详细规范存放在 `references/` 目录：

| 文件 | 内容 |
|------|------|
| `01-gameplay-feasibility.md` | 玩法可行性评估框架 |
| `02-numerical-design.md` | 数值设计原则与模板 |
| `03-human-psychology.md` | 人性弱点利用与用户粘性策略 |
| `04-mobile-ux.md` | 手机操作与横屏适配规范 |
| `05-art-spec.md` | 美术设计与 Canvas 绘制规范 |
| `06-audio-vfx.md` | 音效与动效规范 |
| `07-code-conventions.md` | 编程约束与性能优化规则 |
| `08-bug-checklist.md` | 常见 Bug 检查清单（Top 30） |

需要某个领域的详细规范时，读取对应的参考文档。
