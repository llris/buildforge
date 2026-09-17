import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  PAID: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
  REFUNDED: '#64748b',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  });
  const [salesRange, setSalesRange] = useState('30d');
  const [salesData, setSalesData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchSalesChart(salesRange);
  }, [salesRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, statusRes, topRes, ordersRes, inventoryRes] = await Promise.all([
        api.get('/admin/analytics/summary'),
        api.get('/admin/analytics/orders-by-status'),
        api.get('/admin/analytics/top-products?limit=5'),
        api.get('/admin/orders?limit=5'),
        api.get('/admin/inventory?limit=5&lowStockOnly=true'),
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (statusRes.data.success) setStatusData(statusRes.data.data);
      if (topRes.data.success) setTopProducts(topRes.data.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.orders);
      if (inventoryRes.data.success) setLowStockItems(inventoryRes.data.data.items);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesChart = async (range) => {
    try {
      const res = await api.get(`/admin/analytics/sales?range=${range}`);
      if (res.data.success) {
        setSalesData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sales chart', err);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time performance metrics and store management</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Manage Catalog
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{formatINR(summary.totalRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Paid & completed sales
            </p>
          </div>
        </div>

        {/* Card 2: Orders Today */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Orders Today</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{summary.ordersToday}</h3>
            <p className="text-xs text-slate-500 mt-1">Placed in the last 24 hours</p>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customers</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{summary.totalCustomers}</h3>
            <p className="text-xs text-slate-500 mt-1">Registered customer accounts</p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              summary.lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black ${summary.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {summary.lowStockCount}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.lowStockCount > 0 ? (
                <Link to="/admin/inventory" className="text-rose-600 font-bold hover:underline">
                  Action required &rarr;
                </Link>
              ) : (
                'All inventory optimal'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Revenue Analytics</h2>
              <p className="text-xs text-slate-500">Gross sales revenue over time</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSalesRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    salesRange === r
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toDateString()}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Donut (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Orders by Status</h2>
            <p className="text-xs text-slate-500">Distribution across all orders</p>
          </div>

          <div className="h-[220px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} orders`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-100">
            {statusData.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                />
                <span className="text-slate-600 text-[11px] truncate">{item.status}</span>
                <span className="text-slate-900 text-[11px] font-bold ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Top Products & Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Products (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Top Selling Products</h2>
              <p className="text-xs text-slate-500">Highest unit volume</p>
            </div>
            <Package className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No sales recorded yet.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.brand} &bull; {formatINR(p.price)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900">{p.qtySold} sold</span>
                    <p className="text-[10px] font-bold text-emerald-600">{formatINR(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Recent Orders</h2>
                <p className="text-xs text-slate-500">Latest customer transactions</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 font-mono font-bold text-slate-900">
                          #{ord.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3">
                          <p className="font-bold text-slate-900">{ord.user?.name || 'Customer'}</p>
                          <p className="text-[10px] text-slate-400">{ord.user?.email}</p>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-extrabold text-slate-900">
                          {formatINR(ord.totalAmount)}
                        </td>
                        <td className="py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                            style={{
                              backgroundColor: `${STATUS_COLORS[ord.status] || '#64748b'}15`,
                              color: STATUS_COLORS[ord.status] || '#64748b',
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
