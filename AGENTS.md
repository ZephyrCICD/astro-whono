# AGENTS.md

Guidance for AI coding agents working in this repository.

This repo was forked from `astro-whono` and is being converted into a personal blog. Example/tutorial content may be removed later, so treat this file as the durable project contract.

## Project Context

- This is an Astro 6 static blog/theme with local development admin tools.
- Package manager: pnpm 10.15.1. Keep `pnpm-lock.yaml` in sync when dependency changes are intentional.
- Node requirement: `>=22.12.0`. `.nvmrc` currently records `22.22.0`, but local toolchains may use mise or another manager.
- Main configuration entry points:
  - `site.config.mjs` for legacy/default site values and pagination constants.
  - `src/content.config.ts` for Astro Content Collections schemas.
  - `src/data/settings/*.json` for Theme Console-managed settings.
  - `astro.config.mjs` for Astro output mode, markdown pipeline, sitemap, aliases, and sanitizer allowlist.

## Working Rules

- Preserve user edits. This repo may have dirty files; inspect before editing and do not revert unrelated changes.
- Prefer small, focused changes that match the current Astro/TypeScript/CSS style.
- Do not turn example article content into permanent product requirements. Extract reusable conventions into this file or implementation tests instead.
- Keep route behavior, content schemas, and admin API boundaries explicit. Avoid hidden conventions spread across content files.
- Use ASCII for code/config unless the existing file already uses Chinese prose or another clear non-ASCII context.
- When adding public behavior, update the relevant README/docs only if it is still meant to survive the fork. Otherwise keep notes in `AGENTS.md` or tests.
- Personal blog content updates target this fork/repository. Do not create or suggest pull requests back to the upstream/original author unless the user explicitly asks for that.

## Commands

- Install: `pnpm install`
- Dev server: `pnpm run dev`
- Type/content check: `pnpm run check`
- Unit tests: `pnpm test`
- Build: `pnpm run build`
- Default regression: `pnpm run ci`
- Markdown fixture regression: `pnpm run check:markdown-smoke`
- Production artifact check, after setting a real production domain:
  - `SITE_URL=https://your-domain pnpm run build`
  - `SITE_URL=https://your-domain pnpm run check:prod-artifacts`
- Admin preview boundary check, only when changing `/admin/**`, `/api/admin/**`, or dev/prod read-only behavior:
  - `pnpm run check:preview-admin`

Before finishing code changes, run the narrowest useful check. For shared routing, content schema, markdown rendering, or admin changes, prefer `pnpm run ci`.

## Content Model

Content Collections are defined in `src/content.config.ts`.

- Essays live in `src/content/essay/**.md`.
- Bits live in `src/content/bits/**.md`.
- Memo currently lives in `src/content/memo/index.md`.
- Archive pages are generated from essay entries whose `archive` field is not `false`.

### Essay Frontmatter

Required:

```yaml
title: My Post
date: 2026-01-01
```

Common optional fields:

```yaml
description: SEO description only
tags:
  - Astro
draft: false
archive: true
listed: false
slug: optional-kebab-slug
badge: optional
cover: optional
publishedAt: 2026-01-01T12:00:00+08:00
updatedAt: 2026-01-02
```

Rules:

- `date` should usually be `YYYY-MM-DD`; ISO datetimes remain supported for old content.
- `updatedAt` is optional. Use it when an essay has meaningful revisions; it accepts `YYYY-MM-DD` or an ISO datetime and is displayed as an update date.
- When editing an existing published essay's body or moving legacy "last updated" footer text into metadata, add or refresh `updatedAt` in frontmatter and avoid leaving duplicate visible update-date text in the body.
- Public essay slugs must be lowercase kebab-case and unique after path flattening.
- If `slug` is omitted, nested content paths are flattened with `/` replaced by `-`.
- Reserved essay slugs: `page`, `tag`, `rss.xml`.
- `draft: true` is visible in dev, but excluded from production lists/RSS.
- `archive: false` excludes the entry from `/archive/` and archive RSS, but the essay can still exist elsewhere.
- `listed: false` keeps the entry routable and eligible for `/archive/`, but hides it from the home page, `/essay/`, essay RSS, and essay search JSON. Use this for reference/cold-archive material.
- `description` is for SEO/OG metadata. List excerpts come from body text, optionally split with `<!-- more -->`.

