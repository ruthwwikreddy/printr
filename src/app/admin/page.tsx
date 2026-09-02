'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  Banknote,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Github,
  LayoutDashboard,
  ListOrdered,
  Loader2,
  Lock,
  LogOut,
  Printer,
  QrCode,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  Server,
  Smartphone,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import './admin.css';

interface Stats {
  ordersToday: number;
  isOnline: boolean;
  agentName: string;
  queuedJobs: number;
  printingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRevenue: number;
}

interface PrintJob {
  id: string;
  status: string;
  printerName?: string;
  errorLog?: string;
  copies: number;
  colourMode: string;
  paperSize: string;
  duplexMode: string;
  pageRange?: string;
}

interface OrderFile {
  originalName?: string;
  pageCount?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  files?: OrderFile[];
  printJobs?: PrintJob[];
}

type AdminSection = 'overview' | 'queue' | 'rates' | 'agent' | 'standee';
type FilterStatus = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType; title: string; subtitle: string }[] = [
  {
    id: 'overview',
    label: 'Live Overview',
    icon: LayoutDashboard,
    title: 'Live Overview',
    subtitle: 'Counter health, revenue and the latest orders, refreshed every 4 seconds.',
  },
  {
    id: 'queue',
    label: 'Print Queue',
    icon: ListOrdered,
    title: 'Print Queue',
    subtitle: 'Every order with its print job — retry a failed print or cancel a stuck one.',
  },
  {
    id: 'rates',
    label: 'Rates & UPI',
    icon: Banknote,
    title: 'Rates & UPI',
    subtitle: 'Shop identity, the UPI ID that receives payments, and per-page pricing.',
  },
  {
    id: 'agent',
    label: 'Counter PC Setup',
    icon: Server,
    title: 'Counter PC Setup',
    subtitle: 'Connect the computer attached to your printer so jobs dispatch automatically.',
  },
  {
    id: 'standee',
    label: 'QR Standee',
    icon: QrCode,
    title: 'QR Standee',
    subtitle: 'Print the counter standee customers scan to reach your kiosk.',
  },
];

