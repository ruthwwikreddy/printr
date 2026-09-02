'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  BarChart3,
  ListOrdered,
  Banknote,
  RefreshCw,
  RotateCw,
  X,
  Check,
  Activity,
  Server,
  Save,
  Clock,
  Layers,
  SlidersHorizontal,
  CircleDot,
  CheckCircle2,
  Search,
  ExternalLink,
  QrCode,
  Store,
  Terminal,
  Copy,
  AlertTriangle,
  Loader2,
  Download,
  Sparkles,
  Smartphone,
  MapPin,
  Phone,
} from 'lucide-react';
import Link from 'next/link';

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

interface Order {
  id: string;
  orderNumber: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  filename?: string;
  printJobs: PrintJob[];
}

type AdminTab = 'overview' | 'orders' | 'pricing' | 'agent' | 'standee';
type FilterStatus = 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED';

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Shop Settings State
  const [shopName, setShopName] = useState('Quick Print Xerox');
  const [upiId, setUpiId] = useState('shopowner@upi');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Main Market, Counter 1');
  const [tagline, setTagline] = useState('Instant Automated Self-Service Printing Station');
  const [pricing, setPricing] = useState({
    A4_MONOCHROME: 2,
    A4_COLOUR: 10,
    A3_MONOCHROME: 5,
    A3_COLOUR: 20,
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Fetch initial stats & settings
  const fetchData = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/settings'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        if (statsData.orders) setOrders(statsData.orders);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          const s = settingsData.settings;
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
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save Shop Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          upiId,
          phone,
          address,
          tagline,
          pricing,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return order.status === 'COMPLETED';
      if (statusFilter === 'PENDING')
        return ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PRINTING'].includes(order.status);
      if (statusFilter === 'FAILED') return order.status === 'FAILED';

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const kioskUrl = originUrl || 'https://your-shop-domain.com';
  const standeeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=15&data=${encodeURIComponent(
    kioskUrl
  )}`;

  return (
    <div className="admin-container">
      {/* Top Navigation */}
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-logo-badge">
            <Printer size={18} strokeWidth={2.5} />
          </div>
          <div className="admin-title-group">
            <span className="admin-title">{shopName}</span>
            <span className="admin-subtitle">Shop Owner Control Center</span>
          </div>
        </div>

        <div className="admin-header-right">
          {/* Agent Status Live Indicator */}
          <div
            className={`admin-status-badge ${
              stats?.isOnline ? 'status-online' : 'status-offline'
            }`}
          >
            <span className="dot pulse"></span>
            <span>
              {stats?.isOnline
                ? `Agent Online (${stats.agentName})`
                : 'Agent Offline (Start Daemon)'}
            </span>
          </div>

          <Link href="/" target="_blank" className="btn-customer-portal">
            <ExternalLink size={14} />
            <span>Open Customer Kiosk</span>
          </Link>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="admin-nav-tabs">
        <button
          type="button"
          className={`tab-item ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          <BarChart3 size={15} />
          <span>Live Overview</span>
        </button>
        <button
          type="button"
          className={`tab-item ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          <ListOrdered size={15} />
          <span>Print Orders Queue ({orders.length})</span>
        </button>
        <button
          type="button"
          className={`tab-item ${tab === 'pricing' ? 'active' : ''}`}
          onClick={() => setTab('pricing')}
        >
          <Banknote size={15} />
          <span>Rates &amp; Direct UPI</span>
        </button>
        <button
          type="button"
          className={`tab-item ${tab === 'agent' ? 'active' : ''}`}
          onClick={() => setTab('agent')}
        >
          <Terminal size={15} />
          <span>Connect Counter PC</span>
        </button>
        <button
          type="button"
          className={`tab-item ${tab === 'standee' ? 'active' : ''}`}
          onClick={() => setTab('standee')}
        >
          <QrCode size={15} />
          <span>Counter QR Standee</span>
        </button>
      </nav>

      {/* TAB 1: Live Overview */}
      {tab === 'overview' && (
        <div className="admin-tab-content">
          {/* Metrics Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Orders Today</span>
                <Clock size={16} className="stat-icon" />
              </div>
              <div className="stat-val">{stats?.ordersToday ?? 0}</div>
              <span className="stat-sub">Paid &amp; Received</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Today's Revenue</span>
                <Banknote size={16} className="stat-icon text-accent" />
              </div>
              <div className="stat-val text-accent">₹{(stats?.totalRevenue ?? 0).toFixed(2)}</div>
              <span className="stat-sub">100% Direct to your UPI</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Queued Jobs</span>
                <Layers size={16} className="stat-icon" />
              </div>
              <div className="stat-val">{stats?.queuedJobs ?? 0}</div>
              <span className="stat-sub">Waiting for physical print</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Completed Jobs</span>
                <CheckCircle2 size={16} className="stat-icon text-success" />
              </div>
              <div className="stat-val text-success">{stats?.completedJobs ?? 0}</div>
              <span className="stat-sub">Successfully printed</span>
            </div>
          </div>

          {/* Quick Hardware & Instructions Strip */}
          <div className="admin-quick-strip">
            <div className="quick-strip-left">
              <div className="strip-badge">
                <Server size={14} />
                <span>Hardware Connection Status</span>
              </div>
              <p className="strip-text">
                {stats?.isOnline ? (
                  <>
                    Active Print Daemon is listening on <strong>{stats.agentName}</strong>. Customer
                    jobs will be printed immediately upon payment.
                  </>
                ) : (
                  <>
                    No print agent connected. Launch the print agent daemon on your counter computer
                    to enable automated physical printing.
                  </>
                )}
              </p>
            </div>
            <div className="quick-strip-right">
              <button className="btn-action-outline" onClick={() => setTab('agent')}>
                <Terminal size={14} />
                <span>View Setup Commands</span>
              </button>
              <button className="btn-action-outline" onClick={() => setTab('standee')}>
                <QrCode size={14} />
                <span>Print QR Standee</span>
              </button>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="card-title">Recent Print Orders</h3>
              <button className="btn-link-tab" onClick={() => setTab('orders')}>
                View Full Queue →
              </button>
            </div>

            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Options</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => {
                    const job = order.printJobs?.[0];
                    return (
                      <tr key={order.id}>
                        <td className="font-mono font-bold">{order.orderNumber}</td>
                        <td className="text-muted">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>{order.customerPhone || 'Counter Guest'}</td>
                        <td className="text-sm">
                          {job ? (
                            <span>
                              {job.copies}x {job.colourMode === 'COLOUR' ? 'Color' : 'B&W'}{' '}
                              {job.paperSize} ({job.duplexMode})
                            </span>
                          ) : (
                            'Standard Print'
                          )}
                        </td>
                        <td className="font-bold">₹{order.totalAmount.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge-pill ${
                              order.status === 'COMPLETED'
                                ? 'badge-success'
                                : order.status === 'PAID'
                                ? 'badge-info'
                                : order.status === 'FAILED'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted">
                        No orders recorded yet today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Full Orders Queue */}
      {tab === 'orders' && (
        <div className="admin-tab-content">
          <div className="admin-card">
            <div className="orders-toolbar">
              <div className="search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search by order # or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as FilterStatus[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Created At</th>
                    <th>Customer</th>
                    <th>Print Settings</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Printer / Job</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const job = order.printJobs?.[0];
                    return (
                      <tr key={order.id}>
                        <td className="font-mono font-bold">{order.orderNumber}</td>
                        <td className="text-muted">
                          {new Date(order.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td>{order.customerPhone || 'Counter Guest'}</td>
                        <td>
                          {job ? (
                            <div className="job-specs-col">
                              <span>
                                {job.copies}x {job.colourMode} {job.paperSize}
                              </span>
                              <span className="text-xs text-muted">
                                {job.duplexMode}{' '}
                                {job.pageRange ? `· Pgs: ${job.pageRange}` : ''}
                              </span>
                            </div>
                          ) : (
                            'Standard'
                          )}
                        </td>
                        <td className="font-bold text-accent">₹{order.totalAmount.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge-pill ${
                              ['PAID', 'COMPLETED'].includes(order.status)
                                ? 'badge-success'
                                : 'badge-warning'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="job-status-col">
                            <span
                              className={`job-status-badge ${
                                job?.status === 'COMPLETED'
                                  ? 'text-success'
                                  : job?.status === 'PROCESSING'
                                  ? 'text-info'
                                  : job?.status === 'FAILED'
                                  ? 'text-danger'
                                  : 'text-muted'
                              }`}
                            >
                              {job?.status || 'QUEUED'}
                            </span>
                            {job?.printerName && (
                              <span className="text-xs text-muted">via {job.printerName}</span>
                            )}
                            {job?.errorLog && (
                              <span className="text-xs text-danger">{job.errorLog}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted">
                        No orders matching the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rates & Direct UPI */}
      {tab === 'pricing' && (
        <div className="admin-tab-content">
          <form onSubmit={handleSaveSettings} className="settings-form-layout">
            {/* Shop Identity */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="card-title">Shop Identity &amp; Contact</h3>
                  <p className="card-desc">
                    These details appear on your customer kiosk and printed receipts.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Shop / Business Name</label>
                  <input
                    type="text"
                    className="input-clean"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tagline / Subtitle</label>
                  <input
                    type="text"
                    className="input-clean"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number (Counter Contact)</label>
                  <input
                    type="text"
                    className="input-clean"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Shop Address / Counter Location</label>
                  <input
                    type="text"
                    className="input-clean"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Direct UPI Payment Details */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="card-title">Direct UPI Payment Setup</h3>
                  <p className="card-desc">
                    100% of customer funds are sent directly to your UPI ID without any intermediary
                    or fees.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label>
                    Your UPI ID (VPA) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-clean font-mono"
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                  <span className="text-xs text-muted mt-1">
                    Accepts payments from Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, and all
                    banking apps.
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Page Printing Rates */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="card-title">Per-Page Printing Rates (₹ INR)</h3>
                  <p className="card-desc">
                    Set your custom rates per page. Customer totals are calculated dynamically in
                    real time.
                  </p>
                </div>
              </div>

              <div className="rates-editor-grid">
                <div className="rate-edit-box">
                  <span className="rate-box-title">A4 Black &amp; White</span>
                  <div className="rate-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={pricing.A4_MONOCHROME}
                      onChange={(e) =>
                        setPricing({ ...pricing, A4_MONOCHROME: parseFloat(e.target.value) || 0 })
                      }
                      className="input-rate"
                    />
                    <span className="rate-unit">/ page</span>
                  </div>
                </div>

                <div className="rate-edit-box">
                  <span className="rate-box-title">A4 Full Color</span>
                  <div className="rate-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={pricing.A4_COLOUR}
                      onChange={(e) =>
                        setPricing({ ...pricing, A4_COLOUR: parseFloat(e.target.value) || 0 })
                      }
                      className="input-rate"
                    />
                    <span className="rate-unit">/ page</span>
                  </div>
                </div>

                <div className="rate-edit-box">
                  <span className="rate-box-title">A3 Black &amp; White</span>
                  <div className="rate-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={pricing.A3_MONOCHROME}
                      onChange={(e) =>
                        setPricing({ ...pricing, A3_MONOCHROME: parseFloat(e.target.value) || 0 })
                      }
                      className="input-rate"
                    />
                    <span className="rate-unit">/ page</span>
                  </div>
                </div>

                <div className="rate-edit-box">
                  <span className="rate-box-title">A3 Full Color</span>
                  <div className="rate-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={pricing.A3_COLOUR}
                      onChange={(e) =>
                        setPricing({ ...pricing, A3_COLOUR: parseFloat(e.target.value) || 0 })
                      }
                      className="input-rate"
                    />
                    <span className="rate-unit">/ page</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Action Bar */}
            <div className="settings-action-bar">
              <button type="submit" className="btn-save-settings" disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check size={16} />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Connect Counter PC (Agent Setup) */}
      {tab === 'agent' && (
        <div className="admin-tab-content">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="card-title">Connect Counter Printer Computer</h3>
                <p className="card-desc">
                  Run the lightweight agent daemon on the computer connected to your physical
                  printer.
                </p>
              </div>
            </div>

            <div className="agent-instructions-grid">
              {/* Windows Instructions */}
              <div className="agent-platform-card">
                <div className="platform-header">
                  <Server size={18} />
                  <h4>Windows (10 / 11 / Server)</h4>
                </div>
                <p className="platform-desc">
                  Double-click the 1-click batch launcher or run in PowerShell:
                </p>
                <div className="cmd-box">
                  <code>
                    set BACKEND_URL={kioskUrl} &amp;&amp; node print-agent\agent.js
                  </code>
                  <button
                    className="btn-copy-code"
                    onClick={() =>
                      copyToClipboard(
                        `set BACKEND_URL=${kioskUrl} && node print-agent\\agent.js`,
                        'win'
                      )
                    }
                  >
                    {copiedCmd === 'win' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="platform-tip">
                  💡 You can also double click <code>print-agent/start-windows.bat</code>.
                </div>
              </div>

              {/* macOS / Linux Instructions */}
              <div className="agent-platform-card">
                <div className="platform-header">
                  <Terminal size={18} />
                  <h4>macOS / Linux / Raspberry Pi</h4>
                </div>
                <p className="platform-desc">Run directly via Terminal:</p>
                <div className="cmd-box">
                  <code>
                    BACKEND_URL="{kioskUrl}" node print-agent/agent.js
                  </code>
                  <button
                    className="btn-copy-code"
                    onClick={() =>
                      copyToClipboard(
                        `BACKEND_URL="${kioskUrl}" node print-agent/agent.js`,
                        'mac'
                      )
                    }
                  >
                    {copiedCmd === 'mac' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="platform-tip">
                  💡 Or execute <code>bash print-agent/start-mac-linux.sh</code>.
                </div>
              </div>

              {/* PM2 24/7 Autostart */}
              <div className="agent-platform-card col-span-2">
                <div className="platform-header">
                  <Sparkles size={18} />
                  <h4>Keep Running 24/7 on Reboot (PM2 Daemon)</h4>
                </div>
                <p className="platform-desc">
                  To keep the agent automatically running even if the counter computer restarts:
                </p>
                <div className="cmd-box">
                  <code>
                    npm install -g pm2 &amp;&amp; pm2 start ecosystem.config.js &amp;&amp; pm2 save &amp;&amp; pm2 startup
                  </code>
                  <button
                    className="btn-copy-code"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Counter QR Standee */}
      {tab === 'standee' && (
        <div className="admin-tab-content">
          <div className="standee-wrapper">
            <div className="standee-actions-bar">
              <div>
                <h3 className="card-title">Front-Desk QR Standee</h3>
                <p className="card-desc">
                  Print and place this standee at your counter. Customers can scan to upload and pay
                  instantly.
                </p>
              </div>
              <button
                className="btn-print-standee"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} />
                <span>Print Standee on A4</span>
              </button>
            </div>

            {/* Printable Standee Sheet */}
            <div className="standee-sheet-preview" id="printable-standee">
              <div className="standee-inner-frame">
                <div className="standee-header">
                  <div className="standee-logo-icon">
                    <Printer size={32} strokeWidth={2.5} />
                  </div>
                  <h1 className="standee-shop-name">{shopName}</h1>
                  <p className="standee-tagline">
                    {tagline || 'Self-Service Autonomous Printing Kiosk'}
                  </p>
                </div>

                <div className="standee-qr-frame">
                  <img
                    src={standeeQrUrl}
                    alt="Counter Scan QR"
                    className="standee-qr-img"
                    width={280}
                    height={280}
                  />
                  <div className="standee-scan-prompt">
                    <Smartphone size={18} />
                    <span>SCAN WITH PHONE CAMERA OR ANY QR APP</span>
                  </div>
                </div>

                <div className="standee-steps-strip">
                  <div className="step-col">
                    <span className="step-badge">1</span>
                    <span className="step-text">Upload PDF / Photos</span>
                  </div>
                  <div className="step-col">
                    <span className="step-badge">2</span>
                    <span className="step-text">Select Color &amp; Copies</span>
                  </div>
                  <div className="step-col">
                    <span className="step-badge">3</span>
                    <span className="step-text">Pay via UPI &amp; Collect</span>
                  </div>
                </div>

                <div className="standee-footer-info">
                  <span className="kiosk-url-text">{kioskUrl}</span>
                  {(phone || address) && (
                    <div className="counter-contact">
                      {address && <span>{address}</span>}
                      {address && phone && <span>·</span>}
                      {phone && <span>Help: {phone}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
