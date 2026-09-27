import { Bricolage_Grotesque, Kantumruy_Pro } from 'next/font/google';
import SchoolProvider from '@/components/SchoolProvider';
import Shell from '@/components/Shell';
import './globals.css';

const body = Kantumruy_Pro({ subsets:['latin','khmer'], variable:'--f-body', display:'swap' });
const display = Bricolage_Grotesque({ subsets:['latin'], axes:['opsz'], variable:'--f-display', display:'swap' });

export const metadata = {
  title: 'Sala School Management',
  description: 'Students, attendance, grades, fees and more for Sala Secondary School.'
};

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
