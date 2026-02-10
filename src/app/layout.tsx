import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VaaS by Greenbelt — Your Idea Gets a Verdict, Not a Vibe Check',
  description: 'Adversarial AI validation for startup ideas. Builder AI defends, Guardian AI attacks. Scored against 1,310+ real startup failures. Free instant results.',
  openGraph: {
    title: 'VaaS by Greenbelt — Adversarial Startup Validation',
    description: 'Builder AI defends your idea. Guardian AI tries to destroy it. Three rounds. One verdict. Based on 1,310+ real startup failures.',
    type: 'website',
    url: 'https://vaas-greenbelt.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaaS — Your Idea Gets a Verdict, Not a Vibe Check',
    description: 'Adversarial AI validation scored against 1,310+ startup failures. Free.',
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
