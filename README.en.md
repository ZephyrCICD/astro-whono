# Zephyr CI/CD Blog

[中文](README.md)

This is my personal blog for technical notes, development experience, tool usage, and site migration records.

The project is built with Astro and forked from [cxro/astro-whono](https://github.com/cxro/astro-whono). This repository is maintained as a personal blog while selectively syncing upstream theme features.

## Routes

- Home: `/`
- Essays: `/essay/`
- Archive: `/archive/`
- Bits: `/bits/`
- Memo: `/memo/`
- About: `/about/`
- Local Admin Console: `/admin/`

## Local Development

Requirements:

- Node.js `>=22.12.0`
- pnpm `10.15.1`

Common commands:

```bash
corepack enable
pnpm install
pnpm run dev
```

Build and checks:

```bash
pnpm run check
pnpm test
pnpm run build
pnpm run check:markdown-smoke
```

Full regression entry:

```bash
pnpm run ci
```

## Features

- Astro 6 static blog with the two-column writing theme and mobile layout.
- Content collections: essays, bits, memo, and about page.
- RSS endpoints: `/rss.xml`, `/archive/rss.xml`, and `/essay/rss.xml`.
- Markdown rendering supports code-block toolbar, callouts, figures/galleries, Mermaid, math, and About-page friend/FAQ directives.
- Local Admin Console includes Theme, Content, Images, Checks, and Data Console.
- Content Console supports creating and editing essays, bits, memo, and about page, plus export, bulk status actions, and supported local image uploads.

## Content Structure

- `src/content/essay/`: long-form posts. Canonical detail route: `/archive/[slug]/`
- `src/content/bits/`: short-form feed
- `src/content/memo/index.md`: memo page body
- `src/content/about/index.md`: about page body
- `public/images/posts/`: public post images
- `src/data/settings/*.json`: theme settings written by the local Admin Console

## Local Admin Console

Start the dev server and open `http://localhost:4321/admin/`.

Main entries:

- `/admin/`: site overview
- `/admin/theme/`: site, sidebar, home page, and inner-page settings
- `/admin/content/`: content management, draft creation, editing, and export
- `/admin/images/`: image browser, path helper, and supported local uploads
- `/admin/checks/`: structured checks
- `/admin/data/`: settings snapshot import/export

Admin write features are local-development tools only. Production builds remain static output, and `/api/admin/**` should not be treated as public production APIs.

## Deployment

This repository no longer keeps template-style one-click deploy buttons. Import the current GitHub repository directly in Vercel, Cloudflare Pages, GitHub Pages, or another static hosting provider.

Recommended build settings:

- Framework preset: Astro
- Build command: `pnpm run build`
- Output directory: `dist`

Recommended production environment variable:

```text
SITE_URL=https://blog.zephyrcicd.com
```

Do not add a trailing `/` to `SITE_URL`. It is used for canonical URLs, Open Graph URLs, RSS links, sitemap generation, and the Sitemap line in `robots.txt`. Without it, the site can still build, but SEO/share metadata will use fallback behavior.

GitHub Pages project-site deployment uses:

```text
SITE_URL=https://zephyrcicd.github.io/astro-whono
SITE_BASE=/astro-whono
```

## Maintenance

- After content changes, run at least `pnpm run check`.
- After changing pages, content schemas, Markdown rendering, or Admin Console boundaries, prefer `pnpm run ci`.
- After changing `/admin/**` or `/api/admin/**`, run `pnpm run check:preview-admin`.
- Before release, when absolute-link artifacts need verification:

```bash
SITE_URL=https://blog.zephyrcicd.com pnpm run build
SITE_URL=https://blog.zephyrcicd.com pnpm run check:prod-artifacts
```

## Source and License

This project is forked from [cxro/astro-whono](https://github.com/cxro/astro-whono) and keeps the MIT License.

Thanks to the upstream project for the Astro blog theme foundation.
