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
  status: string;
  filename: string;
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
 * Save / sync an order to Cloud Firestore
 */
export async function syncOrderToFirestore(orderData: FirestoreOrder) {
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
 * Real-time listener for Admin Dashboard orders
 */
export function subscribeToAllFirestoreOrders(
  callback: (orders: FirestoreOrder[]) => void
) {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
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
      console.error('Firestore admin subscription error:', err);
    }
  );
}
