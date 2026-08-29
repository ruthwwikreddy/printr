import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface ShopPricing {
  A4_MONOCHROME: number;
  A4_COLOUR: number;
  A3_MONOCHROME: number;
  A3_COLOUR: number;
  DUPLEX_DISCOUNT?: number;
}

export interface ShopPrinter {
  id: string;
  name: string;
  isDefault: boolean;
  capabilities: ('A4' | 'A3' | 'MONOCHROME' | 'COLOUR')[];
  status?: 'ONLINE' | 'OFFLINE';
}

export interface ShopAgent {
  id: string;
  name: string;
  os: 'macOS' | 'Windows' | 'Linux';
  tokenHash: string;
  lastSeen?: string;
  isActive: boolean;
  defaultPrinter?: string;
}

export interface TenantShop {
  id: string;
  slug: string;
  name: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  upiId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  plan: 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS';
  pricing: ShopPricing;
  supportedFormats: string[];
  maxFileSizeMB: number;
  branding?: {
    logoUrl?: string;
    bannerText?: string;
    instructions?: string;
  };
  agentSecretKey: string;
  printers: ShopPrinter[];
  agents: ShopAgent[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PRICING: ShopPricing = {
  A4_MONOCHROME: 2,
  A4_COLOUR: 10,
  A3_MONOCHROME: 5,
  A3_COLOUR: 20,
  DUPLEX_DISCOUNT: 0,
};

const DEFAULT_TENANT_ID = 'demo-prints';

export async function getTenantBySlug(slug: string): Promise<TenantShop | null> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    // 1. Try direct doc get by ID/slug
    const docRef = doc(db, 'tenants', cleanSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as TenantShop;
    }

    // 2. Query by slug field
    const q = query(collection(db, 'tenants'), where('slug', '==', cleanSlug), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as TenantShop;
    }

    // 3. If requesting default demo shop and doesn't exist, create it
    if (cleanSlug === DEFAULT_TENANT_ID || cleanSlug === 'default') {
      return await initializeDefaultTenant();
    }

    return null;
  } catch (error) {
    console.error('getTenantBySlug error:', error);
    return null;
  }
}

export async function getTenantByOwner(ownerEmail: string): Promise<TenantShop | null> {
  try {
    const q = query(
      collection(db, 'tenants'),
      where('ownerEmail', '==', ownerEmail.toLowerCase().trim()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as TenantShop;
    }
    return null;
  } catch (error) {
    console.error('getTenantByOwner error:', error);
    return null;
  }
}

export async function getAllTenants(): Promise<TenantShop[]> {
  try {
    const snap = await getDocs(collection(db, 'tenants'));
    const tenants: TenantShop[] = [];
    snap.forEach((d) => {
      tenants.push(d.data() as TenantShop);
    });
    return tenants;
  } catch (error) {
    console.error('getAllTenants error:', error);
    return [];
  }
}

export async function upsertTenant(data: Partial<TenantShop> & { slug: string; name: string }): Promise<TenantShop> {
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
  const docRef = doc(db, 'tenants', cleanSlug);

  const existing = await getTenantBySlug(cleanSlug);
  const now = new Date().toISOString();

  const tenantPayload: TenantShop = {
    id: cleanSlug,
    slug: cleanSlug,
    name: data.name || (existing ? existing.name : 'Print Shop'),
    ownerEmail: (data.ownerEmail || existing?.ownerEmail || '').toLowerCase().trim(),
    phone: data.phone || existing?.phone || '',
    address: data.address || existing?.address || '',
    upiId: (data.upiId || existing?.upiId || 'shop@upi').trim(),
    status: data.status || existing?.status || 'ACTIVE',
    plan: data.plan || existing?.plan || 'FREE',
    pricing: {
      A4_MONOCHROME: Number(data.pricing?.A4_MONOCHROME ?? existing?.pricing?.A4_MONOCHROME ?? 2),
      A4_COLOUR: Number(data.pricing?.A4_COLOUR ?? existing?.pricing?.A4_COLOUR ?? 10),
      A3_MONOCHROME: Number(data.pricing?.A3_MONOCHROME ?? existing?.pricing?.A3_MONOCHROME ?? 5),
      A3_COLOUR: Number(data.pricing?.A3_COLOUR ?? existing?.pricing?.A3_COLOUR ?? 20),
      DUPLEX_DISCOUNT: Number(data.pricing?.DUPLEX_DISCOUNT ?? existing?.pricing?.DUPLEX_DISCOUNT ?? 0),
    },
    supportedFormats: data.supportedFormats || existing?.supportedFormats || [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ],
    maxFileSizeMB: data.maxFileSizeMB || existing?.maxFileSizeMB || 50,
    branding: {
      logoUrl: data.branding?.logoUrl || existing?.branding?.logoUrl || '',
      bannerText: data.branding?.bannerText || existing?.branding?.bannerText || 'Instant Automated Printing',
      instructions: data.branding?.instructions || existing?.branding?.instructions || 'Scan QR, upload files and collect at the desk.',
    },
    agentSecretKey:
      data.agentSecretKey ||
      existing?.agentSecretKey ||
      '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63',
    printers: data.printers || existing?.printers || [
      { id: 'p1', name: 'HP_Deskjet_3540_series', isDefault: true, capabilities: ['A4', 'MONOCHROME', 'COLOUR'] }
    ],
    agents: data.agents || existing?.agents || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await setDoc(docRef, tenantPayload, { merge: true });
  return tenantPayload;
}

export async function initializeDefaultTenant(): Promise<TenantShop> {
  const defaultTenant: TenantShop = {
    id: DEFAULT_TENANT_ID,
    slug: DEFAULT_TENANT_ID,
    name: 'PrintShop Central',
    ownerEmail: 'admin@printr.live',
    phone: '+91 98765 43210',
    address: 'Main Campus Counter #1',
    upiId: 'shopowner@upi',
    status: 'ACTIVE',
    plan: 'PRO',
    pricing: DEFAULT_PRICING,
    supportedFormats: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxFileSizeMB: 50,
    branding: {
      logoUrl: '',
      bannerText: 'Instant Automated Document Printing & Xerox',
      instructions: 'Upload documents, choose print settings, pay via UPI and collect instantly.',
    },
    agentSecretKey: '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63',
    printers: [
      { id: 'p1', name: 'HP_Deskjet_3540_series', isDefault: true, capabilities: ['A4', 'MONOCHROME', 'COLOUR'] },
    ],
    agents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'tenants', DEFAULT_TENANT_ID), defaultTenant, { merge: true });
  return defaultTenant;
}
