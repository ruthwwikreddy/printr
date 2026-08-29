'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Printer,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Minus,
  Plus,
  ArrowRight,
  Loader2,
  Info,
  AlertTriangle,
  Receipt,
  Hash,
  CreditCard,
  Clock,
  ScanLine,
  Layers,
  Sparkles,
  MapPin,
  Phone,
  Store,
} from 'lucide-react';
import Link from 'next/link';

type Step = 'upload' | 'configure' | 'payment' | 'status';
type ColourMode = 'MONOCHROME' | 'COLOUR';
type PaperSize = 'A4' | 'A3';
type DuplexMode = 'SIMPLEX' | 'DUPLEX';

interface FileDetails {
  filename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
}

interface OrderInfo {
  orderId: string;
  orderNumber: string;
  amount: number;
  gatewayOrderId: string;
}

interface OrderStatus {
  orderNumber: string;
  status: string;
  totalAmount: number;
  jobStatus: string;
  printer: string | null;
  error: string | null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ShopCustomerPortal({ params }: { params: { slug: string } }) {
  const shopSlug = params.slug.toLowerCase();

  const [shop, setShop] = useState<{
    name: string;
    upiId: string;
    phone?: string;
    address?: string;
    pricing: Record<string, number>;
    branding?: { bannerText?: string; instructions?: string };
  } | null>(null);

  const [loadingShop, setLoadingShop] = useState(true);
  const [shopNotFound, setShopNotFound] = useState(false);

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  const [copies, setCopies] = useState(1);
  const [colourMode, setColourMode] = useState<ColourMode>('MONOCHROME');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('SIMPLEX');
  const [pageRange, setPageRange] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch shop metadata by slug
  useEffect(() => {
    fetch(`/api/tenants/${shopSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.tenant) {
          setShop(data.tenant);
        } else {
          setShopNotFound(true);
        }
      })
      .catch(() => setShopNotFound(true))
      .finally(() => setLoadingShop(false));
  }, [shopSlug]);

  const getPricePerPage = (paper: PaperSize, colour: ColourMode) => {
    if (!shop?.pricing) return 2;
    const key = `${paper}_${colour}`;
    return shop.pricing[key] ?? 2;
  };

  const estimatedPrice = fileDetails
    ? getPricePerPage(paperSize, colourMode) * fileDetails.pageCount * copies
    : 0;

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFile = async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG files are supported.', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('File must be under 50 MB.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 85));
    }, 200);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      clearInterval(progressInterval);

      if (data.error) {
        showToast(data.error, 'error');
        setIsUploading(false);
        return;
      }
      setUploadProgress(100);
      setTimeout(() => {
        setFileDetails(data);
        setStep('configure');
        setIsUploading(false);
      }, 350);
    } catch {
      clearInterval(progressInterval);
      showToast('Upload failed. Please check your connection.', 'error');
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCreateOrder = async () => {
    if (!fileDetails) return;
    setIsCreatingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: shopSlug,
          filename: fileDetails.filename,
          filePath: fileDetails.filePath,
          mimeType: fileDetails.mimeType,
          fileSize: fileDetails.fileSize,
          pageCount: fileDetails.pageCount,
          copies,
          colourMode,
          paperSize,
          duplexMode,
          pageRange: pageRange || null,
          customerPhone: customerPhone || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderInfo(data);
        setStep('payment');
      } else {
        showToast(data.error || 'Failed to create order.', 'error');
      }
    } catch {
      showToast('Server error. Please try again.', 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePay = async () => {
    if (!orderInfo) return;
    setIsPaying(true);
    try {
      const res = await fetch('/api/payments/mock-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderInfo.orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('status');
        pollStatus(orderInfo.orderId);
      } else {
        showToast('Payment verification failed. Please try again.', 'error');
      }
    } catch {
      showToast('Payment network error.', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  const pollStatus = useCallback((orderId: string) => {
    let unsubscribeFirestore: (() => void) | null = null;
    import('@/lib/firestoreService').then(({ subscribeToFirestoreOrder }) => {
      unsubscribeFirestore = subscribeToFirestoreOrder(orderId, (fsOrder) => {
        if (fsOrder) {
          setOrderStatus({
            orderNumber: fsOrder.orderNumber,
            status: fsOrder.status,
            totalAmount: fsOrder.totalAmount,
            jobStatus: fsOrder.jobStatus,
            printer: fsOrder.printerName || null,
            error: fsOrder.errorLog || null,
          });
        }
      });
    }).catch(() => {});

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();
        setOrderStatus(data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED' || attempts > 60) {
          clearInterval(interval);
          if (unsubscribeFirestore) unsubscribeFirestore();
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(interval);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const getPipelineState = (statusLabel: string) => {
    const s = orderStatus?.status || '';
    const j = orderStatus?.jobStatus || '';
    switch (statusLabel) {
      case 'payment':
        return 'done';
      case 'queued':
        return ['PAID', 'PRINTING', 'QUEUED', 'COMPLETED', 'FAILED'].includes(s) ? 'done' : 'active';
      case 'printing':
        if (j === 'PROCESSING') return 'active';
        if (j === 'COMPLETED') return 'done';
        if (j === 'FAILED') return 'error';
        return 'pending';
      case 'ready':
        return s === 'COMPLETED' ? 'done' : 'pending';
      default:
        return 'pending';
    }
  };

  if (loadingShop) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 14 }}>
          <div className="status-avatar spinning" style={{ width: 44, height: 44 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Loading shop portal...</span>
        </div>
      </div>
    );
  }

  if (shopNotFound || !shop) {
    return (
      <div className="page-wrapper">
        <div className="portal-container" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Store size={44} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Print Shop Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            The requested shop link <code>/shop/{shopSlug}</code> has not been registered yet or is inactive.
          </p>
          <Link href="/landing" className="btn-mini" style={{ display: 'inline-flex', padding: '10px 20px', textDecoration: 'none' }}>
            Explore Printr Platform &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const qrUrl = orderInfo
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.name)}&am=${orderInfo.amount}&cu=INR&tn=${orderInfo.orderNumber}`)}`
    : '';

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'configure', label: 'Configure' },
    { key: 'payment', label: 'Payment' },
    { key: 'status', label: 'Status' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const progressPercent = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="page-wrapper">
      <div className="portal-container">
        {/* Header */}
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
            <div className="brand-row" style={{ margin: 0 }}>
              <div className="brand-icon-box">
                <Printer size={18} strokeWidth={2.4} />
              </div>
              <h1 className="brand-title">{shop.name}</h1>
            </div>
            <Link
              href={`/shop/${shopSlug}/standee`}
              target="_blank"
              className="btn-mini"
              style={{ fontSize: 11, padding: '4px 8px', textDecoration: 'none' }}
              title="Print QR Standee for this Shop Counter"
            >
              <ScanLine size={12} strokeWidth={2.5} /> Standee
            </Link>
          </div>
          <p className="subtitle">{shop.branding?.bannerText || 'Instant Automated Document Printing'}</p>
          {shop.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>
              <MapPin size={12} strokeWidth={2.4} /> {shop.address}
            </div>
          )}
        </div>

        {/* Steps Bar */}
        <div className="steps-bar-container">
          <div className="steps-nav">
            <div className="steps-track">
              <div
                className="steps-track-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {steps.map((s, i) => {
              const isDone = currentStepIndex > i;
              const isActive = step === s.key;
              return (
                <div
                  key={s.key}
                  className={`step-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                >
                  <div className="step-bubble">
                    {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className="step-text">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="card-body">
          {/* STEP 1 — UPLOAD */}
          {step === 'upload' && (
            <div className="upload-zone-wrapper">
              <div
                className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
                <div className="upload-icon-circle">
                  <UploadCloud size={24} strokeWidth={2} />
                </div>
                {isUploading ? (
                  <div className="upload-progress-container">
                    <div className="progress-header">
                      <span>Analyzing document</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="upload-primary-text">Select or drag document here</div>
                    <div className="upload-secondary-text">PDF, JPG, or PNG with automatic page count detection</div>
                    <div className="upload-supported-badges">
                      <span className="file-type-pill">PDF</span>
                      <span className="file-type-pill">JPG</span>
                      <span className="file-type-pill">PNG</span>
                      <span className="file-type-pill">MAX 50MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — CONFIGURE */}
          {step === 'configure' && fileDetails && (
            <>
              <div className="file-preview-card">
                <div className="file-preview-icon">
                  {fileDetails.mimeType === 'application/pdf'
                    ? <FileText size={22} strokeWidth={2.2} />
                    : <ImageIcon size={22} strokeWidth={2.2} />}
                </div>
                <div className="file-preview-meta">
                  <div className="file-preview-name">{fileDetails.filename}</div>
                  <div className="file-preview-details">
                    <span>{fileDetails.pageCount} {fileDetails.pageCount === 1 ? 'Page' : 'Pages'}</span>
                    <span>&middot;</span>
                    <span>{formatFileSize(fileDetails.fileSize)}</span>
                  </div>
                </div>
                <button
                  className="file-change-btn"
                  onClick={() => { setFileDetails(null); setStep('upload'); }}
                >
                  Change
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Color Mode</label>
                  <select
                    className="form-select"
                    value={colourMode}
                    onChange={(e) => setColourMode(e.target.value as ColourMode)}
                  >
                    <option value="MONOCHROME">Black &amp; White (INR {getPricePerPage(paperSize, 'MONOCHROME')}/pg)</option>
                    <option value="COLOUR">Full Color (INR {getPricePerPage(paperSize, 'COLOUR')}/pg)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Paper Size</label>
                  <select
                    className="form-select"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                  >
                    <option value="A4">A4 (Standard Document)</option>
                    <option value="A3">A3 (Large Print)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Copies</label>
                  <div className="copies-stepper">
                    <button
                      className="stepper-btn"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      disabled={copies <= 1}
                      aria-label="Decrease copies"
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <span className="stepper-value">{copies}</span>
                    <button
                      className="stepper-btn"
                      onClick={() => setCopies((c) => Math.min(99, c + 1))}
                      aria-label="Increase copies"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sides</label>
                  <select
                    className="form-select"
                    value={duplexMode}
                    onChange={(e) => setDuplexMode(e.target.value as DuplexMode)}
                  >
                    <option value="SIMPLEX">Single-Sided</option>
                    <option value="DUPLEX">Double-Sided</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Page Range (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="All pages or custom (e.g. 1-5, 8, 11-13)"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Mobile Number (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="For order tracking & receipt"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    type="tel"
                  />
                </div>
              </div>

              <div className="price-box">
                <div>
                  <div className="price-label">Total Payable to {shop.name}</div>
                  <div className="price-amount">INR {estimatedPrice.toFixed(2)}</div>
                </div>
                <button
                  className="btn"
                  style={{ width: 'auto', padding: '12px 24px' }}
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 size={16} className="spin" strokeWidth={2.5} />
                      Processing
                    </>
                  ) : (
                    <>
                      Proceed to Pay <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 3 — PAYMENT */}
          {step === 'payment' && orderInfo && (
            <>
              <div className="payment-amount-card">
                <div className="label">Pay Directly to {shop.name}</div>
                <div className="amount">INR {orderInfo.amount.toFixed(2)}</div>
              </div>

              <div className="qr-section">
                <div className="qr-title">
                  <ScanLine size={14} strokeWidth={2.5} /> Scan UPI QR to Pay
                </div>
                <div className="qr-box">
                  <img src={qrUrl} alt="UPI QR Code" />
                </div>
                <div className="qr-id-row">
                  UPI ID: <strong>{shop.upiId}</strong>
                </div>
              </div>

              <div className="order-summary-list">
                <div className="order-summary-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={12} strokeWidth={2} /> Order ID
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{orderInfo.orderNumber}</span>
                </div>
                <div className="order-summary-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={12} strokeWidth={2} /> Amount
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>INR {orderInfo.amount.toFixed(2)}</span>
                </div>
                <div className="order-summary-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={12} strokeWidth={2} /> Specifications
                  </span>
                  <span>
                    {fileDetails?.pageCount} pgs &times; {copies} {copies > 1 ? 'copies' : 'copy'} &middot; {colourMode === 'MONOCHROME' ? 'B&W' : 'Color'} &middot; {paperSize}
                  </span>
                </div>
              </div>

              <button className="btn" onClick={handlePay} disabled={isPaying}>
                {isPaying ? (
                  <>
                    <Loader2 size={16} className="spin" strokeWidth={2.5} /> Confirming Payment
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} /> I Have Paid &mdash; Start Printing
                  </>
                )}
              </button>
            </>
          )}

          {/* STEP 4 — STATUS */}
          {step === 'status' && (
            <>
              {!orderStatus ? (
                <div className="status-head">
                  <div className="status-avatar spinning" />
                  <div className="status-order-tag">{orderInfo?.orderNumber}</div>
                  <div className="status-sub-info">Transmitting to {shop.name} print queue</div>
                </div>
              ) : (
                <>
                  <div className="status-head">
                    {orderStatus.status === 'COMPLETED' ? (
                      <div className="status-avatar success">
                        <Check size={32} strokeWidth={3} />
                      </div>
                    ) : orderStatus.status === 'FAILED' ? (
                      <div className="status-avatar error">
                        <X size={32} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="status-avatar spinning" />
                    )}
                    <div className="status-order-tag">{orderStatus.orderNumber}</div>
                    <div className="status-sub-info">{shop.name} &middot; Live Queue Status</div>
                  </div>

                  <div className="pipeline-card">
                    {[
                      { label: 'payment', title: 'Payment verified' },
                      { label: 'queued', title: `Dispatched to ${shop.name} printer queue` },
                      { label: 'printing', title: 'Physical printing in progress' },
                      { label: 'ready', title: 'Completed & ready for counter pickup' },
                    ].map(({ label, title }) => {
                      const state = getPipelineState(label);
                      return (
                        <div className="pipeline-row" key={label}>
                          <div className="pipeline-name">
                            <div className={`pipeline-dot ${state}`} />
                            {title}
                          </div>
                          <div className={`pipeline-tag ${state}`}>
                            {state === 'done' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} strokeWidth={3} /> Done
                              </span>
                            ) : state === 'active' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Loader2 size={12} className="spin" strokeWidth={3} /> Active
                              </span>
                            ) : state === 'error' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <X size={12} strokeWidth={3} /> Issue
                              </span>
                            ) : (
                              <span>Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {orderStatus.status === 'COMPLETED' && (
                    <div className="status-alert success">
                      <div className="status-alert-title">
                        <Check size={18} strokeWidth={3} /> Print Complete
                      </div>
                      <div className="status-alert-body">
                        Your pages are ready. Please show Order ID <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{orderStatus.orderNumber}</strong> at the counter for collection.
                      </div>
                    </div>
                  )}

                  {orderStatus.status === 'FAILED' && (
                    <div className="status-alert error">
                      <div className="status-alert-title">
                        <AlertTriangle size={18} strokeWidth={2.4} /> Print Alert
                      </div>
                      <div className="status-alert-body">
                        Payment was verified. Please present Order ID <strong style={{ fontFamily: 'var(--font-mono)' }}>{orderStatus.orderNumber}</strong> to the staff to print manually.
                      </div>
                    </div>
                  )}

                  {!['COMPLETED', 'FAILED'].includes(orderStatus.status) && (
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 12, marginTop: 16 }}>
                      <Clock size={13} strokeWidth={2.2} />
                      Keep this page open. Your pages will print directly.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 28, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/landing" style={{ textDecoration: 'underline' }}>Printr Platform</Link>
          <span>&middot;</span>
          <Link href="/dashboard" style={{ textDecoration: 'underline' }}>Shop Owner Login</Link>
          <span>&middot;</span>
          <a
            href="https://www.ruthwikreddy.live/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 600, color: 'var(--text-primary)' }}
          >
            Built by Ruthwik Reddy &nearr;
          </a>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Powered by Printr Cloud Smart Printing OS
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast-bar show ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={14} strokeWidth={2.5} /> : <Info size={14} strokeWidth={2.5} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
