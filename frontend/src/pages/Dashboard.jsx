import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, Box, IndianRupee, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../utils/api';
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from '../lib/utils';

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-24 rounded-[32px] bg-white/70" />
    <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-40 rounded-[28px] bg-white/80" />
      ))}
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="h-96 rounded-[28px] bg-white/80" />
      <div className="h-96 rounded-[28px] bg-white/80" />
    </div>
  </div>
);

export const Dashboard = () => {
  const { currentStore, isGuest, isAdmin } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!currentStore && !isGuest) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const reportResponse = await reportsAPI.getDashboard();
        setStats(reportResponse.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [currentStore, isGuest, isAdmin]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        tone="error"
        title="Dashboard unavailable"
        description={error}
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  const topProducts = (stats?.topProducts || []).map((item) => ({
    name: item.name,
    units: item.totalQuantity,
    revenue: item.totalRevenue,
  }));
  const activity = [
    ...(stats?.recentSales || []).map((item) => ({
      id: item._id,
      type: 'Sale',
      label: item.productId?.name || 'Product',
      meta: item.customerName || 'Customer sale',
      value: formatCurrency(item.totalAmount),
      date: item.createdAt,
    })),
    ...(stats?.recentPurchases || []).map((item) => ({
      id: item._id,
      type: 'Purchase',
      label: item.productId?.name || 'Product',
      meta: item.supplierName || 'Supplier purchase',
      value: formatCurrency(item.totalAmount),
      date: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={currentStore?.name ? `${currentStore.name} dashboard` : 'Dashboard'}
        description="See your store in one place."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Total Sales"
          value={formatCompactCurrency(stats?.totalSales)}
          tone="brand"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Purchases"
          value={formatCompactCurrency(stats?.totalPurchases)}
          tone="warning"
        />
        <StatCard
          icon={TrendingUp}
          label="Net Revenue"
          value={formatCompactCurrency(stats?.netRevenue)}
          tone={stats?.netRevenue >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon={Box}
          label="Current Stock"
          value={formatNumber(stats?.currentStock)}
          tone="brand"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="mb-6">
              <h2 className="section-title">Top products</h2>
              <p className="mt-1 text-sm text-neutral-500">Best-selling items.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={({ active, payload, label }) => active ? (
                  <div className="chart-tooltip">
                    <p className="mb-2 font-semibold text-neutral-950">{label}</p>
                    {payload?.map((item) => (
                      <p key={item.dataKey} className="mb-1 text-sm text-neutral-600">
                        {item.name}: {item.dataKey === 'revenue' ? formatCurrency(item.value) : formatNumber(item.value)}
                      </p>
                    ))}
                  </div>
                ) : null} />
                <Bar dataKey="units" name="Units sold" radius={[10, 10, 0, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={entry.name} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Recent activity</h2>
              <p className="mt-1 text-sm text-neutral-500">Latest updates.</p>
            </div>
            <button
              type="button"
              onClick={() => toast.info('Use the Sales and Purchases pages to dive deeper into activity.')}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700"
            >
              View workflows
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-[22px] border border-neutral-100 bg-neutral-50/80 px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-2xl p-3 ${item.type === 'Sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.type === 'Sale' ? <TrendingUp className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-neutral-950">{item.label}</p>
                      <p className="mb-0 text-sm text-neutral-500">{item.type} • {item.meta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-sm font-semibold text-neutral-950">{item.value}</p>
                    <p className="mb-0 text-xs text-neutral-400">{formatDate(item.date, { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No activity yet" description="Record your first sale or purchase to unlock activity tracking." />
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-5">
              <h2 className="section-title">Low stock alerts</h2>
              <p className="mt-1 text-sm text-neutral-500">Items to refill soon.</p>
          </div>
          <div className="space-y-3">
            {(stats?.lowStockProducts || []).length ? (
              stats.lowStockProducts.map((product) => (
                <div key={product._id} className="rounded-[22px] border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-neutral-950">{product.name}</p>
                      <p className="mb-0 text-sm text-neutral-500">Threshold: {formatNumber(product.lowStockThreshold)} units</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                      {formatNumber(product.stock)} left
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Box}
                title="Inventory looks healthy"
                description="No low-stock alerts right now. You have enough buffer on tracked products."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
