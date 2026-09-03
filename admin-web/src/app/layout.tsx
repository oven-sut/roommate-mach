import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: 'SUT Roommate Match - Admin',
  description: 'Admin console for SUT Roommate Match',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
