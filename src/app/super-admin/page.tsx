'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Server,
  Building,
  Activity,
  Layers,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { subscribeToAllFirestoreOrders, FirestoreOrder } from '@/lib/firestoreService';

export default function SuperAdminPlatform() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (data.tenants) setTenants(data.tenants);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();

    const unsubscribe = subscribeToAllFirestoreOrders((allOrders) => {
      setOrders(allOrders);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const totalRevenue = orders
    .filter((o) => ['PAID', 'PRINTING', 'COMPLETED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ownerEmail && t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-layout">
      {/* Super Admin Topbar */}
      <div className="admin-header-row">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <ShieldCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="admin-brand-title">Printr Platform Master Dashboard</div>
            <div className="admin-brand-subtitle">Cross-Tenant Global Oversight &amp; Network Health</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" className="btn-mini" style={{ textDecoration: 'none' }}>
            Shop Owner Dashboard &rarr;
          </Link>
          <a
            href="https://www.ruthwikreddy.live/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mini"
            style={{ fontWeight: 600, textDecoration: 'none' }}
          >
            ruthwikreddy.live &nearr;
          </a>
        </div>
      </div>

      {/* Global SaaS Telemetry */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
        <div className="stat-box">
          <div className="stat-box-label">
            <Building size={12} strokeWidth={2.4} /> Total Registered Shops
          </div>
          <div className="stat-box-value">{tenants.length}</div>
          <div className="stat-box-sub">Across campus &amp; commercial zones</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">
            <Activity size={12} strokeWidth={2.4} /> Platform Orders
          </div>
          <div className="stat-box-value">{orders.length}</div>
          <div className="stat-box-sub">Total customer uploads logged</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">
            <Layers size={12} strokeWidth={2.4} /> Total Platform Volume
          </div>
          <div className="stat-box-value">INR {totalRevenue.toFixed(2)}</div>
          <div className="stat-box-sub">Direct UPI merchant settlement</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-label">
            <Server size={12} strokeWidth={2.4} /> Cloud Agents
          </div>
          <div className="stat-box-value">{tenants.length}</div>
          <div className="stat-box-sub">Windows &amp; macOS active daemons</div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="table-panel">
        <div className="table-panel-header">
          <div className="table-panel-title">
            <Building size={16} strokeWidth={2.4} /> All Printing Shop Tenants
          </div>
          <button className="btn-mini" onClick={fetchTenants}>
            <RefreshCw size={11} strokeWidth={2.5} /> Refresh Shops
          </button>
        </div>

        <div className="table-filter-bar">
          <div className="table-search-input-wrap" style={{ maxWidth: 400 }}>
            <Search size={14} className="table-search-icon" strokeWidth={2.4} />
            <input
              className="table-search-input"
              placeholder="Search by shop name, slug, or owner email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Slug (URL)</th>
                <th>Owner Email</th>
                <th>UPI Destination</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">No shops found.</td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.slug}>
                    <td><strong>{t.name}</strong></td>
                    <td className="td-mono">
                      <Link href={`/shop/${t.slug}`} target="_blank" style={{ textDecoration: 'underline' }}>
                        /shop/{t.slug}
                      </Link>
                    </td>
                    <td>{t.ownerEmail || '—'}</td>
                    <td className="td-mono">{t.upiId}</td>
                    <td><span className="badge-clean filled">{t.plan || 'FREE'}</span></td>
                    <td><span className="agent-state-badge online">{t.status || 'ACTIVE'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link
                          href={`/shop/${t.slug}`}
                          target="_blank"
                          className="btn-mini"
                          style={{ textDecoration: 'none' }}
                        >
                          Customer Kiosk <ExternalLink size={10} strokeWidth={2.4} />
                        </Link>
                        <Link
                          href={`/shop/${t.slug}/standee`}
                          target="_blank"
                          className="btn-mini"
                          style={{ textDecoration: 'none' }}
                        >
                          Standee
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
