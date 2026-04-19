import React, { useState, useEffect } from 'react';
import { purchasesAPI, productsAPI } from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import type { Purchase, Product, SaleProduct } from '../types/index';

interface PurchaseForm { productId: string; quantity: string; costPrice: string; supplierName: string; }

const getPurchaseName = (p: Purchase): string => {
    if (!p.productId) return 'N/A';
    if (typeof p.productId === 'string') return p.productId;
    return (p.productId as SaleProduct).name;
};

export const Purchases = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<PurchaseForm>({ productId: '', quantity: '', costPrice: '', supplierName: '' });
    const { currentStore, isAdmin } = useAuth();

    useEffect(() => { if (currentStore) { fetchPurchases(); fetchProducts(); } }, [currentStore]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const { data } = await purchasesAPI.getAll({ limit: 100 });
            setPurchases(data.purchases || []);
        } catch (error: unknown) {
            const e = error as { response?: { data?: { error?: string } }; message?: string };
            alert('Failed to fetch purchases: ' + (e.response?.data?.error || e.message));
        } finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try { const { data } = await productsAPI.getAll(); setProducts(data || []); }
        catch (error) { console.error('Error fetching products:', error); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await purchasesAPI.create({ productId: formData.productId, quantity: parseInt(formData.quantity), costPrice: parseFloat(formData.costPrice), supplierName: formData.supplierName });
            await fetchPurchases(); await fetchProducts();
            setIsModalOpen(false);
            setFormData({ productId: '', quantity: '', costPrice: '', supplierName: '' });
        } catch (error: unknown) {
            const e = error as { response?: { data?: { error?: string } }; message?: string };
            alert('Failed to create purchase: ' + (e.response?.data?.error || e.message));
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentStore) return (<div><h1>Purchases</h1><Card className="text-center"><p>Please select a store</p></Card></div>);
    if (!isAdmin()) return (<div><h1>Purchases</h1><Card className="text-center"><p>You don't have permission to view purchases.</p></Card></div>);

    return (
        <div>
            <div className="flex justify-between items-center mb-xl">
                <h1>Purchases</h1>
                <Button onClick={() => { setFormData({ productId: '', quantity: '', costPrice: '', supplierName: '' }); setIsModalOpen(true); }}>+ Record Purchase</Button>
            </div>
            {purchases.length === 0 ? (<Card className="text-center"><p>No purchases recorded yet</p></Card>) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Date</th><th>Product</th><th>Supplier</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <tr key={purchase._id}>
                                    <td>{new Date(purchase.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td>{getPurchaseName(purchase)}</td>
                                    <td>{purchase.supplierName || '-'}</td>
                                    <td>{purchase.quantity}</td>
                                    <td>Rs.{parseFloat(String(purchase.costPrice)).toFixed(2)}</td>
                                    <td style={{ fontWeight: 600 }}>Rs.{parseFloat(String(purchase.totalAmount)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Purchase">
                <form onSubmit={handleSubmit}>
                    <Select label="Product" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} options={products.map(p => ({ value: p._id, label: `${p.name} (Stock: ${p.stock})` }))} required />
                    <Input label="Supplier Name" type="text" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} placeholder="Optional" />
                    <Input label="Quantity" type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                    <Input label="Cost Price" type="number" step="0.01" min="0" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} required />
                    <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" style={{ flex: 1 }}>Record Purchase</Button>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
