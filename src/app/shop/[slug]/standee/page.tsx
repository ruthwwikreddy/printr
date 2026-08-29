'use client';

import React, { useEffect, useState } from 'react';
import { Printer, QrCode, ArrowLeft, Download, ShieldCheck, Zap, Layers } from 'lucide-react';
import Link from 'next/link';

export default function ShopStandeePoster({ params }: { params: { slug: string } }) {
  const shopSlug = params.slug.toLowerCase();
  const [shop, setShop] = useState<{
    name: string;
    upiId: string;
    address?: string;
    phone?: string;
    pricing: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/tenants/${shopSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.tenant) {
          setShop(data.tenant);
        }
      })
      .catch(() => {});
  }, [shopSlug]);

  const shopUrl = `https://printr.ruthwikreddy.live/shop/${shopSlug}`;
  const standeeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shopUrl)}`;

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="standee-wrapper">
      {/* Screen action bar */}
      <div className="standee-screen-bar no-print">
        <Link href={`/shop/${shopSlug}`} className="btn-mini" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={12} strokeWidth={2.5} /> Back to Shop
        </Link>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Counter QR Standee Poster for <strong>{shop?.name || shopSlug}</strong>
        </div>
        <button className="btn-mini-landing" onClick={handlePrintStandee}>
          <Printer size={13} strokeWidth={2.5} /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Poster Card */}
      <div className="standee-sheet">
        <div className="standee-header">
          <div className="standee-brand-badge">
            <Printer size={18} strokeWidth={2.6} />
            <span>SELF-SERVICE SMART PRINT STATION</span>
          </div>
          <h1 className="standee-shop-name">{shop?.name || 'PrintShop'}</h1>
          {shop?.address && <p className="standee-shop-address">{shop.address}</p>}
        </div>

        <div className="standee-qr-hero">
          <div className="standee-qr-frame">
            <img src={standeeQrUrl} alt="Scan to Print QR" className="standee-qr-image" />
          </div>
          <div className="standee-scan-label">
            <span className="standee-pulse-tag">SCAN TO PRINT</span>
            <div className="standee-url-mono">{shopUrl}</div>
          </div>
        </div>

        {/* 3 Step Instructions */}
        <div className="standee-steps-strip">
          <div className="standee-step-item">
            <div className="standee-step-num">1</div>
            <div className="standee-step-title">Scan QR &amp; Upload</div>
            <div className="standee-step-desc">Open on your phone &amp; select your PDF or Photo</div>
          </div>
          <div className="standee-step-item">
            <div className="standee-step-num">2</div>
            <div className="standee-step-title">Choose Settings</div>
            <div className="standee-step-desc">Pick B&amp;W or Color, copies, and sides</div>
          </div>
          <div className="standee-step-item">
            <div className="standee-step-num">3</div>
            <div className="standee-step-title">Pay UPI &amp; Collect</div>
            <div className="standee-step-desc">Instant physical print directly from the counter</div>
          </div>
        </div>

        {/* Rates Display */}
        {shop?.pricing && (
          <div className="standee-rates-box">
            <div className="standee-rate-item">
              <span className="standee-rate-name">A4 Black &amp; White</span>
              <span className="standee-rate-val">INR {shop.pricing.A4_MONOCHROME || 2}/pg</span>
            </div>
            <div className="standee-rate-item">
              <span className="standee-rate-name">A4 Full Color</span>
              <span className="standee-rate-val">INR {shop.pricing.A4_COLOUR || 10}/pg</span>
            </div>
            <div className="standee-rate-item">
              <span className="standee-rate-name">A3 Black &amp; White</span>
              <span className="standee-rate-val">INR {shop.pricing.A3_MONOCHROME || 5}/pg</span>
            </div>
            <div className="standee-rate-item">
              <span className="standee-rate-name">A3 Full Color</span>
              <span className="standee-rate-val">INR {shop.pricing.A3_COLOUR || 20}/pg</span>
            </div>
          </div>
        )}

        <div className="standee-footer">
          <div>Autonomous Xerox &amp; Document Printing OS</div>
          <div>Powered by <strong>Printr</strong> (ruthwikreddy.live)</div>
        </div>
      </div>
    </div>
  );
}
