import type { Metadata } from 'next';
import { Source_Serif_4, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { APP_NAME } from '@/lib/env';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Industrial Relations, made simple`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Run your disciplinary caseload end to end — cases, investigations, PIPs — with an awards-grounded AI assistant, templates, and document generation. Built for Malaysian HR & IR teams.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
