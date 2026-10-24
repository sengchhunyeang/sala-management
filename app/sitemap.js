// sitemap.xml for Google Search Console. Only public pages belong here
// (see PRIVATE_PATHS in lib/site.mjs for the ones kept out of search).
import { SITE_URL } from '@/lib/site.mjs';

export default function sitemap(){
  return [{ url: SITE_URL + '/', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
