'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Key,
  ShieldCheck,
  LogOut,
  User,
  PlusCircle,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { FirestoreOrder, subscribeToTenantOrders } from '@/lib/firestoreService';

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

export default function ShopOwnerDashboard() {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();

  // Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Shop Context
  const [shops, setShops] = useState<any[]>([]);
  const [currentShopSlug, setCurrentShopSlug] = useState<string>('demo-prints');
  const [currentShop, setCurrentShop] = useState<any | null>(null);
  const [tab, setTab] = useState<'overview' | 'orders' | 'settings' | 'agent'>('overview');

  // New Shop Creation Modal
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopSlug, setNewShopSlug] = useState('');
  const [newShopUpi, setNewShopUpi] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');

  // Orders State
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL');

  // Settings Form State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Load All Shops
  const loadShops = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (data.tenants && data.tenants.length > 0) {
        setShops(data.tenants);
        // Find shop belonging to user or default
        const userShop = data.tenants.find((s: any) => user && s.ownerEmail === user.email);
        if (userShop) {
          setCurrentShopSlug(userShop.slug);
          setCurrentShop(userShop);
        } else {
          setCurrentShopSlug(data.tenants[0].slug);
          setCurrentShop(data.tenants[0]);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadShops();
  }, [user]);

  // Load current shop details when slug changes
  useEffect(() => {
    if (!currentShopSlug) return;
    fetch(`/api/tenants/${currentShopSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant) setCurrentShop(data.tenant);
      })
      .catch(() => {});

    // Subscribe to real-time orders strictly for this shop
    const unsubscribe = subscribeToTenantOrders(currentShopSlug, (fsOrders) => {
      setOrders(fsOrders);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentShopSlug]);

  // Calculate live stats from real-time tenant orders
  const stats: Stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= today);
    const revenue = todayOrders
      .filter((o) => ['PAID', 'PRINTING', 'COMPLETED'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const queuedJobs = orders.filter((o) => ['PENDING', 'AWAITING_PAYMENT'].includes(o.status)).length;
    const printingJobs = orders.filter((o) => ['PRINTING', 'PAID'].includes(o.status)).length;
    const completedJobs = orders.filter((o) => o.status === 'COMPLETED').length;
    const failedJobs = orders.filter((o) => o.status === 'FAILED').length;

    return {
      ordersToday: todayOrders.length,
      isOnline: true,
      agentName: `${currentShop?.name || 'Shop'} Agent`,
      queuedJobs,
      printingJobs,
      completedJobs,
      failedJobs,
      totalRevenue: revenue,
    };
  }, [orders, currentShop]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCreateNewShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopSlug || !newShopName) return;
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newShopSlug,
          name: newShopName,
          ownerEmail: user?.email || '',
          upiId: newShopUpi || 'shop@upi',
          phone: newShopPhone,
          address: newShopAddress,
        }),
      });
      const data = await res.json();
      if (data.tenant) {
        setShowCreateShop(false);
        await loadShops();
        setCurrentShopSlug(data.tenant.slug);
      }
    } catch {}
  };

  const handleSaveSettings = async () => {
    if (!currentShop) return;
    setSettingsSaving(true);
    try {
      const res = await fetch(`/api/tenants/${currentShop.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentShop),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } catch {}
    finally {
      setSettingsSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesSearch =
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customerPhone && ord.customerPhone.includes(searchQuery));
      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return ord.status === 'COMPLETED';
      if (statusFilter === 'PENDING') return ['PENDING', 'CREATED', 'AWAITING_PAYMENT'].includes(ord.status);
      if (statusFilter === 'FAILED') return ord.status === 'FAILED';
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // If not logged in, render strict black & white authentication modal
  if (!user && !authLoading) {
    return (
      <div className="page-wrapper">
        <div className="portal-container" style={{ maxWidth: 440, padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="brand-icon-box" style={{ margin: '0 auto 12px' }}>
              <Printer size={22} strokeWidth={2.4} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Shop Owner Portal</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Sign in to access your shop queue, hardware dispatch, &amp; rates
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="owner@yourshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                {authError}
              </div>
            )}

            <button className="btn" type="submit" disabled={authSubmitting} style={{ marginTop: 8 }}>
              {authSubmitting ? 'Authenticating...' : authMode === 'signin' ? 'Sign In to Shop' : 'Create Shop Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, fontSize: 12 }}>
            <button
              onClick={() => setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              style={{ textDecoration: 'underline', color: 'var(--text-secondary)' }}
            >
              {authMode === 'signin' ? "Don't have an account? Register Shop" : 'Already registered? Sign In'}
            </button>
            <Link href="/landing" style={{ textDecoration: 'underline', color: 'var(--text-tertiary)' }}>
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header-row">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Printer size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="admin-brand-title">{currentShop?.name || 'Shop Control Center'}</div>
            <div className="admin-brand-subtitle">
              Shop URL: <code>/shop/{currentShopSlug}</code> &middot; Plan: <strong>{currentShop?.plan || 'PRO'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Shop Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={14} strokeWidth={2.4} />
            <select
              className="form-select"
              style={{ padding: '6px 12px', fontSize: 12, height: 32, width: 'auto' }}
              value={currentShopSlug}
              onChange={(e) => setCurrentShopSlug(e.target.value)}
            >
              {shops.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>
            <button
              className="btn-mini"
              onClick={() => setShowCreateShop(true)}
              title="Add New Shop Branch"
            >
              <PlusCircle size={12} strokeWidth={2.5} /> New Shop
            </button>
          </div>

          <Link
            href={`/shop/${currentShopSlug}`}
            className="btn-mini"
            style={{ textDecoration: 'none' }}
            target="_blank"
          >
            Customer Kiosk <ExternalLink size={11} strokeWidth={2.5} />
          </Link>

          <Link
            href={`/shop/${currentShopSlug}/standee`}
            className="btn-mini"
            style={{ textDecoration: 'none' }}
            target="_blank"
          >
            QR Standee <QrCode size={11} strokeWidth={2.5} />
          </Link>

          <button className="btn-mini" onClick={() => signOut()} title="Sign Out">
            <LogOut size={12} strokeWidth={2.5} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`admin-tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          <BarChart3 size={14} strokeWidth={2.4} /> Overview
        </button>
        <button
          className={`admin-tab-btn ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          <ListOrdered size={14} strokeWidth={2.4} /> Orders ({orders.length})
        </button>
        <button
          className={`admin-tab-btn ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <SlidersHorizontal size={14} strokeWidth={2.4} /> Rates &amp; UPI
        </button>
        <button
          className={`admin-tab-btn ${tab === 'agent' ? 'active' : ''}`}
          onClick={() => setTab('agent')}
        >
          <Server size={14} strokeWidth={2.4} /> Print Agent Setup
        </button>
      </div>

      {/* TAB 1 — OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box-label">
                <Store size={12} strokeWidth={2.4} /> Active Shop Counter
              </div>
              <div style={{ margin: '6px 0' }}>
                <span className="agent-state-badge online">{currentShopSlug.toUpperCase()}</span>
              </div>
              <div className="stat-box-sub">{currentShop?.name}</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">
                <Banknote size={12} strokeWidth={2.4} /> Revenue (Today)
              </div>
              <div className="stat-box-value">INR {Number(stats.totalRevenue).toFixed(2)}</div>
              <div className="stat-box-sub">Direct to UPI: {currentShop?.upiId}</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">
                <Activity size={12} strokeWidth={2.4} /> Orders Received
              </div>
              <div className="stat-box-value">{stats.ordersToday}</div>
              <div className="stat-box-sub">Via customer mobile kiosk</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">
                <Layers size={12} strokeWidth={2.4} /> Queue Distribution
              </div>
              <div className="queue-chips-wrap">
                <span className="queue-chip">
                  <Clock size={11} strokeWidth={2.5} /> {stats.queuedJobs} Queued
                </span>
                <span className="queue-chip">
                  <CircleDot size={11} strokeWidth={2.5} /> {stats.printingJobs} Printing
                </span>
                <span className="queue-chip">
                  <Check size={11} strokeWidth={3} /> {stats.completedJobs} Done
                </span>
              </div>
            </div>
          </div>

          <div className="table-panel">
            <div className="table-panel-header">
              <div className="table-panel-title">
                <ListOrdered size={16} strokeWidth={2.4} /> Recent Print Submissions for {currentShop?.name}
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Specs</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        No orders recorded yet for {currentShop?.name}. Place a test order from <code>/shop/{currentShopSlug}</code>.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 10).map((ord) => (
                      <tr key={ord.id}>
                        <td className="td-mono">{ord.orderNumber}</td>
                        <td>{ord.customerPhone || 'Walk-in'}</td>
                        <td className="td-mono">INR {Number(ord.totalAmount).toFixed(2)}</td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {ord.copies}x &middot; {ord.colourMode === 'MONOCHROME' ? 'B&W' : 'Color'} &middot; {ord.paperSize}
                        </td>
                        <td>
                          <span className={`badge-clean ${['COMPLETED', 'PAID'].includes(ord.status) ? 'filled' : 'subtle'}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2 — ORDERS */}
      {tab === 'orders' && (
        <div className="table-panel">
          <div className="table-panel-header">
            <div className="table-panel-title">
              <ListOrdered size={16} strokeWidth={2.4} /> Master Order Registry &middot; {currentShop?.name}
            </div>
          </div>
          <div className="table-filter-bar">
            <div className="table-search-input-wrap">
              <Search size={14} className="table-search-icon" strokeWidth={2.4} />
              <input
                className="table-search-input"
                placeholder="Search order ID or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="table-filter-pills">
              {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  className={`filter-pill-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Phone</th>
                  <th>Total Amount</th>
                  <th>File Name</th>
                  <th>Pages</th>
                  <th>Specs</th>
                  <th>Status</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">No matching orders.</td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="td-mono">{ord.orderNumber}</td>
                      <td>{ord.customerPhone || '—'}</td>
                      <td className="td-mono">INR {Number(ord.totalAmount).toFixed(2)}</td>
                      <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ord.filename}</td>
                      <td>{ord.pageCount} pgs</td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {ord.copies}x &middot; {ord.colourMode === 'MONOCHROME' ? 'B&W' : 'Color'} &middot; {ord.paperSize}
                      </td>
                      <td>
                        <span className={`badge-clean ${ord.status === 'COMPLETED' ? 'filled' : 'subtle'}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        {new Date(ord.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 — SETTINGS */}
      {tab === 'settings' && currentShop && (
        <div className="pricing-section-container">
          <div className="table-panel" style={{ marginBottom: 20 }}>
            <div className="table-panel-header">
              <div className="table-panel-title">
                <QrCode size={16} strokeWidth={2.4} /> Shop Identity &amp; UPI Destination
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Shop Display Name</label>
                  <input
                    className="form-input"
                    value={currentShop.name}
                    onChange={(e) => setCurrentShop({ ...currentShop, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Shop UPI ID (Receives 100% of Payments)</label>
                  <input
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    value={currentShop.upiId}
                    onChange={(e) => setCurrentShop({ ...currentShop, upiId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Shop Address / Counter Location</label>
                  <input
                    className="form-input"
                    value={currentShop.address || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Support Phone</label>
                  <input
                    className="form-input"
                    value={currentShop.phone || ''}
                    onChange={(e) => setCurrentShop({ ...currentShop, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="table-panel">
            <div className="table-panel-header">
              <div className="table-panel-title">
                <Banknote size={16} strokeWidth={2.4} /> Rate Card for {currentShop.name}
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div className="pricing-grid-clean">
                {[
                  { key: 'A4_MONOCHROME', label: 'A4 · Black & White' },
                  { key: 'A4_COLOUR', label: 'A4 · Full Color' },
                  { key: 'A3_MONOCHROME', label: 'A3 · Black & White' },
                  { key: 'A3_COLOUR', label: 'A3 · Full Color' },
                ].map(({ key, label }) => (
                  <div className="pricing-card-clean" key={key}>
                    <div className="pricing-header-label">
                      <SlidersHorizontal size={13} strokeWidth={2.4} /> {label}
                    </div>
                    <div className="pricing-input-group">
                      <span className="pricing-prefix">INR</span>
                      <input
                        className="pricing-field"
                        type="number"
                        step="0.5"
                        value={currentShop.pricing?.[key] ?? 2}
                        onChange={(e) =>
                          setCurrentShop({
                            ...currentShop,
                            pricing: {
                              ...currentShop.pricing,
                              [key]: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                      <span className="pricing-unit">/ page</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <button className="btn" onClick={handleSaveSettings} disabled={settingsSaving} style={{ maxWidth: 240 }}>
                  {settingsSaved ? (
                    <><Check size={16} strokeWidth={3} /> Changes Saved</>
                  ) : settingsSaving ? (
                    'Updating...'
                  ) : (
                    <><Save size={16} strokeWidth={2.4} /> Save Shop Settings</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — AGENT SETUP */}
      {tab === 'agent' && currentShop && (
        <div className="table-panel">
          <div className="table-panel-header">
            <div className="table-panel-title">
              <Server size={16} strokeWidth={2.4} /> Hardware Print Agent Daemon Setup (Windows &amp; macOS)
            </div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Connect the physical counter computer (Mac or Windows PC) hooked up to your printer. This agent pulls jobs strictly for <strong>{currentShop.name} ({currentShopSlug})</strong>.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Shop Agent Secret Token</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="form-input"
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  value={currentShop.agentSecretKey || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63'}
                />
                <button
                  className="btn-mini"
                  onClick={() => {
                    navigator.clipboard.writeText(currentShop.agentSecretKey || '');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                >
                  {copiedKey ? <Check size={13} strokeWidth={3} /> : <Copy size={13} strokeWidth={2.4} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="instructions-panel">
              <div className="instruction-step">
                <div className="instruction-badge">macOS / Linux</div>
                <div className="instruction-content">
                  <h4>Run macOS / CUPS Agent</h4>
                  <div className="code-snippet-box">
                    <code>TENANT_ID="{currentShopSlug}" BACKEND_URL="https://printr.ruthwikreddy.live" PRINT_AGENT_AUTH_SECRET="{currentShop.agentSecretKey}" node print-agent/agent.js</code>
                  </div>
                </div>
              </div>

              <div className="instruction-step">
                <div className="instruction-badge">Windows PC</div>
                <div className="instruction-content">
                  <h4>Run Windows PowerShell Agent</h4>
                  <div className="code-snippet-box">
                    <code>$env:TENANT_ID="{currentShopSlug}"; $env:BACKEND_URL="https://printr.ruthwikreddy.live"; $env:PRINT_AGENT_AUTH_SECRET="{currentShop.agentSecretKey}"; node print-agent/agent.js</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Shop Modal */}
      {showCreateShop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="portal-container" style={{ maxWidth: 500, padding: 32, background: '#fff' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Add New Shop Branch</h3>
            <form onSubmit={handleCreateNewShop} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Shop Name</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. City Xerox Center"
                  value={newShopName}
                  onChange={(e) => {
                    setNewShopName(e.target.value);
                    if (!newShopSlug) {
                      setNewShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                />
              </div>
              <div>
                <label className="form-label">Shop URL Slug (Unique Identifier)</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. city-xerox"
                  value={newShopSlug}
                  onChange={(e) => setNewShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
              <div>
                <label className="form-label">UPI ID for Direct Payments</label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. cityxerox@okaxis"
                  value={newShopUpi}
                  onChange={(e) => setNewShopUpi(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Shop Address</label>
                <input
                  className="form-input"
                  placeholder="e.g. Near University Gate #2"
                  value={newShopAddress}
                  onChange={(e) => setNewShopAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn" type="submit">Create Shop Branch</button>
                <button className="btn-mini" type="button" onClick={() => setShowCreateShop(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
