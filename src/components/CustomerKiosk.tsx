'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  CreditCard,
  Sparkles,
  MapPin,
  Phone,
  Copy,
  Zap,
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

interface ShopConfig {
  shopName: string;
  upiId: string;
  phone?: string;
  address?: string;
  tagline?: string;
  pricing: {
    A4_MONOCHROME: number;
    A4_COLOUR: number;
    A3_MONOCHROME: number;
    A3_COLOUR: number;
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function CustomerKiosk() {
  const [shop, setShop] = useState<ShopConfig>({
    shopName: 'Quick Print Xerox & Digital Prints',
    upiId: 'shopowner@upi',
    phone: '+91 98765 43210',
    address: 'Main Market, Counter 1',
    tagline: 'Instant Automated Self-Service Printing Station',
    pricing: {
      A4_MONOCHROME: 2,
      A4_COLOUR: 10,
      A3_MONOCHROME: 5,
      A3_COLOUR: 20,
    },
  });

  const [loadingShop, setLoadingShop] = useState(true);
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  // Print Configuration State
  const [copies, setCopies] = useState(1);
  const [colourMode, setColourMode] = useState<ColourMode>('MONOCHROME');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('SIMPLEX');
  const [pageRange, setPageRange] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Order & Payment State
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Load Shop Configuration
  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setShop(data.settings);
          }
        }
      } catch (err) {
        console.warn('Could not fetch shop settings:', err);
      } finally {
        setLoadingShop(false);
      }
    }
    loadShop();
  }, []);

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG documents are supported.', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File exceeds maximum size limit of 50MB.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p));
      }, 150);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setFileDetails(data);
      setStep('configure');
    } catch (err: any) {
      showToast(err.message || 'Network error during upload.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Calculate pages for active pageRange
  const calculateEffectivePages = () => {
    if (!fileDetails) return 1;
    if (!pageRange.trim()) return fileDetails.pageCount;

    try {
      const parts = pageRange.split(',').map((p) => p.trim());
      let count = 0;
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map((n) => parseInt(n, 10));
          if (!isNaN(start) && !isNaN(end) && end >= start) {
            count += Math.min(end, fileDetails.pageCount) - Math.max(1, start) + 1;
          }
        } else {
          const page = parseInt(part, 10);
          if (!isNaN(page) && page >= 1 && page <= fileDetails.pageCount) {
            count += 1;
          }
        }
      }
      return count > 0 ? count : fileDetails.pageCount;
    } catch {
      return fileDetails.pageCount;
    }
  };

  const effectivePageCount = calculateEffectivePages();

  // Dynamic Rate Calculation from Shop Settings
  const pricing = shop.pricing || {
    A4_MONOCHROME: 2,
    A4_COLOUR: 10,
    A3_MONOCHROME: 5,
    A3_COLOUR: 20,
  };

  const rateKey = `${paperSize}_${colourMode}` as keyof typeof pricing;
  const unitRate = pricing[rateKey] ?? 2;
  const calculatedTotal = unitRate * effectivePageCount * copies;

  // Handle Order Creation
  const handleProceedToPayment = async () => {
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
          pageCount: effectivePageCount,
          copies,
          colourMode,
          paperSize,
          duplexMode,
          pageRange: pageRange || null,
          customerPhone: customerPhone || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const orderData = await res.json();
      setOrderInfo(orderData);
      setOrderStatus({
        orderNumber: orderData.orderNumber,
        status: 'AWAITING_PAYMENT',
        totalAmount: orderData.amount,
        jobStatus: 'PENDING',
        printer: null,
        error: null,
      });

      setStep('payment');
    } catch (err: any) {
      showToast(err.message || 'Error initializing checkout', 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Payment Verification Handler
  const handlePaymentSimulation = async () => {
    if (!orderInfo) return;
    setIsPaying(true);

    try {
      const res = await fetch('/api/payments/mock-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderInfo.orderId }),
      });

      if (res.ok) {
        setStep('status');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: any) {
      showToast('Payment verification failed. Please try again.', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  // Real-time Firestore & Polling Listener for Order Status
  useEffect(() => {
    if (step !== 'status' || !orderInfo) return;

    let unsubscribe: (() => void) | null = null;

    // 1. Cloud Firestore Real-time Listener
    import('@/lib/firestoreService')
      .then(({ subscribeToFirestoreOrder }) => {
        unsubscribe = subscribeToFirestoreOrder(orderInfo.orderId, (order) => {
          if (order) {
            setOrderStatus({
              orderNumber: order.orderNumber,
              status: order.status,
              totalAmount: order.totalAmount,
              jobStatus: order.jobStatus,
              printer: order.printerName || null,
              error: order.errorLog || null,
            });
          }
        });
      })
      .catch((err) => {
        console.warn('Firestore subscription fallback:', err);
      });

    // 2. Periodic Polling fallback
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderInfo.orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          setOrderStatus({
            orderNumber: data.orderNumber,
            status: data.status,
            totalAmount: data.totalAmount,
            jobStatus: data.jobStatus || 'PENDING',
            printer: data.printer || null,
            error: data.error || null,
          });
        }
      } catch {}
    }, 2500);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [step, orderInfo]);

  // Generate UPI URI
  const upiUri = orderInfo
    ? `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(
        shop.shopName
      )}&am=${orderInfo.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        `Print Order ${orderInfo.orderNumber}`
      )}`
    : '';

  const qrImageUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
        upiUri
      )}`
    : '';

  return (
    <div className="terminal-app-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`terminal-toast ${toast.type === 'error' ? 'toast-error' : 'toast-info'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="terminal-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-logo-badge" title="Printr Self-Service Kiosk">
              <Printer size={22} strokeWidth={2.4} />
              <span className="brand-logo-glow"></span>
            </div>
            <div className="brand-titles">
              <div className="brand-title-wrap">
                <h1 className="brand-main-title">{shop.shopName}</h1>
                <span className="brand-station-pill">
                  <Zap size={10} strokeWidth={3} />
                  <span>Auto-Kiosk</span>
                </span>
              </div>
              <div className="brand-sub-wrap">
                <span className="brand-sub-title">
                  {shop.tagline || 'Autonomous Self-Service Printing Station'}
                </span>
                {shop.address && (
                  <>
                    <span className="sub-dot">·</span>
                    <span className="brand-address-text">
                      <MapPin size={11} className="inline mr-1" />
                      {shop.address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="status-pill-live" title="Hardware Agent Connected & Ready to Print">
              <span className="live-dot-ring">
                <span className="live-dot-core"></span>
              </span>
              <span className="live-text">Printer Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Terminal Container */}
      <main className="terminal-main">
        {/* Step Indicator */}
        <div className="terminal-stepper">
          <div className={`step-item ${step === 'upload' ? 'active' : 'completed'}`}>
            <span className="step-num">{step === 'upload' ? '1' : <Check size={12} strokeWidth={3} />}</span>
            <span className="step-label">Upload</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step-item ${step === 'configure' ? 'active' : ['payment', 'status'].includes(step) ? 'completed' : ''}`}>
            <span className="step-num">{['payment', 'status'].includes(step) ? <Check size={12} strokeWidth={3} /> : '2'}</span>
            <span className="step-label">Options</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step-item ${step === 'payment' ? 'active' : step === 'status' ? 'completed' : ''}`}>
            <span className="step-num">{step === 'status' ? <Check size={12} strokeWidth={3} /> : '3'}</span>
            <span className="step-label">UPI Pay</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step-item ${step === 'status' ? 'active' : ''}`}>
            <span className="step-num">4</span>
            <span className="step-label">Print Status</span>
          </div>
        </div>

        {/* STEP 1: Upload File */}
        {step === 'upload' && (
          <div className="terminal-card">
            <div className="card-header-clean">
              <h2 className="card-title">Upload Your Document</h2>
              <p className="card-desc">
                Select or drop your PDF document or images to start printing instantly.
              </p>
            </div>

            <div
              className={`dropzone-box ${isDragging ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              {isUploading ? (
                <div className="upload-progress-view">
                  <Loader2 size={36} className="animate-spin text-accent" />
                  <p className="upload-status-text">Analyzing &amp; Preparing Pages...</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <span className="progress-num">{uploadProgress}%</span>
                </div>
              ) : (
                <label className="dropzone-label">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="file-hidden-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="dropzone-icon-circle">
                    <UploadCloud size={32} strokeWidth={2.2} />
                  </div>
                  <h3 className="dropzone-prompt">Tap to browse or drop file here</h3>
                  <p className="dropzone-specs">Supports PDF, JPG, PNG up to 50MB</p>
                  <span className="btn-browse-file">Choose File</span>
                </label>
              )}
            </div>

            {/* Shop Rates Display Strip */}
            <div className="rates-preview-strip">
              <div className="rates-header-title">
                <Sparkles size={13} />
                <span>Shop Rates</span>
              </div>
              <div className="rates-grid-compact">
                <div className="rate-badge">
                  <span className="rate-name">A4 B&amp;W</span>
                  <span className="rate-val">₹{shop.pricing?.A4_MONOCHROME ?? 2}/pg</span>
                </div>
                <div className="rate-badge">
                  <span className="rate-name">A4 Color</span>
                  <span className="rate-val">₹{shop.pricing?.A4_COLOUR ?? 10}/pg</span>
                </div>
                <div className="rate-badge">
                  <span className="rate-name">A3 B&amp;W</span>
                  <span className="rate-val">₹{shop.pricing?.A3_MONOCHROME ?? 5}/pg</span>
                </div>
                <div className="rate-badge">
                  <span className="rate-name">A3 Color</span>
                  <span className="rate-val">₹{shop.pricing?.A3_COLOUR ?? 20}/pg</span>
                </div>
              </div>
            </div>

            {/* Shop Info Footer */}
            {(shop.address || shop.phone) && (
              <div className="shop-location-info">
                {shop.address && (
                  <div className="info-item">
                    <MapPin size={13} />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="info-item">
                    <Phone size={13} />
                    <span>{shop.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Configure Print Options */}
        {step === 'configure' && fileDetails && (
          <div className="terminal-card">
            <div className="card-header-clean">
              <div className="header-with-action">
                <div>
                  <h2 className="card-title">Print Customization</h2>
                  <p className="card-desc">Configure print settings for your document.</p>
                </div>
                <button
                  className="btn-text-change"
                  onClick={() => {
                    setFileDetails(null);
                    setStep('upload');
                  }}
                >
                  Change File
                </button>
              </div>
            </div>

            {/* File Info Bar */}
            <div className="file-info-summary">
              <div className="file-icon-box">
                {fileDetails.mimeType.includes('pdf') ? (
                  <FileText size={22} />
                ) : (
                  <ImageIcon size={22} />
                )}
              </div>
              <div className="file-text-meta">
                <span className="file-name-truncate">{fileDetails.filename}</span>
                <span className="file-sub-meta">
                  {fileDetails.pageCount} {fileDetails.pageCount === 1 ? 'Page' : 'Pages'} ·{' '}
                  {formatFileSize(fileDetails.fileSize)}
                </span>
              </div>
              <div className="file-pages-pill">
                {effectivePageCount} {effectivePageCount === 1 ? 'Page' : 'Pages'} Active
              </div>
            </div>

            {/* Print Options Form */}
            <div className="options-layout">
              {/* Paper Size */}
              <div className="option-field-group">
                <label className="field-label">Paper Size</label>
                <div className="toggle-button-group">
                  <button
                    type="button"
                    className={`toggle-option-btn ${paperSize === 'A4' ? 'active' : ''}`}
                    onClick={() => setPaperSize('A4')}
                  >
                    <span className="opt-title">A4 Standard</span>
                    <span className="opt-desc">210 × 297 mm</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-option-btn ${paperSize === 'A3' ? 'active' : ''}`}
                    onClick={() => setPaperSize('A3')}
                  >
                    <span className="opt-title">A3 Large</span>
                    <span className="opt-desc">297 × 420 mm</span>
                  </button>
                </div>
              </div>

              {/* Colour Mode */}
              <div className="option-field-group">
                <label className="field-label">Color Mode</label>
                <div className="toggle-button-group">
                  <button
                    type="button"
                    className={`toggle-option-btn ${colourMode === 'MONOCHROME' ? 'active' : ''}`}
                    onClick={() => setColourMode('MONOCHROME')}
                  >
                    <span className="opt-title">Black &amp; White</span>
                    <span className="opt-desc">₹{pricing[`${paperSize}_MONOCHROME`]}/pg</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-option-btn ${colourMode === 'COLOUR' ? 'active' : ''}`}
                    onClick={() => setColourMode('COLOUR')}
                  >
                    <span className="opt-title">Full Color</span>
                    <span className="opt-desc">₹{pricing[`${paperSize}_COLOUR`]}/pg</span>
                  </button>
                </div>
              </div>

              {/* Duplex Sides */}
              <div className="option-field-group">
                <label className="field-label">Print Sides</label>
                <div className="toggle-button-group">
                  <button
                    type="button"
                    className={`toggle-option-btn ${duplexMode === 'SIMPLEX' ? 'active' : ''}`}
                    onClick={() => setDuplexMode('SIMPLEX')}
                  >
                    <span className="opt-title">Single Sided</span>
                    <span className="opt-desc">One side per sheet</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-option-btn ${duplexMode === 'DUPLEX' ? 'active' : ''}`}
                    onClick={() => setDuplexMode('DUPLEX')}
                  >
                    <span className="opt-title">Double Sided (Duplex)</span>
                    <span className="opt-desc">Back-to-back print</span>
                  </button>
                </div>
              </div>

              {/* Copies & Page Range Row */}
              <div className="options-sub-row">
                {/* Copies Counter */}
                <div className="option-field-group">
                  <label className="field-label">Number of Copies</label>
                  <div className="stepper-counter">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      disabled={copies <= 1}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="stepper-value">{copies}</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setCopies((c) => Math.min(100, c + 1))}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* Page Range */}
                <div className="option-field-group">
                  <label className="field-label">
                    Page Range <span className="label-hint">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. 1-5, 8 (Total: ${fileDetails.pageCount})`}
                    className="input-clean"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer Mobile (Optional) */}
              <div className="option-field-group">
                <label className="field-label">
                  Your Phone Number <span className="label-hint">(Optional for order alerts)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  className="input-clean"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Price Summary & Checkout Action */}
            <div className="checkout-summary-box">
              <div className="breakdown-col">
                <span className="breakdown-calc">
                  ₹{unitRate} × {effectivePageCount} pgs × {copies} {copies > 1 ? 'copies' : 'copy'}
                </span>
                <span className="breakdown-total">
                  Total Payable: <strong>₹{calculatedTotal.toFixed(2)}</strong>
                </span>
              </div>

              <button
                type="button"
                className="btn-checkout-primary"
                onClick={handleProceedToPayment}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Preparing UPI QR...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{calculatedTotal.toFixed(2)} via UPI</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: UPI Payment */}
        {step === 'payment' && orderInfo && (
          <div className="terminal-card">
            <div className="card-header-clean text-center">
              <h2 className="card-title">Scan &amp; Pay via UPI</h2>
              <p className="card-desc">
                Scan with any UPI app (GPay, PhonePe, Paytm, BHIM, Cred) to start printing automatically.
              </p>
            </div>

            <div className="payment-qr-container">
              {/* Dynamic QR Box */}
              <div className="qr-box-frame">
                <img
                  src={qrImageUrl}
                  alt="UPI Payment QR Code"
                  className="qr-code-img"
                  width={230}
                  height={230}
                />
                <div className="qr-badge-amount">₹{orderInfo.amount.toFixed(2)}</div>
              </div>

              {/* Shop & Order Metadata */}
              <div className="payment-meta-details">
                <div className="meta-line">
                  <span className="meta-label">Pay To:</span>
                  <span className="meta-val font-bold">{shop.shopName}</span>
                </div>
                <div className="meta-line">
                  <span className="meta-label">UPI ID:</span>
                  <span className="meta-val code-val">
                    {shop.upiId}
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => {
                        navigator.clipboard.writeText(shop.upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                    >
                      {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
                <div className="meta-line">
                  <span className="meta-label">Order Ref:</span>
                  <span className="meta-val font-mono">{orderInfo.orderNumber}</span>
                </div>
                <div className="meta-line">
                  <span className="meta-label">Amount:</span>
                  <span className="meta-val text-accent font-bold">₹{orderInfo.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Mobile Direct App Intent Link */}
              <div className="upi-mobile-actions">
                <a href={upiUri} className="btn-upi-intent">
                  <CreditCard size={15} />
                  <span>Open Any UPI App</span>
                </a>
              </div>

              {/* Payment Verification Trigger */}
              <div className="verification-trigger-box">
                <p className="verify-hint">Once you complete the payment on your phone:</p>
                <button
                  type="button"
                  className="btn-verify-payment"
                  onClick={handlePaymentSimulation}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>I Have Completed Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Live Real-Time Print Status */}
        {step === 'status' && orderStatus && (
          <div className="terminal-card">
            <div className="card-header-clean text-center">
              <div className="order-number-tag">ORDER #{orderStatus.orderNumber}</div>
              <h2 className="card-title">Live Dispatch Status</h2>
              <p className="card-desc">
                Your order is connected directly to the physical counter printer.
              </p>
            </div>

            {/* Status Timeline */}
            <div className="status-timeline-box">
              {/* Step A: Payment */}
              <div className="timeline-node completed">
                <div className="node-icon">
                  <Check size={14} strokeWidth={3} />
                </div>
                <div className="node-content">
                  <span className="node-title">Payment Confirmed</span>
                  <span className="node-desc">₹{orderStatus.totalAmount.toFixed(2)} received via UPI</span>
                </div>
              </div>

              {/* Step B: Dispatch to Hardware */}
              <div
                className={`timeline-node ${
                  ['PROCESSING', 'COMPLETED'].includes(orderStatus.jobStatus)
                    ? 'completed'
                    : orderStatus.jobStatus === 'FAILED'
                    ? 'failed'
                    : 'active'
                }`}
              >
                <div className="node-icon">
                  {['PROCESSING', 'COMPLETED'].includes(orderStatus.jobStatus) ? (
                    <Check size={14} strokeWidth={3} />
                  ) : orderStatus.jobStatus === 'FAILED' ? (
                    <X size={14} strokeWidth={3} />
                  ) : (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                </div>
                <div className="node-content">
                  <span className="node-title">Queued for Counter Printer</span>
                  <span className="node-desc">
                    {orderStatus.jobStatus === 'PENDING' && 'Waiting for print agent pickup...'}
                    {orderStatus.jobStatus === 'PROCESSING' &&
                      `Sent to printer${orderStatus.printer ? ` (${orderStatus.printer})` : ''}...`}
                    {orderStatus.jobStatus === 'COMPLETED' && 'Job transmitted to printer successfully'}
                    {orderStatus.jobStatus === 'FAILED' && `Error: ${orderStatus.error || 'Print failed'}`}
                  </span>
                </div>
              </div>

              {/* Step C: Physical Printing & Ready */}
              <div
                className={`timeline-node ${
                  orderStatus.jobStatus === 'COMPLETED'
                    ? 'completed success-highlight'
                    : orderStatus.jobStatus === 'PROCESSING'
                    ? 'active'
                    : 'pending'
                }`}
              >
                <div className="node-icon">
                  {orderStatus.jobStatus === 'COMPLETED' ? (
                    <Sparkles size={14} />
                  ) : (
                    <Printer size={14} />
                  )}
                </div>
                <div className="node-content">
                  <span className="node-title">
                    {orderStatus.jobStatus === 'COMPLETED'
                      ? 'Printing Completed!'
                      : 'Physical Printing'}
                  </span>
                  <span className="node-desc">
                    {orderStatus.jobStatus === 'COMPLETED'
                      ? 'Please collect your printed pages from the counter tray.'
                      : 'Pages will eject from the printer tray.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="status-footer-actions">
              <button
                type="button"
                className="btn-print-another"
                onClick={() => {
                  setFileDetails(null);
                  setOrderInfo(null);
                  setOrderStatus(null);
                  setStep('upload');
                }}
              >
                <Printer size={15} />
                <span>Print Another Document</span>
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
