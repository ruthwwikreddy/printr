'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root route — redirects to the customer self-service kiosk at /app.
 *
 * Open-source note:
 * This file is intentionally minimal. The repository ships only:
 *   /app   — Customer self-service kiosk
 *   /admin — Shop owner control center
 *
 * If you want a custom landing page, replace the contents of this file.
 */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', color: '#71717a' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '2px solid #e4e4e7',
            borderTopColor: '#000',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, margin: 0 }}>Redirecting to kiosk…</p>
      </div>
    </div>
  );
}
