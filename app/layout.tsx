import type {Metadata} from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans-primary' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono-primary' });

export const metadata: Metadata = {
  applicationName: 'FORMAT',
  title: {
    default: 'FORMAT by TAGDesigns - Anti-AI-Slop Finishing Engine',
    template: '%s | FORMAT'
  },
  description: 'Local-first browser finishing for creator visuals: anti-AI-slop repair, procedural premium effects, portrait-safe retouching, material finishes, and export-ready presets.',
  keywords: ['anti AI slop repair', 'image finishing', 'portrait retouching', 'photo effects', 'creative presets', 'browser image editor'],
  authors: [{ name: 'TAGDesigns' }],
  creator: 'TAGDesigns',
  publisher: 'TAGDesigns',
  category: 'creative software',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'FORMAT by TAGDesigns - Anti-AI-Slop Finishing Engine',
    description: 'Premium local-first browser finishing for creator visuals, procedural effects, and export-ready image treatments.',
    type: 'website',
    siteName: 'FORMAT'
  },
  twitter: {
    card: 'summary',
    title: 'FORMAT by TAGDesigns',
    description: 'Anti-AI-slop repair and premium image finishing in the browser.'
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`dark ${plexSans.variable} ${plexMono.variable}`}>
      <body className="antialiased min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
