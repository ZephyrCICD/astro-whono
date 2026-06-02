---
title: "MCP (Model Context Protocol) 配置完全指南"
description: "全面的MCP配置指南，涵盖Claude Code、OpenAI Codex、Cursor等AI工具的MCP接入配置，包括常用MCP服务器介绍、作用域管理、故障排查和最佳实践"
date: 2025-10-15
publishedAt: 2025-10-15T16:00:00+08:00
badge: AI
tags:
  - "MCP"
  - "AI Tools"
  - "Claude Code"
  - "OpenAI Codex"
  - "Cursor"
  - "Config"
  - "Tech"
  - "AI"
draft: false
archive: true
---
## 目录

- [常用MCP服务器](#常用mcp服务器)
  - [Context7 - 最新库文档](#context7)
  - [Fetch - 无限制网页抓取](#fetch)
  - [Memory - 知识图谱记忆](#memory)
  - [Sequential Thinking - 增强推理](#sequential-thinking)
  - [Playwright - 浏览器自动化](#playwright)
  - [Filesystem - 文件系统访问](#filesystem)
  - [GitHub - GitHub集成](#github)
- [AI工具接入配置](#ai工具接入配置)
  - [Claude Code配置](#claude-code)
  - [OpenAI Codex配置](#openai-codex)
  - [Cursor配置](#cursor)
- [MCP Router统一管理](#使用mcp-router统一管理mcp)
- [故障排查](#故障排查)
- [常见问题FAQ](#常见问题-faq)
- [进阶技巧](#进阶技巧)
- [相关资源](#相关资源)

## 常用MCP服务器

### Context7
**功能**：获取最新库文档和代码示例

**特性**：
- 查询超越AI知识截止日期的最新库文档
- 支持主流前端/后端框架（React、Vue、Next.js、Spring Boot等）
- 提供最佳实践代码示例
- 可选API KEY（高峰期建议使用）

**使用场景**：
- 查询最新版本框架特性
- 获取官方文档和API说明
- 学习最佳实践

**相关链接**：
- [官网](https://context7.com/dashboard) 获取API KEY（非必需）
- [GitHub](https://github.com/upstash/context7)

---

### Fetch
**功能**：无限制网页抓取工具

**特性**：
- 访问任何公开网站（GitHub、博客等）
- 自动将HTML转换为Markdown
- 支持分块读取长内容
- 忽略robots.txt限制
- 突破WebFetch工具的限制

**使用场景**：
- 访问被WebFetch限制的网站
- 获取技术文档和博客内容
- 抓取GitHub仓库信息

---

### Memory
**功能**：基于知识图谱的记忆系统

**特性**：
- 创建实体和关系
- 存储观察和事实
- 构建知识图谱
- 支持搜索和查询
- 数据本地存储

**使用场景**：
- 记住项目相关信息
- 构建知识库
- 跨对话记忆重要内容

---

### Sequential Thinking
**功能**：增强AI推理能力

**特性**：
- 支持复杂问题分析
- 分步推理过程
- 提高逻辑准确性

**使用场景**：
- 复杂算法设计
- 架构决策分析
- 多步骤问题解决

---

### Playwright
**功能**：浏览器自动化工具

**特性**：
- 网页导航和交互
- 元素点击、输入
- 页面截图和快照
- 表单填写
- 网络请求监控

**使用场景**：
- 前端功能测试
- 页面状态检查
- UI自动化验证

---

### Filesystem
**功能**：本地文件系统访问

**特性**：
- 文件读写操作
- 目录管理
- 权限控制

**使用场景**：
- 批量文件处理
- 项目文件管理
- 配置文件操作

**注意**：需要指定允许访问的目录

---

### GitHub
**功能**：GitHub API集成

**特性**：
- 仓库操作
- Issue管理
- Pull Request处理
- 代码审查

**使用场景**：
- 自动化GitHub工作流
- 批量Issue处理
- 代码仓库管理

**注意**：需要GitHub Personal Access Token

---

## AI工具接入配置

### Claude Code

#### MCP安装作用域

Claude Code支持三种不同的安装作用域，用于控制MCP服务器的可访问范围：

##### 1. 本地作用域（Local Scope）- 默认
**配置文件位置**：项目特定用户设置

**特点**：
- 仅对当前用户在当前项目中可用
- 配置私密，不会被共享
- 适合个人实验或包含敏感凭据的服务器

**使用场景**：
- 个人开发服务器
- 实验性配置
- 包含API密钥的私密服务

```bash
# 默认就是local作用域（可省略 --scope local）
claude mcp add context7 -- npx -y @upstash/context7-mcp
# 或明确指定
claude mcp add context7 --scope local -- npx -y @upstash/context7-mcp
```

##### 2. 项目作用域（Project Scope）
**配置文件位置**：项目根目录 `.mcp.json`

**特点**：
- 团队共享，可检入版本控制
- 所有团队成员都能访问相同的MCP工具
- 使用前会提示批准（安全机制）

**使用场景**：
- 团队协作项目
- 项目特定工具
- 需要版本控制的MCP配置

```bash
# 添加项目作用域的MCP
claude mcp add paypal --scope project -- npx -y @modelcontextprotocol/server-paypal

# 重置项目作用域的批准选择
claude mcp reset-project-choices
```

生成的 `.mcp.json` 文件格式：
```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-paypal"],
      "env": {}
    }
  }
}
```

##### 3. 用户作用域（User Scope）
**配置文件位置**：`~/.claude.json`

**特点**：
- 跨所有项目可用
- 对当前用户保持私密
- 适合常用的个人工具

**使用场景**：
- 个人实用工具
- 跨项目开发工具
- 频繁使用的服务

```bash
# 添加用户作用域的MCP
claude mcp add hubspot --scope user -- npx -y @modelcontextprotocol/server-hubspot
```

##### 作用域优先级

当多个作用域中存在同名服务器时，优先级为：
```
本地作用域 > 项目作用域 > 用户作用域
```

这样设计确保个人配置可以覆盖共享配置。

---

#### 单个MCP添加（命令行方式）

**用户作用域示例（跨所有项目可用）：**
```bash
# Context7（可选API KEY）
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp --api-key ctx7sk-your-api-key-here

# Fetch
claude mcp add fetch --scope user -- npx -y @modelcontextprotocol/server-fetch

# Memory
claude mcp add memory --scope user -- npx -y @modelcontextprotocol/server-memory

# Sequential Thinking
claude mcp add sequential-thinking --scope user -- npx -y @modelcontextprotocol/server-sequential-thinking

# Playwright
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest

# Filesystem（需要指定目录）
claude mcp add filesystem --scope user -- npx -y @modelcontextprotocol/server-filesystem /path/to/directory

# GitHub（需要环境变量设置Token）
claude mcp add github --scope user -- npx -y @modelcontextprotocol/server-github
```

**项目作用域示例（团队共享）：**
```bash
# 添加项目特定的MCP，会在项目根目录创建 .mcp.json
claude mcp add stripe --scope project -- npx -y @modelcontextprotocol/server-stripe
claude mcp add notion --scope project -- npx -y @modelcontextprotocol/server-notion
```

**本地作用域示例（仅当前项目当前用户）：**
```bash
# 本地实验性配置，不影响其他项目或团队成员
claude mcp add test-server --scope local -- npx -y @test/mcp-server
```

#### 批量配置（配置文件方式）

编辑 `~/.claude.json`：

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "ctx7sk-your-api-key-here"
      ],
      "env": {}
    },
    "fetch": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ],
      "env": {}
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {}
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ],
      "env": {}
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest"
      ],
      "env": {}
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "jetbrains": {
      "type": "sse",
      "url": "http://localhost:64342/sse"
    }
  }
}
```

---

### OpenAI Codex

#### 配置文件位置
- `~/.codex/config.toml`

#### 单个MCP添加

编辑 `~/.codex/config.toml`，每次添加一个MCP：

```toml
# Context7
[mcp_servers.context7]
args = ["-y", "@upstash/context7-mcp", "--api-key", "ctx7sk-your-api-key-here"]
command = "npx"
```

#### 批量配置

编辑 `~/.codex/config.toml`，一次性添加所有MCP：

```toml
# Context7 - 获取最新库文档
[mcp_servers.context7]
args = ["-y", "@upstash/context7-mcp", "--api-key", "ctx7sk-your-api-key-here"]
command = "npx"

# Fetch - 无限制网页抓取
[mcp_servers.fetch]
args = ["-y", "@modelcontextprotocol/server-fetch"]
command = "npx"

# Memory - 知识图谱记忆
[mcp_servers.memory]
args = ["-y", "@modelcontextprotocol/server-memory"]
command = "npx"

# Sequential Thinking - 增强推理能力
[mcp_servers.sequential-thinking]
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]
command = "npx"

# Playwright - 浏览器自动化
[mcp_servers.playwright]
args = ["-y", "@playwright/mcp@latest"]
command = "npx"

# GitHub - GitHub API集成
[mcp_servers.github]
args = ["-y", "@modelcontextprotocol/server-github"]
command = "npx"
env = { "GITHUB_PERSONAL_ACCESS_TOKEN" = "ghp_your_token_here" }

# Filesystem - 本地文件系统访问
[mcp_servers.filesystem]
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
command = "npx"
```

#### 添加环境变量示例
```toml
[mcp_servers.example]
args = ["param1", "param2"]
command = "npx"
env = { "API_KEY" = "your_api_key_here" }
```

---

### Cursor

#### 配置文件位置
- Cursor Settings → Features → Model Context Protocol

#### 单个MCP添加

在配置中添加一个MCP：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ]
    }
  }
}
```

#### 批量配置

一次性添加所有MCP：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "ctx7sk-your-api-key-here"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

---

## 使用MCP Router统一管理MCP

> **原理**：在MCP Router添加需要的MCP，它会将自身封装为一个MCP，任何需要用到MCP的地方，添加这个MCP Router即可

### 优势
- ✅ **集中管理** - 在一个地方配置所有MCP服务器
- ✅ **跨平台复用** - 配置一次，多个AI工具共享
- ✅ **可视化界面** - 图形化管理MCP配置
- ✅ **动态更新** - 无需重启AI工具即可生效

### 使用步骤

#### 1. 下载安装MCP Router
- [官网下载](https://mcp-router.net/en)
- 支持 macOS、Windows、Linux

#### 2. 在MCP Router内配置需要的MCP
在MCP Router的可视化界面中添加你需要的MCP服务器：
- Context7（文档查询）
- Memory（知识图谱）
- Playwright（浏览器自动化）
- Fetch（网页抓取）
- 等等...

![MCP Router配置界面](/images/posts/MCP.png)

#### 3. 获取Token
配置完成后，MCP Router会生成一个Token（格式：`mcpr_xxxxxxxxxxxxxx`），用于连接到Router。

#### 4. 在各AI工具中添加MCP Router

##### Claude Code配置
**方式1：使用命令行**
```bash
claude mcp add mcp-router -s user -- npx -y mcpr-cli@latest connect
# 然后在环境变量中设置 MCPR_TOKEN
```

**方式2：手动配置** `~/.claude.json`
```json
{
  "mcpServers": {
    "mcp-router": {
      "command": "npx",
      "args": [
        "-y",
        "mcpr-cli@latest",
        "connect"
      ],
      "env": {
        "MCPR_TOKEN": "mcpr_xxxxxxxxxxxxxx"
      }
    }
  }
}
```

##### OpenAI Codex配置
编辑 `~/.codex/config.toml`
```toml
[mcp_servers.mcp-router]
args = ["-y", "mcpr-cli@latest", "connect"]
command = "npx"
env = { "MCPR_TOKEN" = "mcpr_xxxxxxxxxxxxx" }
```

##### Cursor配置
编辑 Cursor 的 MCP 配置文件
```json
{
  "mcpServers": {
    "mcp-router": {
      "command": "npx",
      "args": [
        "-y",
        "mcpr-cli@latest",
        "connect"
      ],
      "env": {
        "MCPR_TOKEN": "mcpr_xxxxxxxxxxxxxx"
      }
    }
  }
}
```

![MCP Router使用示例](/images/posts/MCP-1.png)

### 注意事项
- MCP Router 需要保持运行状态才能使用
- Token 仅用于本地连接认证，他人获取 Token 后无法远程访问（除非你本地暴露了端口）
- 如有安全顾虑，可以在 MCP Router 中重新生成 Token

---

## 故障排查

### MCP服务器无法启动

#### 问题：npx命令执行失败
**解决方案：**
```bash
# 1. 检查Node.js版本（需要16+）
node --version

# 2. 更新npm
npm install -g npm@latest

# 3. 清除npx缓存
npx clear-npx-cache
```

#### 问题：端口被占用
**解决方案：**
```bash
# 查看占用端口的进程
lsof -i :端口号

# 杀死占用进程
kill -9 <PID>
```

### Context7相关问题

#### 问题：API限流
**症状**：提示"Rate limit exceeded"

**解决方案：**
- 如果没有API KEY：访问 [Context7官网](https://context7.com/dashboard) 获取免费API KEY
- 如果已有API KEY：等待限流解除或升级套餐

#### 问题：找不到库文档
**解决方案：**
```bash
# 先使用resolve-library-id确认库ID
# 再使用get-library-docs获取文档
# 如果仍然找不到，可能该库暂未被收录
```

### Playwright相关问题

#### 问题：浏览器未安装
**症状**：提示"Browser executable not found"

**解决方案：**
```bash
# 使用browser_install工具安装浏览器
# 或手动安装
npx playwright install chromium
```

#### 问题：页面加载超时
**解决方案：**
- 检查网络连接
- 使用browser_wait_for工具等待特定元素
- 增加超时时间设置

### Memory相关问题

#### 问题：知识图谱数据丢失
**解决方案：**
- Memory服务器的数据存储在本地
- 检查是否正确配置了数据目录
- 定期备份重要的知识图谱数据

### 配置文件问题

#### 问题：JSON/TOML格式错误
**常见错误：**
- JSON缺少逗号或有多余逗号
- TOML的引号使用错误
- 路径使用了反斜杠（应使用正斜杠）

**解决方案：**
```bash
# 使用在线工具验证格式
# JSON: https://jsonlint.com/
# TOML: https://www.toml-lint.com/

# 或使用命令行工具
cat config.toml | npx @taplo/cli fmt
```

---

## 常见问题 FAQ

### Q: 如何选择合适的MCP服务器？
**A:** 根据需求选择：
- 📚 需要查询最新文档 → Context7
- 🌐 需要访问网页内容 → Fetch
- 🧠 需要记住对话信息 → Memory
- 🎭 需要浏览器自动化 → Playwright
- 💭 需要复杂推理 → Sequential Thinking

### Q: 多个AI工具能共享MCP配置吗？
**A:** 可以，使用MCP Router即可实现：
- 在MCP Router中配置一次
- 所有AI工具都连接到同一个MCP Router
- 统一管理，避免重复配置

### Q: MCP服务器会影响性能吗？
**A:** 影响很小：
- MCP服务器按需启动
- 只在调用时才消耗资源
- 不使用时不会占用系统资源

### Q: 如何更新MCP服务器？
**A:** 使用npx时会自动使用最新版本：
```bash
# -y 参数会自动使用最新版本
npx -y @modelcontextprotocol/server-memory

# 如果需要指定版本
npx @modelcontextprotocol/server-memory@1.0.0
```

### Q: 可以同时使用多个MCP服务器吗？
**A:** 完全可以：
- 在配置文件中添加多个MCP服务器
- AI工具会自动管理多个MCP连接
- 建议根据实际需求添加，避免不必要的资源消耗

### Q: MCP服务器的数据安全吗？
**A:** 安全性说明：
- ✅ 本地运行的MCP（如Memory、Filesystem）数据存储在本地
- ⚠️ 云端MCP（如Context7）数据会发送到服务器
- 🔒 不要在MCP中存储敏感信息（密码、密钥等）
- 🛡️ 使用环境变量管理API密钥

### Q: 如何调试MCP连接问题？
**A:** 调试步骤：
1. 检查AI工具的MCP日志
2. 确认配置文件格式正确
3. 手动运行MCP命令测试
4. 检查网络连接和防火墙设置

```bash
# 手动测试MCP服务器
npx -y @modelcontextprotocol/server-memory

# 查看详细日志
# Claude Code: claude mcp logs
# 其他工具查看各自的日志文件
```

---

## 进阶技巧

### 自定义MCP服务器

你可以创建自己的MCP服务器来扩展AI能力：

```typescript
// 示例：简单的自定义MCP服务器
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-custom-mcp",
  version: "1.0.0",
});

// 添加工具
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "custom_tool",
      description: "我的自定义工具",
      inputSchema: {
        type: "object",
        properties: {
          input: { type: "string" }
        }
      }
    }
  ]
}));

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 环境变量管理

推荐使用环境变量管理敏感信息：

```bash
# .env 文件
CONTEXT7_API_KEY=ctx7sk-xxxxxx
GITHUB_TOKEN=ghp_xxxxxx
OPENAI_API_KEY=sk-xxxxxx
```

在配置中引用：
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    }
  }
}
```

### 性能优化建议

1. **按需启用MCP** - 只添加实际需要的MCP服务器
2. **使用MCP Router** - 减少重复启动的开销
3. **合理设置超时** - 避免长时间等待
4. **定期清理缓存** - 清除不需要的MCP缓存数据

```bash
# 清理npx缓存
npx clear-npx-cache

# 清理npm缓存
npm cache clean --force
```

---

## 相关资源

### 官方文档
- [MCP官方文档](https://modelcontextprotocol.io/)
- [MCP GitHub仓库](https://github.com/modelcontextprotocol)
- [Context7文档](https://github.com/upstash/context7)

### 常用MCP服务器列表
- [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- [@modelcontextprotocol/server-fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [@playwright/mcp](https://github.com/microsoft/playwright-mcp)

### 社区资源
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) - MCP服务器精选列表
- [MCP Discord社区](https://discord.gg/modelcontextprotocol) - 官方Discord频道
