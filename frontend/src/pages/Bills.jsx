import { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Input, Select } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { productsAPI } from '../utils/api';

const emptyLine = { productId: '', quantity: 1, price: '', name: '' };

export const Bills = () => {
  const { currentStore } = useAuth();
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billNumber, setBillNumber] = useState(() => `BILL-${crypto.randomUUID().slice(0, 6).toUpperCase()}`);
  const [lines, setLines] = useState([{ ...emptyLine }]);

  useEffect(() => {
    if (!currentStore) return;
    const fetchProducts = async () => {
      const response = await productsAPI.getAll({ sortBy: 'name', order: 'asc' });
      setProducts(response.data || []);
    };
    fetchProducts();
  }, [currentStore]);

  const updateLine = (index, next) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...next } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, { ...emptyLine }]);
  };

  const removeLine = (index) => {
    setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  };

  const totalAmount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0),
        0
      ),
    [lines]
  );

  const canPrint = lines.some((line) => line.name && Number(line.quantity) > 0 && Number(line.price) > 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bills" title="Print bill" description="Create a simple bill and print it." />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="space-y-4">
            <Input label="Bill number" value={billNumber} onChange={(event) => setBillNumber(event.target.value)} />
            <Input label="Customer name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            <Input label="Phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
          </div>

          <div className="mt-6 space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-4">
                <div className="grid gap-3">
                  <Select
                    label={`Item ${index + 1}`}
                    value={line.productId}
                    onChange={(event) => {
                      const selected = products.find((product) => product._id === event.target.value);
                      updateLine(index, {
                        productId: event.target.value,
                        name: selected?.name || '',
                        price: selected?.sellingPrice || '',
                      });
                    }}
                    options={products.map((product) => ({
                      value: product._id,
                      label: product.name,
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Qty"
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(event) => updateLine(index, { quantity: event.target.value })}
                    />
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      value={line.price}
                      onChange={(event) => updateLine(index, { price: event.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" icon={Trash2} onClick={() => removeLine(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" icon={Plus} onClick={addLine}>
              Add Item
            </Button>
            <Button type="button" icon={Printer} onClick={() => window.print()} disabled={!canPrint}>
              Print Bill
            </Button>
          </div>
        </Card>

        <Card className="print:shadow-none">
          {canPrint ? (
            <div className="space-y-5">
              <div className="border-b border-neutral-200 pb-4">
                <h2 className="text-2xl font-semibold text-neutral-950">{currentStore?.name || 'Store'}</h2>
                <p className="mt-1 text-sm text-neutral-500">Bill No: {billNumber}</p>
                <p className="mt-1 text-sm text-neutral-500">Date: {formatDate(new Date())}</p>
              </div>

              <div className="grid gap-1 text-sm text-neutral-700">
                <p className="mb-0">Customer: {customerName || 'Walk-in customer'}</p>
                <p className="mb-0">Phone: {customerPhone || '-'}</p>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-neutral-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines
                      .filter((line) => line.name)
                      .map((line, index) => (
                        <tr key={index} className="border-t border-neutral-100">
                          <td className="px-4 py-3">{line.name}</td>
                          <td className="px-4 py-3">{line.quantity}</td>
                          <td className="px-4 py-3">{formatCurrency(line.price)}</td>
                          <td className="px-4 py-3">{formatCurrency((Number(line.quantity) || 0) * (Number(line.price) || 0))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-neutral-200 pt-4">
                <div className="rounded-[20px] bg-neutral-50 px-5 py-4 text-right">
                  <p className="mb-1 text-sm text-neutral-500">Total</p>
                  <p className="mb-0 text-2xl font-semibold text-neutral-950">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Bill preview" description="Choose an item and enter quantity to see the bill." />
          )}
        </Card>
      </div>
    </div>
  );
};
