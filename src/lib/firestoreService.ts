import { db, firebaseEnabled } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface FirestoreOrder {
  id: string;
  orderNumber: string;
  customerPhone?: string | null;
  totalAmount: number;
  status: string; // AWAITING_PAYMENT, PAID, CANCELLED
  filename: string;
  filePath?: string;
  pageCount: number;
  copies: number;
  colourMode: string;
  paperSize: string;
  duplexMode: string;
  pageRange?: string | null;
  jobStatus: string; // PENDING, PROCESSING, COMPLETED, FAILED
  printerName?: string | null;
  errorLog?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSettings {
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
  updatedAt?: string;
}

const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'config';
const SETTINGS_DOC = 'shop_settings';

// Firestore writes wait for a server ack and never settle while the client is offline,
// so every call is bounded to keep it off the request critical path.
const FIRESTORE_TIMEOUT_MS = 2500;

function withTimeout<T>(operation: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), FIRESTORE_TIMEOUT_MS);
    operation
      .then((value) => resolve(value))
      .catch((err) => {
        console.error('Firestore operation failed:', err);
        resolve(fallback);
      })
      .finally(() => clearTimeout(timer));
  });
}

const noop = () => undefined;

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
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
};


// [TEMP TEST GUARD] local settings persistence used when Firestore is disabled
async function readLocalSettings(): Promise<ShopSettings> {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(process.cwd() + '/local_shop_settings.json', 'utf-8');
    return { ...DEFAULT_SHOP_SETTINGS, ...JSON.parse(raw) } as ShopSettings;
  } catch {
    return DEFAULT_SHOP_SETTINGS;
  }
}

async function writeLocalSettings(s: ShopSettings) {
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(process.cwd() + '/local_shop_settings.json', JSON.stringify(s, null, 2));
  } catch {}
}

/**
 * Save / sync an order to Cloud Firestore
 */
export async function syncOrderToFirestore(orderData: FirestoreOrder): Promise<boolean> {
  if (!firebaseEnabled) return false;
  const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
  return withTimeout(setDoc(orderRef, orderData, { merge: true }).then(() => true), false);
}

/**
 * Update order status in Cloud Firestore
 */
export async function updateFirestoreOrderStatus(
  orderId: string,
  updates: Partial<FirestoreOrder>
): Promise<boolean> {
  if (!firebaseEnabled) return false;
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  return withTimeout(
    updateDoc(orderRef, { ...updates, updatedAt: new Date().toISOString() }).then(() => true),
    false
  );
}

/**
 * Real-time listener for a single customer order status
 */
export function subscribeToFirestoreOrder(
  orderId: string,
  callback: (order: FirestoreOrder | null) => void
) {
  if (!firebaseEnabled) return noop;
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  return onSnapshot(
    orderRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as FirestoreOrder);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error('Firestore single order subscription error:', err);
    }
  );
}

/**
 * Real-time listener for Shop Owner Dashboard orders
 */
export function subscribeToShopOrders(
  callback: (orders: FirestoreOrder[]) => void
) {
  if (!firebaseEnabled) return noop;
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(150)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders: FirestoreOrder[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data() as FirestoreOrder);
      });
      callback(orders);
    },
    (err) => {
      console.warn('Firestore ordered query fallback:', err);
      // Fallback in case index is not yet built
      const fallbackQuery = query(collection(db, ORDERS_COLLECTION), limit(150));
      return onSnapshot(fallbackQuery, (snap) => {
        const orders: FirestoreOrder[] = [];
        snap.forEach((doc) => orders.push(doc.data() as FirestoreOrder));
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(orders);
      });
    }
  );
}

/**
 * Get Shop Settings from Cloud Firestore or return defaults
 */
export async function getShopSettings(): Promise<ShopSettings> {
  if (!firebaseEnabled) return DEFAULT_SHOP_SETTINGS;
  const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  const settings = await withTimeout(
    getDoc(ref).then((snap) =>
      snap.exists() ? ({ ...DEFAULT_SHOP_SETTINGS, ...snap.data() } as ShopSettings) : null
    ),
    null
  );
  return settings ?? DEFAULT_SHOP_SETTINGS;
}

/**
 * Save Shop Settings to Cloud Firestore
 */
export async function saveShopSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
  const merged: ShopSettings = {
    ...DEFAULT_SHOP_SETTINGS,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  if (firebaseEnabled) {
    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    await withTimeout(setDoc(ref, merged, { merge: true }).then(() => true), false);
  }
  return merged;
}
