// robots.txt: only the home page may be crawled; record pages and the APIs are blocked.
import { PRIVATE_PATHS, SITE_URL } from '@/lib/site.mjs';

export default function robots(){
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: SITE_URL + '/sitemap.xml',
    host: SITE_URL,
  };
}
