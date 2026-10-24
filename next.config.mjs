import { PRIVATE_PATHS } from './lib/site.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers(){
    return [
    // Record pages and APIs show personal data: keep them out of search results.
    ...PRIVATE_PATHS.map(p => ({ source: p + '/:path*', headers: [{ key:'X-Robots-Tag', value:'noindex, nofollow' }] })),
    // The service worker must never be served stale, or app updates get stuck.
    {
      source: '/sw.js',
      headers: [
        { key:'Cache-Control', value:'no-cache, no-store, must-revalidate' },
        { key:'Content-Type', value:'application/javascript; charset=utf-8' },
      ],
    }];
  },
};

export default nextConfig;
