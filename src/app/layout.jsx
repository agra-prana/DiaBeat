import './globals.css';
import { Poppins } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'DiaBeat | Platform Kesehatan & Pencegahan Diabetes',
  description: 'Health, Diabetes Risk Prevention, Nutrition, Sleep, and Activity Tracking Platform developed by Agra Prana',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${poppins.className} font-sans bg-gradient-to-br from-slate-100 via-blue-50/20 to-slate-200/40 text-blue-950 min-h-screen antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