### Bits Frontmatter

Typical shape:

```yaml
date: 2026-01-01T12:00:00+08:00
tags:
  - loc:深圳
  - 阅读
images:
  - src: bits/demo-01.webp
    width: 800
    height: 800
    alt: optional alt text
draft: false
```

Rules:

- Bits can be untitled.
- `loc:<place>` is the location tag convention; only the first location tag is displayed.
- Bits images should usually be under `public/bits/**` and referenced without a leading slash, for example `bits/photo.webp`.
- `images[*].width` and `height` are optional but recommended to reduce layout shift.
- Bits currently do not generate detail pages from `slug`; do not add `slug` unless a feature explicitly needs it.
- Default bits author data comes from Theme Console page settings, falling back to `site.config.mjs`.
- Author avatars must be relative image paths such as `author/avatar.webp`: no `public/` prefix, no leading slash, no URL, no `..`, no query/hash.

## Markdown Conventions

The durable Markdown rendering contract is covered by `src/test-fixtures/markdown-smoke.md` and `pnpm run check:markdown-smoke`.

### Essay Embedded Images

When adding images inside essay Markdown files:

- Prefer colocated article images under `src/content/essay/**`, next to the Markdown file or in a small sibling folder named for the article/topic.
- Reference article-local images with Markdown-relative paths, for example `![Alt text](./photo.webp)` for directory entries or `![Alt text](./post-assets/photo.webp)` for flat `.md` entries.
- Use `public/images/**` only for direct-link assets that are intentionally shared across pages or should not participate in article-local organization.
- Use remote `https://` image URLs only when the image is intentionally hosted outside the repo, such as a stable R2/custom-domain asset. Do not use temporary, demo-domain, or upstream-theme image URLs in production content.
- Prefer compressed `webp` or `avif` files. Do not commit oversized originals when a display-sized derivative is enough for the article.
- Every content image needs meaningful alt text. If a caption is needed, use the existing `figure.figure` / `figcaption` convention rather than inventing one-off markup.
- For multiple related images, use the existing gallery convention (`ul.gallery > li > figure > img + figcaption?`) instead of ad hoc grid markup.

Supported authoring conventions:

- Callouts: `:::note[Title] ... :::`, `:::tip[...]`, `:::info[...]`, `:::warning[...]`.
- Unsupported callout types degrade to `note`.
- HTML callouts may use `<div class="callout note">` with `.callout-title`; use `data-icon="none"` on the title to hide the icon.
- Figures: `figure > (img|picture) + figcaption?`, with class `figure` on explicit HTML figures when needed.
- Figure captions: use `figcaption.figure-caption` for standalone explicit figures.
- Gallery: `ul.gallery > li > figure > (img|picture) + figcaption?`; optional classes include `cols-2` and `cols-3`.
- Pullquote: `blockquote.pullquote`.
- Standard code fences are enhanced at build time by Shiki toolbar/line-number behavior; authors do not need custom HTML for code blocks.

If sanitizer or markdown plugin behavior changes, update both `astro.config.mjs` and the smoke fixture/check together.

## Assets

- Article-local images: prefer `src/content/**` or `src/assets/**` when they should participate in Astro processing.
- Public direct-link assets: use `public/**`.
- Bits images: use `public/bits/**` and reference paths such as `bits/name.webp`.
- Author avatars: use `public/author/**` and reference paths such as `author/avatar.webp`.
- Home hero image supports `src/assets/**`, `public/**`, and `https://` URLs.
- Do not leave production pages requesting the upstream demo domain after personalization.

## Routes and SEO

