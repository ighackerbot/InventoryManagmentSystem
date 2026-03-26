import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Table } from '../components/Table';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatNumber } from '../lib/utils';
import { reportsAPI } from '../utils/api';

export const Reports = () => {
  const { currentStore } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    const fetchReports = async () => {
      try {
        const response = await reportsAPI.getStats();
        setStats(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentStore]);

  const salesData = stats
    .map((item) => ({ name: item.name, sales: item.total_sold, revenue: item.revenue }))
    .filter((item) => item.sales > 0 || item.revenue > 0)
    .slice(0, 10);
  const stockData = stats
    .map((item) => ({ name: item.name, value: item.stock }))
    .filter((item) => item.value > 0)
    .slice(0, 6);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-[28px] bg-white/80" />;
  }

  if (!stats.length) {
    return <EmptyState title="No report data yet" description="Reports become more useful after you start recording products, sales, and purchases." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Business performance"
        description="A higher-level view of product movement, stock concentration, and contribution to revenue."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-5">
            <h2 className="section-title">Product sales overview</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => (name === 'revenue' ? formatCurrency(value) : formatNumber(value))} />
                <Bar dataKey="sales" radius={[10, 10, 0, 0]}>
                  {salesData.map((item, index) => (
                    <Cell key={item.name} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="section-title">Stock distribution</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                  {stockData.map((item, index) => (
                    <Cell key={item.name} fill={['#0f172a', '#1d4ed8', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Table
        rowKey={(row) => row._id}
        columns={[
          { key: 'name', header: 'Product', render: (item) => <span className="font-semibold text-neutral-950">{item.name}</span> },
          { key: 'total_purchased', header: 'Purchased', render: (item) => formatNumber(item.total_purchased) },
          { key: 'total_sold', header: 'Sold', render: (item) => formatNumber(item.total_sold) },
          { key: 'stock', header: 'Current stock', render: (item) => formatNumber(item.stock) },
          { key: 'revenue', header: 'Revenue', render: (item) => formatCurrency(item.revenue) },
          {
            key: 'profit_loss',
            header: 'Profit / Loss',
            render: (item) => (
              <span className={item.profit_loss >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                {formatCurrency(item.profit_loss)}
              </span>
            ),
          },
        ]}
        data={stats}
        empty="No report rows available."
      />
    </div>
  );
};
