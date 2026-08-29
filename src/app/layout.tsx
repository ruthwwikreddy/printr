import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://printr.ruthwikreddy.live'),
  title: {
    default: 'Printr — Cloud Smart Printing & Autonomous Print Automation for Xerox & Print Shops',
    template: '%s | Printr — Built by Ruthwik Reddy',
  },
  description:
    'Self-service automated document printing system for Xerox shops, campuses, and businesses. Upload PDF/images, custom print configuration, direct UPI QR payments, and instant physical printing. Engineered by Ruthwik Reddy (https://www.ruthwikreddy.live).',
  keywords: [
    'Printr',
    'Cloud Printing',
    'Autonomous Print Shop',
    'Xerox automation software',
    'Self service print kiosk',
    'UPI QR Print automation',
    'Ruthwik Reddy',
    'ruthwikreddy.live',
    'Smart Printer SaaS',
    'Wireless automated printing',
    'Next.js printer agent',
  ],
  authors: [
    {
      name: 'Ruthwik Reddy',
      url: 'https://www.ruthwikreddy.live',
    },
  ],
  creator: 'Ruthwik Reddy (https://www.ruthwikreddy.live)',
  publisher: 'Ruthwik Reddy',
  applicationName: 'Printr Cloud Automation',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://printr.ruthwikreddy.live',
    title: 'Printr — The Automated Cloud Print System for Print & Xerox Shops',
    description:
      'Transform any traditional Xerox shop into a 24/7 automated self-service print hub with UPI QR payment and instant physical dispatch. Developed by Ruthwik Reddy.',
    siteName: 'Printr by Ruthwik Reddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Printr — Automated Print Shop Ecosystem',
    description:
      'Zero queues, automated page calculation, dynamic UPI QR payments, and instant physical printer dispatch. Built by Ruthwik Reddy (https://www.ruthwikreddy.live).',
    creator: '@ruthwikreddy',
  },
  alternates: {
    canonical: 'https://printr.ruthwikreddy.live',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Printr',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Cross-platform (macOS, Windows, Linux, Web)',
    description:
      'Autonomous cloud print dispatcher and customer self-service kiosk system for Xerox and print shops. Built by Ruthwik Reddy.',
    url: 'https://printr.ruthwikreddy.live',
    author: {
      '@type': 'Person',
      name: 'Ruthwik Reddy',
      url: 'https://www.ruthwikreddy.live',
    },
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'INR',
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
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
