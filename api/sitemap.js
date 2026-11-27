
const DOMAIN = 'https://onlibry.in';

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/files',
  '/folders',
  '/mock-tests',
  '/quizzes',
  '/blog',
  '/exam-updates',
  '/notifications',
  '/info'
];

const RESERVED_SLUGS = new Set([
  'dashboard',
  'create',
  'edit',
  'admin',
  'login'
]);

function escapeXML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function createURL(path, lastmod = null) {
  return `
  <url>
    <loc>${escapeXML(DOMAIN + path)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

export default async function handler(req, res) {
  try {
    const API_URL = process.env.VITE_BLOG_API_URL;

    if (!API_URL) {
      throw new Error('Blog API URL missing');
    }

    const response = await fetch(
      `${API_URL.replace(/\/+$/, '')}/api/sitemap`,
      {
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`Blog API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.posts)) {
      throw new Error('Invalid sitemap response');
    }

    const urls = PUBLIC_ROUTES.map(
      route => createURL(route)
    );

    const seen = new Set();

    for (const post of data.posts) {
      if (typeof post.slug !== 'string') continue;

      if (!/^[a-zA-Z0-9_-]+$/.test(post.slug)) {
        continue;
      }

      if (RESERVED_SLUGS.has(post.slug.toLowerCase())) {
        continue;
      }

      if (seen.has(post.slug)) continue;

      seen.add(post.slug);

      const lastmod =
        validDate(post.updated_at) ||
        validDate(post.published_at);

      urls.push(
        createURL(
          `/blog/${encodeURIComponent(post.slug)}`,
          lastmod
        )
      );
    }

    if (urls.length > 50000) {
      throw new Error('Sitemap URL limit exceeded');
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    if (Buffer.byteLength(xml, 'utf8') > 52428800) {
      throw new Error('Sitemap size limit exceeded');
    }

    res.setHeader(
      'Content-Type',
      'application/xml; charset=utf-8'
    );

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=60'
    );

    return res.status(200).send(xml);

  } catch (error) {
    console.error('SitemapX:', error);

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '300');

    return res.status(503).send(
      'Sitemap temporarily unavailable'
    );
  }
}