function statusTone(status: string) {
  if (status === 'COMPLETED') return 'ok';
  if (status === 'PRINTING' || status === 'PROCESSING') return 'info';
  if (status === 'PAID' || status === 'PENDING' || status === 'AWAITING_PAYMENT') return 'warn';
  if (status === 'FAILED' || status === 'CANCELLED') return 'bad';
  return 'idle';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard() {
  const [authState, setAuthState] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [usingDefaultPassword, setUsingDefaultPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [section, setSection] = useState<AdminSection>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [jobActionId, setJobActionId] = useState<string | null>(null);

  const [shopName, setShopName] = useState('Quick Print Xerox');
  const [upiId, setUpiId] = useState('shopowner@upi');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('Instant Automated Self-Service Printing Station');
  const [pricing, setPricing] = useState({
    A4_MONOCHROME: 2,
    A4_COLOUR: 10,
    A3_MONOCHROME: 5,
    A3_COLOUR: 20,
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOriginUrl(window.location.origin);
  }, []);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        setUsingDefaultPassword(Boolean(data.usingDefaultPassword));
        setAuthState(data.authenticated ? 'unlocked' : 'locked');
      })
      .catch(() => setAuthState('locked'));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/settings'),
      ]);

      if (statsRes.status === 401) {
        setAuthState('locked');
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        if (statsData.orders) setOrders(statsData.orders);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const s = settingsData.settings;
        if (s) {
          setShopName(s.shopName || 'Quick Print Xerox');
          setUpiId(s.upiId || 'shopowner@upi');
          setPhone(s.phone || '');
          setAddress(s.address || '');
          setTagline(s.tagline || '');
          if (s.pricing) setPricing(s.pricing);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState !== 'unlocked') return;
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [authState, fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword('');
        setLoading(true);
        setAuthState('unlocked');
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Incorrect password');
      }
    } catch {
      setLoginError('Network error — could not reach the server.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => undefined);
    setStats(null);
    setOrders([]);
    setAuthState('locked');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, upiId, phone, address, tagline, pricing }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else if (res.status === 401) {
        setAuthState('locked');
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || 'Failed to save settings. Check the UPI ID and try again.');
      }
    } catch {
      setSaveError('Network error — could not reach the server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'retry' | 'cancel') => {
    setJobActionId(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.status === 401) setAuthState('locked');
      await fetchData();
    } finally {
      setJobActionId(null);
    }
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (q) {
        const haystack = [order.orderNumber, order.customerPhone, order.files?.[0]?.originalName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return order.status === 'COMPLETED';
      if (statusFilter === 'FAILED') return ['FAILED', 'CANCELLED'].includes(order.status);
      return ['CREATED', 'PENDING', 'AWAITING_PAYMENT', 'PAID', 'PRINTING'].includes(order.status);
    });
  }, [orders, searchQuery, statusFilter]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const hubUrl = originUrl || 'https://printr.ruthwikreddy.live';
  const kioskUrl = `${hubUrl}/app`;
  const standeeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=15&data=${encodeURIComponent(
    kioskUrl
  )}`;
  const activeSection = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  if (authState === 'checking') {
    return (
      <div className="pa">
        <div className="pa-login-screen">
          <Loader2 size={22} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (authState === 'locked') {
    return (
      <div className="pa">
        <div className="pa-login-screen">
          <div className="pa-login-card">
            <div className="pa-login-logo">
              <Lock size={20} strokeWidth={2.4} />
            </div>
            <h1>Shop Control Center</h1>
            <p className="pa-login-sub">
              Enter the admin password to manage rates, the print queue and your counter agent.
            </p>

            <form className="pa-login-form" onSubmit={handleLogin}>
              <input
                type="password"
                className="pa-input"
                placeholder="Admin password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {loginError && (
                <div className="pa-login-error">
                  <AlertTriangle size={14} />
                  {loginError}
                </div>
              )}
              <button type="submit" className="pa-btn pa-btn-primary" disabled={loggingIn}>
                {loggingIn ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                {loggingIn ? 'Unlocking…' : 'Unlock Dashboard'}
              </button>
            </form>

            <div className="pa-login-hint">
              {usingDefaultPassword ? (
                <>
                  No <code>ADMIN_PASSWORD</code> is set, so the default <code>printr-admin</code> is
                  active. Set the variable in your environment before going live.
                </>
              ) : (
                <>
                  The password is the <code>ADMIN_PASSWORD</code> environment variable of this
                  deployment.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pa">
      <div className="pa-shell">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="pa-sidebar">
          <div className="pa-brand">
            <div className="pa-brand-logo">
              <Printer size={19} strokeWidth={2.4} />
            </div>
            <div className="pa-brand-text">
              <span className="pa-brand-name">{shopName}</span>
              <span className="pa-brand-role">Shop Control Center</span>
            </div>
          </div>

          <nav className="pa-nav">
            <span className="pa-nav-label">Operations</span>
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const count =
                item.id === 'queue' && stats ? stats.queuedJobs + stats.printingJobs : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pa-nav-item ${section === item.id ? 'active' : ''}`}
                  onClick={() => setSection(item.id)}
                >
                  <Icon size={16} strokeWidth={2.2} />
                  <span>{item.label}</span>
                  {count ? <span className="pa-nav-count">{count}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="pa-sidebar-footer">
            <div className="pa-agent-card">
              <div className="pa-agent-row">
                <span className={`pa-dot ${stats?.isOnline ? 'on' : 'off'}`} />
                {stats?.isOnline ? 'Counter agent online' : 'Counter agent offline'}
              </div>
              <span className="pa-agent-name">{stats?.agentName || 'Not connected'}</span>
            </div>
            <a className="pa-side-link" href={kioskUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              Open customer kiosk
            </a>
            <a
              className="pa-side-link"
              href="https://github.com/ruthwwikreddy/printr"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={14} />
              Docs &amp; source
            </a>
            <button type="button" className="pa-side-link" onClick={handleLogout}>
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────── */}
        <main className="pa-main">
          <header className="pa-topbar">
            <div className="pa-topbar-title">
              <h1>{activeSection.title}</h1>
              <p>{activeSection.subtitle}</p>
            </div>
            <div className="pa-topbar-actions">
              <span className={`pa-status-pill ${stats?.isOnline ? 'on' : 'off'}`}>
                <span className={`pa-dot ${stats?.isOnline ? 'on' : 'off'}`} />
                {stats?.isOnline ? 'Printer ready' : 'Agent offline'}
              </span>
              <button type="button" className="pa-btn" onClick={manualRefresh}>
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link className="pa-btn pa-btn-primary" href="/app" target="_blank">
                <ArrowUpRight size={14} />
                Kiosk
              </Link>
            </div>
          </header>

          <div className="pa-content">
            {/* ── Overview ───────────────────────────────── */}
            {section === 'overview' && (
              <>
                {!stats?.isOnline && (
                  <div className="pa-banner warn">
                    <div className="pa-banner-icon">
                      <AlertTriangle size={17} />
                    </div>
                    <div className="pa-banner-body">
                      <strong>No print agent is reporting in</strong>
                      <span>
                        Paid orders will queue safely, but nothing prints until the agent runs on the
                        computer attached to your printer.
                      </span>
                    </div>
                    <div className="pa-banner-actions">
                      <button
                        type="button"
                        className="pa-btn pa-btn-primary pa-btn-sm"
                        onClick={() => setSection('agent')}
                      >
                        Setup instructions
                      </button>
                    </div>
                  </div>
                )}

                <div className="pa-kpi-grid">
                  <div className="pa-kpi green">
                    <div className="pa-kpi-top">
                      <span className="pa-kpi-label">Revenue collected</span>
                      <BadgeIndianRupee size={16} />
                    </div>
                    <span className="pa-kpi-value">₹{stats?.totalRevenue ?? 0}</span>
                    <span className="pa-kpi-sub">Paid, printing and completed orders</span>
                  </div>
                  <div className="pa-kpi">
                    <div className="pa-kpi-top">
                      <span className="pa-kpi-label">Orders today</span>
                      <ListOrdered size={16} />
                    </div>
                    <span className="pa-kpi-value">{stats?.ordersToday ?? 0}</span>
                    <span className="pa-kpi-sub">Since midnight</span>
                  </div>
                  <div className="pa-kpi blue">
                    <div className="pa-kpi-top">
                      <span className="pa-kpi-label">In the queue</span>
                      <Activity size={16} />
                    </div>
                    <span className="pa-kpi-value">
                      {(stats?.queuedJobs ?? 0) + (stats?.printingJobs ?? 0)}
                    </span>
                    <span className="pa-kpi-sub">
                      {stats?.printingJobs ?? 0} printing · {stats?.queuedJobs ?? 0} waiting
                    </span>
                  </div>
                  <div className="pa-kpi">
                    <div className="pa-kpi-top">
                      <span className="pa-kpi-label">Printed / failed</span>
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="pa-kpi-value">
                      {stats?.completedJobs ?? 0}
                      <span style={{ color: '#8b8b95', fontSize: 18 }}> / {stats?.failedJobs ?? 0}</span>
                    </span>
                    <span className="pa-kpi-sub">Lifetime print jobs</span>
                  </div>
                </div>

                <section className="pa-card">
                  <div className="pa-card-head">
                    <div>
                      <h2>Recent orders</h2>
                      <p>The last 20 orders received from the kiosk.</p>
                    </div>
                    <button type="button" className="pa-btn pa-btn-sm" onClick={() => setSection('queue')}>
                      Open full queue
                    </button>
                  </div>
                  <OrdersTable
                    orders={orders.slice(0, 8)}
                    loading={loading}
                    emptyText="No orders yet — print the QR standee and place it at your counter."
                  />
                </section>
              </>
            )}

            {/* ── Queue ──────────────────────────────────── */}
            {section === 'queue' && (
              <section className="pa-card">
                <div className="pa-toolbar">
                  <div className="pa-search">
                    <Search size={15} />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search order number, phone or file name"
                    />
                  </div>
                  <div className="pa-filters">
                    {(['ALL', 'ACTIVE', 'COMPLETED', 'FAILED'] as FilterStatus[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`pa-filter ${statusFilter === f ? 'active' : ''}`}
                        onClick={() => setStatusFilter(f)}
                      >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <OrdersTable
                  orders={filteredOrders}
                  loading={loading}
                  emptyText="No orders match this filter."
                  jobActionId={jobActionId}
                  onJobAction={handleJobAction}
                />
              </section>
            )}

            {/* ── Rates & UPI ────────────────────────────── */}
            {section === 'rates' && (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <section className="pa-card">
                  <div className="pa-card-head">
                    <div>
                      <h2>Shop identity</h2>
                      <p>Shown on the kiosk header, the payment screen and the printed QR standee.</p>
                    </div>
                  </div>
                  <div className="pa-card-body">
                    <div className="pa-form-grid">
                      <div className="pa-field">
                        <label htmlFor="shopName">Shop name</label>
                        <input
                          id="shopName"
                          className="pa-input"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="pa-field">
                        <label htmlFor="tagline">Tagline</label>
                        <input
                          id="tagline"
                          className="pa-input"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                        />
                      </div>
                      <div className="pa-field">
                        <label htmlFor="phone">Counter phone</label>
                        <input
                          id="phone"
                          className="pa-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="pa-field">
                        <label htmlFor="address">Counter location</label>
                        <input
                          id="address"
                          className="pa-input"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Main Market, Counter 1"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pa-card">
                  <div className="pa-card-head">
                    <div>
                      <h2>Direct UPI payout</h2>
                      <p>
                        Customers pay this VPA directly from any UPI app. Printr never holds the money
                        and charges no fee.
                      </p>
                    </div>
                  </div>
                  <div className="pa-card-body">
                    <div className="pa-field">
                      <label htmlFor="upiId">UPI ID (VPA)</label>
                      <input
                        id="upiId"
                        className="pa-input mono"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        required
                      />
                      <span className="pa-help">
                        Works with Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay and every bank
                        app.
                      </span>
                    </div>
                  </div>
                </section>

                <section className="pa-card">
                  <div className="pa-card-head">
                    <div>
                      <h2>Per-page rates (₹)</h2>
                      <p>Kiosk totals recalculate live from these rates as customers change options.</p>
                    </div>
                  </div>
                  <div className="pa-card-body">
                    <div className="pa-rate-grid">
                      {(
                        [
                          ['A4_MONOCHROME', 'A4 black & white'],
                          ['A4_COLOUR', 'A4 full colour'],
                          ['A3_MONOCHROME', 'A3 black & white'],
                          ['A3_COLOUR', 'A3 full colour'],
                        ] as const
                      ).map(([key, label]) => (
                        <div className="pa-rate" key={key}>
                          <span className="pa-rate-title">{label}</span>
                          <div className="pa-rate-input">
                            <span>₹</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={pricing[key]}
                              onChange={(e) =>
                                setPricing({ ...pricing, [key]: parseFloat(e.target.value) || 0 })
                              }
                            />
                            <span className="pa-rate-unit">/ page</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pa-save-bar">
                    <button type="submit" className="pa-btn pa-btn-primary" disabled={savingSettings}>
                      {savingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {savingSettings ? 'Saving…' : 'Save all changes'}
                    </button>
                    {savedSuccess && (
                      <span className="pa-save-msg ok">
                        <Check size={14} /> Settings saved
                      </span>
                    )}
                    {saveError && (
                      <span className="pa-save-msg bad">
                        <AlertTriangle size={14} /> {saveError}
                      </span>
                    )}
                  </div>
                </section>
              </form>
            )}

            {/* ── Agent setup ────────────────────────────── */}
            {section === 'agent' && (
              <section className="pa-card">
                <div className="pa-card-head">
                  <div>
                    <h2>Connect the counter computer</h2>
                    <p>
                      The agent polls this deployment for paid jobs and sends them to the printer that
                      the computer already prints to. Node.js 18+ is the only requirement.
                    </p>
                  </div>
                  <span className={`pa-status-pill ${stats?.isOnline ? 'on' : 'off'}`}>
                    <span className={`pa-dot ${stats?.isOnline ? 'on' : 'off'}`} />
                    {stats?.isOnline ? stats.agentName : 'Waiting for heartbeat'}
                  </span>
                </div>
                <div className="pa-card-body">
                  <div className="pa-platform-grid">
                    <div className="pa-platform">
                      <div className="pa-platform-head">
                        <Server size={17} /> Windows 10 / 11 / Server
                      </div>
                      <p>Run in PowerShell from the project folder:</p>
                      <div className="pa-cmd">
                        <code>{`set BACKEND_URL=${hubUrl} && node print-agent\\agent.js`}</code>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(`set BACKEND_URL=${hubUrl} && node print-agent\\agent.js`, 'win')
                          }
                        >
                          {copiedCmd === 'win' ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className="pa-tip">
                        Or double-click <code>print-agent/start-windows.bat</code>.
                      </div>
                    </div>

                    <div className="pa-platform">
                      <div className="pa-platform-head">
                        <Terminal size={17} /> macOS / Linux / Raspberry Pi
                      </div>
                      <p>Run in a terminal from the project folder:</p>
                      <div className="pa-cmd">
                        <code>{`BACKEND_URL="${hubUrl}" node print-agent/agent.js`}</code>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(`BACKEND_URL="${hubUrl}" node print-agent/agent.js`, 'nix')
                          }
                        >
                          {copiedCmd === 'nix' ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className="pa-tip">
                        Or run <code>bash print-agent/start-mac-linux.sh</code>. Printing uses CUPS
                        (<code>lp</code>).
                      </div>
                    </div>

                    <div className="pa-platform">
                      <div className="pa-platform-head">
                        <Sparkles size={17} /> Keep it running 24/7
                      </div>
                      <p>Register the agent with PM2 so it restarts with the computer:</p>
                      <div className="pa-cmd">
                        <code>npm install -g pm2 &amp;&amp; pm2 start ecosystem.config.js &amp;&amp; pm2 save &amp;&amp; pm2 startup</code>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              'npm install -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup',
                              'pm2'
                            )
                          }
                        >
                          {copiedCmd === 'pm2' ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className="pa-tip">
                        Set <code>PRINTER_NAME</code> to target a specific printer, otherwise the system
                        default is used.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Standee ────────────────────────────────── */}
            {section === 'standee' && (
              <div className="pa-standee-layout">
                <div className="pa-standee-sheet">
                  <div className="pa-standee-logo">
                    <Printer size={26} strokeWidth={2.5} />
                  </div>
                  <h2 className="pa-standee-shop">{shopName}</h2>
                  <p className="pa-standee-tagline">
                    {tagline || 'Self-service autonomous printing kiosk'}
                  </p>

                  <div className="pa-standee-qr">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={standeeQrUrl} alt="Scan to open the print kiosk" width={260} height={260} />
                  </div>
                  <span className="pa-standee-scan">
                    <Smartphone size={15} /> Scan with your phone camera
                  </span>

                  <div className="pa-standee-steps">
                    {['Upload PDF or photos', 'Choose colour & copies', 'Pay by UPI, collect'].map(
                      (text, i) => (
                        <div className="pa-standee-step" key={text}>
                          <span className="num">{i + 1}</span>
                          {text}
                        </div>
                      )
                    )}
                  </div>

                  <div className="pa-standee-rates">
                    <span className="pa-standee-rate">A4 B&amp;W ₹{pricing.A4_MONOCHROME}</span>
                    <span className="pa-standee-rate">A4 Colour ₹{pricing.A4_COLOUR}</span>
                    <span className="pa-standee-rate">A3 B&amp;W ₹{pricing.A3_MONOCHROME}</span>
                    <span className="pa-standee-rate">A3 Colour ₹{pricing.A3_COLOUR}</span>
                  </div>

                  <span className="pa-standee-url">{kioskUrl}</span>
                  {(address || phone) && (
                    <span className="pa-standee-contact">
                      {[address, phone && `Help: ${phone}`].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>

                <aside className="pa-standee-side">
                  <div className="pa-card">
                    <div className="pa-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 style={{ fontSize: 15, margin: 0, fontWeight: 800 }}>Print &amp; place</h2>
                      <p style={{ margin: 0, fontSize: 12.8, color: '#52525b', lineHeight: 1.6 }}>
                        Print this page on A4, slide it into a stand and place it where customers queue.
                        Everything except the standee is hidden when printing.
                      </p>
                      <button type="button" className="pa-btn pa-btn-primary" onClick={() => window.print()}>
                        <Printer size={15} /> Print standee
                      </button>
                      <button
                        type="button"
                        className="pa-btn"
                        onClick={() => copyToClipboard(kioskUrl, 'kiosk')}
                      >
                        {copiedCmd === 'kiosk' ? <Check size={14} /> : <Copy size={14} />} Copy kiosk link
                      </button>
                      <a className="pa-btn" href={standeeQrUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} /> Download QR image
                      </a>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function OrdersTable({
  orders,
  loading,
  emptyText,
  jobActionId,
  onJobAction,
}: {
  orders: Order[];
  loading: boolean;
  emptyText: string;
  jobActionId?: string | null;
  onJobAction?: (jobId: string, action: 'retry' | 'cancel') => void;
}) {
  if (loading && orders.length === 0) {
    return (
      <div className="pa-empty">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return <div className="pa-empty">{emptyText}</div>;
  }

  return (
    <div className="pa-table-scroll">
      <table className="pa-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Document</th>
            <th>Spec</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Printer</th>
            {onJobAction && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const job = order.printJobs?.[0];
            const file = order.files?.[0];
            return (
              <tr key={order.id}>
                <td>
                  <div className="pa-cell-stack">
                    <span className="pa-mono">#{order.orderNumber}</span>
                    <span className="pa-cell-sub">{formatTime(order.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="pa-cell-stack">
                    <span>{file?.originalName || 'Document'}</span>
                    <span className="pa-cell-sub">
                      {file?.pageCount ? `${file.pageCount} pages` : order.customerPhone || '—'}
                    </span>
                  </div>
                </td>
                <td className="pa-muted">
                  {job
                    ? `${job.paperSize} · ${job.colourMode === 'COLOUR' ? 'Colour' : 'B&W'} · ${job.copies}×`
                    : '—'}
                </td>
                <td className="pa-mono">₹{order.totalAmount}</td>
                <td>
                  <div className="pa-cell-stack">
                    <span className={`pa-badge ${statusTone(order.status)}`}>{order.status}</span>
                    {job?.errorLog && <span className="pa-cell-sub">{job.errorLog.slice(0, 60)}</span>}
                  </div>
                </td>
                <td className="pa-muted">{job?.printerName || '—'}</td>
                {onJobAction && (
                  <td>
                    <div className="pa-row-actions">
                      {job ? (
                        <>
                          <button
                            type="button"
                            className="pa-btn pa-btn-sm"
                            disabled={jobActionId === job.id}
                            onClick={() => onJobAction(job.id, 'retry')}
                          >
                            <RotateCw size={13} /> Retry
                          </button>
                          <button
                            type="button"
                            className="pa-btn pa-btn-sm pa-btn-danger"
                            disabled={jobActionId === job.id}
                            onClick={() => onJobAction(job.id, 'cancel')}
                          >
                            <X size={13} /> Cancel
                          </button>
                        </>
                      ) : (
                        <span className="pa-cell-sub">No job</span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
