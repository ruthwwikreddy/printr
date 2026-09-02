import type { Metadata } from 'next';
import { headers } from 'next/headers';
import CustomerKiosk from '@/components/CustomerKiosk';
import LandingPage from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

/**
 * Root route.
 *
 * On the official project site (printr.ruthwikreddy.live) the root serves the
 * open-source showcase. Every other deployment is a print shop, so the root
 * serves the customer kiosk directly — a scanned counter QR should never land
 * on marketing copy.
 *
 * Override the showcase hosts with NEXT_PUBLIC_LANDING_HOSTS (comma separated).
 */
const LANDING_HOSTS = (process.env.NEXT_PUBLIC_LANDING_HOSTS || 'printr.ruthwikreddy.live')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isShowcaseHost() {
  const host = (headers().get('host') || '').toLowerCase().split(':')[0].replace(/^www\./, '');
  return LANDING_HOSTS.includes(host);
}

export function generateMetadata(): Metadata {
  if (isShowcaseHost()) {
    return {
      title:
        'Printr — Open-Source Autonomous Printing OS for Xerox & Print Shops by Ruthwik Reddy',
      description:
        'Printr is a free, MIT-licensed, self-hosted printing OS by Ruthwik Reddy. Customers scan a counter QR, upload PDFs, pay with a dynamic UPI QR, and the shop printer dispatches the job automatically on Windows, macOS and Linux.',
      alternates: { canonical: '/' },
    };
  }

  return {
    title: 'Self-Service Print Kiosk — Upload, Pay by UPI, Collect',
    description:
      'Upload a PDF, JPG or PNG, choose copies, colour, A4/A3 and duplex, pay with a UPI QR code, and collect your prints from the counter.',
    alternates: { canonical: '/' },
  };
}

export default function RootPage() {
  return isShowcaseHost() ? <LandingPage /> : <CustomerKiosk />;
}
