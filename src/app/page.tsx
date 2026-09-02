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
  FileText,
  Sparkles,
  Download,
  Flame,
  Activity,
  UploadCloud,
  Menu,
  X,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="landing-root">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <div className="brand-icon-box">
              <Printer size={19} strokeWidth={2.5} />
            </div>
            <div className="brand-text-col">
              <div className="brand-title-row">
                <span className="brand-name">Printr</span>
                <span className="brand-version-badge">v1.0 · MIT</span>
              </div>
              <span className="brand-tagline">Open-Source Autonomous Print OS</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="landing-nav-links">
            <a href="#how-it-works" className="nav-link-item">How It Works</a>
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#hardware" className="nav-link-item">Hardware Agent</a>
            <a href="#deploy" className="nav-link-item">Deploy Guide</a>
            
            <a
              href="https://github.com/ruthwwikreddy/printr"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-github-btn"
              title="View on GitHub"
            >
              <Github size={14} />
              <span>GitHub</span>
            </a>

            <Link href="/admin" className="nav-admin-btn">
              <SlidersHorizontal size={13} />
              <span>Shop Admin</span>
            </Link>

            <Link href="/app" className="nav-kiosk-btn">
              <span>Customer Kiosk</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <a
              href="#how-it-works"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#features"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#hardware"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hardware Agent
            </a>
            <a
              href="#deploy"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Deploy Guide
            </a>
            <div className="mobile-nav-actions">
              <a
                href="https://github.com/ruthwwikreddy/printr"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-btn-github"
              >
                <Github size={15} />
                <span>GitHub Star</span>
              </a>
              <Link
                href="/admin"
                className="mobile-btn-admin"
                onClick={() => setMobileMenuOpen(false)}
              >
                <SlidersHorizontal size={15} />
                <span>Shop Control (/admin)</span>
              </Link>
              <Link
                href="/app"
                className="mobile-btn-kiosk"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Smartphone size={15} />
                <span>Customer Kiosk (/app)</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-badge">
          <Zap size={12} strokeWidth={2.8} />
          <span>100% Free &amp; Open-Source Autonomous Cloud Print Station</span>
        </div>
        <h1 className="landing-hero-title">
          Turn Any Printer Into A<br />
          <span>Self-Service Autonomous Kiosk</span>
        </h1>
        <p className="landing-hero-desc">
          Printr eliminates counter congestion in Xerox &amp; print shops. Customers scan your
          counter QR code, upload documents from their phone, configure print options, pay via
          dynamic UPI QR, and your physical printers automatically dispatch the job in seconds on
          Windows, macOS, or Linux.
        </p>

        <div className="landing-cta-group">
          <Link href="/app" className="btn-landing-primary">
            <Smartphone size={16} strokeWidth={2.4} />
            <span>Try Customer Kiosk (/app)</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
          <Link href="/admin" className="btn-landing-secondary">
            <SlidersHorizontal size={15} strokeWidth={2.4} />
            <span>Shop Control Center (/admin)</span>
          </Link>
          <a
            href="https://github.com/ruthwwikreddy/printr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-secondary"
          >
            <Github size={15} strokeWidth={2.4} />
            <span>GitHub Repository</span>
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
            <div className="terminal-title">
              Universal Print Agent Daemon — Windows / macOS / Linux
            </div>
            <button
              className="terminal-copy-btn"
              onClick={() =>
                copyCommand(
                  'git clone https://github.com/ruthwwikreddy/printr.git && cd printr && npm install && npm run agent',
                  'agent-cmd'
                )
              }
              title="Copy setup command"
            >
              {copiedCmd === 'agent-cmd' ? (
                <Check size={13} strokeWidth={2.5} />
              ) : (
                <Copy size={13} strokeWidth={2} />
              )}
              <span>{copiedCmd === 'agent-cmd' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="landing-terminal-body">
            <p className="terminal-line">
              <span className="term-prompt">$</span> git clone
              https://github.com/ruthwwikreddy/printr.git &amp;&amp; cd printr &amp;&amp; npm run agent
            </p>
            <p className="terminal-line text-muted">
              [10:30:01] Initializing Universal Hardware Print Daemon...
            </p>
            <p className="terminal-line text-muted">
              [10:30:02] Detected Physical Printers: HP_DeskJet_3540, Canon_LBP2900, Epson_L3150
            </p>
            <p className="terminal-line text-highlight">
              [10:30:15] ORDER #PRN-9402: Payment Verified (INR 12.00) via UPI
            </p>
            <p className="terminal-line text-highlight">
              [10:30:16] Dispatched 6 pages [A4 MONOCHROME DUPLEX] → Canon_LBP2900
            </p>
            <p className="terminal-line text-success">
              ✓ Print Job Completed. Ready for counter pickup.
            </p>
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
          <div className="metric-label">Native on Windows 10/11, macOS &amp; Linux</div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section">
        <div className="section-badge">END-TO-END AUTONOMOUS FLOW</div>
        <h2 className="section-heading">How Printr Works in Your Shop</h2>
        <p className="section-subheading">
          A seamless 4-step experience designed for both customers and print shop owners.
        </p>

        <div className="how-it-works-grid">
          <div className="flow-card">
            <div className="flow-num-badge">1</div>
            <div className="flow-icon-wrap">
              <QrCode size={26} strokeWidth={2.4} />
            </div>
            <h3 className="flow-card-title">Customer Scans Standee</h3>
            <p className="flow-card-desc">
              Customer points phone camera at the counter QR standee. Opens the web kiosk (<code>/app</code>)
              instantly with zero app download or signup.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num-badge">2</div>
            <div className="flow-icon-wrap">
              <UploadCloud size={26} strokeWidth={2.4} />
            </div>
            <h3 className="flow-card-title">Upload &amp; Configure</h3>
            <p className="flow-card-desc">
              Customer uploads PDF/images. Page count is detected automatically. Selects Copies,
              Color vs B&amp;W, A4 vs A3, and Duplex.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num-badge">3</div>
            <div className="flow-icon-wrap">
              <Banknote size={26} strokeWidth={2.4} />
            </div>
            <h3 className="flow-card-title">Dynamic UPI QR Payment</h3>
            <p className="flow-card-desc">
              Total price is calculated in real time based on your custom rates. Customer scans and pays
              via GPay, PhonePe, Paytm, or BHIM directly to your UPI ID.
            </p>
          </div>

          <div className="flow-card">
            <div className="flow-num-badge">4</div>
            <div className="flow-icon-wrap">
              <Printer size={26} strokeWidth={2.4} />
            </div>
            <h3 className="flow-card-title">Automatic Physical Print</h3>
            <p className="flow-card-desc">
              The counter agent instantly downloads the paid document and triggers physical printing
              on your connected printer in under 2 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="landing-section">
        <div className="section-badge">ENGINEERED FOR MODERN XEROX CENTERS</div>
        <h2 className="section-heading">Everything You Need To Run An Autonomous Shop</h2>
        <p className="section-subheading">
          Replace manual pendrive transfers, chaotic WhatsApp chats, and paper calculation notebooks.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <CreditCard size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">100% Direct UPI Payments</h3>
            <p className="feature-desc">
              Zero platform commissions, zero middleman accounts. Payments go straight from the customer
              to your bank UPI VPA (e.g. <code>shop@okhdfcbank</code>).
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Terminal size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Universal Counter Agent</h3>
            <p className="feature-desc">
              Lightweight daemon runs on your counter PC (Windows, macOS, Linux). Automatically detects
              USB/network printers and executes native print jobs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <SlidersHorizontal size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Shop Owner Control Center</h3>
            <p className="feature-desc">
              Manage your shop identity, set custom rates for A4/A3 B&amp;W and Color, view live incoming
              order feeds, and reprint jobs with 1 click.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <QrCode size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Printable Counter Standee</h3>
            <p className="feature-desc">
              Generate a formatted, printable A4 counter standee with your shop name, custom instructions,
              and QR code pointing directly to your kiosk.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Layers size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">Automated Page Counting</h3>
            <p className="feature-desc">
              Client &amp; server PDF engine instantly inspects uploaded documents, counts pages, and applies
              custom page range filters with zero latency.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
            <h3 className="feature-title">100% Open-Source &amp; Self-Hosted</h3>
            <p className="feature-desc">
              You own your code, data, and domain. Host on Vercel, Netlify, VPS, or local server under the
              permissive MIT License.
            </p>
          </div>
        </div>
      </section>

      {/* HARDWARE ARCHITECTURE */}
      <section id="hardware" className="landing-section">
        <div className="section-badge">CROSS-PLATFORM PRINTER COMPATIBILITY</div>
        <h2 className="section-heading">Works on Any Computer &amp; Any Printer</h2>
        <p className="section-subheading">
          The Printr Agent supports native operating system print pipelines across all hardware.
        </p>

        <div className="hardware-cards-grid">
          <div className="hardware-platform-box">
            <div className="hw-icon-header">
              <Server size={22} />
              <h4>Windows 10 / 11 / Server</h4>
            </div>
            <p className="hw-desc">
              Uses PowerShell <code>Start-Process -Verb PrintTo</code> and SumatraPDF / <code>Out-Printer</code> fallback.
              Includes a 1-click double-click launcher: <code>start-windows.bat</code>.
            </p>
            <div className="hw-code-preview">
              <code>set BACKEND_URL=https://print.yourshop.com &amp;&amp; node print-agent\agent.js</code>
            </div>
          </div>

          <div className="hardware-platform-box">
            <div className="hw-icon-header">
              <Terminal size={22} />
              <h4>macOS &amp; Linux (CUPS)</h4>
            </div>
            <p className="hw-desc">
              Uses Apple CUPS native <code>lp</code> driver. Automatically configures paper size, color model,
              duplex binding, and page ranges.
            </p>
            <div className="hw-code-preview">
              <code>BACKEND_URL="https://print.yourshop.com" ./print-agent/start-mac-linux.sh</code>
            </div>
          </div>
        </div>

        <div className="printer-brands-strip">
          <span className="brands-title">Compatible with all major brands:</span>
          <div className="brands-list">
            <span className="brand-tag">HP LaserJet / DeskJet / InkTank</span>
            <span className="brand-tag">Canon LBP / PIXMA / imageCLASS</span>
            <span className="brand-tag">Epson EcoTank L-Series</span>
            <span className="brand-tag">Brother HL / DCP / MFC</span>
            <span className="brand-tag">Xerox &amp; Ricoh Heavy Duty</span>
          </div>
        </div>
      </section>

      {/* DEPLOYMENT GUIDE SECTION */}
      <section id="deploy" className="landing-section">
        <div className="section-badge">SELF-HOST IN UNDER 3 MINUTES</div>
        <h2 className="section-heading">How to Deploy To Your Own Website</h2>
        <p className="section-subheading">
          Simple step-by-step setup guide for Xerox &amp; print shop owners.
        </p>

        <div className="setup-steps-list">
          <div className="setup-step-row">
            <div className="step-number-circle">1</div>
            <div className="step-content">
              <h3 className="step-title">Deploy Web Hub to Vercel or Netlify</h3>
              <p className="step-desc">
                Fork or clone the repository on GitHub, import it into Vercel or Netlify, and attach your
                own custom domain (e.g., <code>print.yourshop.com</code>).
              </p>
              <div className="step-cmd-snippet">
                <code>git clone https://github.com/ruthwwikreddy/printr.git</code>
              </div>
            </div>
          </div>

          <div className="setup-step-row">
            <div className="step-number-circle">2</div>
            <div className="step-content">
              <h3 className="step-title">Configure Shop Details in /admin</h3>
              <p className="step-desc">
                Open your website&apos;s <code>/admin</code> panel. Enter your Shop Name, UPI ID (e.g.
                <code>yourname@okhdfcbank</code>), and set your per-page rates for A4/A3 B&amp;W and Color.
              </p>
            </div>
          </div>

          <div className="setup-step-row">
            <div className="step-number-circle">3</div>
            <div className="step-content">
              <h3 className="step-title">Start the Agent on Counter Computer</h3>
              <p className="step-desc">
                Double-click <code>start-windows.bat</code> on Windows or execute <code>start-mac-linux.sh</code>
                on macOS to connect your physical printer.
              </p>
            </div>
          </div>

          <div className="setup-step-row">
            <div className="step-number-circle">4</div>
            <div className="step-content">
              <h3 className="step-title">Print &amp; Frame Your QR Standee</h3>
              <p className="step-desc">
                In <code>/admin</code>, go to <strong>Counter QR Standee</strong> and click <strong>Print Standee on A4</strong>.
                Place it on your counter and let customers print autonomously!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CREATOR & OPEN SOURCE FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="brand-icon-box">
                <Printer size={16} strokeWidth={2.4} />
              </div>
              <span className="brand-name">Printr</span>
              <p className="footer-brand-desc">
                100% Free &amp; Open-Source Autonomous Cloud Smart Printing OS for Xerox and print shops worldwide.
              </p>
            </div>

            <div className="footer-nav-col">
              <span className="footer-nav-title">Quick Links</span>
              <Link href="/app">Customer Kiosk (/app)</Link>
              <Link href="/admin">Shop Admin (/admin)</Link>
              <a href="https://github.com/ruthwwikreddy/printr" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
              <a href="https://www.ruthwikreddy.live/" target="_blank" rel="noopener noreferrer">
                Developer Portfolio
              </a>
            </div>
          </div>

          <div className="footer-bottom-row">
            <p>
              Engineered with <Heart size={13} className="text-danger inline-block" /> by{' '}
              <a
                href="https://www.ruthwikreddy.live/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                Ruthwik Reddy
              </a>
              . Licensed under the MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
