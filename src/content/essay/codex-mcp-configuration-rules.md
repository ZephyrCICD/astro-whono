---
title: "Codex MCP 配置规则：全局、项目级、cwd 和同名配置合并"
description: "整理 Codex 中 MCP 的推荐配置方式，重点说明全局配置、项目级配置、cwd、同名 MCP 合并风险，以及工具未暴露时的排查顺序。"
date: 2026-03-19
publishedAt: 2026-03-19T20:30:00+08:00
badge: AI
tags:
  - "Codex"
  - "MCP"
  - "AI Tools"
  - "Config"
  - "Debugging"
  - "Tech"
  - "AI"
  - "Tools"
draft: false
archive: true
---
Codex 支持通过 MCP 扩展外部工具，但 MCP 配置能被 `codex mcp list` 看到，不代表当前会话一定能拿到工具。

我踩过的问题主要集中在几个点：

- 全局配置和项目配置边界不清
- `cwd` 写了 `$HOME` 或 `~`
- 全局和项目里定义了同名 MCP
- 修改配置后没有重启 Codex App 或新开线程

这篇文章整理一套更稳的配置规则。

## 先记住几条原则

1. MCP 配置存在，不代表工具已经注册到当前会话。
2. `codex mcp list` 显示 enabled，只能说明配置被识别。
3. `cwd` 不会自动展开 `$HOME`、`~` 这类 shell 写法。
4. 全局配置和项目配置里的同名 MCP 可能会合并字段。
5. 配置变更后，建议重启 Codex App，并新开线程验证。

## 配置应该放在哪里

如果某个 MCP 只服务一个项目，推荐放项目级配置：

```toml
# <project-root>/.codex/config.toml
[mcp_servers.project_tool]
command = "python3"
args = ["scripts/mcp_server.py"]
startup_timeout_sec = 30
```

这种方式的好处是：

- 只有进入该项目的新线程才会加载它
- 不会影响其他项目
- 不需要在全局配置里写项目路径
- 不容易出现全局 `cwd` 污染项目配置

如果某个 MCP 多个项目都要用，比如一个通用文档查询工具，可以放全局配置：

```toml
# ~/.codex/config.toml
[mcp_servers.docs]
enabled = true
command = "uvx"
args = ["some-docs-mcp"]
startup_timeout_sec = 20
```

这类不依赖当前仓库文件的 MCP，通常不要写 `cwd`。

## cwd 要谨慎

不依赖工作目录时，不写 `cwd`。

确实需要工作目录时，写绝对路径：

```toml
cwd = "/absolute/path/to/example-project"
```

不要写：

```toml
cwd = "$HOME/workspace/example"
cwd = "~/workspace/example"
```

原因很简单：Codex 启动 MCP 时不是通过 shell 执行，`$HOME` 和 `~` 可能不会展开。最终 MCP 进程拿到的是一个字面路径，路径不存在时 server 就启动失败。

## 同名 MCP 的合并风险

如果全局和项目里都有同名配置：

```toml
[mcp_servers.confluence]
```

不要默认以为项目配置会完全覆盖全局配置。实际使用中，更稳妥的假设是：字段可能会被合并。

这意味着：

- 全局里的错误 `cwd` 可能进入项目配置
- 全局 env 可能影响项目行为
- 项目没有写的字段，不一定等于没有

我的建议是：

- 单项目使用，只放项目级配置
- 多项目通用，只放全局配置
- 尽量不要全局和项目同时定义同名 MCP

## 常见问题：list 能看到，但会话里没有工具

现象通常是：

- `codex mcp list` 能看到 MCP
- 状态看起来是 enabled
- 当前会话里没有出现对应的 `mcp__server__tool`
- MCP 命令单独在终端中可以启动

优先检查：

1. `cwd` 是否真实存在
2. `cwd` 是否用了 `$HOME` 或 `~`
3. 全局和项目是否定义了同名 MCP
4. MCP 命令是否能独立启动
5. 配置修改后是否重启 Codex App 并新开线程

可以用这些命令辅助排查：

```bash
codex mcp list
codex mcp get <server-name>
test -d "/absolute/path/to/project" && echo ok || echo missing
```

如果是 uvx / npx 这类命令，也可以先直接跑 help：

```bash
uvx some-mcp-server --help
npx -y some-mcp-server --help
```

## 我的推荐配置策略

如果 MCP 依赖当前仓库文件：

- 放项目 `.codex/config.toml`
- 不要放全局
- `cwd` 能不写就不写
- 必须写时使用绝对路径

如果 MCP 不依赖项目文件：

- 放全局 `~/.codex/config.toml`
- 不写项目专属 `cwd`
- env 里不要放会泄漏到其他项目的配置

如果某个 MCP 要从单项目迁移到多项目：

1. 先删除项目级配置
2. 再新增全局配置
3. 避免同名配置同时存在
4. 重启 Codex App
5. 新开线程验证工具是否出现

## 最后

MCP 配置最麻烦的地方，不是 TOML 语法，而是“配置被识别”和“工具真正可用”之间隔着启动、注册、作用域、线程刷新几个环节。

把全局和项目级配置分清楚，少写不必要的 `cwd`，避免同名合并，大部分问题都能提前避开。
