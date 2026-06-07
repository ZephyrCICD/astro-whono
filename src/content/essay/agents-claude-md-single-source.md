---
title: "AGENTS.md 与 CLAUDE.md：多 Agent 项目约束如何统一维护"
description: "记录同一个项目同时使用 Codex 和 Claude Code 时，如何避免 AGENTS.md 与 CLAUDE.md 两份规则漂移，并维护一份统一的项目约束入口。"
date: 2026-04-17
publishedAt: 2026-04-17T16:40:00+08:00
badge: AI
tags:
  - "Codex"
  - "Claude Code"
  - "Agent"
  - "AGENTS.md"
  - "CLAUDE.md"
  - "Engineering"
  - "Tech"
  - "AI"
  - "Tools"
draft: false
archive: true
---
同一个项目里同时使用 Codex 和 Claude Code 时，很容易遇到一个问题：项目约束写了两份。

Codex 默认看 `AGENTS.md`，Claude Code 默认看 `CLAUDE.md`。如果两份文件各写一套规则，短期看起来没问题，长期一定会漂移。

典型情况是：

- Codex 里要求用 `rg` 搜索，Claude Code 里没写
- Claude Code 里写了测试命令，AGENTS.md 忘了同步
- 一个文件更新了敏感信息规则，另一个还是旧版本
- 项目目录调整后，两边引用路径不一致

最后 Agent 执行结果不一致，排查时还很难判断到底是哪份规则生效。

## 推荐做法：AGENTS.md 作为唯一主入口

我的做法是把 `AGENTS.md` 作为项目约束的唯一事实来源。

项目根目录保留两份文件：

```text
project-root/
├── AGENTS.md
└── CLAUDE.md
```

其中 `AGENTS.md` 写完整项目约束，`CLAUDE.md` 只做转发：

```markdown
@AGENTS.md
```

这样 Claude Code 会读取同级目录下的 `AGENTS.md`，项目只需要维护一份主要规则。

如果项目基本只有自己使用，也可以直接把 `CLAUDE.md` 做成指向 `AGENTS.md` 的软链接。新项目可以这样建：

```bash
ln -s AGENTS.md CLAUDE.md
```

已有项目要先确认 `CLAUDE.md` 没有 Claude Code 专属内容，再替换成软链接。链接目标建议用 `AGENTS.md` 这种相对路径，不要写成本机绝对路径。

这种方式更彻底，文件系统层面只剩一份内容。打开 `CLAUDE.md` 和打开 `AGENTS.md` 看到的是同一份规则，也不会出现 `CLAUDE.md` 里那一行引用被误删、改错或不被某些编辑器理解的问题。

## 什么时候适合用软链接

软链接适合这些场景：

- 仓库主要是个人使用，协作者很少
- 主要在 macOS、Linux 或 WSL 环境里工作
- `CLAUDE.md` 没有 Claude Code 专属补充，内容应该和 `AGENTS.md` 完全一致
- 你希望任何工具打开 `CLAUDE.md` 时都能直接读到完整规则，而不是依赖 `@AGENTS.md` 的 include 语义
- 你能接受 Windows 原生环境里软链接行为可能受 Git 配置和系统权限影响

它的优势也很明确：真正只有一份文件，没有转发文件和主文件之间的关系需要解释；本地搜索、编辑器跳转、Agent 读取都会落到同一份内容上；后续修改规则时也不需要再检查 `CLAUDE.md` 是否还保持正确引用。

Git 会保存软链接关系。提交后，`CLAUDE.md` 会以 symlink 的形式记录，目标是 `AGENTS.md`。在 macOS、Linux、WSL 中 pull 下来通常会继续保持软链接；Windows 原生环境取决于 `core.symlinks`、开发者模式和权限配置，不支持时可能会变成一个内容为 `AGENTS.md` 的普通文本文件。

所以我的取舍是：个人仓库、同一套开发环境，软链接更省心；多人项目、跨 OS 协作，普通 `CLAUDE.md` 加 `@AGENTS.md` 更稳。

## AGENTS.md 适合放什么

适合放所有 Agent 都应该遵守的稳定规则：

- 输出语言
- 修改范围
- 目录用途
- 敏感信息处理
- 测试和验证命令
- Git 工作方式
- MCP / Skill / Hooks 的维护原则
- 文档写作格式
- 禁止事项

这些内容应该明确、可执行、尽量少依赖口头约定。

比如不要只写：

```markdown
注意安全。
```

更好的写法是：

```markdown
不要提交包含 token、密钥、个人手机号、邮箱、内网地址的文件；发布前使用 rg 扫描敏感关键词。
```

Agent 更适合执行明确规则，不适合猜测“注意安全”到底包含什么。

## CLAUDE.md 什么时候需要写内容

如果没有 Claude Code 专属差异，`CLAUDE.md` 可以只保留一行引用：

```markdown
@AGENTS.md
```

也可以直接作为软链接指向 `AGENTS.md`。

只有在工具行为确实不同，或者 Claude Code 需要额外说明时，才补一小段专属内容：

```markdown
@AGENTS.md

## Claude Code 专属说明

- 仅当 Claude Code 工具行为和 Codex 不一致时，在这里补充差异。
```

不要把通用规则复制一遍。复制就是漂移的开始。

## 全局规则和项目规则也要分清楚

另一个容易混的点是：哪些规则应该放全局，哪些应该放项目。

我的判断标准：

| 类型 | 放在哪里 |
|---|---|
| 所有项目都成立的个人偏好 | 全局配置 |
| 只对当前项目成立的目录、命令、发布流程 | 项目 AGENTS.md |
| 只对 Claude Code 成立的差异 | CLAUDE.md 专属补充 |
| 只对 Codex 成立的差异 | Codex 项目配置或 AGENTS.md 中明确标注 |

比如“默认中文输出”可以放全局；“这个项目不要读取某个私有目录”应该放项目级约束；“这个项目构建命令是 `hugo --minify`”也应该放项目级约束。

## 推荐检查清单

维护一个多 Agent 项目时，我会检查：

- 项目根目录是否存在 `AGENTS.md`
- `CLAUDE.md` 是否只引用 `AGENTS.md`，或者直接软链接到 `AGENTS.md`
- 是否存在两份重复的大段规则
- 测试命令是否只维护在一个地方
- 敏感信息规则是否明确
- 目录边界是否写清楚
- 更新项目规则时是否只改主入口

如果项目里还有自定义 Skill、MCP、Hooks，也建议把维护原则写进 `AGENTS.md`，但不要把机器本地私有路径和 token 写进去。

## 一句话原则

同一个项目中，优先让 `AGENTS.md` 成为项目约束的唯一事实来源；`CLAUDE.md` 只负责引用它，或者直接软链接到它。

这件事本身不复杂，但很值得做。规则越少重复，Agent 越不容易走偏，人也越容易维护。
