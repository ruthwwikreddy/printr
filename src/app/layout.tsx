import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://printr.ruthwikreddy.live'),
  title: {
    default: 'Printr — Open-Source Autonomous Smart Printing OS for Xerox & Print Shops',
    template: '%s | Printr',
  },
  description:
    '100% Open-source, self-hosted autonomous document printing system for Xerox and print shops. Upload PDF/images, custom print configuration, direct UPI QR payments, and instant physical printing on Windows, macOS, and Linux.',
  keywords: [
    'Printr',
    'Open Source Print OS',
    'Cloud Printing',
    'Autonomous Print Shop',
    'Xerox automation software',
    'Self service print kiosk',
    'UPI QR Print automation',
    'Wireless automated printing',
    'Next.js printer agent',
    'Ruthwik Reddy',
    'Ruthwik Reddy Printr',
    'open source print shop software India',
    'self hosted printing platform',
  ],
  authors: [
    {
      name: 'Ruthwik Reddy',
      url: 'https://www.ruthwikreddy.live',
    },
  ],
  creator: 'Ruthwik Reddy (https://www.ruthwikreddy.live)',
  applicationName: 'Printr Autonomous OS',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://printr.ruthwikreddy.live',
    title: 'Printr — Open-Source Autonomous Printing OS',
    description:
      'Turn any conventional Xerox or print shop into an automated 24/7 self-service station. 100% open source.',
    siteName: 'Printr Open Source',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Printr — Open-Source Autonomous Printing OS',
    description:
      'Self-hosted printing OS by Ruthwik Reddy: QR kiosk, direct UPI payments, and automatic printer dispatch. MIT licensed.',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = 'https://printr.ruthwikreddy.live';
  const author = {
    '@type': 'Person',
    '@id': 'https://www.ruthwikreddy.live/#person',
    name: 'Ruthwik Reddy',
    url: 'https://www.ruthwikreddy.live/',
    jobTitle: 'Software Engineer',
    sameAs: ['https://www.ruthwikreddy.live/', 'https://github.com/ruthwwikreddy'],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      author,
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Printr',
        description:
          'Open-source autonomous printing OS for Xerox and print shops, created by Ruthwik Reddy.',
        inLanguage: 'en',
        publisher: { '@id': author['@id'] },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#software`,
        name: 'Printr',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Cross-platform (Windows, macOS, Linux, Web)',
        url: siteUrl,
        downloadUrl: 'https://github.com/ruthwwikreddy/printr',
        codeRepository: 'https://github.com/ruthwwikreddy/printr',
        license: 'https://opensource.org/licenses/MIT',
        isAccessibleForFree: true,
        author,
        creator: author,
        description:
          'Autonomous open-source printing OS and customer self-service kiosk system for Xerox and print shops: QR upload, direct UPI payment, and automatic dispatch to the counter printer.',
        featureList: [
          'QR-code self-service print kiosk',
          'Direct UPI payments with zero platform fee',
          'Cross-platform native print agent',
          'Real-time print job status',
          'Shop owner admin control center',
        ],
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'INR',
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
