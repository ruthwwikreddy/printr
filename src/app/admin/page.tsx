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
}

interface Order {
  id: string;
  orderNumber: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  printJobs: PrintJob[];
}

function getOrderBadge(status: string) {
  const filled = ['COMPLETED', 'PAID', 'PRINTING'];
  const pending = ['PENDING', 'QUEUED'];
  if (filled.includes(status)) return 'badge-clean filled';
  if (pending.includes(status)) return 'badge-clean dashed';
  return 'badge-clean subtle';
}

function getJobBadge(status: string) {
  const filled = ['COMPLETED', 'PROCESSING'];
  const pending = ['PENDING'];
  if (filled.includes(status)) return 'badge-clean filled';
  if (pending.includes(status)) return 'badge-clean dashed';
  return 'badge-clean subtle';
}

type AdminTab = 'overview' | 'orders' | 'pricing';
type FilterStatus = 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED';

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const [upiId, setUpiId] = useState('shopowner@upi');
  const [shopName, setShopName] = useState('PrintShop');
  const [pricing, setPricing] = useState({
    A4_MONOCHROME: 2,
    A4_COLOUR: 10,
    A3_MONOCHROME: 5,
    A3_COLOUR: 20,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setOrders(data.orders || []);
      }
    } catch {}
    setLoading(false);
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setUpiId(data.settings.upiId || 'shopowner@upi');
        setShopName(data.settings.shopName || 'PrintShop');
        if (data.settings.pricing) {
          setPricing({
            A4_MONOCHROME: data.settings.pricing.A4_MONOCHROME ?? 2,
            A4_COLOUR: data.settings.pricing.A4_COLOUR ?? 10,
            A3_MONOCHROME: data.settings.pricing.A3_MONOCHROME ?? 5,
            A3_COLOUR: data.settings.pricing.A3_COLOUR ?? 20,
          });
        }
      }
    } catch {
      setSettingsError('Could not load settings from cloud.');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();

    // 1. Instant Real-time Cloud Firestore listener for admin orders
    let unsubscribeFirestore: (() => void) | null = null;
    import('@/lib/firestoreService').then(({ subscribeToAllFirestoreOrders }) => {
      unsubscribeFirestore = subscribeToAllFirestoreOrders((fsOrders) => {
        if (fsOrders && fsOrders.length > 0) {
          const mapped: Order[] = fsOrders.map((fso) => ({
            id: fso.id,
            orderNumber: fso.orderNumber,
            customerPhone: fso.customerPhone || undefined,
            totalAmount: fso.totalAmount,
            status: fso.status,
            createdAt: fso.createdAt,
            printJobs: [
              {
                id: fso.id,
                status: fso.jobStatus || 'PENDING',
                printerName: fso.printerName || undefined,
                errorLog: fso.errorLog || undefined,
                copies: fso.copies || 1,
                colourMode: fso.colourMode || 'MONOCHROME',
                paperSize: fso.paperSize || 'A4',
                duplexMode: fso.duplexMode || 'SIMPLEX',
              },
            ],
          }));
          setOrders(mapped);
        }
      });
    }).catch(() => {});

    // 2. Periodic polling interval
    const interval = setInterval(fetchData, 5000);
    return () => {
      clearInterval(interval);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const handleRetry = async (jobId: string) => {
    if (!confirm('Retry this print job now?')) return;
    await fetch('/api/admin/jobs/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    fetchData();
  };

  const handleCancel = async (jobId: string) => {
    if (!confirm('Cancel this print job? This cannot be undone.')) return;
    await fetch('/api/admin/jobs/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    fetchData();
  };

  const handleSavePricing = async () => {
    setPricingSaving(true);
    setSettingsError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId, shopName, pricing }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 2500);
    } catch (e: any) {
      setSettingsError(e?.message || 'Failed to save settings.');
    } finally {
      setPricingSaving(false);
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
      if (statusFilter === 'PENDING') return ['PENDING', 'CREATED', 'QUEUED'].includes(ord.status);
      if (statusFilter === 'FAILED') return ord.status === 'FAILED';
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
          <div className="status-avatar spinning" style={{ width: 44, height: 44 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Loading control center</span>
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
            <div className="admin-brand-title">PrintShop Control Center</div>
            <div className="admin-brand-subtitle">Real-time queue monitoring & automated dispatch</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/landing"
            className="btn-mini"
            style={{ textDecoration: 'none' }}
          >
            Product &amp; Setup Guide
          </Link>

          <Link
            href="/"
            className="btn-mini"
            style={{ textDecoration: 'none' }}
            target="_blank"
          >
            Customer Kiosk <ExternalLink size={12} strokeWidth={2.5} />
          </Link>

          <a
            href="https://www.ruthwikreddy.live/"
            className="btn-mini"
            style={{ textDecoration: 'none', fontWeight: 600 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            ruthwikreddy.live &nearr;
          </a>

          <div className="admin-tabs">
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
              <ListOrdered size={14} strokeWidth={2.4} /> Orders
            </button>
            <button
              className={`admin-tab-btn ${tab === 'pricing' ? 'active' : ''}`}
              onClick={() => setTab('pricing')}
            >
              <Banknote size={14} strokeWidth={2.4} /> Rates
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box-label">
                <Server size={12} strokeWidth={2.4} /> Print Agent
              </div>
              <div style={{ margin: '6px 0' }}>
                <span className={`agent-state-badge ${stats.isOnline ? 'online' : 'offline'}`}>
                  {stats.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="stat-box-sub">{stats.agentName}</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">
                <Banknote size={12} strokeWidth={2.4} /> Revenue (Today)
              </div>
              <div className="stat-box-value">INR {Number(stats.totalRevenue || 0).toFixed(2)}</div>
              <div className="stat-box-sub">From settled print orders</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-label">
                <Activity size={12} strokeWidth={2.4} /> Total Orders
              </div>
              <div className="stat-box-value">{stats.ordersToday}</div>
              <div className="stat-box-sub">Inbound customer uploads</div>
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
                <span className="queue-chip">
                  <X size={11} strokeWidth={3} /> {stats.failedJobs} Failed
                </span>
              </div>
            </div>
          </div>

          <div className="table-panel">
            <div className="table-panel-header">
              <div className="table-panel-title">
                <ListOrdered size={16} strokeWidth={2.4} /> Recent Submissions
              </div>
              <button className="btn-mini" onClick={fetchData}>
                <RefreshCw size={11} strokeWidth={2.5} /> Refresh
              </button>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer Phone</th>
                    <th>Total Amount</th>
                    <th>Payment Status</th>
                    <th>Print Status</th>
                    <th>Received At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        No orders recorded yet. Share the portal to begin receiving jobs.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 10).map((ord) => {
                      const job = ord.printJobs?.[0];
                      return (
                        <tr key={ord.id}>
                          <td className="td-mono">{ord.orderNumber}</td>
                          <td>{ord.customerPhone || <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>}</td>
                          <td className="td-mono">INR {Number(ord.totalAmount).toFixed(2)}</td>
                          <td><span className={getOrderBadge(ord.status)}>{ord.status}</span></td>
                          <td>
                            {job ? (
                              <span className={getJobBadge(job.status)}>{job.status}</span>
                            ) : (
                              <span className="badge-clean subtle">&mdash;</span>
                            )}
                          </td>
                          <td>
                            {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td>
                            {job && job.status === 'FAILED' && (
                              <button className="btn-mini dark" onClick={() => handleRetry(job.id)}>
                                <RotateCw size={11} strokeWidth={2.5} /> Retry
                              </button>
                            )}
                            {job && job.status === 'PENDING' && (
                              <button className="btn-mini" onClick={() => handleCancel(job.id)}>
                                <X size={11} strokeWidth={2.8} /> Cancel
                              </button>
                            )}
                            {job && job.status === 'COMPLETED' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700 }}>
                                <CheckCircle2 size={13} strokeWidth={2.5} /> Printed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ALL ORDERS TAB */}
      {tab === 'orders' && (
        <div className="table-panel">
          <div className="table-panel-header">
            <div className="table-panel-title">
              <ListOrdered size={16} strokeWidth={2.4} /> Master Order Registry
            </div>
            <button className="btn-mini" onClick={fetchData}>
              <RefreshCw size={11} strokeWidth={2.5} /> Refresh
            </button>
          </div>

          <div className="table-filter-bar">
            <div className="table-search-input-wrap">
              <Search size={14} className="table-search-icon" strokeWidth={2.4} />
              <input
                className="table-search-input"
                placeholder="Search by order number or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="table-filter-pills">
              {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as FilterStatus[]).map((st) => (
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
                  <th>Specifications</th>
                  <th>Payment Status</th>
                  <th>Print Status</th>
                  <th>Target Printer</th>
                  <th>Dispatch Log</th>
                  <th>Date &amp; Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'No orders match your filter criteria.'
                        : 'No orders recorded in system.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const job = ord.printJobs?.[0];
                    return (
                      <tr key={ord.id}>
                        <td className="td-mono">{ord.orderNumber}</td>
                        <td>{ord.customerPhone || <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>}</td>
                        <td className="td-mono">INR {Number(ord.totalAmount).toFixed(2)}</td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {job
                            ? `${job.copies}x · ${job.colourMode === 'MONOCHROME' ? 'B&W' : 'Color'} · ${job.paperSize} · ${job.duplexMode === 'SIMPLEX' ? '1-Sided' : '2-Sided'}`
                            : '—'}
                        </td>
                        <td><span className={getOrderBadge(ord.status)}>{ord.status}</span></td>
                        <td>{job ? <span className={getJobBadge(job.status)}>{job.status}</span> : '—'}</td>
                        <td style={{ fontSize: 11.5 }}>{job?.printerName || <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job?.errorLog || <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>}
                        </td>
                        <td>
                          {new Date(ord.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          {job && job.status === 'FAILED' && (
                            <button className="btn-mini dark" onClick={() => handleRetry(job.id)}>
                              <RotateCw size={11} strokeWidth={2.5} /> Retry
                            </button>
                          )}
                          {job && job.status === 'PENDING' && (
                            <button className="btn-mini" onClick={() => handleCancel(job.id)}>
                              <X size={11} strokeWidth={2.8} /> Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRICING TAB */}
      {tab === 'pricing' && (
        <div className="pricing-section-container">

          {/* UPI & Shop Settings */}
          <div className="table-panel" style={{ marginBottom: 20 }}>
            <div className="table-panel-header">
              <div className="table-panel-title">
                <QrCode size={16} strokeWidth={2.4} /> Payment Settings
              </div>
              {settingsLoading && (
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Loading from cloud...</span>
              )}
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                Your UPI ID is embedded in the payment QR code shown to customers. Changes take effect immediately on the next order.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                    <QrCode size={12} strokeWidth={2.5} style={{ display: 'inline', marginRight: 5 }} />
                    UPI ID
                  </label>
                  <input
                    className="form-input pricing-field"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={settingsLoading}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    e.g. ruthwik@okaxis, shop@ybl, 9876543210@paytm
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                    <Store size={12} strokeWidth={2.5} style={{ display: 'inline', marginRight: 5 }} />
                    Shop Name (shown in QR)
                  </label>
                  <input
                    className="form-input pricing-field"
                    style={{ width: '100%', fontSize: 13 }}
                    placeholder="PrintShop"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    disabled={settingsLoading}
                  />
                </div>
              </div>

              {/* Live QR Preview */}
              {upiId && (
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>LIVE QR PREVIEW</div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, display: 'inline-block', background: '#fff' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&cu=INR`)}`}
                        alt="UPI QR Preview"
                        style={{ display: 'block', width: 120, height: 120 }}
                      />
                    </div>
                  </div>
                  <div style={{ paddingTop: 28 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{upiId}</strong><br />
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Customers will scan this to pay</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="table-panel">
            <div className="table-panel-header">
              <div className="table-panel-title">
                <Banknote size={16} strokeWidth={2.4} /> Rate Card Configuration
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                Configure per-page unit rates for all supported paper formats and color modes. Updated pricing applies live across the customer portal.
              </p>

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
                        min="0"
                        step="0.5"
                        value={pricing[key as keyof typeof pricing]}
                        onChange={(e) =>
                          setPricing((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))
                        }
                        disabled={settingsLoading}
                      />
                      <span className="pricing-unit">/ page</span>
                    </div>
                  </div>
                ))}
              </div>

              {settingsError && (
                <div style={{ marginTop: 16, fontSize: 12.5, color: '#c0392b', fontWeight: 500 }}>
                  {settingsError}
                </div>
              )}

              <div style={{ marginTop: 28 }}>
                <button
                  className="btn"
                  onClick={handleSavePricing}
                  disabled={pricingSaving || settingsLoading}
                  style={{ maxWidth: 280 }}
                >
                  {pricingSaved ? (
                    <><Check size={16} strokeWidth={3} /> Settings Saved</>
                  ) : pricingSaving ? (
                    <><RefreshCw size={16} className="spin" strokeWidth={2.5} /> Saving to Cloud</>
                  ) : (
                    <><Save size={16} strokeWidth={2.5} /> Save UPI ID & Rates</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
