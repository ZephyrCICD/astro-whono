# Zephyr CI/CD Blog

[中文](README.md)

This is my personal blog for technical notes, development experience, tool usage, and site migration records.

The project is built with Astro and forked from [cxro/astro-whono](https://github.com/cxro/astro-whono). The upstream template docs and demo content have been removed; this repository is now maintained as a personal blog.

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
pnpm run build
pnpm run check:markdown-smoke
```

Full regression entry:

```bash
pnpm run ci
```

## Content Structure

- `src/content/essay/`: long-form posts. Canonical detail route: `/archive/[slug]/`
- `src/content/bits/`: short-form feed
- `src/content/memo/index.md`: memo page body
- `src/pages/about/index.astro`: about page
- `public/images/posts/`: public post images
- `src/data/settings/*.json`: theme settings written by the local Admin Console

## Local Admin Console

Start the dev server and open `http://localhost:4321/admin/`.

Main entries:

- `/admin/`: site overview
- `/admin/theme/`: site, sidebar, home page, and inner-page settings
- `/admin/images/`: image browser and path helper
- `/admin/checks/`: structured checks
- `/admin/data/`: settings snapshot import/export

Admin write features are local-development tools only. Production builds remain static output, and `/api/admin/**` should not be treated as public production APIs.

## Deployment

This repository no longer keeps template-style one-click deploy buttons. Import the current GitHub repository directly in Vercel, Cloudflare Pages, or another static hosting provider.

Recommended build settings:

- Framework preset: Astro
- Build command: `pnpm run build`
- Output directory: `dist`

Recommended production environment variable:

```text
SITE_URL=https://blog.zephyrcicd.com
```

Do not add a trailing `/` to `SITE_URL`. It is used for canonical URLs, Open Graph URLs, RSS links, sitemap generation, and the Sitemap line in `robots.txt`. Without it, the site can still build, but SEO/share metadata will use fallback behavior.

## Maintenance

- After content changes, run at least `pnpm run check`.
- After changing pages, content schemas, Markdown rendering, or Admin Console boundaries, prefer `pnpm run ci`.
- Before release, when absolute-link artifacts need verification:

```bash
SITE_URL=https://blog.zephyrcicd.com pnpm run build
SITE_URL=https://blog.zephyrcicd.com pnpm run check:prod-artifacts
```

## Source and License

This project is forked from [cxro/astro-whono](https://github.com/cxro/astro-whono) and keeps the MIT License.

Thanks to the upstream project for the Astro blog theme foundation.

