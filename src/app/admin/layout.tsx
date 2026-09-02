import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Control Center',
  description: 'Password-protected Printr admin panel for shop owners.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
