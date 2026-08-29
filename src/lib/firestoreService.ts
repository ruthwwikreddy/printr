import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface FirestoreOrder {
  id: string;
  orderNumber: string;
  tenantId: string; // Tenant Isolation
  customerPhone?: string | null;
  totalAmount: number;
  status: string;
  filename: string;
  filePath?: string;
  pageCount: number;
  copies: number;
  colourMode: string;
  paperSize: string;
  duplexMode: string;
  pageRange?: string | null;
  jobStatus: string;
  printerName?: string | null;
  errorLog?: string | null;
  createdAt: string;
  updatedAt: string;
}

const ORDERS_COLLECTION = 'orders';

/**
 * Save / sync an order to Cloud Firestore scoped by tenantId
 */
export async function syncOrderToFirestore(orderData: FirestoreOrder) {
  try {
    const cleanTenantId = (orderData.tenantId || 'demo-prints').toLowerCase().trim();
    const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
    await setDoc(orderRef, { ...orderData, tenantId: cleanTenantId }, { merge: true });
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
) {
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
 * Real-time listener for customer order status
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
      console.error('Firestore subscription error:', err);
    }
  );
}

/**
 * Real-time listener for Shop Owner Dashboard orders (Strictly filtered by tenantId)
 */
export function subscribeToTenantOrders(
  tenantId: string,
  callback: (orders: FirestoreOrder[]) => void
) {
  const cleanTenantId = (tenantId || 'demo-prints').toLowerCase().trim();
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('tenantId', '==', cleanTenantId),
    orderBy('createdAt', 'desc'),
    limit(100)
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
      // Fallback query without orderBy if composite index is being generated
      const fallbackQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('tenantId', '==', cleanTenantId),
        limit(100)
      );
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
 * Real-time listener for Platform Super Admin (Global orders view)
 */
export function subscribeToAllFirestoreOrders(
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
      console.error('Firestore super-admin subscription error:', err);
    }
  );
}