- Canonical essay detail route: `/archive/[slug]/`.
- `/essay/[slug]/` exists for compatibility; do not make it the canonical target without checking redirects, sitemap exclusion, RSS, and docs.
- Main list pages: `/archive/`, `/essay/`, `/bits/`, `/memo/`, `/about/`.
- RSS endpoints include `/rss.xml`, `/archive/rss.xml`, and `/essay/rss.xml`.
- `SITE_URL` should be set in production without a trailing slash. It controls canonical URLs, Open Graph URLs, RSS links, sitemap generation, and the `Sitemap:` line in `robots.txt`.
- Without `SITE_URL`, builds still pass by using `https://example.invalid`, but SEO artifacts are intentionally incomplete.
- GitHub Pages project-site deployment uses `.github/workflows/github-pages.yml`, `SITE_URL=https://zephyrcicd.github.io/astro-whono`, and `SITE_BASE=/astro-whono`. Vercel should leave `SITE_BASE` unset unless it is also deployed under a subpath.

## Admin Console

Admin Console is a local development tool, not a production CMS.

- Stable entry: `/admin/`.
- Theme settings: `/admin/theme/`.
- Images browser/path helper: `/admin/images/`.
- Checks: `/admin/checks/`.
- Data import/export: `/admin/data/`.
- Content Console is still in progress.
- `src/data/settings/*.json` is generated or updated by Theme Console saves and should be treated as normal tracked project state when personalization is intentional.
- Theme Console writes by settings group: `site`, `shell`, `home`, `page`, `ui`.
- Settings read order is `src/data/settings/*.json` first, then legacy config, then defaults.
- In production, `/admin/` may expose only a read-only overview or hidden-state message depending on settings. Admin tabs and write forms must stay development-only.
- `/api/admin/settings/`, `/api/admin/content/entry/`, and `/api/admin/data/settings/` are local development APIs only. Do not rely on them as public production APIs.
- If changing admin dev/prod boundaries, run `pnpm run check:preview-admin`.

## Styling and UI

- Shared style entry: `src/styles/global.css`.
- Page/scene style entries: `src/styles/home.css`, `src/styles/about.css`, `src/styles/memo.css`, `src/styles/article.css`, `src/styles/bits-page.css`.
- Admin shell styles start at `src/styles/components/admin-shell.css`; route-specific admin styles live under `src/styles/components/`.
- Keep frontend changes consistent with the existing minimal two-column writing theme unless the user explicitly asks for a broader redesign.
- Do not reintroduce a monolithic admin stylesheet unless there is a clear reason; current structure uses shell plus route/component styles.

### About Page FAQ Pattern

The About page FAQ was removed during personalization because the old questions documented the upstream theme, not the personal blog. If an FAQ is needed later, add it back as an explicit About page section rather than mixing it into article content.

Use native `<details>` for each question:

```astro
<h2 class="section-title about-section-title">常见问题</h2>
<section class="qa-list" aria-label="常见问题">
  <details class="qa-item">
    <summary class="qa-question">
      <span class="qa-icon" aria-hidden="true">Q</span>
      问题标题
    </summary>
    <p class="qa-answer">回答内容。</p>
  </details>
</section>
```

Style only the About page local classes in `src/styles/about.css`: `.qa-list`, `.qa-item`, `.qa-question`, `.qa-icon`, and `.qa-answer`. Keep FAQ copy personal-site focused; do not restore upstream theme deployment/tutorial questions unless they are intentionally being documented as site-maintenance notes.

## Fonts

- The repo includes subset WOFF2 font files for Noto Serif SC and LXGW WenKai Lite.
- Source fonts are expected under `tools/fonts-src/` and are not committed.
- To regenerate subsets, install the Python font tooling described in `README.md`, then run `pnpm run font:build`.
- `tools/charset-common.txt` is generated by `pnpm run font:charset`; do not hand-edit it unless intentionally bypassing the full font pipeline.

## Personalization/Fork Cleanup

When converting this fork into a personal blog:

- Replace upstream brand/title/author defaults in Theme Console settings and/or `site.config.mjs`.
- Upstream tutorial/example/Astro guide posts may be kept as reference material only when marked `listed: false`; keep durable conventions in `AGENTS.md` and tests.
- Replace or remove demo posts under `src/content/essay`, `src/content/bits`, and `src/content/memo`.
- Replace demo images under `public/**` and article asset folders when they are no longer referenced.
- Keep `src/test-fixtures/markdown-smoke.md` or an equivalent fixture even if tutorial posts are removed; it protects markdown rendering behavior.
- After removing examples, run `pnpm run ci` and check that no page still references demo-domain resources or deleted assets.
