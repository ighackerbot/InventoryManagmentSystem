import { useEffect, useState } from 'react';
import { PackagePlus, Plus, ReceiptIndianRupee, Search, Truck } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, groupTransactionsByDay, paginate } from '../lib/utils';
import { productsAPI, purchasesAPI } from '../utils/api';

export const Purchases = () => {
  const { currentStore, isAdmin } = useAuth();
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: '', costPrice: '', supplierName: '' });

  useEffect(() => {
    if (!currentStore) return;
    const fetchData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [purchaseResponse, productsResponse] = await Promise.all([
          purchasesAPI.getAll({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
          productsAPI.getAll(),
        ]);
        setPurchases(purchaseResponse.data.purchases || []);
        setProducts(productsResponse.data || []);
      } catch (err) {
        setLoadError(err.response?.data?.error || 'Failed to load purchases.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStore]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await purchasesAPI.create({
        ...form,
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice),
      });
      toast.success('Purchase recorded successfully.');
      setIsModalOpen(false);
      setForm({ productId: '', quantity: '', costPrice: '', supplierName: '' });
      const [purchaseResponse, productsResponse] = await Promise.all([
        purchasesAPI.getAll({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
        productsAPI.getAll(),
      ]);
      setPurchases(purchaseResponse.data.purchases || []);
      setProducts(productsResponse.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record purchase.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin()) {
    return <EmptyState title="Purchases are restricted" description="Only admins and co-admins can review procurement activity or create purchase entries." />;
  }

  const filtered = purchases.filter((purchase) => {
    const searchTarget = `${purchase.productId?.name || ''} ${purchase.supplierName || ''}`.toLowerCase();
    return searchTarget.includes(query.toLowerCase());
  });
  const chartData = groupTransactionsByDay([...purchases].reverse(), 'totalAmount');
  const totalToday = purchases
    .filter((purchase) => new Date(purchase.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
  const totalTransactions = purchases.length;
  const totalSpend = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
  const visibleRows = paginate(filtered, 1, 10);

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (purchase) => (
        <div>
          <p className="mb-1 font-medium text-neutral-950">{formatDate(purchase.createdAt)}</p>
          <p className="mb-0 text-xs text-neutral-400">{formatDate(purchase.createdAt, { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
      ),
    },
    { key: 'product', header: 'Product', render: (purchase) => <span className="font-semibold text-neutral-950">{purchase.productId?.name || 'N/A'}</span> },
    { key: 'supplier', header: 'Supplier', render: (purchase) => purchase.supplierName || 'Unknown supplier' },
    { key: 'quantity', header: 'Quantity', render: (purchase) => purchase.quantity },
    { key: 'costPrice', header: 'Unit cost', render: (purchase) => formatCurrency(purchase.costPrice) },
    { key: 'totalAmount', header: 'Total', render: (purchase) => <span className="font-semibold text-neutral-950">{formatCurrency(purchase.totalAmount)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Purchases"
        title="Purchase workflow"
        description="Add new stock purchases."
        actions={
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Record Purchase
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ReceiptIndianRupee} label="Total today" value={formatCurrency(totalToday)} tone="warning" />
        <StatCard icon={Truck} label="Transactions" value={String(totalTransactions)} tone="brand" />
        <StatCard icon={PackagePlus} label="Total spend" value={formatCurrency(totalSpend)} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-6">
              <h2 className="section-title">Purchase trend</h2>
              <p className="mt-1 text-sm text-neutral-500">Daily purchases.</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="purchaseTrend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#purchaseTrend)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <Input icon={Search} placeholder="Search by supplier or product" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-5">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-[20px] bg-neutral-100" />
                ))}
              </div>
            ) : loadError ? (
              <EmptyState title="Purchases failed to load" description={loadError} />
            ) : filtered.length === 0 ? (
              <EmptyState title="No purchases yet" description="Add your first purchase to visualize spend, inventory replenishment, and supplier activity." action={{ label: 'Record Purchase', onClick: () => setIsModalOpen(true), icon: Plus }} />
            ) : (
              <Table columns={columns} data={visibleRows} rowKey={(row) => row._id} empty="No matching purchases." zebra />
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record a purchase" description="Enter the purchase details.">
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">Store Info</h3>
              <p className="mt-1 text-sm text-neutral-500">Choose product and supplier.</p>
            </div>
            <Select
              label="Product"
              value={form.productId}
              onChange={(event) => {
                const selected = products.find((item) => item._id === event.target.value);
                setForm({
                  ...form,
                  productId: event.target.value,
                  costPrice: selected?.costPrice || '',
                });
              }}
              options={products.map((product) => ({
                value: product._id,
                label: `${product.name} • Current stock ${product.stock}`,
              }))}
              required
            />
            <Input label="Supplier" placeholder="Optional supplier name" value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} />
          </div>

          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-base font-semibold text-neutral-950">Pricing</h3>
              <p className="mt-1 text-sm text-neutral-500">Enter quantity and cost.</p>
            </div>
            <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            <Input label="Cost price" type="number" min="0" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} required />
            <div className="sm:col-span-2 rounded-[20px] bg-white px-4 py-4 ring-1 ring-neutral-200">
              <p className="mb-1 text-sm text-neutral-500">Estimated total</p>
              <p className="mb-0 text-xl font-semibold text-neutral-950">
                {formatCurrency((Number(form.quantity) || 0) * (Number(form.costPrice) || 0))}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Record Purchase
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
