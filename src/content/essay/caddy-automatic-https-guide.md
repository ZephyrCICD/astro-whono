---
title: "Caddy自动HTTPS配置完全指南"
description: "详细介绍如何使用Caddy实现自动HTTPS配置和反向代理，3行代码完成SSL配置，支持HTTP/2、HTTP/3，包含高级配置和与Nginx的完整对比"
date: 2025-11-07
publishedAt: 2025-11-07T20:30:00+08:00
updatedAt: 2025-11-07
badge: Ops
tags:
  - "Caddy"
  - "HTTPS"
  - "SSL"
  - "Automation"
  - "Web Server"
  - "Reverse Proxy"
  - "Let's Encrypt"
  - "Tech"
  - "Ops"
draft: false
archive: true
---
本文档记录了使用Caddy配置自动HTTPS证书和反向代理的完整过程。

<!--more-->

## 目录

- [1. Caddy简介和优势](#1-caddy简介和优势)
- [2. 环境要求](#2-环境要求)
- [3. 安装Caddy](#3-安装caddy)
- [4. DNS记录配置](#4-dns记录配置)
- [5. Caddy配置](#5-caddy配置)
- [6. 启动和管理](#6-启动和管理)
- [7. 测试和验证](#7-测试和验证)
- [8. 常见问题](#8-常见问题)
- [9. 高级配置](#9-高级配置)
- [10. 维护和更新](#10-维护和更新)
- [11. 与Nginx对比](#11-与nginx对比)

本文档记录了使用Caddy配置自动HTTPS证书和反向代理的完整过程。

## 目录

- [1. Caddy简介和优势](#1-caddy简介和优势)
- [2. 环境要求](#2-环境要求)
- [3. 安装Caddy](#3-安装caddy)
- [4. DNS记录配置](#4-dns记录配置)
- [5. Caddy配置](#5-caddy配置)
- [6. 启动和管理](#6-启动和管理)
- [7. 测试和验证](#7-测试和验证)
- [8. 常见问题](#8-常见问题)
- [9. 高级配置](#9-高级配置)
- [10. 维护和更新](#10-维护和更新)
- [11. 与Nginx对比](#11-与nginx对比)

---

## 1. Caddy简介和优势

### 1.1 什么是Caddy

Caddy是一个现代化的Web服务器，使用Go语言编写，以简单、安全、自动化著称。

### 1.2 核心优势

| 特性 | Caddy | Nginx + Certbot |
|------|-------|----------------|
| **自动HTTPS** | ✅ 完全自动 | ❌ 需手动配置 |
| **证书申请** | ✅ 自动申请 | ⚙️ 需运行certbot |
| **证书续期** | ✅ 自动续期 | ⚙️ 需配置定时任务 |
| **配置复杂度** | ✅ 极简 | ⚙️ 较复杂 |
| **HTTP/2** | ✅ 默认启用 | ⚙️ 需手动配置 |
| **HTTP/3** | ✅ 支持 | ❌ 需额外编译 |
| **性能** | ✅ 优秀 | ✅ 优秀 |

### 1.3 适用场景

**推荐使用Caddy**：
- 需要自动HTTPS管理
- 追求简单配置
- 新项目或小型项目
- 快速部署需求

**继续使用Nginx**：
- 已有复杂的Nginx配置
- 需要特定的Nginx模块
- 超大规模部署（需精细调优）

---

## 2. 环境要求

### 2.1 基本要求

- **操作系统**: Ubuntu 20.04+ / Debian 10+ 或其他Linux发行版
- **域名**: 已注册的域名，并可以管理DNS记录
- **服务器**: 具有公网IP的云服务器
- **权限**: sudo或root权限
- **端口**:
  - 80端口（HTTP）- 用于证书验证和HTTP到HTTPS重定向
  - 443端口（HTTPS）- 用于SSL/TLS加密连接

### 2.2 后端服务说明

本指南适用于任何后端服务，例如：
- **Web框架**: Express、Django、Flask、Spring Boot、FastAPI等
- **前端应用**: React、Vue、Angular构建后的静态文件
- **其他服务**: 任何监听在本地端口的HTTP服务

示例场景：
- `example.com` - 前端静态网站（React/Vue等）
- `api.example.com` - 后端API服务（任意端口，如8080）
- `admin.example.com` - 管理后台（任意端口，如3000）

---

## 3. 安装Caddy

### 3.1 官方推荐安装方式

#### Ubuntu/Debian

```bash
# 安装依赖
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

# 添加Caddy官方仓库
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# 更新并安装Caddy
sudo apt update
sudo apt install caddy
```

#### CentOS/RHEL/Fedora

```bash
# 添加Caddy官方仓库
dnf install 'dnf-command(copr)'
dnf copr enable @caddy/caddy

# 安装Caddy
dnf install caddy
```

### 3.2 验证安装

```bash
# 检查Caddy版本
caddy version

# 检查Caddy服务状态
sudo systemctl status caddy
```

### 3.3 Caddy文件结构

```
/etc/caddy/
├── Caddyfile          # 主配置文件
└── caddy.json         # JSON格式配置（可选）

/var/lib/caddy/        # Caddy数据目录
├── .local/            # 证书存储
└── certificates/      # Let's Encrypt证书

/usr/bin/caddy         # Caddy可执行文件
```

---

## 4. DNS记录配置

### 4.1 添加A记录

在DNS控制台添加A记录，将域名指向服务器IP：

| 类型 | 名称 | 值 | TTL |
|------|------|----|----|
| A | @ | 服务器公网IP | 600 |
| A | www | 服务器公网IP | 600 |
| A | api | 服务器公网IP | 600 |
| A | admin | 服务器公网IP | 600 |

> ⚠️ **重要**: 在启动Caddy前，必须确保DNS已解析到服务器，否则自动HTTPS会失败

### 4.2 验证DNS解析

```bash
# 验证主域名
dig example.com

# 验证子域名
dig api.example.com
dig admin.example.com

# 确保返回的IP地址是您的服务器IP
```

---

## 5. Caddy配置

### 5.1 Caddyfile基本语法

Caddyfile使用简洁的语法，基本结构：

```
域名 {
    指令1
    指令2
}
```

### 5.2 配置示例

#### 场景说明

假设您有以下服务：
- **前端应用** (`example.com`) - 静态文件位于 `/var/www/frontend`
- **后端API** (`api.example.com`) - 运行在 `http://127.0.0.1:8080`
- **管理后台** (`admin.example.com`) - 运行在 `http://127.0.0.1:3000`

#### 完整配置文件

编辑Caddyfile：

```bash
sudo nano /etc/caddy/Caddyfile
```

添加以下内容：

```text
# 主站 - 前端静态文件
example.com, www.example.com {
    # 静态文件根目录
    root * /var/www/frontend

    # 启用文件服务器
    file_server

    # SPA应用支持（React/Vue等）
    try_files {path} /index.html

    # 启用压缩
    encode gzip

    # 日志（可选）
    log {
        output file /var/log/caddy/example.com.log
        format json
    }
}

# API服务 - 反向代理到后端
api.example.com {
    # 反向代理到后端服务（可以是任意技术栈：Spring Boot、Express、Django等）
    reverse_proxy http://127.0.0.1:8080

    # 启用压缩
    encode gzip

    # 超时设置
    @timeout {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }

    # 日志（可选）
    log {
        output file /var/log/caddy/api.example.com.log
        format json
    }
}

# 管理后台 - 反向代理到本地服务
admin.example.com {
    # 反向代理到管理后台服务
    reverse_proxy http://127.0.0.1:3000

    # 启用压缩
    encode gzip

    # 日志（可选）
    log {
        output file /var/log/caddy/admin.example.com.log
        format json
    }
}
```

### 5.3 配置说明

| 指令 | 说明 | 示例 |
|------|------|------|
| `root * 路径` | 静态文件根目录 | `root * /var/www/frontend` |
| `file_server` | 启用文件服务器 | 用于提供静态文件 |
| `reverse_proxy` | 反向代理 | `reverse_proxy http://127.0.0.1:8080` |
| `encode gzip` | 启用Gzip压缩 | 自动压缩响应内容 |
| `try_files` | 文件查找顺序 | 用于SPA应用路由 |
| `log` | 日志配置 | 记录访问和错误日志 |

### 5.4 创建日志目录

```bash
# 创建日志目录
sudo mkdir -p /var/log/caddy

# 设置权限
sudo chown -R caddy:caddy /var/log/caddy
```

### 5.5 验证配置语法

```bash
# 验证Caddyfile语法
sudo caddy validate --config /etc/caddy/Caddyfile

# 格式化Caddyfile（可选）
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

---

## 6. 启动和管理

### 6.1 启动Caddy

```bash
# 启动Caddy服务
sudo systemctl start caddy

# 设置开机自启
sudo systemctl enable caddy

# 查看服务状态
sudo systemctl status caddy
```

### 6.2 重新加载配置

修改Caddyfile后，无需重启服务：

```bash
# 重新加载配置（零停机时间）
sudo systemctl reload caddy

# 或者使用caddy命令
sudo caddy reload --config /etc/caddy/Caddyfile
```

### 6.3 常用管理命令

```bash
# 启动服务
sudo systemctl start caddy

# 停止服务
sudo systemctl stop caddy

# 重启服务
sudo systemctl restart caddy

# 重新加载配置
sudo systemctl reload caddy

# 查看服务状态
sudo systemctl status caddy

# 查看实时日志
sudo journalctl -u caddy -f
```

---

## 7. 测试和验证

### 7.1 检查后端服务状态

```bash
# 检查后端服务是否运行（替换为实际端口）
sudo ss -tlnp | grep :8080
sudo ss -tlnp | grep :3000

# 检查Caddy状态
sudo systemctl status caddy

# 查看Caddy日志
sudo journalctl -u caddy -n 50
```

### 7.2 测试访问

在浏览器中访问（Caddy会自动申请并配置HTTPS）：
- **主站**: https://example.com
- **API**: https://api.example.com
- **管理后台**: https://admin.example.com

> ⚠️ **注意**: 首次访问可能需要等待10-30秒，Caddy正在申请证书

### 7.3 验证HTTPS证书

```bash
# 查看证书详情
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -text

# 查看证书有效期
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates

# 查看证书颁发者
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -issuer
```

### 7.4 检查证书存储位置

```bash
# Caddy自动管理的证书位置
sudo ls -la /var/lib/caddy/.local/share/caddy/certificates/

# 查看证书详情
sudo caddy list-certificates
```

### 7.5 测试HTTP到HTTPS重定向

```bash
# 测试HTTP请求是否重定向到HTTPS
curl -I http://example.com

# 应该看到 301 或 308 重定向到 https://
```

---

## 8. 常见问题

### 8.1 证书申请失败

**问题**: 启动Caddy后，访问域名显示证书错误或Caddy日志报错

**常见原因**:
1. DNS未正确解析到服务器
2. 80或443端口被占用
3. 防火墙阻止了80/443端口
4. Let's Encrypt速率限制

**解决方案**:

```bash
# 1. 验证DNS解析
dig example.com

# 2. 检查端口占用
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# 3. 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. 查看详细错误日志
sudo journalctl -u caddy -n 100

# 5. 重启Caddy
sudo systemctl restart caddy
```

### 8.2 配置文件语法错误

**问题**: 修改配置后重载失败

**解决方案**:

```bash
# 验证配置语法
sudo caddy validate --config /etc/caddy/Caddyfile

# 查看具体错误信息
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

### 8.3 反向代理502错误

**问题**: 访问代理的域名返回502 Bad Gateway

**解决方案**:

```bash
# 1. 检查后端服务是否运行
sudo ss -tlnp | grep :8080

# 2. 测试后端服务是否可访问
curl http://127.0.0.1:8080

# 3. 检查Caddy错误日志
sudo journalctl -u caddy -f

# 4. 检查防火墙是否阻止了本地连接
sudo iptables -L -n
```

### 8.4 证书自动续期失败

**问题**: 证书即将过期但未自动续期

**解决方案**:

Caddy会在证书到期前自动续期，无需手动操作。如果遇到问题：

```bash
# 查看Caddy日志
sudo journalctl -u caddy | grep -i certificate

# 手动触发证书续期（通常不需要）
sudo systemctl restart caddy

# 检查证书有效期
sudo caddy list-certificates
```

### 8.5 端口冲突

**问题**: Caddy启动失败，提示端口已被占用

**解决方案**:

```bash
# 查看80和443端口占用情况
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443

# 停止占用端口的服务（如Nginx）
sudo systemctl stop nginx
sudo systemctl disable nginx

# 重新启动Caddy
sudo systemctl start caddy
```

---

## 9. 高级配置

### 9.1 自定义证书邮箱

默认情况下，Caddy会自动管理证书。您可以指定邮箱接收Let's Encrypt通知：

```text
# 在Caddyfile顶部添加全局选项
{
    email your-email@example.com
}

example.com {
    # 站点配置...
}
```

### 9.2 启用访问日志

```text
example.com {
    # 访问日志
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
    }

    # 站点配置...
}
```

### 9.3 配置CORS（跨域）

```text
api.example.com {
    # CORS配置
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header Access-Control-Allow-Origin "*"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type, Authorization"
        respond 204
    }

    header Access-Control-Allow-Origin "*"

    reverse_proxy http://127.0.0.1:8080
}
```

### 9.4 请求限流

```text
api.example.com {
    # 限流：每秒100个请求
    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1s
        }
    }

    reverse_proxy http://127.0.0.1:8080
}
```

### 9.5 基本认证

```text
admin.example.com {
    # 基本认证
    basicauth {
        admin $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx7wNQsUYu4aW
        # 密码: password123
        # 生成命令: caddy hash-password
    }

    reverse_proxy http://127.0.0.1:3000
}
```

生成密码哈希：

```bash
caddy hash-password
```

### 9.6 启用HTTP/3

```text
{
    # 全局启用HTTP/3
    servers {
        protocols h1 h2 h3
    }
}

example.com {
    # 站点配置...
}
```

### 9.7 自定义错误页面

```text
example.com {
    root * /var/www/frontend
    file_server

    # 自定义错误页面
    handle_errors {
        @404 {
            expression {http.error.status_code} == 404
        }
        rewrite @404 /404.html
        file_server
    }
}
```

### 9.8 重定向配置

```text
# HTTP重定向到HTTPS（自动）
# Caddy默认会自动处理

# 域名重定向
www.example.com {
    redir https://example.com{uri} permanent
}

# 路径重定向
example.com {
    redir /old-path /new-path permanent
}
```

### 9.9 WebSocket支持

```text
ws.example.com {
    # WebSocket会自动支持
    reverse_proxy http://127.0.0.1:3001
}
```

### 9.10 多个后端负载均衡

```text
api.example.com {
    # 负载均衡到多个后端
    reverse_proxy http://127.0.0.1:8080 http://127.0.0.1:8081 http://127.0.0.1:8082 {
        lb_policy round_robin
        health_check /health
    }
}
```

---

## 10. 维护和更新

### 10.1 自动证书续期

**Caddy的最大优势**：证书完全自动续期，无需任何手动操作！

- ✅ 证书会在到期前自动续期
- ✅ 零停机时间
- ✅ 无需配置定时任务
- ✅ 自动处理续期失败重试

### 10.2 查看证书状态

```bash
# 查看所有管理的证书
sudo caddy list-certificates

# 查看证书详细信息
sudo ls -la /var/lib/caddy/.local/share/caddy/certificates/

# 检查证书有效期
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates
```

### 10.3 更新Caddy

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade caddy

# 查看新版本
caddy version

# 重启服务
sudo systemctl restart caddy
```

### 10.4 配置备份

```bash
# 备份Caddyfile
sudo cp /etc/caddy/Caddyfile ~/caddy-backup-$(date +%Y%m%d).Caddyfile

# 备份证书（通常不需要，Caddy会自动管理）
sudo tar -czf ~/caddy-data-backup-$(date +%Y%m%d).tar.gz /var/lib/caddy/
```

### 10.5 修改配置的标准流程

```bash
# 1. 备份当前配置
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# 2. 编辑配置
sudo nano /etc/caddy/Caddyfile

# 3. 验证语法
sudo caddy validate --config /etc/caddy/Caddyfile

# 4. 格式化配置（可选）
sudo caddy fmt --overwrite /etc/caddy/Caddyfile

# 5. 重新加载配置（零停机）
sudo systemctl reload caddy

# 6. 检查服务状态
sudo systemctl status caddy

# 7. 查看日志（确认无错误）
sudo journalctl -u caddy -n 20
```

### 10.6 日志管理

```bash
# 查看Caddy系统日志
sudo journalctl -u caddy -n 100

# 实时查看日志
sudo journalctl -u caddy -f

# 查看访问日志（如果配置了）
sudo tail -f /var/log/caddy/access.log

# 清理旧日志
sudo journalctl --vacuum-time=7d
```

### 10.7 性能监控

```bash
# 查看Caddy进程资源占用
ps aux | grep caddy

# 查看内存使用
sudo systemctl status caddy

# 查看端口监听
sudo ss -tlnp | grep caddy
```

---

## 11. 与Nginx对比

### 11.1 配置复杂度对比

#### Nginx配置（约70行）

```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect off;
    }
}
```

#### Caddy配置（3行）

```text
api.example.com {
    reverse_proxy http://127.0.0.1:8080
}
```

> ✅ Caddy自动处理：HTTP重定向、HTTPS、证书申请、证书续期、HTTP/2、安全配置、请求头转发等

### 11.2 证书管理对比

| 操作 | Nginx + Certbot | Caddy |
|------|----------------|-------|
| **安装证书工具** | `apt install certbot` | 无需额外工具 |
| **申请证书** | `certbot certonly --nginx` | 自动 |
| **配置证书路径** | 手动添加到Nginx配置 | 自动 |
| **证书续期** | 配置systemd timer | 自动 |
| **续期测试** | `certbot renew --dry-run` | 无需测试 |
| **续期失败处理** | 手动排查和修复 | 自动重试 |
| **零停机续期** | 需要reload nginx | 自动处理 |

### 11.3 迁移建议

**何时应该迁移到Caddy**：
- ✅ 新项目
- ✅ 配置简单的项目
- ✅ 厌倦手动管理证书
- ✅ 希望简化运维

**何时保留Nginx**：
- ⚙️ 有复杂的Nginx配置（如lua脚本、特殊模块）
- ⚙️ 团队熟悉Nginx，不愿学习新工具
- ⚙️ 需要特定的Nginx高级特性

### 11.4 从Nginx迁移到Caddy

```bash
# 1. 停止Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# 2. 安装Caddy（参考第3章）
# ...

# 3. 转换配置
# 将Nginx的 proxy_pass 转换为 Caddy的 reverse_proxy
# 将Nginx的 root 转换为 Caddy的 root * 和 file_server

# 4. 启动Caddy
sudo systemctl start caddy

# 5. 测试访问
# Caddy会自动申请新证书
```

---

## 附录

### A. Caddyfile指令速查

```text
# 静态文件服务
root * /var/www/html
file_server

# 反向代理
reverse_proxy http://localhost:8080

# HTTP重定向到HTTPS（自动）
# Caddy默认处理，无需配置

# 域名重定向
redir https://example.com{uri} permanent

# Gzip压缩
encode gzip

# 日志
log {
    output file /var/log/caddy/access.log
}

# CORS
header Access-Control-Allow-Origin "*"

# 基本认证
basicauth {
    user $2a$14$...
}

# 重写规则
rewrite /old /new

# 尝试文件（SPA支持）
try_files {path} /index.html

# 响应头
header X-Custom-Header "value"

# 请求匹配
@api {
    path /api/*
}
reverse_proxy @api http://localhost:8080
```

### B. 常用命令速查

```bash
# 服务管理
sudo systemctl start caddy        # 启动
sudo systemctl stop caddy         # 停止
sudo systemctl restart caddy      # 重启
sudo systemctl reload caddy       # 重新加载配置
sudo systemctl status caddy       # 查看状态

# 配置管理
sudo caddy validate --config /etc/caddy/Caddyfile  # 验证配置
sudo caddy fmt --overwrite /etc/caddy/Caddyfile    # 格式化配置
sudo caddy run --config /etc/caddy/Caddyfile       # 前台运行（调试用）

# 证书管理
sudo caddy list-certificates      # 查看证书列表
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates  # 查看证书有效期

# 日志查看
sudo journalctl -u caddy -f       # 实时日志
sudo journalctl -u caddy -n 100   # 最近100行日志

# 端口检查
sudo ss -tlnp | grep :80          # 检查80端口
sudo ss -tlnp | grep :443         # 检查443端口
```

### C. 故障排查流程

1. **检查DNS解析**: `dig example.com`
2. **检查端口占用**: `sudo ss -tlnp | grep :80` 和 `sudo ss -tlnp | grep :443`
3. **检查后端服务**: `sudo ss -tlnp | grep :端口号`
4. **验证配置语法**: `sudo caddy validate --config /etc/caddy/Caddyfile`
5. **查看错误日志**: `sudo journalctl -u caddy -n 100`
6. **测试后端连接**: `curl http://127.0.0.1:8080`
7. **检查防火墙**: `sudo ufw status`
8. **重启服务**: `sudo systemctl restart caddy`

### D. 安全建议

```bash
# 配置防火墙
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 定期更新系统
sudo apt update && sudo apt upgrade

# 定期更新Caddy
sudo apt update && sudo apt upgrade caddy

# 监控日志
sudo journalctl -u caddy | grep -i error
```

### E. 性能优化

```text
{
    # 全局配置
    servers {
        protocols h1 h2 h3
    }
}

example.com {
    # 启用压缩
    encode gzip

    # 静态文件缓存
    @static {
        file
        path *.jpg *.jpeg *.png *.gif *.webp *.css *.js *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000"

    # 其他配置...
}
```

---

## 总结

### Caddy的核心优势

1. **🚀 极简配置** - 3行配置实现HTTPS反向代理
2. **🔒 自动HTTPS** - 无需手动管理证书，完全自动化
3. **⚡ 零停机维护** - 配置重载和证书续期都是零停机
4. **🛠️ 开箱即用** - 默认安全配置，HTTP/2自动启用
5. **📦 单一二进制** - 无依赖，部署简单

### 推荐使用场景

- ✅ 小型到中型网站
- ✅ 微服务架构
- ✅ 个人项目和博客
- ✅ API网关
- ✅ 快速原型开发

---

**文档版本**: v1.0
**适用版本**: Caddy 2.7+
**官方文档**: https://caddyserver.com/docs/

**贡献**: 如有问题或建议，欢迎反馈
