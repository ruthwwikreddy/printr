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
  Github,
  Heart,
  CreditCard,
  Banknote,
} from 'lucide-react';

export default function LandingPage() {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(
      'git clone https://github.com/ruthwwikreddy/printr.git && cd printr && npm install && npm run dev'
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
              <span className="brand-tagline">Open-Source Print OS</span>
            </div>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#deploy">Deploy to Website</a>
            <Link href="/admin" className="btn-mini-landing" style={{ background: '#ffffff', color: '#000000 !important', border: '1px solid var(--border)' }}>
              Shop Admin Panel
            </Link>
            <Link href="/" className="btn-mini-landing">
              Live Customer Kiosk <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-badge">
          <Zap size={12} strokeWidth={2.8} />
          <span>100% Free &amp; Open-Source for Print &amp; Xerox Shops Worldwide</span>
        </div>
        <h1 className="landing-hero-title">
          Turn Any Printer Into A<br />
          <span>Self-Service Autonomous Print Station</span>
        </h1>
        <p className="landing-hero-desc">
          Printr eliminates long counter queues. Customers scan a QR code at your shop, upload documents, customize print settings, pay via dynamic UPI QR code, and your physical printers automatically dispatch the job in seconds on Windows, macOS, or Linux.
        </p>

        <div className="landing-cta-group">
          <Link href="/" className="btn-landing-primary">
            Launch Customer Kiosk <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
          <Link href="/admin" className="btn-landing-secondary">
            <SlidersHorizontal size={15} strokeWidth={2.4} /> Shop Owner Control Center
          </Link>
          <a
            href="https://github.com/ruthwwikreddy/printr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-secondary"
          >
            <Github size={15} strokeWidth={2.4} /> GitHub Repository
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
            <div className="terminal-title">Universal Hardware Print Daemon — Windows / macOS / Linux</div>
            <button className="terminal-copy-btn" onClick={handleCopyCmd} title="Copy setup command">
              {copiedCmd ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
              <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="landing-terminal-body">
            <p className="terminal-line"><span className="term-prompt">$</span> git clone https://github.com/ruthwwikreddy/printr.git &amp;&amp; cd printr</p>
            <p className="terminal-line text-muted">[2026-09-02 10:30:00] Initializing Printr Universal Daemon...</p>
            <p className="terminal-line text-muted">[2026-09-02 10:30:01] Detected Physical Printers: HP_DeskJet_3540, Canon_LBP2900, Epson_L3150</p>
            <p className="terminal-line text-highlight">[2026-09-02 10:30:15] ORDER #PRN-9402: Payment Verified (INR 12.00) via UPI</p>
            <p className="terminal-line text-highlight">[2026-09-02 10:30:16] Dispatched 6 pages [A4 MONOCHROME DUPLEX] → Canon_LBP2900</p>
            <p className="terminal-line text-success">✓ Print Job Completed. Ready for counter pickup.</p>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="landing-metrics-strip">
        <div className="metric-box">
          <div className="metric-number">&lt; 2 sec</div>
          <div className="metric-label">Cloud-to-Printer Dispatch Latency</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">100%</div>
          <div className="metric-label">Automated Zero-Staff Intervention</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">Direct UPI</div>
          <div className="metric-label">0% Platform Fee · Money straight to shop owner</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">Cross-Platform</div>
          <div className="metric-label">Runs natively on Windows, macOS &amp; Linux</div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="landing-section">
        <div className="section-badge">BUILT FOR EVERY PRINT SHOP</div>
        <h2 className="section-heading">Everything You Need To Automate Your Shop</h2>
        <p className="section-subheading">
          Stop manually taking pendrives, opening WhatsApp chats, and calculating page counts by hand.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <QrCode size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">QR Code Customer Kiosk</h3>
            <p className="feature-desc">
              Customers scan your counter QR standee with their phone, upload documents, and customize print options instantly with zero app installation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Banknote size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Direct UPI Payments</h3>
            <p className="feature-desc">
              Dynamic UPI QR code automatically calculates the exact bill based on your custom per-page rates. Funds go straight to your own UPI ID.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Terminal size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Universal Counter Agent</h3>
            <p className="feature-desc">
              Lightweight daemon runs on your counter PC (Windows, Mac, or Linux), listens for paid orders, and dispatches native print commands directly to your connected printer.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <SlidersHorizontal size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Shop Owner Control Center</h3>
            <p className="feature-desc">
              Manage your shop identity, configure custom rates for A4/A3 B&amp;W and Color, view live queues, and print front-desk standees with 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section id="deploy" className="landing-section">
        <div className="section-badge">SELF-HOST IN 3 MINUTES</div>
        <h2 className="section-heading">How to Deploy To Your Own Website</h2>

        <div className="setup-steps-list">
          <div className="setup-step-row">
            <div className="step-number-circle">1</div>
            <div className="step-content">
              <h3 className="step-title">Deploy Web Hub to Vercel or Netlify</h3>
              <p className="step-desc">
                Fork or clone the repository on GitHub, import it into Vercel or Netlify, and attach your custom domain (e.g., <code>print.yourshop.com</code>).
              </p>
            </div>
          </div>

          <div className="setup-step-row">
            <div className="step-number-circle">2</div>
            <div className="step-content">
              <h3 className="step-title">Set Up Your Shop Details in /admin</h3>
              <p className="step-desc">
                Open your deployed website&apos;s <code>/admin</code> panel, enter your Shop Name, UPI ID (e.g. <code>yourname@okhdfcbank</code>), and set your per-page rates.
              </p>
            </div>
          </div>

          <div className="setup-step-row">
            <div className="step-number-circle">3</div>
            <div className="step-content">
              <h3 className="step-title">Start the Agent on Counter Computer</h3>
              <p className="step-desc">
                Double-click <code>start-windows.bat</code> on Windows or run <code>start-mac-linux.sh</code> on macOS to connect your physical printer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>
            Printr is 100% Free &amp; Open-Source under the MIT License.
          </p>
          <div className="landing-footer-links">
            <Link href="/">Customer Kiosk</Link>
            <Link href="/admin">Shop Admin</Link>
            <a href="https://github.com/ruthwwikreddy/printr" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://www.ruthwikreddy.live/" target="_blank" rel="noopener noreferrer">
              Author Portfolio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
