/** @type {import('next').NextConfig} */
const nextConfig = {
  // The service worker must never be served stale, or app updates get stuck.
  async headers(){
    return [{
      source: '/sw.js',
      headers: [
        { key:'Cache-Control', value:'no-cache, no-store, must-revalidate' },
        { key:'Content-Type', value:'application/javascript; charset=utf-8' },
      ],
    }];
  },
};

export default nextConfig;
