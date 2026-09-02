import { NextResponse } from 'next/server';
import db from '@/lib/db';

import { isAuthenticated } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
}

export async function GET() {
  if (!isAuthenticated()) return unauthorized();

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [ordersToday, agent, queuedJobs, printingJobs, completedJobs, failedJobs, revenueResult, recentOrders] =
      await Promise.all([
        db.order.count({ where: { createdAt: { gte: todayStart } } }),
        db.printAgent.findFirst(),
        db.printJob.count({ where: { status: 'PENDING' } }),
        db.printJob.count({ where: { status: 'PROCESSING' } }),
        db.printJob.count({ where: { status: 'COMPLETED' } }),
        db.printJob.count({ where: { status: 'FAILED' } }),
        db.order.aggregate({
          where: { status: { in: ['PAID', 'PRINTING', 'COMPLETED'] } },
          _sum: { totalAmount: true },
        }),
        db.order.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      ]);

    // Agent is online if it sent a heartbeat in the last 30 seconds
    const isOnline = agent
      ? Date.now() - new Date(agent.lastSeen).getTime() < 30000
      : false;

    return NextResponse.json({
      stats: {
        ordersToday,
        isOnline,
        agentName: agent?.name || 'Not Connected',
        queuedJobs,
        printingJobs,
        completedJobs,
        failedJobs,
        totalRevenue: revenueResult._sum?.totalAmount || 0,
      },
      orders: recentOrders,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
