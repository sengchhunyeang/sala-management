import { Bricolage_Grotesque, Kantumruy_Pro } from 'next/font/google';
import SchoolProvider from '@/components/SchoolProvider';
import Shell from '@/components/Shell';
import { SITE_URL } from '@/lib/site.mjs';
import './globals.css';

const body = Kantumruy_Pro({ subsets:['latin','khmer'], variable:'--f-body', display:'swap' });
const display = Bricolage_Grotesque({ subsets:['latin'], axes:['opsz'], variable:'--f-display', display:'swap' });

const description = 'Sala Secondary School management system: students, teachers, classes, attendance, exams, grades, timetable and reports.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Sala School Management', template: '%s – Sala School Management' },
  description,
  keywords: ['Sala Secondary School', 'school management', 'Cambodia', 'attendance', 'gradebook', 'student records'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', siteName: 'Sala School Management', title: 'Sala School Management', description, locale: 'en_US',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'Sala Secondary School logo' }] },
  twitter: { card: 'summary', title: 'Sala School Management', description, images: ['/icons/icon-512.png'] },
  robots: { index: true, follow: true },
  // Google Search Console "HTML tag" verification: set GOOGLE_SITE_VERIFICATION
  // in Vercel to the content="…" value Google gives you, then redeploy.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  applicationName: 'Sala SMS',
  appleWebApp: { capable:true, title:'Sala SMS', statusBarStyle:'default' },
};

// viewport-fit=cover lets the phone tab bar pad itself above the iPhone home indicator.
export const viewport = { width:'device-width', initialScale:1, viewportFit:'cover', themeColor:'#071A33' };

export default function RootLayout({ children }){
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <SchoolProvider>
          <Shell>{children}</Shell>
        </SchoolProvider>
      </body>
    </html>
  );
}
