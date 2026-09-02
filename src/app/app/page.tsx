import type { Metadata } from 'next';
import CustomerKiosk from '@/components/CustomerKiosk';

export const metadata: Metadata = {
  title: 'Self-Service Print Kiosk — Upload, Pay by UPI, Collect',
  description:
    'Upload a PDF, JPG or PNG, choose copies, colour, A4/A3 and duplex, pay with a UPI QR code, and collect your prints from the counter. No app, no signup.',
  alternates: { canonical: '/app' },
  openGraph: {
    title: 'Printr Self-Service Print Kiosk',
    description:
      'Upload a document, pay via UPI QR, and your prints come out at the shop counter in seconds.',
    url: '/app',
  },
};

export default function KioskPage() {
  return <CustomerKiosk />;
}
