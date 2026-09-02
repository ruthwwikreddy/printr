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
  SlidersHorizontal,
  QrCode,
  Terminal,
  Cpu,
  Copy,
  Check,
  Github,
  Heart,
  CreditCard,
  Banknote,
  Sparkles,
  UploadCloud,
  Menu,
  X,
  Lock,
  Globe,
  Wallet,
  Gauge,
  Code2,
  BookOpen,
  Radio,
} from 'lucide-react';

const GITHUB_URL = 'https://github.com/ruthwwikreddy/printr';
const PORTFOLIO_URL = 'https://www.ruthwikreddy.live/';

const FEATURES = [
  {
    icon: CreditCard,
    title: '100% Direct UPI Payments',
    desc: 'Dynamic UPI QR per order. Money lands in the shop owner\u2019s bank VPA instantly — zero platform commission, no gateway onboarding, no settlement delay.',
  },
  {
    icon: Terminal,
    title: 'Universal Counter Agent',
    desc: 'A single Node.js daemon on the counter PC auto-discovers USB and network printers and executes native print jobs on Windows, macOS, Linux and Raspberry Pi.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Shop Owner Control Center',
    desc: 'Password-protected /admin with live revenue, print queue, per-page rate editor, UPI setup, agent status and one-click job retry or cancel.',
  },
  {
    icon: QrCode,
    title: 'Printable Counter Standee',
    desc: 'Generate an A4 standee with your shop name, rates, 3-step instructions and a QR code that opens the kiosk on any phone camera. Print it and you are live.',
  },
  {
    icon: Layers,
    title: 'Automatic Page Counting',
    desc: 'Server-side pdf-lib inspection counts pages on upload and honours custom page ranges like 1-4,8 so pricing is exact before the customer pays.',
  },
  {
    icon: Radio,
    title: 'Real-Time Job Status',
    desc: 'Firestore listeners with an HTTP polling fallback stream every state change — awaiting payment, queued, dispatched, printing, completed or failed.',
  },
  {
    icon: Gauge,
    title: 'Sub-2-Second Dispatch',
    desc: 'The agent long-polls for paid jobs, so a document reaches the physical tray seconds after the customer\u2019s UPI app confirms the payment.',
  },
  {
    icon: Lock,
    title: 'Privacy-First Retention',
    desc: 'Uploaded documents live only as long as they need to. The cleanup route purges files older than 24 hours and blanks their stored paths.',
  },
  {
    icon: ShieldCheck,
    title: 'Open-Source & Self-Hosted',
    desc: 'MIT licensed. Your code, your domain, your data, your printer. Deploy to Vercel, Netlify, a VPS or an offline LAN box in the shop itself.',
  },
];

const STACK = [
  { name: 'Next.js 14 App Router', role: 'Web hub, kiosk UI, API routes' },
  { name: 'TypeScript + React 18', role: 'Typed, component-driven front end' },
  { name: 'Cloud Firestore', role: 'Optional real-time order + settings sync' },
  { name: 'pdf-lib', role: 'Server-side PDF page counting' },
  { name: 'Node.js agent', role: 'Native printing via CUPS / PowerShell' },
  { name: 'UPI deep links', role: 'Dynamic QR payment intents' },
];

const FAQS = [
  {
    q: 'Is Printr really free and open source?',
    a: 'Yes. Printr is MIT licensed and hosted on GitHub. You can fork it, rebrand it, sell services around it and run it for as many shops as you like without paying anyone.',
  },
  {
    q: 'Do customers need to install an app?',
    a: 'No. They point their phone camera at the counter standee QR, and the kiosk opens in the mobile browser. No signup, no login, no download.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'Any UPI app — Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay and every bank app — because Printr generates a standard UPI intent QR pointing at your own VPA.',
  },
  {
    q: 'Which printers work with Printr?',
    a: 'Anything your operating system can already print to: HP LaserJet/DeskJet/InkTank, Canon LBP/PIXMA/imageCLASS, Epson EcoTank, Brother HL/DCP/MFC, Xerox and Ricoh workgroup machines.',
  },
  {
    q: 'Does it need the internet to print?',
    a: 'The hub can run on the shop LAN. As long as the counter PC can reach the hub URL, jobs dispatch — even on a local network deployment.',
  },
  {
    q: 'How is the admin panel secured?',
    a: 'A single shop password set with the ADMIN_PASSWORD environment variable. It issues an httpOnly session cookie and every admin API route rejects unauthenticated requests.',
  },
];

