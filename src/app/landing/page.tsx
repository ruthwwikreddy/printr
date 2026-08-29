'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Zap,
  ShieldCheck,
  Smartphone,
  Server,
  Layers,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  QrCode,
  Globe,
  Terminal,
  TrendingUp,
  Cpu,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(
      'git clone https://github.com/ruthwwikreddy/printr.git && cd printr && npm install && npm run agent'
    );
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="landing-root">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-icon-box">
              <Printer size={18} strokeWidth={2.4} />
            </div>
            <div className="brand-text-col">
              <span className="brand-name">Printr</span>
              <span className="brand-tagline">Cloud Print OS</span>
            </div>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#setup-guide">Shop Setup</a>
            <a href="#author">Creator</a>
            <Link href="/" className="btn-mini-landing">
              Open Customer Kiosk <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-badge">
          <Zap size={12} strokeWidth={2.8} />
          <span>Next-Gen Autonomous Print Infrastructure for Xerox &amp; Print Centers</span>
        </div>
        <h1 className="landing-hero-title">
          Turn Any Printer Into A<br />
          <span>Self-Service Cloud Print Station</span>
        </h1>
        <p className="landing-hero-desc">
          Printr eliminates counter congestion. Customers upload files directly from their phone, customize pages, pay via dynamic UPI QR code, and your physical printers automatically dispatch the job in seconds with zero manual handling.
        </p>

        <div className="landing-cta-group">
          <Link href="/" className="btn-landing-primary">
            Launch Customer Terminal <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
          <Link href="/admin" className="btn-landing-secondary">
            <Server size={15} strokeWidth={2.4} /> Open Store Control Center
          </Link>
          <a
            href="https://www.ruthwikreddy.live/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-secondary"
          >
            <Globe size={15} strokeWidth={2.4} /> Developed by Ruthwik Reddy
          </a>
        </div>

        {/* Hero Interactive Terminal Widget */}
        <div className="landing-terminal-preview">
          <div className="landing-terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-1"></span>
              <span className="dot dot-2"></span>
              <span className="dot dot-3"></span>
            </div>
            <div className="terminal-title">printr-agent — macOS / Linux / Windows daemon</div>
            <button className="terminal-copy-btn" onClick={handleCopyCmd} title="Copy setup command">
              {copiedCmd ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
              <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="landing-terminal-body">
            <p className="terminal-line"><span className="term-prompt">$</span> printr connect --backend https://printr.ruthwikreddy.live</p>
            <p className="terminal-line text-muted">[2026-08-29 14:40:02] Connected to Printr Cloud Stream</p>
            <p className="terminal-line text-muted">[2026-08-29 14:40:03] Detected Printers: HP_Deskjet_3540_series, Canon_LBP2900, Epson_L3150</p>
            <p className="terminal-line text-highlight">[2026-08-29 14:40:15] ORDER #PRN-9402: Payment Verified (INR 12.00) via UPI</p>
            <p className="terminal-line text-highlight">[2026-08-29 14:40:16] Dispatched 6 pages [A4 MONOCHROME DUPLEX] → HP_Deskjet_3540_series</p>
            <p className="terminal-line text-success">✓ Print Job Completed. Ready for counter pickup.</p>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="landing-metrics-strip">
        <div className="metric-box">
          <div className="metric-number">&lt; 3 sec</div>
          <div className="metric-label">Cloud-to-Printer Dispatch Latency</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">100%</div>
          <div className="metric-label">Automated Zero-Staff Intervention</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">Direct UPI</div>
          <div className="metric-label">0% Platform Fee · Money straight to shop</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">Scalable</div>
          <div className="metric-label">Deploy across 100+ branches simultaneously</div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="landing-section">
        <div className="section-badge">ENGINEERED FOR MULTI-SHOP SCALE</div>
        <h2 className="section-heading">Everything a Modern Xerox &amp; Print Business Needs</h2>
        <p className="section-subheading">
          Built with an enterprise-grade stack so you can onboard dozens of franchise branches or campus printing spots with isolated configuration.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <QrCode size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Dynamic UPI QR Code</h3>
            <p className="feature-desc">
              Every order generates an on-the-fly QR code containing your exact UPI ID and dynamic amount. Payments go directly into the store owner bank account without middlemen.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Cpu size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Cross-Platform Background Agent</h3>
            <p className="feature-desc">
              Lightweight Node.js agent runs natively via CUPS / LP on macOS and Linux, and via Powershell on Windows. Auto-recovers on reboots with PM2.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <SlidersHorizontal size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Live Rate &amp; UPI Customization</h3>
            <p className="feature-desc">
              Store managers can update A4/A3, Color, and Black &amp; White rates, shop name, and UPI ID on the fly from the admin panel without modifying any code.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Layers size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Auto PDF Page Detection</h3>
            <p className="feature-desc">
              Instant server-side PDF parsing extracts true page counts, preventing customer fraud and calculating bill totals automatically.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Real-Time Control Center</h3>
            <p className="feature-desc">
              Live dashboard monitoring queue health, printer hardware status, daily revenue, and one-click reprint/cancel controls.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Multi-Shop Franchise Ready</h3>
            <p className="feature-desc">
              Each store connects via a dedicated secret auth token. Easily scale from 1 counter to 1,000 store locations across college campuses and cities.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="landing-section bg-subtle-section">
        <div className="section-badge">USER JOURNEY</div>
        <h2 className="section-heading">How Printr Automates the Entire Workflow</h2>
        <p className="section-subheading">From customer mobile device to physical paper tray in 4 simple steps.</p>

        <div className="steps-cards-grid">
          <div className="flow-card">
            <div className="flow-num">01</div>
            <h4 className="flow-title">Customer Scans &amp; Uploads</h4>
            <p className="flow-desc">
              Customer scans your shop poster QR code to open the mobile web portal. They select PDF, JPG, or PNG files with instant page analysis.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num">02</div>
            <h4 className="flow-title">Custom Options &amp; Billing</h4>
            <p className="flow-desc">
              Customer chooses copies, single/double sided, A4/A3, and color mode. Total bill is calculated dynamically based on store rates.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num">03</div>
            <h4 className="flow-title">UPI Payment</h4>
            <p className="flow-desc">
              Customer scans the UPI QR code directly on their phone using GPay, PhonePe, Paytm, or CRED to clear payment in 5 seconds.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num">04</div>
            <h4 className="flow-title">Automatic Physical Print</h4>
            <p className="flow-desc">
              Your computer print agent immediately receives the secure job payload, downloads the file, and sends native print commands to the printer.
            </p>
          </div>
        </div>
      </section>

      {/* Setup Guide for Store Owners */}
      <section id="setup-guide" className="landing-section">
        <div className="section-badge">SCALE TO NEW SHOPS</div>
        <h2 className="section-heading">Deploying Printr to a New Print / Xerox Shop in 3 Minutes</h2>
        <p className="section-subheading">
          Setting up a new counter requires zero specialized hardware — any existing PC or Mac connected to your USB/Wi-Fi printer works out of the box.
        </p>

        <div className="instructions-panel">
          <div className="instruction-step">
            <div className="instruction-badge">Step 1</div>
            <div className="instruction-content">
              <h4>Open Admin &amp; Configure Shop Identity</h4>
              <p>Navigate to <code>/admin</code> → <strong>Rates tab</strong>. Set your shop’s UPI ID (e.g. <code>store@upi</code>) and configure your rates per page.</p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="instruction-badge">Step 2</div>
            <div className="instruction-content">
              <h4>Connect the Shop Computer Print Agent</h4>
              <p>On the counter laptop or PC connected to your printer, start the background agent process:</p>
              <div className="code-snippet-box">
                <code>BACKEND_URL="https://printr.ruthwikreddy.live" PRINT_AGENT_AUTH_SECRET="your-auth-token" node print-agent/agent.js</code>
              </div>
            </div>
          </div>

          <div className="instruction-step">
            <div className="instruction-badge">Step 3</div>
            <div className="instruction-content">
              <h4>Keep Running 24/7 with PM2 (Mac &amp; Windows)</h4>
              <p>Ensure the print service launches automatically whenever the store computer boots:</p>
              <div className="code-snippet-box">
                <code>pm2 start ecosystem.config.js &amp;&amp; pm2 save &amp;&amp; pm2 startup</code>
              </div>
            </div>
          </div>

          <div className="instruction-step">
            <div className="instruction-badge">Step 4</div>
            <div className="instruction-content">
              <h4>Print Your Counter QR Standee</h4>
              <p>Display your store URL <code>https://printr.ruthwikreddy.live</code> as a standee at the front desk. Customers scan and print independently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Author & Engineering Credential Section */}
      <section id="author" className="landing-section bg-subtle-section">
        <div className="author-card">
          <div className="author-details">
            <div className="section-badge">SYSTEM ARCHITECT</div>
            <h2 className="author-name">Engineered &amp; Built by Ruthwik Reddy</h2>
            <p className="author-bio">
              Printr was designed and engineered by <strong>Ruthwik Reddy</strong> to revolutionize decentralized hardware automation and self-service commerce workflows.
            </p>
            <div className="author-links">
              <a
                href="https://www.ruthwikreddy.live/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-landing-primary"
              >
                Visit Official Portfolio (ruthwikreddy.live) <ExternalLink size={14} strokeWidth={2.4} />
              </a>
              <a
                href="https://github.com/ruthwwikreddy/printr"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-landing-secondary"
              >
                <Terminal size={14} strokeWidth={2.4} /> GitHub Repository
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon-box">
              <Printer size={16} strokeWidth={2.4} />
            </div>
            <span>Printr — Cloud Smart Print Automation</span>
          </div>

          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Printr. Built with pride by{' '}
            <a
              href="https://www.ruthwikreddy.live/"
              target="_blank"
              rel="noopener noreferrer"
              className="author-link"
            >
              Ruthwik Reddy
            </a>
            .
          </div>

          <div className="footer-links">
            <Link href="/">Customer Kiosk</Link>
            <Link href="/admin">Store Control Center</Link>
            <a href="https://www.ruthwikreddy.live/" target="_blank" rel="noopener noreferrer">
              ruthwikreddy.live
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
