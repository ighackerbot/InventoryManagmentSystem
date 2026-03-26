import { useEffect, useState } from 'react';
import { BarChart3, Plus, ReceiptIndianRupee, Search, ShoppingBag } from 'lucide-react';
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
import { formatCurrency, formatDate, paginate } from '../lib/utils';
import { productsAPI, salesAPI } from '../utils/api';

export const Sales = () => {
  const { currentStore } = useAuth();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ productId: '', quantity: '', sellingPrice: '', customerName: '' });

  useEffect(() => {
    if (!currentStore) return;
    const fetchData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [salesResponse, productsResponse] = await Promise.all([
          salesAPI.getAll({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
          productsAPI.getAll(),
        ]);
        setSales(salesResponse.data.sales || []);
        setProducts(productsResponse.data || []);
      } catch (err) {
        setLoadError(err.response?.data?.error || 'Failed to load sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStore]);

  const handleSave = async (event) => {
    event.preventDefault();
    const product = products.find((item) => item._id === form.productId);
    if (product && Number(form.quantity) > Number(product.stock)) {
      toast.error(`Insufficient stock. Available quantity: ${product.stock}`);
      return;
    }

    setSaving(true);
    try {
      await salesAPI.create({
        ...form,
        quantity: Number(form.quantity),
        sellingPrice: Number(form.sellingPrice),
      });
      toast.success('Sale recorded successfully.');
      setIsModalOpen(false);
      setForm({ productId: '', quantity: '', sellingPrice: '', customerName: '' });
      const [salesResponse, productsResponse] = await Promise.all([
        salesAPI.getAll({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
        productsAPI.getAll(),
      ]);
      setSales(salesResponse.data.sales || []);
      setProducts(productsResponse.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record sale.');
    } finally {
      setSaving(false);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchTarget = `${sale.productId?.name || ''} ${sale.customerName || ''}`.toLowerCase();
    return searchTarget.includes(query.toLowerCase());
  });
  const totalToday = sales
    .filter((sale) => new Date(sale.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const totalTransactions = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const visibleRows = paginate(filteredSales, 1, 10);

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (sale) => (
        <div>
          <p className="mb-1 font-medium text-neutral-950">{formatDate(sale.createdAt)}</p>
          <p className="mb-0 text-xs text-neutral-400">{formatDate(sale.createdAt, { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
      ),
    },
    { key: 'product', header: 'Product', render: (sale) => <span className="font-semibold text-neutral-950">{sale.productId?.name || 'N/A'}</span> },
    { key: 'customer', header: 'Customer', render: (sale) => sale.customerName || 'Walk-in customer' },
    { key: 'quantity', header: 'Quantity', render: (sale) => sale.quantity },
    { key: 'sellingPrice', header: 'Unit price', render: (sale) => formatCurrency(sale.sellingPrice) },
    { key: 'totalAmount', header: 'Total', render: (sale) => <span className="font-semibold text-neutral-950">{formatCurrency(sale.totalAmount)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title="Sales activity"
        description="Record and check sales."
        actions={
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Record Sale
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ReceiptIndianRupee} label="Total today" value={formatCurrency(totalToday)} tone="success" />
        <StatCard icon={ShoppingBag} label="Transactions" value={String(totalTransactions)} tone="brand" />
        <StatCard icon={BarChart3} label="Revenue" value={formatCurrency(totalRevenue)} tone="brand" />
      </div>

      <div className="grid gap-4">
        <Card>
          <Input icon={Search} placeholder="Search by customer or product" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-5">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-[20px] bg-neutral-100" />
                ))}
              </div>
            ) : loadError ? (
              <EmptyState title="Sales failed to load" description={loadError} />
            ) : filteredSales.length === 0 ? (
              <EmptyState title="No sales yet" description="Record your first sale to unlock charts, revenue summaries, and activity history." action={{ label: 'Record Sale', onClick: () => setIsModalOpen(true), icon: Plus }} />
            ) : (
              <Table columns={columns} data={visibleRows} rowKey={(row) => row._id} empty="No matching sales." zebra />
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record a sale" description="Enter the sale details.">
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">Store Info</h3>
              <p className="mt-1 text-sm text-neutral-500">Choose product and customer.</p>
            </div>
            <Select
              label="Product"
              value={form.productId}
              onChange={(event) => {
                const selected = products.find((item) => item._id === event.target.value);
                setForm({
                  ...form,
                  productId: event.target.value,
                  sellingPrice: selected?.sellingPrice || '',
                });
              }}
              options={products.map((product) => ({
                value: product._id,
                label: `${product.name} • Stock ${product.stock}`,
              }))}
              required
            />
            <Input label="Customer" placeholder="Optional customer name" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
          </div>

          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-base font-semibold text-neutral-950">Pricing</h3>
              <p className="mt-1 text-sm text-neutral-500">Enter quantity and price.</p>
            </div>
            <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            <Input label="Selling price" type="number" min="0" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} required />
            <div className="sm:col-span-2 rounded-[20px] bg-white px-4 py-4 ring-1 ring-neutral-200">
              <p className="mb-1 text-sm text-neutral-500">Estimated total</p>
              <p className="mb-0 text-xl font-semibold text-neutral-950">
                {formatCurrency((Number(form.quantity) || 0) * (Number(form.sellingPrice) || 0))}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Record Sale
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
