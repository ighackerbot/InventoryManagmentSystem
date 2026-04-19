import React, { useState, useEffect } from 'react';
import { salesAPI, productsAPI } from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import type { Sale, Product, SaleProduct } from '../types/index';

interface SaleForm { productId: string; quantity: string; sellingPrice: string; customerName: string; }

const getSaleName = (sale: Sale): string => {
    if (!sale.productId) return 'N/A';
    if (typeof sale.productId === 'string') return sale.productId;
    return (sale.productId as SaleProduct).name;
};

export const Sales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<SaleForm>({ productId: '', quantity: '', sellingPrice: '', customerName: '' });
    const { currentStore } = useAuth();

    useEffect(() => { if (currentStore) { fetchSales(); fetchProducts(); } }, [currentStore]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const { data } = await salesAPI.getAll({ limit: 100 });
            setSales(data.sales || []);
        } catch (error: unknown) {
            const e = error as { response?: { data?: { error?: string } }; message?: string };
            alert('Failed to fetch sales: ' + (e.response?.data?.error || e.message));
        } finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try { const { data } = await productsAPI.getAll(); setProducts(data || []); }
        catch (error) { console.error('Error fetching products:', error); }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        const selectedProduct = products.find(p => p._id === productId);
        setFormData(prev => ({ ...prev, productId, sellingPrice: selectedProduct ? String(selectedProduct.sellingPrice) : prev.sellingPrice }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProduct = products.find(p => p._id === formData.productId);
        if (selectedProduct && parseInt(formData.quantity) > selectedProduct.stock) {
            alert(`Insufficient stock! Available: ${selectedProduct.stock}`); return;
        }
        try {
            await salesAPI.create({ productId: formData.productId, quantity: parseInt(formData.quantity), sellingPrice: parseFloat(formData.sellingPrice), customerName: formData.customerName });
            await fetchSales(); await fetchProducts();
            setIsModalOpen(false);
            setFormData({ productId: '', quantity: '', sellingPrice: '', customerName: '' });
        } catch (error: unknown) {
            const e = error as { response?: { data?: { error?: string } }; message?: string };
            alert('Failed to create sale: ' + (e.response?.data?.error || e.message));
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentStore) return (<div><h1>Sales</h1><Card className="text-center"><p>Please select a store to view sales</p></Card></div>);

    return (
        <div>
            <div className="flex justify-between items-center mb-xl">
                <h1>Sales</h1>
                <Button onClick={() => { setFormData({ productId: '', quantity: '', sellingPrice: '', customerName: '' }); setIsModalOpen(true); }}>+ Record Sale</Button>
            </div>
            {sales.length === 0 ? (<Card className="text-center"><p>No sales recorded yet</p></Card>) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Date</th><th>Product</th><th>Customer</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale._id}>
                                    <td>{new Date(sale.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>{getSaleName(sale)}</td>
                                    <td>{sale.customerName || '-'}</td>
                                    <td>{sale.quantity}</td>
                                    <td>Rs.{parseFloat(String(sale.sellingPrice)).toFixed(2)}</td>
                                    <td style={{ fontWeight: 600 }}>Rs.{parseFloat(String(sale.totalAmount)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Sale">
                <form onSubmit={handleSubmit}>
                    <Select label="Product" value={formData.productId} onChange={handleProductChange} options={products.map(p => ({ value: p._id, label: `${p.name} (Stock: ${p.stock})` }))} required />
                    <Input label="Customer Name" type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Optional" />
                    <Input label="Quantity" type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                    <Input label="Selling Price" type="number" step="0.01" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} required />
                    <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" style={{ flex: 1 }}>Record Sale</Button>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
