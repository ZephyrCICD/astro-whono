---
title: "主流 AI CLI 工具接入指南：Claude Code、Codex、Gemini CLI 配置、使用与选择"
description: "主流 AI 命令行工具 Claude Code、OpenAI Codex 和 Gemini CLI 的接入配置指南，包括安装配置、MCP 集成、基础使用和选择推荐"
date: 2025-10-15
publishedAt: 2025-10-15T17:40:00+08:00
badge: AI
tags:
  - "AI CLI"
  - "Claude Code"
  - "Codex"
  - "Gemini CLI"
  - "Dev Tools"
  - "CLI"
  - "Tech"
  - "AI"
  - "Tools"
draft: false
archive: true
---
## 目录

- [概述](#概述)
- [Claude Code](#claude-code)
  - [安装与更新](#claude-code-安装)
  - [配置详解](#claude-code-配置)
  - [MCP 集成](#claude-code-mcp)
- [OpenAI Codex](#openai-codex)
  - [安装方式](#codex-安装)
  - [配置说明](#codex-配置)
- [Gemini CLI](#gemini-cli)
  - [注册与安装](#gemini-安装)
  - [配置指南](#gemini-配置)
  - [多账户切换](#gemini-多账户)
- [三者对比](#对比分析)
- [选择建议](#选择建议)

---

## 概述

随着 AI 技术的快速发展，命令行 AI 工具已成为开发者提高效率的重要助手。本文将详细介绍三款主流 AI CLI 工具：

- **Claude Code** - Anthropic 出品，基于 Claude 模型的强大 CLI 工具
- **OpenAI Codex** - OpenAI 官方 CLI，支持 GPT 系列模型
- **Gemini CLI** - Google 推出的基于 Gemini 模型的命令行工具

这三款工具都支持 **MCP (Model Context Protocol)** 协议，可以扩展丰富的功能插件。

---

## Claude Code

### 特点
- ✅ 强大的代码理解和生成能力
- ✅ 支持 Claude Sonnet 4.5 和 Opus 4.1 模型
- ✅ 完善的 MCP 生态支持
- ✅ 灵活的配置系统（全局、项目、用户三级作用域）
- ✅ 内置 Git 集成
- ✅ 支持自定义规则（CLAUDE.md）

### 官网
[https://www.anthropic.com/claude-code](https://www.anthropic.com/claude-code)

---

### Claude Code 安装 {#claude-code-安装}

#### 首次安装
```bash
npm install -g @anthropic-ai/claude-code
```

#### 更新
```bash
# 方式1：使用 npm
npm update -g @anthropic-ai/claude-code

# 方式2：使用 claude 命令
claude update
```

---

### Claude Code 配置 {#claude-code-配置}

#### 模型选择

Claude Code 支持以下模型：

**可用模型**：
1. **Default (recommended)** - Sonnet 4.5，默认模型，性价比最高（$3/$15 per Mtok）
2. **Opus** - Opus 4.1，适合复杂任务（$15/$75 per Mtok）

可以使用 `/model` 命令在会话中切换模型。

---

#### 全局配置

**配置目录**：`~/.claude`

**配置文件**：`~/.claude/settings.json`

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-xxxxxxxxxxxxx",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "includeCoAuthoredBy": false
}
```

**配置说明**：
- `ANTHROPIC_API_KEY`：Claude API 密钥（[官方获取](https://console.anthropic.com/)）
- `includeCoAuthoredBy`：禁用 Git 提交信息中的 AI 协作者标记

**自定义 API 端点（可选）**：

如果使用第三方中转服务，可以添加 `ANTHROPIC_BASE_URL`：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "your-api-key",
    "ANTHROPIC_BASE_URL": "https://your-custom-endpoint.com"
  }
}
```

> ⚠️ **注意**：使用第三方中转服务需自行承担安全风险，建议优先使用官方 API

---

#### 自定义规则（Rules）

创建 `~/.claude/CLAUDE.md` 文件，定义 AI 助手的行为规则：

```markdown
## Git 提交规范
- 提交 Git Message 时，内容不要携带任何 AI 来源相关的信息

## 终端代理配置
- 由于网络限制，终端内需要启用代理后才能下载内容
- 执行 npm install/yarn/pip install 等指令前，需要先执行 `proxy_on` 开启代理

## 代码规范
- 优先使用项目现有的工具类
- 遵循项目的编码风格和命名规范
```

---

### Claude Code MCP 集成 {#claude-code-mcp}

Claude Code 支持丰富的 MCP 服务器扩展，可以快速添加各种功能插件。

#### 快速添加 MCP

```bash
# 添加常用 MCP（用户级全局可用）
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp
claude mcp add memory -s user -- npx -y @modelcontextprotocol/server-memory
claude mcp add playwright -s user -- npx -y @playwright/mcp@latest
```

**作用域说明**：
- `-s user`：用户级（全局可用）
- `-s project`：项目级（团队共享）
- `-s local`：本地级（默认，仅当前项目）

> 💡 **详细的 MCP 配置指南请参考**：[MCP (Model Context Protocol) 配置完全指南](/archive/mcp-configuration-guide/)

---

## OpenAI Codex

### 特点
- ✅ 官方支持，稳定可靠
- ✅ 专为编码优化的 GPT-5 模型系列
- ✅ 支持三种模型变体和三档推理级别
- ✅ 配置简单，使用 TOML 格式
- ✅ 支持自定义 API 端点
- ✅ 完整的 MCP 支持

### 官网
- [https://openai.com/codex/](https://openai.com/codex/)
- [GitHub](https://github.com/openai/codex)

---

### Codex 安装 {#codex-安装}

```bash
# 方式1：使用 npm
npm install -g @openai/codex

# 方式2：使用 Homebrew (macOS)
brew install codex
```

---

### Codex 配置 {#codex-配置}

#### 模型选择

Codex 目前仅支持 GPT-5 系列模型，提供以下选项：

**可用模型**：
1. **gpt-5-codex** (current) - 针对编码任务优化，支持多工具调用
2. **gpt-5** - 广泛的通用知识，强大的推理能力

**推理级别**（Reasoning Level）：
- `low` - 最快响应，有限推理
- `medium` (default) - 根据任务动态调整推理
- `high` (current) - 最大化推理深度，适合复杂或模糊问题

---

#### 主配置文件

**文件路径**：`~/.codex/config.toml`

```toml
# 模型配置
model_provider = "openai"
model = "gpt-5-codex"  # 可选: gpt-5-codex 或 gpt-5
model_reasoning_effort = "high"  # 可选: low, medium, high
disable_response_storage = true

# API 提供商配置（使用官方 API）
[model_providers.openai]
name = "openai"
base_url = "https://api.openai.com/v1"
wire_api = "responses"
env_key = "OPENAI_API_KEY"

# MCP 服务器配置（示例）
[mcp_servers.context7]
args = ["-y", "@upstash/context7-mcp"]
command = "npx"

[mcp_servers.playwright]
args = ["@playwright/mcp@latest"]
command = "npx"
```

**配置说明**：
- `model`：建议使用 `gpt-5-codex`（编码场景最优）
- `model_reasoning_effort`：根据任务复杂度选择
  - 简单任务：`low` 或 `medium`
  - 复杂重构/架构设计：`high`

**自定义 API 端点（可选）**：

如果使用第三方中转服务，可以自定义 `base_url`：

```toml
# 自定义中转服务配置
[model_providers.custom]
name = "custom"
base_url = "https://your-custom-endpoint.com/v1"
wire_api = "responses"
env_key = "CUSTOM_API_KEY"
```

然后在模型配置中引用：
```toml
model_provider = "custom"
```

> ⚠️ **注意**：使用第三方中转服务需自行承担安全风险，建议优先使用官方 API

> 💡 **完整的 MCP 配置请参考**：[MCP 配置完全指南 - Codex 部分](/archive/mcp-configuration-guide/#openai-codex)

---

#### 认证配置

**文件路径**：`~/.codex/auth.json`

```json
{
  "OPENAI_API_KEY": "your-api-key-here"
}
```

---

#### 测试配置

```bash
# 1. 启动 Codex
codex

# 2. 测试基本对话
> Hi

# 3. 检查 MCP 连接状态
> /mcp
```

---

## Gemini CLI

### 特点
- ✅ Google 官方支持
- ✅ 支持 Gemini 2.0 系列模型
- ✅ 免费额度充足
- ✅ 支持多账户切换
- ✅ 丰富的主题配置
- ✅ 完整的 MCP 生态

### 官网
[https://github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)

---

### Gemini 安装 {#gemini-安装}

```bash
npm install -g @google/gemini-cli
```

---

### Gemini 配置 {#gemini-配置}

#### 1. 获取 API Key

**步骤**：

1. **注册 Google 账户**

2. **创建 Google Cloud 项目**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/projectcreate)
   - 随意创建一个项目

3. **生成 API 密钥**
   - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
   - 点击右侧的"创建 API 密钥"按钮
   - 选择刚刚创建的项目
   - 点击"在现有项目中创建 API 密钥"
   - 复制生成的密钥

---

#### 2. 配置文件

**文件路径**：`~/.gemini/settings.json`

```json
{
  "theme": "GitHub",
  "selectedAuthType": "gemini-api-key",
  "contextFileName": ["GEMINI.md"],
  "preferredEditor": "vscode",
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

> 💡 **完整的 MCP 配置请参考**：[MCP 配置完全指南 - Cursor 部分](/archive/mcp-configuration-guide/#cursor)（Gemini CLI 配置格式与 Cursor 类似）

---

#### 3. 环境变量配置

编辑 `~/.zshrc` 或 `~/.bashrc`，添加：

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

应用配置：
```bash
source ~/.zshrc
# 或
source ~/.bashrc
```

---

#### 4. 启动使用

```bash
gemini
```

---

### Gemini 多账户切换 {#gemini-多账户}

如果你有多个 Google 账户，可以配置快速切换功能：

#### 1. 创建密钥配置文件

```bash
touch ~/.gemini/keys.sh
```

添加内容：
```bash
export GEMINI_ALL_KEYS=(
  "key1-from-account-1"
  "key2-from-account-2"
  "key3-from-account-3"
)
```

---

#### 2. 创建切换脚本

```bash
touch ~/.gemini/switch_key.sh
```

添加内容：
```bash
# gmn 函数：用于切换 GEMINI_API_KEY
gmn() {
    # 检查是否提供了参数
    if [ -z "$1" ]; then
        echo "用法：gmn <数字> (例如 gmn 1)"
        echo "或者 gmn n 切换到下一个"
        return 1
    fi

    local target_index=$1

    # 检查 GEMINI_ALL_KEYS 数组是否已加载且不为空
    if [ ${#GEMINI_ALL_KEYS[@]} -eq 0 ]; then
        echo "错误：GEMINI API 密钥数组 GEMINI_ALL_KEYS 为空或未加载。"
        echo "请检查 '$HOME/.gemini/keys.sh' 文件和 '$HOME/.zshrc' 配置。"
        return 1
    fi

    echo "切换到 Gemini API key: $GEMINI_ALL_KEYS[$1]"

    # 可选：自动开启代理（国内用户需要）
    export https_proxy=http://127.0.0.1:7890
    export http_proxy=http://127.0.0.1:7890
    export all_proxy=socks5://127.0.0.1:7890

    export GEMINI_API_KEY=$GEMINI_ALL_KEYS[$1]
    gemini
}
```

---

#### 3. 配置环境变量

编辑 `~/.zshrc` 或 `~/.bashrc`，添加：

```bash
# 默认密钥
export GEMINI_API_KEY="default-key"

# 加载多密钥配置
source "$HOME/.gemini/keys.sh"
source "$HOME/.gemini/switch_key.sh"
```

---

#### 4. 使用方式

```bash
# 切换到第一个账户
gmn 1

# 切换到第二个账户
gmn 2

# 以此类推
```

---

## 对比分析

### 功能对比

| 特性 | Claude Code | OpenAI Codex | Gemini CLI |
|------|------------|--------------|------------|
| **模型能力** | Sonnet 4.5 / Opus 4.1 | GPT-5 系列 | Gemini 2.0 |
| **代码理解** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **中文支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **MCP 支持** | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| **配置灵活性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **作用域管理** | ✅ 三级 | ⚠️ 单级 | ⚠️ 单级 |
| **价格** | 💰💰💰 最贵 | 💰💰 中等 | 🆓 免费（有额度） |
| **网络要求** | 国际网络 | 国际网络 | 需要魔法 |

---

### 价格对比

| 工具 | 定价模式 | 价格详情 | 性价比 |
|------|---------|---------|--------|
| **Claude Code** | 按 Token 计费 | Sonnet 4.5: $3/$15 per Mtok<br>Opus 4.1: $15/$75 per Mtok | 💰💰💰 最贵 |
| **OpenAI Codex** | 按 Token 计费 | GPT-5 系列定价<br>（具体价格见 OpenAI 官网） | 💰💰 中等 |
| **Gemini CLI** | 免费 + 限额 | 完全免费<br>每日/每月有请求额度限制 | 🆓 最优 |

**成本建议**：
- **预算充足**：Claude Code（Sonnet 4.5 性价比最高，Opus 适合复杂任务）
- **成本敏感**：Gemini CLI（免费额度足够个人开发使用）
- **平衡选择**：OpenAI Codex（价格适中，性能稳定）

---

### 配置文件格式对比

| 工具 | 配置格式 | 配置位置 |
|------|---------|---------|
| **Claude Code** | JSON | `~/.claude/settings.json` |
| **OpenAI Codex** | TOML | `~/.codex/config.toml` |
| **Gemini CLI** | JSON | `~/.gemini/settings.json` |

---

### 安装方式对比

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# OpenAI Codex
npm install -g @openai/codex
# 或
brew install codex

# Gemini CLI
npm install -g @google/gemini-cli
```

---

## 选择建议

### 根据使用场景选择

#### 代码编写场景
**推荐顺序：**

1. **首选：OpenAI Codex**
   - ✅ 性价比最高，价格适中
   - ✅ GPT-5 编码能力出色
   - ✅ 文档编写和 Bug 修复能力强
   - ✅ 配置简单，快速上手
   - 💡 **最佳平衡选择**：性能与成本的完美平衡

2. **次选：Claude Code**
   - ✅ 交互能力最出色
   - ✅ 代码理解和重构能力最强
   - ✅ 项目需要团队协作配置（Project Scope）
   - ✅ 追求最佳的中文交互体验
   - ⚠️ 价格最贵，适合预算充足的团队

3. **备选：Gemini CLI**
   - ✅ 完全免费，零成本
   - ✅ 适合学习和个人小项目
   - ⚠️ 编码能力相对较弱
   - 🎓 实在没有预算时的选择

**推荐人群**：
- **个人开发者**：优先 Codex（性价比高）
- **团队项目**：Claude Code（协作能力强）
- **学生/预算有限**：Gemini CLI（免费）

---

#### 文档编写与代码审查场景
**推荐：OpenAI Codex**
- ✅ 文档编写和 Bug 修复能力最强
- ✅ 适合代码 Review 和重构建议
- ✅ GPT-5 模型推理能力出色
- ✅ 价格适中，性价比最好

**推荐人群**：代码审查、文档编写、Bug 修复、注重性价比的团队

---

#### 非编码任务场景
**推荐：Gemini CLI**
- ✅ 超大上下文窗口（2M tokens）
- ✅ 适合长文档分析、需求整理
- ✅ 完全免费，有日/月额度限制
- ✅ 有多个 Google 账户需要切换
- 🎓 特别适合学生和个人开发者

**推荐人群**：学生、个人开发者、文档分析、需求管理、预算有限的场景

---

### 协同工作流推荐

**最佳实践：Codex + Claude Code 组合使用**

```
1. Codex (需求分析)
   ↓
   生成详细的需求文档和技术方案
   ↓
2. Claude Code (代码实现)
   ↓
   根据文档进行功能实现和代码编写
   ↓
3. Codex (代码审查)
   ↓
   Review 代码质量，提供优化建议
```

**优势**：
- 🎯 发挥各工具的专长领域
- 🔄 形成完整的开发闭环
- 💰 Codex 性价比高，适合需求和审查阶段
- 🎨 Claude Code 交互能力强，适合代码实现阶段

**适用场景**：
- 大型项目开发
- 团队协作项目
- 对代码质量要求高的场景

---

## 最佳实践

### 1. MCP 配置建议

三款工具都支持 MCP (Model Context Protocol) 扩展，推荐安装：

**核心 MCP**：
- `context7` - 查询最新库文档
- `memory` - 知识图谱记忆
- `fetch` - 网页内容抓取

**可选 MCP**：
- `playwright` - 浏览器自动化
- `sequential-thinking` - 增强推理能力
- `filesystem` - 文件系统访问
- `github` - GitHub 集成

> 💡 **详细的 MCP 服务器介绍和配置方法请参考**：[MCP 配置完全指南](/archive/mcp-configuration-guide/)
>
> 该指南包含：
> - 常用 MCP 服务器详细介绍
> - Claude Code、Codex、Cursor 的完整配置方案
> - MCP Router 统一管理方案
> - 故障排查和常见问题解答

---

### 2. 代理配置

**国内用户建议**：

```bash
# 在配置文件中添加代理设置
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890
```

或者使用别名：
```bash
alias proxy_on="export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890"
alias proxy_off="unset https_proxy http_proxy all_proxy"
```

---

### 3. API Key 管理

**安全建议**：
- 🔒 不要将 API Key 提交到 Git 仓库
- 🔒 使用环境变量管理敏感信息
- 🔒 定期轮换 API Key
- 🔒 为不同项目使用不同的 Key

---

### 4. 自定义规则（Rules）

**建议配置**：
- 代码风格规范
- Git 提交规范
- 项目特定的开发流程
- 终端代理配置
- 常用工具类说明

---

## 总结

三款 AI CLI 工具各有特色：

- **OpenAI Codex** 性价比最高，编码能力强，适合个人开发者和注重成本的团队
- **Claude Code** 交互体验最出色，功能最完善，适合专业开发和团队协作
- **Gemini CLI** 完全免费，适合学习和个人小项目

**我的推荐**：
1. **首选**：OpenAI Codex（性价比最高，编码能力强）
2. **次选**：Claude Code（交互体验最佳，适合团队协作）
3. **备选**：Gemini CLI（免费额度充足，适合学习和小项目）

**核心建议**：
- 💰 **预算优先**：Codex 是性价比最优选择
- 🎯 **体验优先**：Claude Code 交互能力最出色
- 🆓 **零成本**：Gemini CLI 适合学习和个人项目

建议根据实际需求和预算选择，或者多个工具配合使用，发挥各自优势。

---

## 相关资源

### 官方文档
- [Claude Code 官网](https://www.anthropic.com/claude-code)
- [OpenAI Codex 官网](https://openai.com/codex/)
- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)

### 本站相关文章
- [MCP (Model Context Protocol) 配置完全指南](/archive/mcp-configuration-guide/) - 详细的 MCP 配置教程

### MCP 资源
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP GitHub 仓库](https://github.com/modelcontextprotocol)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)

### API 获取
- [Anthropic API](https://console.anthropic.com/)
- [OpenAI API](https://platform.openai.com/api-keys)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
