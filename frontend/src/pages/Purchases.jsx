import { useState, useEffect } from 'react';
import { purchasesAPI, productsAPI } from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currentStore, isAdmin } = useAuth();

    const [formData, setFormData] = useState({
        productId: '',
        quantity: '',
        costPrice: '',
        supplierName: '',
    });

    useEffect(() => {
        if (currentStore) {
            fetchPurchases();
            fetchProducts();
        }
    }, [currentStore]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const { data } = await purchasesAPI.getAll({ limit: 100 });
            setPurchases(data.purchases || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            alert('Failed to fetch purchases: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await productsAPI.getAll();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleOpenModal = () => {
        setFormData({ productId: '', quantity: '', costPrice: '', supplierName: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const purchaseData = {
                productId: formData.productId,
                quantity: parseInt(formData.quantity),
                costPrice: parseFloat(formData.costPrice),
                supplierName: formData.supplierName,
            };

            await purchasesAPI.create(purchaseData);

            await fetchPurchases();
            await fetchProducts(); // Refresh to get updated stock
            setIsModalOpen(false);
            setFormData({ productId: '', quantity: '', costPrice: '', supplierName: '' });
        } catch (error) {
            console.error('Error creating purchase:', error);
            alert('Failed to create purchase: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!currentStore) {
        return (
            <div>
                <h1>🛒 Purchases</h1>
                <Card className="text-center">
                    <p>Please select a store to view purchases</p>
                </Card>
            </div>
        );
    }

    // Only admin/coadmin can access purchases
    if (!isAdmin()) {
        return (
            <div>
                <h1>🛒 Purchases</h1>
                <Card className="text-center">
                    <p>You don't have permission to view purchases. Contact your administrator.</p>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-xl">
                <h1>🛒 Purchases</h1>
                <Button onClick={handleOpenModal}>
                    + Record Purchase
                </Button>
            </div>

            {purchases.length === 0 ? (
                <Card className="text-center">
                    <p>No purchases recorded yet</p>
                </Card>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Supplier</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <tr key={purchase._id}>
                                    <td data-label="Date">
                                        {new Date(purchase.createdAt).toLocaleDateString('en-GB')}
                                    </td>
                                    <td data-label="Product">{purchase.productId?.name || 'N/A'}</td>
                                    <td data-label="Supplier">{purchase.supplierName || '-'}</td>
                                    <td data-label="Quantity">{purchase.quantity}</td>
                                    <td data-label="Unit Price">₹{parseFloat(purchase.costPrice).toFixed(2)}</td>
                                    <td data-label="Total Amount" style={{ fontWeight: 600 }}>
                                        ₹{parseFloat(purchase.totalAmount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record New Purchase"
            >
                <form onSubmit={handleSubmit}>
                    <Select
                        label="Product"
                        value={formData.productId}
                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                        options={products.map(p => ({
                            value: p._id,
                            label: `${p.name} (Current Stock: ${p.stock})`
                        }))}
                        required
                    />

                    <Input
                        label="Supplier Name"
                        type="text"
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        placeholder="Optional"
                    />

                    <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                    />

                    <Input
                        label="Cost Price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        required
                    />

                    {formData.quantity && formData.costPrice && (
                        <div className="badge badge-info" style={{ width: '100%', marginBottom: '1rem' }}>
                            Total Amount: ₹{(parseFloat(formData.quantity) * parseFloat(formData.costPrice)).toFixed(2)}
                        </div>
                    )}

                    <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" style={{ flex: 1 }}>
                            Record Purchase
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
