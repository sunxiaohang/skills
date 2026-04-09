> **Note:** 本仓库包含 Anthropic 为 Claude 实现的skills实现。有关 Agent Skills 标准的信息，请参阅 [agentskills.io](http://agentskills.io)。

# Skills
skills是包含指令、脚本和资源的文件夹，Claude 会动态加载它们以提升在特定任务上的表现。skills教会 Claude 如何以可重复的方式完成特定任务——无论是按照你公司的品牌指南创建文档、使用你所在组织的特定工作流程分析数据，还是自动化处理个人事务。

更多信息请查看：
- [什么是skills？](https://support.claude.com/en/articles/12512176-what-are-skills)
- [在 Claude 中使用skills](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [如何创建自定义skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [通过 Agent Skills 为智能体装备应对真实世界的能力](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

# 关于本仓库

本仓库包含演示 Claude skills系统能力的示例skills。这些skills涵盖创意应用（艺术、音乐、设计）、技术任务（测试 Web 应用、MCP 服务端生成）到企业工作流（沟通、品牌等）。

每个skills都独立存放在自己的文件夹中，文件夹内包含 `SKILL.md` 文件，其中含有 Claude 使用的指令和元数据。浏览这些skills，为自己的skills寻找灵感，或者理解不同的模式和实现思路。

本仓库中的许多skills是开源的（Apache 2.0）。我们还在 [`skills/docx`](./skills/docx)、[`skills/pdf`](./skills/pdf)、[`skills/pptx`](./skills/pptx) 和 [`skills/xlsx`](./skills/xlsx) 子文件夹中包含了驱动 [Claude 文档能力](https://www.anthropic.com/news/create-files) 的底层文档创建与编辑skills。这些skills提供源代码（并非开源），但我们希望将它们分享给开发者，作为在生产级 AI 应用中实际使用的复杂skills的参考。

## 免责声明

**这些skills仅用于演示和教育目的。** 尽管其中部分能力可能在 Claude 中可用，但 Claude 的实际实现和行为可能与这些skills中展示的不同。这些skills旨在说明可能的模式和思路。在依赖这些skills处理关键任务之前，请务必在自己的环境中充分测试。

# skills集合
- [./skills](./skills)：创意与设计、开发与技术、企业及沟通、文档skills等示例skills
- [./spec](./spec)：Agent Skills 规范
- [./template](./template)：skills模板

# 在 Claude Code、Claude.ai 和 API 中试用

## Claude Code
你可以通过以下命令在 Claude Code 中将本仓库注册为 Claude Code 插件市场：
/plugin marketplace add anthropics/skills

text

然后，安装特定的skills集：
1. 选择 `Browse and install plugins`
2. 选择 `anthropic-agent-skills`
3. 选择 `document-skills` 或 `example-skills`
4. 选择 `Install now`

或者，直接通过以下命令安装任一插件：
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills

text

安装插件后，只需提及skills即可使用。例如，如果你从市场安装了 `document-skills` 插件，可以要求 Claude Code 执行类似这样的操作：“使用 PDF skills提取 `path/to/some-file.pdf` 中的表单字段”

## Claude.ai

Claude.ai 的付费套餐用户已经可以使用这些示例skills。

要使用本仓库中的任何skills或上传自定义skills，请按照[在 Claude 中使用skills](https://support.claude.com/en/articles/12512180-using-skills-in-claude#h_a4222fa77b)中的说明操作。

## Claude API

你可以通过 Claude API 使用 Anthropic 预构建的skills，并上传自定义skills。更多信息请参阅 [Skills API 快速入门](https://docs.claude.com/en/api/skills-guide#creating-a-skill)。

# 创建一个基础skills

创建skills非常简单——只需一个包含 `SKILL.md` 文件的文件夹，其中包含 YAML 前置元数据和指令。你可以使用本仓库中的 **template-skill** 作为起点：

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2

# skills 技巧
## 模块化任务分解边界清晰，职责单一，一个 Skills 专注一件事
核心原则：

将复杂任务拆分成多个独立的 Skills ,每个 Skills 只负责一个明确的功能
避免创建"万能 Skills",保持单一职责原则，方便维护和组合使用，灵活应对不同场景
示例：

```
❌ 不好: 创建一个 "web-development" Skill 处理所有前端任务
✅ 好的: 分别创建 "react-component-builder"、"api-integration"、"ui-styling" 等专项 Skill
```

##提供清晰的触发条件 - 让 AI 知道何时使用
核心原则：

在 description 中清晰描述技能的适用场景、结合精确关键词和语义理解,通过触发条件激活相关 Skills ，避免误触发
使用"当用户提到 X 时"、"适用于 Y 场景"等明确表述
示例：
```
## 触发条件
- 用户提到"小红书"、"发布笔记"
- 需要生成符合小红书风格的内容
- 涉及小红书 API 调用或数据处理
```

## 热数据前置 - 高频信息优先加载
核心原则：

识别 80% 场景下会用到的"热数据",放在核心指令层
20% 的边缘场景数据作为"冷数据",外部存储
示例：

```
## ? 热数据(核心指令层)
### 最常用的 3 个 API
```python
# 1. 发布笔记(使用率 85%)
create_note(title, content, images)
 
# 2. 上传图片(使用率 80%)
upload_image(file_path)
 
# 3. 获取笔记状态(使用率 60%)
get_note_status(note_id)
```
 
## ❄️ 冷数据(外部引用)
- 完整 API 列表(50+ 接口) → 存储在 `api_reference.md`
- 历史版本兼容性 → 存储在 `CHANGELOG.md`
- 高级配置参数 → 使用时通过 `read_file` 工具获取
```

## 参考官方 Skills 模版案例，示例代码分级，借助 AI 快速生成
核心原则：

参考官方模版，在 Skills 中提供完整的代码示例和配置模板，核心层只提供 1-2 个最简示例(< 10 行代码)
完整教程、高级用法作为外部资源引用
示例：

```
## ? 快速开始(核心层)
```python
# 30 秒上手
from xhs import Client
client = Client(api_key="your_key")
client.create_note("标题", "内容", ["image.jpg"])
```
## ? 完整教程(外部资源)
- 高级配置 → `examples/advanced_usage.py`
- 批量操作 → `examples/batch_processing.py`
- 最佳实践 → `docs/best_practices.md`
 
(AI 会根据用户需求自动读取相应文件)
```

## 三层信息架构 - 渐进式披露内容
核心原则：

将 Skills 内容分为三层:元数据(Meta)、核心指令(Instruction)、参考资源(Reference)
只在需要时逐层加载,避免一次性塞入所有信息
示例：

```
## ? 元数据层 (≤200 tokens, 始终加载)
**触发词:** 小红书、RED、发布笔记
**适用场景:** 内容发布、数据分析
**依赖:** Python 3.8+, requests
 
---
## ? 核心指令层 (触发时加载)
### 基础发布流程
1. 认证 → 2. 上传图片 → 3. 创建笔记
 
### 关键 API
- `create_note(title, content, images)`
- `upload_image(file_path)`
 
---
## ? 参考资源层 (按需加载)
- 完整 API 文档 → 使用 `web_fetch` 工具获取
- 错误码对照表 → 遇到错误时查询
- 高级配置示例 → 用户明确需要时提供
```

## 组合优先 - 设计可被调用的 Skills
核心原则：

Skills 应该像"乐高积木",可以被自由组合和复用
通过参数传递配置,而不是写死在代码中
提供稳定的接口(合约),确保向后兼容
示例：

# Brand Content Generator (正确示范)
## 触发条件
- 用户提到"生成品牌内容"、"营销文案"
- 其他 Skill 调用本 Skill 的内容生成能力
 
## 接口定义(合约)
 
### 输入参数
```typescript
interface BrandConfig {
  // 必填参数
  companyName: string;        // 公司名称
  topic: string;              // 内容主题

  // 可选参数(有默认值)
  brandColor?: string;        // 品牌色,默认 #000000
  slogan?: string;            // 品牌口号,默认为空
  targetAudience?: string;    // 目标用户,默认"大众"
  contentStyle?: string;      // 内容风格,默认"专业"
  platform?: string;          // 发布平台,默认"小红书"
}
```
### 输出格式
```typescript
interface GeneratedContent {
  title: string;              // 标题
  content: string;            // 正文
  hashtags: string[];         // 话题标签
  style: object;              // 样式配置
  metadata: object;           // 元数据
}
```
## 使用示例
 
### 示例 1:直接调用(腾讯)
```python
result = generate_brand_content({
    "companyName": "腾讯科技",
    "topic": "AI 编程助手发布",
    "brandColor": "#006EFF",
    "slogan": "用户为本,科技向善",
    "targetAudience": "开发者",
    "contentStyle": "科技感"
})
```
 
## 识别何时应该创建 Skills - 四大黄金信号
核心原则：

核心原则: 使用高频 × 任务复杂度 x 团队规模 = Skill 价值，例如：
同一任务频繁执行；
Prompt 较长（超过 2000 字）；
团队协作、知识共享；
任务包含脚本执行或模板生成。
例如一次性小任务，不建议使用
示例：

```
频率:每天 1 次,每周 5 次
重复内容:
1. 从数据库提取昨日数据
2. 计算 10+ 个指标(DAU、留存率、转化率...)
3. 生成 Excel 报表
4. 发送邮件给管理层
5. 上传到共享文件夹
 
每次手动输入:
"帮我生成昨日数据报表,需要包括:
- DAU、MAU、留存率
- 新增用户、活跃用户
- 转化漏斗各环节数据
- 同比、环比分析
- 生成 Excel 格式
- 发送给 boss@company.com
..."
(每次输入 200+ 字,耗时 2 分钟)
```

## 动态上下文管理 - 用完即释放
核心原则：

Skills 执行完任务后,主动提示 AI 释放详细文档
使用"会话状态标记"避免重复加载
示例：

```
# 上下文管理策略
 
## 任务开始
1. 加载核心指令层
2. 根据用户需求按需加载参考资源
 
## 任务完成
3. 提示 AI: "详细文档已使用完毕,可释放上下文"
4. 保留元数据层,以便后续快速重新激活
 
## 多轮对话优化
- 使用 `.skill_cache.json` 记录已加载的资源
- 避免同一会话中重复加载相同文档
```

## Skills 的测试与版本管理 - 像对待代码一样对待 Prompt
核心原则：

Prompt = Code,必须可测试、可回滚
Skills 是软件工程资产，不是一次性文档
必须有测试用例验证行为
必须有版本控制支持回滚
示例：

```
1. 明确的契约
输入: source_path , output_format , include_examples
输出: 成功/失败的标准 JSON 格式
错误码: PARSE_ERROR , UNSUPPORTED_FRAMEWORK
 
2. 完整的测试 (87% 覆盖率)
 
单元测试: 路由解析、请求体解析、错误处理
集成测试: 多文件项目、认证识别
E2E 测试: 真实 50+ 端点项目
3. 版本控制
遵循语义化版本管理
v1.0.0: 稳定版
v0.9.0-beta: 实验版,基础功能
清晰的升级路径和迁移指南
```