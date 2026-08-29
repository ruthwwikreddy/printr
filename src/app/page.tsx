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
  RefreshCw,
} from 'lucide-react';

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

function getPricePerPage(paper: PaperSize, colour: ColourMode, pricing: Record<string, number>) {
  const key = `${paper}_${colour}`;
  return pricing[key] ?? 2;
}

export default function CustomerPage() {
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

  // Dynamic shop settings (loaded from Firestore via API)
  const [settings, setSettings] = useState({
    upiId: 'shopowner@upi',
    shopName: 'PrintShop',
    pricing: {
      A4_MONOCHROME: 2,
      A4_COLOUR: 10,
      A3_MONOCHROME: 5,
      A3_COLOUR: 20,
    } as Record<string, number>,
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const estimatedPrice = fileDetails
    ? getPricePerPage(paperSize, colourMode, settings.pricing) * fileDetails.pageCount * copies
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
    // 1. Instant Real-time Cloud Firestore Listener
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

    // 2. HTTP Polling Fallback
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

  const qrUrl = orderInfo
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName)}&am=${orderInfo.amount}&cu=INR&tn=${orderInfo.orderNumber}`)}`
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
          <div className="brand-row">
            <div className="brand-icon-box">
              <Printer size={18} strokeWidth={2.4} />
            </div>
            <h1 className="brand-title">PrintShop</h1>
          </div>
          <p className="subtitle">Instant Automated Document Printing</p>
        </div>

        {/* Elegant Steps Bar */}
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
                    <div className="upload-primary-text">Select or drag your file here</div>
                    <div className="upload-secondary-text">Fast analysis with automatic page count detection</div>
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
                    <option value="MONOCHROME">Black &amp; White (INR {getPricePerPage(paperSize, 'MONOCHROME', settings.pricing)}/pg)</option>
                    <option value="COLOUR">Full Color (INR {getPricePerPage(paperSize, 'COLOUR', settings.pricing)}/pg)</option>
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
                  <div className="price-label">Total Amount</div>
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
                <div className="label">Total Payable</div>
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
                  UPI ID: <strong>{settings.upiId}</strong>
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
                    <Layers size={12} strokeWidth={2} /> Pages &times; Copies
                  </span>
                  <span>{fileDetails?.pageCount} pages &times; {copies} {copies > 1 ? 'copies' : 'copy'}</span>
                </div>
                <div className="order-summary-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Receipt size={12} strokeWidth={2} /> Configuration
                  </span>
                  <span>
                    {colourMode === 'MONOCHROME' ? 'B&W' : 'Color'} &middot; {paperSize} &middot; {duplexMode === 'SIMPLEX' ? '1-Sided' : '2-Sided'}
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
                  <div className="status-sub-info">Connecting to local print queue</div>
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
                    <div className="status-sub-info">Live Queue Dispatch Status</div>
                  </div>

                  <div className="pipeline-card">
                    {[
                      { label: 'payment', title: 'Payment verified' },
                      { label: 'queued', title: 'Dispatched to print queue' },
                      { label: 'printing', title: 'Physical printing in progress' },
                      { label: 'ready', title: 'Completed and ready for pickup' },
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
                        Your print job is ready at the counter. Please present Order ID <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{orderStatus.orderNumber}</strong> for collection.
                      </div>
                    </div>
                  )}

                  {orderStatus.status === 'FAILED' && (
                    <div className="status-alert error">
                      <div className="status-alert-title">
                        <AlertTriangle size={18} strokeWidth={2.4} /> Print Job Alert
                      </div>
                      <div className="status-alert-body">
                        Payment was verified successfully. Please inform the store desk with Order ID <strong style={{ fontFamily: 'var(--font-mono)' }}>{orderStatus.orderNumber}</strong> to print manually.
                      </div>
                    </div>
                  )}

                  {!['COMPLETED', 'FAILED'].includes(orderStatus.status) && (
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 12, marginTop: 16 }}>
                      <Clock size={13} strokeWidth={2.2} />
                      Keep this window open. Your pages will print directly.
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 24 }}>
        <Sparkles size={13} strokeWidth={2.2} /> Automated Print System
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
