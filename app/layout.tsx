import type {Metadata} from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans-primary' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono-primary' });

export const metadata: Metadata = {
  applicationName: 'FORMAT',
  title: {
    default: 'FORMAT by TAGDesigns',
    template: '%s | FORMAT'
  },
  description: 'A browser-based image finishing workspace for portrait, social, cinematic, print, and texture-driven visual treatments.',
  keywords: ['image editor', 'portrait retouching', 'photo finishing', 'creative presets', 'browser image editor'],
  authors: [{ name: 'TAGDesigns' }],
  creator: 'TAGDesigns',
  publisher: 'TAGDesigns',
  category: 'creative software',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'FORMAT by TAGDesigns',
    description: 'A professional browser-based image finishing workspace for stylized raster output.',
    type: 'website',
    siteName: 'FORMAT'
  },
  twitter: {
    card: 'summary',
    title: 'FORMAT by TAGDesigns',
    description: 'Professional image finishing in the browser.'
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`dark ${plexSans.variable} ${plexMono.variable}`}>
      <body className="antialiased min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
