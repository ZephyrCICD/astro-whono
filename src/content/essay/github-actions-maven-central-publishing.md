---
title: "GitHub Actions 自动化 Maven Central 发布完整指南：从配置到实战"
description: "完整介绍如何使用 GitHub Actions 实现 Maven Central 自动化发布，包括 Sonatype 令牌配置、GPG 签名、工作流设计和常见问题解决"
date: 2025-11-05
publishedAt: 2025-11-05T18:00:00+08:00
badge: CI/CD
tags:
  - "GitHub Actions"
  - "Maven Central"
  - "CI/CD"
  - "Release Automation"
  - "DevOps"
  - "Java"
  - "Tech"
  - "Automation"
draft: false
archive: true
---
## 前言

在 Java 开源项目开发中，将包发布到 Maven Central 是一个常见需求。传统的手动发布流程不仅繁琐，还容易出错。本文将介绍如何使用 GitHub Actions 实现完全自动化的 Maven Central 发布流程，让您只需推送一个 Git 标签就能完成整个发布过程。

## 自动化发布的价值

### 传统手动发布的痛点

- **步骤繁琐**：需要手动执行多个 Maven 命令
- **易出错**：版本号不一致、签名失败等问题频发  
- **效率低下**：每次发布都需要重复相同的操作
- **环境依赖**：依赖开发者本地环境配置

### 自动化发布的优势

- **一键发布**：推送标签即可触发完整发布流程
- **版本控制**：严格控制只有标记的版本才会发布
- **一致性保证**：每次发布使用相同的环境和流程
- **错误追踪**：完整的构建日志，便于问题排查

## 核心配置

### 1. GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets（Settings → Secrets and variables → Actions）：

#### 必需的 Secrets：

**`MAVEN_USERNAME`**
- 值：您的 Sonatype 用户令牌的 Username 部分
- 获取方式：见下方"获取 Sonatype 用户令牌"部分

**`MAVEN_CENTRAL_TOKEN`**
- 值：您的 Sonatype 用户令牌的 Password 部分
- 注意：这与您在本地 `.m2/settings.xml` 中配置的是同一个令牌

**`GPG_PRIVATE_KEY`**
- 值：GPG 私钥的完整内容
- 获取方式：`gpg --armor --export-secret-keys <your-key-id>`

**`GPG_PASSPHRASE`**
- 值：GPG 密钥的密码

### 2. 获取 Sonatype 用户令牌

#### 步骤详解：

