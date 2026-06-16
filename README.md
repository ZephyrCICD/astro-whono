# Zephyr CI/CD Blog

[English](README.en.md)

这是我的个人博客，记录技术实践、开发经验、工具使用和站点迁移整理。

本项目基于 Astro 构建，代码从 [cxro/astro-whono](https://github.com/cxro/astro-whono) fork 后改造而来。当前仓库按个人博客维护，并持续同步上游主题能力。

## 内容入口

- 首页：`/`
- 随笔：`/essay/`
- 归档：`/archive/`
- 絮语：`/bits/`
- 小记：`/memo/`
- 关于：`/about/`
- 本地后台：`/admin/`

## 本地开发

环境要求：

- Node.js `>=22.12.0`
- pnpm `10.15.1`

常用命令：

```bash
corepack enable
pnpm install
pnpm run dev
```

构建与检查：

```bash
pnpm run check
pnpm test
pnpm run build
pnpm run check:markdown-smoke
```

完整回归入口：

```bash
pnpm run ci
```

## 功能

- Astro 6 静态博客，保留双栏写作主题和移动端适配。
- 内容集合：随笔、絮语、小记、关于页。
- RSS：`/rss.xml`、`/archive/rss.xml`、`/essay/rss.xml`。
- Markdown 渲染支持代码块工具栏、callout、figure/gallery、Mermaid、数学公式和 About 页友链/FAQ 指令。
- 本地 Admin Console 支持 Theme、Content、Images、Checks、Data Console。
- Content Console 支持新建与编辑随笔、絮语、小记、关于页，以及内容导出、批量状态操作和图片上传。

## 内容结构

- `src/content/essay/`：长文章，详情页规范入口为 `/archive/[slug]/`
- `src/content/bits/`：短内容动态流
- `src/content/memo/index.md`：小记页面正文
- `src/content/about/index.md`：关于页正文
- `public/images/posts/`：文章公共图片资源
- `src/data/settings/*.json`：本地 Admin Console 写入的主题配置

## 本地 Admin Console

开发环境启动后访问 `http://localhost:4321/admin/`。

主要入口：

- `/admin/`：站点概览
- `/admin/theme/`：站点、侧栏、首页、内页文案等主题配置
- `/admin/content/`：内容管理、新建草稿、编辑与导出
- `/admin/images/`：图片资源浏览、路径辅助和受支持的本地上传
- `/admin/checks/`：结构化检查
- `/admin/data/`：settings 快照导入导出

这些后台写入能力只面向本地开发。生产构建仍是静态站点输出，`/api/admin/**` 不作为公开生产 API 使用。

## 部署

不再提供模板式一键部署按钮。部署时直接在 Vercel、Cloudflare Pages、GitHub Pages 或其他静态托管平台导入当前 GitHub 仓库即可。

推荐构建设置：

- Framework preset：Astro
- Build command：`pnpm run build`
- Output directory：`dist`

生产环境建议设置：

```text
SITE_URL=https://blog.zephyrcicd.com
```

`SITE_URL` 不要以 `/` 结尾。它用于生成 canonical、Open Graph URL、RSS 链接、sitemap 和 `robots.txt` 中的 Sitemap 行。未设置时站点仍可构建，但 SEO/分享相关链接会使用占位行为。

GitHub Pages 项目站部署使用：

```text
SITE_URL=https://zephyrcicd.github.io/astro-whono
SITE_BASE=/astro-whono
```

## 维护说明

- 修改内容后至少运行 `pnpm run check`。
- 修改页面、内容 schema、Markdown 渲染或 Admin Console 边界后，优先运行 `pnpm run ci`。
- 改动 `/admin/**` 或 `/api/admin/**` 后运行 `pnpm run check:preview-admin`。
- 发布前如需检查绝对链接产物：

```bash
SITE_URL=https://blog.zephyrcicd.com pnpm run build
SITE_URL=https://blog.zephyrcicd.com pnpm run check:prod-artifacts
```

## 来源与许可

本项目 fork 自 [cxro/astro-whono](https://github.com/cxro/astro-whono)，保留 MIT License。

感谢上游项目提供的 Astro 博客主题基础。
