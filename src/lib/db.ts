import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'mock_db.json');

interface DbData {
  orders: any[];
  printJobs: any[];
  payments: any[];
  agents: any[];
}

async function readDb(): Promise<DbData> {
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { orders: [], printJobs: [], payments: [], agents: [] };
  }
}

async function writeDb(data: DbData) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const db = {
  order: {
    async create({ data }: any) {
      const db = await readDb();

      const fileRecord = data.files?.create
        ? { id: uuid(), orderId: '', ...data.files.create, createdAt: new Date().toISOString() }
        : null;

      const jobRecord = data.printJobs?.create
        ? { id: uuid(), orderId: '', ...data.printJobs.create, status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : null;

      const newOrder: any = {
        id: uuid(),
        orderNumber: data.orderNumber,
        customerPhone: data.customerPhone ?? null,
        totalAmount: data.totalAmount,
        status: data.status || 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (fileRecord) { fileRecord.orderId = newOrder.id; db.orders.push({ ...newOrder }); }
      db.orders.push(newOrder);

      if (fileRecord) {
        fileRecord.orderId = newOrder.id;
        // Store files inline in order
        newOrder.files = [fileRecord];
      }
      if (jobRecord) {
        jobRecord.orderId = newOrder.id;
        db.printJobs.push(jobRecord);
        newOrder.printJobs = [jobRecord];
      }

      // Replace last pushed order (we pushed twice above by mistake) - clean push
      db.orders = db.orders.filter((o) => o.id !== newOrder.id);
      db.orders.push(newOrder);

      await writeDb(db);
      return newOrder;
    },

    async findUnique({ where, include }: any) {
      const db = await readDb();
      let order = db.orders.find((o: any) => o.id === where.id || o.orderNumber === where.orderNumber);
      if (!order) return null;
      order = { ...order };
      order.printJobs = db.printJobs.filter((j: any) => j.orderId === order.id);
      order.payments = db.payments.filter((p: any) => p.orderId === order.id);
      return order;
    },

    async findMany({ take, orderBy, include }: any = {}) {
      const db = await readDb();
      let res = [...db.orders];
      if (orderBy?.createdAt === 'desc') {
        res.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (take) res = res.slice(0, take);
      return res.map((order: any) => ({
        ...order,
        printJobs: db.printJobs.filter((j: any) => j.orderId === order.id),
        payments: db.payments.filter((p: any) => p.orderId === order.id),
      }));
    },

    async update({ where, data }: any) {
      const db = await readDb();
      const idx = db.orders.findIndex((o: any) => o.id === where.id);
      if (idx === -1) return null;
      db.orders[idx] = { ...db.orders[idx], ...data, updatedAt: new Date().toISOString() };
      await writeDb(db);
      return db.orders[idx];
    },

    async count({ where }: any = {}) {
      const db = await readDb();
      if (where?.createdAt?.gte) {
        const threshold = new Date(where.createdAt.gte).getTime();
        return db.orders.filter((o: any) => new Date(o.createdAt).getTime() >= threshold).length;
      }
      if (where?.status) {
        return db.orders.filter((o: any) => o.status === where.status).length;
      }
      return db.orders.length;
    },

    async aggregate({ where, _sum }: any) {
      const db = await readDb();
      let res = [...db.orders];
      if (where?.status) res = res.filter((o: any) => o.status === where.status);
      const totalAmount = res.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      return { _sum: { totalAmount } };
    },
  },

  printJob: {
    async update({ where, data }: any) {
      const db = await readDb();
      const idx = db.printJobs.findIndex((j: any) => j.id === where.id);
      if (idx === -1) return null;
      db.printJobs[idx] = { ...db.printJobs[idx], ...data, updatedAt: new Date().toISOString() };
      await writeDb(db);
      return db.printJobs[idx];
    },

    async updateMany({ where, data }: any) {
      const db = await readDb();
      db.printJobs.forEach((job: any, idx: number) => {
        const matches = Object.entries(where).every(([k, v]) => job[k] === v);
        if (matches) db.printJobs[idx] = { ...job, ...data, updatedAt: new Date().toISOString() };
      });
      await writeDb(db);
      return { count: db.printJobs.length };
    },

    async findMany({ where }: any = {}) {
      const db = await readDb();
      let res = [...db.printJobs];
      if (where?.status) res = res.filter((j: any) => j.status === where.status);
      // Hydrate with order and files
      return res.map((j: any) => {
        const order = db.orders.find((o: any) => o.id === j.orderId);
        return { ...j, order: order ? { ...order } : null };
      });
    },

    async count({ where }: any = {}) {
      const db = await readDb();
      if (where?.status) return db.printJobs.filter((j: any) => j.status === where.status).length;
      return db.printJobs.length;
    },
  },

  payment: {
    async create({ data }: any) {
      const db = await readDb();
      const newPay = { id: uuid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.payments.push(newPay);
      await writeDb(db);
      return newPay;
    },

    async update({ where, data }: any) {
      const db = await readDb();
      const idx = db.payments.findIndex((p: any) => p.id === where.id || p.gatewayOrderId === where.gatewayOrderId);
      if (idx === -1) return null;
      db.payments[idx] = { ...db.payments[idx], ...data, updatedAt: new Date().toISOString() };
      await writeDb(db);
      return db.payments[idx];
    },
  },

  printAgent: {
    async findFirst() {
      const db = await readDb();
      return db.agents[0] || null;
    },
    async upsert({ create }: any) {
      const db = await readDb();
      let agent = db.agents.find((a: any) => a.tokenHash === create.tokenHash);
      if (agent) {
        agent.lastSeen = new Date().toISOString();
        agent.isActive = true;
      } else {
        agent = { id: uuid(), ...create, lastSeen: new Date().toISOString(), createdAt: new Date().toISOString() };
        db.agents.push(agent);
      }
      await writeDb(db);
      return agent;
    },
  },

  orderFile: {
    async findMany({ where }: any = {}) {
      const db = await readDb();
      const files: any[] = [];
      db.orders.forEach((o: any) => {
        if (o.files) files.push(...o.files);
      });
      if (where?.createdAt?.lt) {
        const threshold = new Date(where.createdAt.lt).getTime();
        return files.filter((f: any) => new Date(f.createdAt).getTime() < threshold);
      }
      return files;
    },
    async updateMany({ where, data }: any = {}) { return { count: 0 }; },
  },

  pricingRule: {
    async upsert({ where, update, create }: any) {
      // Pricing stored in memory only for now
      return { id: where.id || uuid(), ...create };
    },
  },

  printAttempt: {
    async create({ data }: any) {
      return { id: uuid(), ...data };
    },
  },
};

export default db;
