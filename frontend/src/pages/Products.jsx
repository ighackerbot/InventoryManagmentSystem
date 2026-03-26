import { useEffect, useState } from 'react';
import { AlertTriangle, Boxes, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input, Select, Textarea } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Table, TablePagination } from '../components/Table';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatNumber, paginate } from '../lib/utils';
import { productsAPI } from '../utils/api';

const emptyForm = {
  name: '',
  sku: '',
  category: 'General',
  description: '',
  costPrice: '',
  sellingPrice: '',
  stock: '',
  lowStockThreshold: '10',
};

const getStockTone = (stock, threshold) => {
  if (stock === 0) return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (stock <= threshold) return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
};

const getStockLabel = (stock, threshold) => {
  if (stock === 0) return 'Out of stock';
  if (stock <= threshold) return 'Low stock';
  return 'In stock';
};

export const Products = () => {
  const toast = useToast();
  const { isAdmin, isStaff, currentStore } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!currentStore) return;
    fetchProducts();
  }, [currentStore]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsAPI.getAll({ sortBy: 'name', order: 'asc' });
      setProducts(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    setEditingProduct(product);
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku || '',
            category: product.category || 'General',
            description: product.description || '',
            costPrice: product.costPrice || '',
            sellingPrice: product.sellingPrice || '',
            stock: product.stock || 0,
            lowStockThreshold: product.lowStockThreshold || 10,
          }
        : emptyForm
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: form.category || 'General',
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, payload);
        toast.success('Product updated.');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created.');
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product removed.');
      await fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  const categories = ['all', ...new Set(products.map((product) => product.category || 'General'))];
  const filtered = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || (product.category || 'General') === category;
    const status = getStockLabel(product.stock, product.lowStockThreshold);
    const matchesStock = stockFilter === 'all' || status.toLowerCase() === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = paginate(filtered, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, category, stockFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (product) => (
        <div>
          <p className="mb-1 font-semibold text-neutral-950">{product.name}</p>
          <p className="mb-0 text-xs text-neutral-500">{product.category || 'General'} • {product.sku || 'No SKU'}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (product) => <span className="line-clamp-2 text-sm text-neutral-500">{product.description || 'No description added.'}</span>,
    },
    ...(!isStaff()
      ? [
          {
            key: 'costPrice',
            header: 'Cost',
            render: (product) => <span className="font-medium text-neutral-700">{formatCurrency(product.costPrice)}</span>,
          },
          {
            key: 'sellingPrice',
            header: 'Selling',
            render: (product) => <span className="font-medium text-neutral-700">{formatCurrency(product.sellingPrice)}</span>,
          },
        ]
      : []),
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => <span className="font-semibold text-neutral-950">{formatNumber(product.stock)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStockTone(product.stock, product.lowStockThreshold)}`}>
          {getStockLabel(product.stock, product.lowStockThreshold)}
        </span>
      ),
    },
    ...(isAdmin()
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (product) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openModal(product)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" icon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(product._id)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Products and stock"
        description="Add, edit, and check items."
        actions={
          isAdmin() ? (
            <Button icon={Plus} onClick={() => openModal()}>
              Add Product
            </Button>
          ) : null
        }
      />

      <Card className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <Input icon={Search} placeholder="Search product or SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          options={categories.map((item) => ({ value: item, label: item === 'all' ? 'All categories' : item }))}
        />
        <Select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
          options={[
            { value: 'all', label: 'All stock states' },
            { value: 'in stock', label: 'In stock' },
            { value: 'low stock', label: 'Low stock' },
            { value: 'out of stock', label: 'Out of stock' },
          ]}
        />
      </Card>

      {loading ? (
        <div className="grid gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-18 rounded-[24px] bg-white/80" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          tone="error"
          title="Inventory failed to load"
          description={error}
          action={{ label: 'Retry', onClick: fetchProducts }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No products match those filters"
          description="Add your first product or adjust the search, category, and stock filters to broaden the list."
          action={isAdmin() ? { label: 'Add Product', onClick: () => openModal(), icon: Plus } : null}
        />
      ) : (
        <>
          <Table columns={columns} data={paged} rowKey={(row) => row._id} empty="No products found." />
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Edit product' : 'Create product'}
        description="Fill the product details."
      >
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">Store Info</h3>
              <p className="mt-1 text-sm text-neutral-500">Basic product details.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <Input label="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} hint="Optional" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              <Input
                label="Low stock threshold"
                type="number"
                value={form.lowStockThreshold}
                onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                required
              />
            </div>
            <Textarea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>

          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <h3 className="text-base font-semibold text-neutral-950">Pricing & Stock</h3>
              <p className="mt-1 text-sm text-neutral-500">Price and quantity.</p>
            </div>
            <Input label="Cost price" type="number" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} required />
            <Input label="Selling price" type="number" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} required />
            <Input label="Opening stock" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
