import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME } from '@/lib/env';

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
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
