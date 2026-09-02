import { db } from './firebase';
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

/**
 * Save / sync an order to Cloud Firestore
 */
export async function syncOrderToFirestore(orderData: FirestoreOrder): Promise<boolean> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
    await setDoc(orderRef, orderData, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore syncOrder error:', err);
    return false;
  }
}

/**
 * Update order status in Cloud Firestore
 */
export async function updateFirestoreOrderStatus(
  orderId: string,
  updates: Partial<FirestoreOrder>
): Promise<boolean> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Firestore updateStatus error:', err);
    return false;
  }
}

/**
 * Real-time listener for a single customer order status
 */
export function subscribeToFirestoreOrder(
  orderId: string,
  callback: (order: FirestoreOrder | null) => void
) {
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
  try {
    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...DEFAULT_SHOP_SETTINGS, ...snap.data() } as ShopSettings;
    }
  } catch (err) {
    console.warn('Could not read shop settings from Firestore:', err);
  }
  return DEFAULT_SHOP_SETTINGS;
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
  try {
    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    await setDoc(ref, merged, { merge: true });
  } catch (err) {
    console.error('Failed to write shop settings to Firestore:', err);
  }
  return merged;
}