1. **登录 Sonatype 账户**
   - 访问 [https://central.sonatype.com/](https://central.sonatype.com/)
   - 使用您的账户登录

2. **生成用户令牌**
   - 点击右上角的用户头像
   - 选择 "View Account"
   - 在左侧菜单选择 "Generate User Token"
   - 点击 "Generate User Token" 按钮

3. **复制令牌信息**
   ```
   Username: 8a2b3c4d-1234-5678-9abc-def012345678
   Password: AbCdEfGhIjKlMnOpQrStUvWxYz123456789+/=
   ```

4. **配置到 GitHub Secrets**
   - `MAVEN_USERNAME` = 上面的 Username
   - `MAVEN_CENTRAL_TOKEN` = 上面的 Password

#### 与本地配置的关系：

如果您已经在本地 `.m2/settings.xml` 中配置过 Maven Central 发布，那么：

**本地配置（.m2/settings.xml）：**
```xml
<server>
    <id>central</id>
    <username>8a2b3c4d-1234-5678-9abc-def012345678</username>
    <password>AbCdEfGhIjKlMnOpQrStUvWxYz123456789+/=</password>
</server>
```

**GitHub Actions 配置：**
- `MAVEN_USERNAME` = settings.xml 中的 `<username>` 值
- `MAVEN_CENTRAL_TOKEN` = settings.xml 中的 `<password>` 值

**重要提示：** 这是同一个 Sonatype 用户令牌，只是在不同地方使用不同的名称。

## GitHub Actions 工作流设计

### 完整工作流配置

创建 `.github/workflows/publish.yml` 文件：

```yaml
name: Publish to Maven Central

on:
  push:
    tags:
      - 'v*'  # 当推送 v1.2.1, v1.3.0 等标签时触发

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up JDK 8
      uses: actions/setup-java@v4
      with:
        java-version: '8'
        distribution: 'temurin'
        server-id: central
        server-username: MAVEN_USERNAME
        server-password: MAVEN_CENTRAL_TOKEN
        gpg-private-key: ${{ secrets.GPG_PRIVATE_KEY }}
        gpg-passphrase: MAVEN_GPG_PASSPHRASE

    - name: Cache Maven dependencies
      uses: actions/cache@v4
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2

    - name: Extract version from tag
      id: extract_version
      run: |
        # 从标签中提取版本号 (v1.2.1 -> 1.2.1)
        VERSION=${GITHUB_REF#refs/tags/v}
        echo "VERSION=$VERSION" >> $GITHUB_OUTPUT
        echo "Extracted version: $VERSION"

    - name: Verify version matches pom.xml
      run: |
        # 检查标签版本是否与 pom.xml 中的版本一致
        POM_VERSION=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout)
        TAG_VERSION=${{ steps.extract_version.outputs.VERSION }}
        echo "POM version: $POM_VERSION"
        echo "Tag version: $TAG_VERSION"
        if [ "$POM_VERSION" != "$TAG_VERSION" ]; then
          echo "Error: Version mismatch between pom.xml ($POM_VERSION) and tag ($TAG_VERSION)"
          exit 1
        fi
        echo "Version verification passed: $POM_VERSION"

    - name: Run tests
      run: mvn clean test

    - name: Publish to Maven Central
      run: mvn clean deploy
      env:
        MAVEN_USERNAME: ${{ secrets.MAVEN_USERNAME }}
        MAVEN_CENTRAL_TOKEN: ${{ secrets.MAVEN_CENTRAL_TOKEN }}
        MAVEN_GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }}

    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref_name }}
        release_name: Release ${{ steps.extract_version.outputs.VERSION }}
        body: |
          ## 📦 Release ${{ steps.extract_version.outputs.VERSION }}
          
          ### 🚀 Maven 依赖
          ```xml
          <dependency>
              <groupId>你的groupId</groupId>
              <artifactId>你的artifactId</artifactId>
              <version>${{ steps.extract_version.outputs.VERSION }}</version>
          </dependency>
          ```
          
          ### 📋 更新内容
          详细更新内容请查看提交历史。
        draft: false
        prerelease: false
```

### 工作流程说明

#### 触发条件：
- 推送格式为 `v*` 的标签（如 v1.2.1, v1.3.0）

#### 执行步骤：
1. **环境准备**：设置 JDK 和 Maven 环境
2. **版本验证**：确保标签版本与 pom.xml 一致
3. **依赖缓存**：缓存 Maven 依赖以提高构建速度
4. **运行测试**：确保代码质量
5. **发布构建**：执行 `mvn clean deploy` 发布到 Maven Central
6. **创建 Release**：自动创建 GitHub Release 并生成更新日志

## 使用方法

### 发布新版本的完整流程

1. **更新版本号**
   ```bash
   # 编辑 pom.xml，更新版本号，例如改为 1.2.1
   vim pom.xml
   ```

2. **提交更改**
   ```bash
   git add .
   git commit -m "chore: 升级版本至 1.2.1"
   git push origin main
   ```

3. **创建并推送标签**
   ```bash
   git tag v1.2.1
   git push origin v1.2.1
   ```

4. **自动发布**
   - GitHub Actions 会自动检测到标签推送
   - 验证标签版本与 pom.xml 版本一致
   - 自动发布到 Maven Central
   - 创建 GitHub Release

### 监控发布状态

- 访问 GitHub 仓库的 Actions 页面
- 查看最新的工作流运行情况
- 如有错误，检查详细日志

## 常见问题与解决方案

### 版本相关问题

**问题：版本不匹配错误**
```
Error: Version mismatch between pom.xml (1.2.0) and tag (1.2.1)
```

**解决方案：**
- 确保 Git 标签版本与 pom.xml 中的版本完全一致
- 先更新 pom.xml 版本，再创建对应的标签

### GPG 签名问题

**问题：GPG 签名失败**
```
gpg: signing failed: No secret key
```

**解决方案：**
- 检查 `GPG_PRIVATE_KEY` 是否正确导出
- 验证 `GPG_PASSPHRASE` 密码是否正确
- 确保私钥格式完整（包含 `-----BEGIN PGP PRIVATE KEY BLOCK-----` 和 `-----END PGP PRIVATE KEY BLOCK-----`）

### Maven Central 认证问题

**问题：认证失败**
```
[ERROR] Failed to execute goal org.sonatype.central:central-publishing-maven-plugin:0.4.0:publish
```

**解决方案：**
- 验证 `MAVEN_USERNAME` 和 `MAVEN_CENTRAL_TOKEN` 是否有效
- 检查 Sonatype 用户令牌是否过期
- 确认令牌权限是否足够

### 网络连接问题

**问题：SSL 握手失败**
```
javax.net.ssl.SSLHandshakeException: Remote host terminated the handshake
```

**解决方案：**
- 通常是网络临时问题，可以重新运行工作流
- 检查 Maven Central 服务状态
- 考虑增加重试机制

## 最佳实践

### 1. 版本管理策略

- **语义化版本**：遵循 SemVer 规范（如 1.2.1）
- **预发布版本**：使用 `-SNAPSHOT` 后缀进行开发
- **标签规范**：使用 `v` 前缀（如 v1.2.1）

### 2. 安全配置

- **定期轮换**：定期更新 GPG 密钥和访问令牌
- **最小权限**：为 GitHub Actions 配置最小必要权限
- **密钥管理**：不要在代码中硬编码任何密钥信息

### 3. 工作流优化

- **依赖缓存**：缓存 Maven 依赖减少构建时间
- **并行执行**：合理设计步骤间的依赖关系
- **错误处理**：为关键步骤添加适当的错误处理

### 4. 测试策略

- **全面测试**：确保发布前运行完整的测试套件
- **环境隔离**：在干净的环境中运行测试
- **回滚准备**：为发布失败准备回滚方案

## 进阶配置

### 多环境发布

可以配置不同的发布环境：

```yaml
strategy:
  matrix:
    java-version: [8, 11, 17]
```

### 条件发布

添加更复杂的触发条件：

```yaml
on:
  push:
    tags:
      - 'v*'
    branches:
      - main
    paths-ignore:
      - 'docs/**'
      - '*.md'
```

### 发布通知

集成 Slack 或其他通知服务：

```yaml
- name: Notify Slack
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: "Successfully published version ${{ steps.extract_version.outputs.VERSION }} to Maven Central"
```

## 总结

通过 GitHub Actions 实现 Maven Central 自动化发布，不仅提高了发布效率，还保证了发布流程的一致性和可靠性。这套配置经过实际项目验证，可以直接应用到您的 Java 开源项目中。

关键收益：
- **效率提升**：从手动发布到一键发布
- **质量保证**：自动化测试和版本验证
- **错误减少**：消除人为操作失误
- **可追溯性**：完整的发布历史和日志

希望这份指南能帮助您建立高效的自动化发布流程。如果在实施过程中遇到问题，欢迎留言讨论！
