// Public address of the site, for metadata, robots.txt and the sitemap.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL; SITE_URL overrides it (e.g. a custom domain).
export const SITE_URL = (process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL)
  || 'https://sala-management.vercel.app').replace(/\/$/, '');

// Pages showing student, staff or school records. They must never appear in
// search results: robots.txt blocks crawling and next.config.mjs adds noindex.
export const PRIVATE_PATHS = ['/students', '/teachers', '/classes', '/attendance', '/gradebook', '/timetable', '/reports', '/settings', '/api', '/api-docs'];
