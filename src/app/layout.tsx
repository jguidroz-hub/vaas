import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VaaS — Validate Your SaaS Idea in 60 Seconds',
  description: 'AI-powered adversarial validation. Submit your SaaS idea, get a brutally honest report scored against 1,310+ startup failures.',
  openGraph: {
    title: 'VaaS — The Moody\'s of AI-Generated Products',
    description: 'Stop building products nobody wants. Validate first.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
