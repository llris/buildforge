const prisma = require('../utils/prisma');

const getSummaryAnalytics = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [revenueResult, ordersToday, totalCustomers, lowStockCount] = await Promise.all([
    // Total Revenue (all paid orders)
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
    }),
    // Orders today
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    // Total customers
    prisma.user.count({
      where: { role: 'CUSTOMER' },
    }),
    // Low stock count (stockQty <= lowStockThreshold)
    prisma.inventory.count({
      where: {
        stockQty: { lte: 5 }, // Default threshold or dynamically via raw/join
      },
    }),
  ]);

  return {
    totalRevenue: revenueResult._sum.totalAmount || 0,
    ordersToday,
    totalCustomers,
    lowStockCount,
  };
};

const getSalesChartData = async (range = '30d') => {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by Date string YYYY-MM-DD
  const dateMap = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    dateMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
  }

  orders.forEach((ord) => {
    const key = ord.createdAt.toISOString().split('T')[0];
    if (dateMap[key]) {
      dateMap[key].revenue += ord.totalAmount;
      dateMap[key].orders += 1;
    }
  });

  return Object.values(dateMap);
};

const getTopProducts = async (limit = 5) => {
  // Aggregate sales from order items
  const items = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { qty: true },
    where: {
      order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    },
    orderBy: {
      _sum: { qty: 'desc' },
    },
    take: limit,
  });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, brand: true, slug: true, images: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const prod = productMap.get(item.productId);
    const qtySold = item._sum.qty || 0;
    return {
      productId: item.productId,
      name: prod?.name || 'Unknown Product',
      brand: prod?.brand || '',
      price: prod?.price || 0,
      qtySold,
      revenue: (prod?.price || 0) * qtySold,
    };
  });
};

const getOrdersByStatus = async () => {
  const counts = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return counts.map((c) => ({
    status: c.status,
    count: c._count.id,
  }));
};

module.exports = {
  getSummaryAnalytics,
  getSalesChartData,
  getTopProducts,
  getOrdersByStatus,
};
