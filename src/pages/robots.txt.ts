import type { APIRoute } from 'astro';
import { hasSiteUrl, siteUrl } from '../../site.config.mjs';

export const GET: APIRoute = () => {
  const lines = ['User-agent: *', 'Allow: /'];

  if (hasSiteUrl) {
    const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
    const sitePathname = new URL(`${siteUrl}/`).pathname.replace(/\/+$/, '');
    const publicSiteUrl = basePath && sitePathname !== basePath && !sitePathname.endsWith(basePath)
      ? `${siteUrl}${basePath}`
      : siteUrl;
    lines.push(`Sitemap: ${publicSiteUrl}/sitemap-index.xml`);
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
