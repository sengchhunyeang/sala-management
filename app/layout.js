import { Bricolage_Grotesque, Kantumruy_Pro } from 'next/font/google';
import SchoolProvider from '@/components/SchoolProvider';
import Shell from '@/components/Shell';
import './globals.css';

const body = Kantumruy_Pro({ subsets:['latin','khmer'], variable:'--f-body', display:'swap' });
const display = Bricolage_Grotesque({ subsets:['latin'], axes:['opsz'], variable:'--f-display', display:'swap' });

export const metadata = {
  title: 'Sala School Management',
  description: 'Students, attendance, grades and more for Sala Secondary School.',
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