export default function LandingPage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="landing-root">
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

          <div className="landing-nav-links">
            <a href="#how-it-works" className="nav-link-item">How It Works</a>
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#stack" className="nav-link-item">Stack</a>
            <a href="#hardware" className="nav-link-item">Hardware</a>
            <a href="#deploy" className="nav-link-item">Deploy</a>
            <a href="#faq" className="nav-link-item">FAQ</a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-github-btn"
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

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            {[
              ['#how-it-works', 'How It Works'],
              ['#features', 'Features'],
              ['#stack', 'Tech Stack'],
              ['#hardware', 'Hardware Agent'],
              ['#deploy', 'Deploy Guide'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="mobile-nav-actions">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-btn-github"
              >
                <Github size={15} />
                <span>GitHub Repository</span>
              </a>
              <Link href="/admin" className="mobile-btn-admin" onClick={() => setMobileMenuOpen(false)}>
                <SlidersHorizontal size={15} />
                <span>Shop Control (/admin)</span>
              </Link>
              <Link href="/app" className="mobile-btn-kiosk" onClick={() => setMobileMenuOpen(false)}>
                <Smartphone size={15} />
                <span>Customer Kiosk</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </nav>

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
          Printr removes the queue from Xerox and print shops. Customers scan your counter QR,
          upload documents from their phone, configure copies, colour, paper size and duplex, pay
          with a dynamic UPI QR, and your physical printer dispatches the job in seconds on Windows,
          macOS or Linux.
        </p>

        <div className="landing-cta-group">
          <Link href="/app" className="btn-landing-primary">
            <Smartphone size={16} strokeWidth={2.4} />
            <span>Launch Customer Kiosk</span>
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
          <Link href="/admin" className="btn-landing-secondary">
            <SlidersHorizontal size={15} strokeWidth={2.4} />
            <span>Shop Control Center</span>
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-secondary"
          >
            <Github size={15} strokeWidth={2.4} />
            <span>Star on GitHub</span>
          </a>
        </div>

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
              {copiedCmd === 'agent-cmd' ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
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

      <section className="landing-metrics-strip">
        <div className="metric-box">
          <div className="metric-number">&lt; 2 sec</div>
          <div className="metric-label">Cloud-to-printer dispatch latency</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">0%</div>
          <div className="metric-label">Platform fee — UPI goes straight to the shop</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">Zero-staff</div>
          <div className="metric-label">Fully automated upload → pay → print</div>
        </div>
        <div className="metric-box">
          <div className="metric-number">MIT</div>
          <div className="metric-label">Free forever, self-hosted, no lock-in</div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="section-badge">END-TO-END AUTONOMOUS FLOW</div>
        <h2 className="section-heading">How Printr Works in Your Shop</h2>
        <p className="section-subheading">
          Four steps for the customer, zero steps for the shop owner.
        </p>

        <div className="how-it-works-grid">
          {[
            {
              icon: QrCode,
              title: 'Customer Scans Standee',
              desc: 'The phone camera opens your kiosk instantly. No app download, no signup, no account.',
            },
            {
              icon: UploadCloud,
              title: 'Upload & Configure',
              desc: 'PDF, JPG or PNG up to 50MB. Pages are counted automatically; copies, colour, A4/A3, duplex and page range are selected on the phone.',
            },
            {
              icon: Banknote,
              title: 'Dynamic UPI QR Payment',
              desc: 'The total is priced live from your rate card, and a UPI QR for that exact amount is generated against your own VPA.',
            },
            {
              icon: Printer,
              title: 'Automatic Physical Print',
              desc: 'The counter agent picks up the paid job, downloads the file and prints it natively — the customer just collects the pages.',
            },
          ].map((s, i) => (
            <div className="flow-card" key={s.title}>
              <div className="flow-num-badge">{i + 1}</div>
              <div className="flow-icon-wrap">
                <s.icon size={26} strokeWidth={2.4} />
              </div>
              <h3 className="flow-card-title">{s.title}</h3>
              <p className="flow-card-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section bg-subtle-section">
        <div className="section-badge">ENGINEERED FOR MODERN XEROX CENTERS</div>
        <h2 className="section-heading">Everything You Need To Run An Autonomous Shop</h2>
        <p className="section-subheading">
          Replace pendrive transfers, WhatsApp file chaos and handwritten payment notebooks.
        </p>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon-box">
                <f.icon size={22} strokeWidth={2.4} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="stack" className="landing-section">
        <div className="section-badge">OPEN ARCHITECTURE</div>
        <h2 className="section-heading">A Stack You Can Read In An Afternoon</h2>
        <p className="section-subheading">
          Three routes, one flat-file database, an optional Firestore layer and a single agent
          script. Nothing hidden, nothing proprietary.
        </p>

        <div className="stack-grid">
          {STACK.map((s) => (
            <div className="stack-item" key={s.name}>
              <Code2 size={16} />
              <div className="stack-text">
                <span className="stack-name">{s.name}</span>
                <span className="stack-role">{s.role}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="routes-grid">
          <div className="route-card">
            <span className="route-path">/</span>
            <span className="route-desc">
              This open-source showcase on printr.ruthwikreddy.live — the customer kiosk on every
              self-hosted deployment.
            </span>
          </div>
          <div className="route-card">
            <span className="route-path">/app</span>
            <span className="route-desc">
              The customer self-service kiosk: upload, configure, pay, watch live print status.
            </span>
          </div>
          <div className="route-card">
            <span className="route-path">/admin</span>
            <span className="route-desc">
              Password-protected shop control center: revenue, queue, rates, agent setup, QR standee.
            </span>
          </div>
        </div>
      </section>

      <section id="hardware" className="landing-section bg-subtle-section">
        <div className="section-badge">CROSS-PLATFORM PRINTER COMPATIBILITY</div>
        <h2 className="section-heading">Works on Any Computer &amp; Any Printer</h2>
        <p className="section-subheading">
          The Printr agent drives the native print pipeline of each operating system.
        </p>

        <div className="hardware-cards-grid">
          <div className="hardware-platform-box">
            <div className="hw-icon-header">
              <Server size={22} />
              <h4>Windows 10 / 11 / Server</h4>
            </div>
            <p className="hw-desc">
              Prints through PowerShell <code>Start-Process -Verb PrintTo</code> with a SumatraPDF
              and <code>Out-Printer</code> fallback. Ships a double-click launcher:{' '}
              <code>start-windows.bat</code>.
            </p>
            <div className="hw-code-preview">
              <code>set BACKEND_URL=https://print.yourshop.com &amp;&amp; node print-agent\agent.js</code>
            </div>
          </div>

          <div className="hardware-platform-box">
            <div className="hw-icon-header">
              <Terminal size={22} />
              <h4>macOS, Linux &amp; Raspberry Pi (CUPS)</h4>
            </div>
            <p className="hw-desc">
              Uses the native <code>lp</code> driver and maps paper size, colour model, duplex
              binding and page ranges to CUPS options automatically.
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

      <section id="deploy" className="landing-section">
        <div className="section-badge">SELF-HOST IN UNDER 5 MINUTES</div>
        <h2 className="section-heading">Deploy Printr On Your Own Domain</h2>
        <p className="section-subheading">
          Every step, in order — from clone to a live counter standee.
        </p>

        <div className="setup-steps-list">
          {[
            {
              title: 'Clone and install',
              desc: 'Node.js 18+ is the only prerequisite. Run it locally first to confirm the kiosk and admin load.',
              cmd: 'git clone https://github.com/ruthwwikreddy/printr.git && cd printr && npm install && npm run dev',
              id: 'clone',
            },
            {
              title: 'Deploy the hub to Vercel, Netlify or a VPS',
              desc: 'Import the repo, keep the Next.js preset, then set ADMIN_PASSWORD, PRINT_AGENT_AUTH_SECRET and (optionally) the NEXT_PUBLIC_FIREBASE_* variables. Attach your domain, e.g. print.yourshop.com.',
              cmd: 'ADMIN_PASSWORD=your-strong-password  PRINT_AGENT_AUTH_SECRET=32+random-characters',
              id: 'env',
            },
            {
              title: 'Configure your shop in /admin',
              desc: 'Sign in with your admin password and set the shop name, tagline, address, counter phone, UPI VPA and per-page rates for A4/A3 in black & white and colour.',
              cmd: null,
              id: 'admin',
            },
            {
              title: 'Start the agent on the counter PC',
              desc: 'Point BACKEND_URL at your deployed hub. Use PM2 to keep it alive across reboots so the shop never misses a job.',
              cmd: 'npm install -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup',
              id: 'pm2',
            },
            {
              title: 'Print and place your QR standee',
              desc: 'In /admin open Counter QR Standee, print it on A4, and place it on the counter. Customers are now self-service.',
              cmd: null,
              id: 'standee',
            },
          ].map((step, i) => (
            <div className="setup-step-row" key={step.id}>
              <div className="step-number-circle">{i + 1}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {step.cmd && (
                  <div className="step-cmd-snippet">
                    <code>{step.cmd}</code>
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => copyCommand(step.cmd as string, step.id)}
                      aria-label="Copy command"
                    >
                      {copiedCmd === step.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-section bg-subtle-section">
        <div className="section-badge">QUESTIONS, ANSWERED</div>
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <p className="section-subheading">
          Everything shop owners and self-hosters ask before switching on Printr.
        </p>

        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={f.q}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                <span className="faq-toggle-icon">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="faq-answer">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section creator-section">
        <div className="creator-card">
          <div className="creator-avatar">
            <Cpu size={26} strokeWidth={2.2} />
          </div>
          <div className="creator-body">
            <span className="section-badge">CREATOR</span>
            <h2 className="creator-name">Ruthwik Reddy</h2>
            <p className="creator-bio">
              Printr is designed and engineered by{' '}
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                Ruthwik Reddy
              </a>
              , an engineer building open-source automation for real-world small businesses. Printr
              is released free under the MIT License so any print shop, campus or office anywhere can
              run an autonomous printing counter without paying software rent.
            </p>
            <div className="creator-links">
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="creator-link">
                <Globe size={14} />
                <span>ruthwikreddy.live</span>
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="creator-link">
                <Github size={14} />
                <span>github.com/ruthwwikreddy/printr</span>
              </a>
              <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noopener noreferrer" className="creator-link">
                <BookOpen size={14} />
                <span>Documentation</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-final-cta">
        <Sparkles size={22} />
        <h2>Ready to make your counter autonomous?</h2>
        <p>Clone it, deploy it, print your standee. It costs nothing but a domain.</p>
        <div className="landing-cta-group">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn-landing-primary">
            <Github size={16} />
            <span>Get Printr on GitHub</span>
            <ArrowRight size={16} />
          </a>
          <Link href="/app" className="btn-landing-secondary">
            <Wallet size={15} />
            <span>Try the Live Kiosk</span>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="brand-icon-box">
                <Printer size={16} strokeWidth={2.4} />
              </div>
              <span className="brand-name">Printr</span>
              <p className="footer-brand-desc">
                Free and open-source autonomous cloud printing OS for Xerox shops, campuses and
                offices worldwide.
              </p>
            </div>

            <div className="footer-nav-col">
              <span className="footer-nav-title">Product</span>
              <Link href="/app">Customer Kiosk</Link>
              <Link href="/admin">Shop Admin</Link>
              <a href="#features">Features</a>
              <a href="#deploy">Deploy Guide</a>
            </div>

            <div className="footer-nav-col">
              <span className="footer-nav-title">Open Source</span>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub Repository</a>
              <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">Report an Issue</a>
              <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a>
            </div>

            <div className="footer-nav-col">
              <span className="footer-nav-title">Creator</span>
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">Ruthwik Reddy</a>
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">Portfolio</a>
            </div>
          </div>

          <div className="footer-bottom-row">
            <p>
              Engineered with <Heart size={13} className="inline-block" /> by{' '}
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline">
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
