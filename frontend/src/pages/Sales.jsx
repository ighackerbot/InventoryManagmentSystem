import { useState, useEffect } from 'react';
import { salesAPI, productsAPI } from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const Sales = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currentStore } = useAuth();

    const [formData, setFormData] = useState({
        productId: '',
        quantity: '',
        sellingPrice: '',
        customerName: '',
    });

    useEffect(() => {
        if (currentStore) {
            fetchSales();
            fetchProducts();
        }
    }, [currentStore]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const { data } = await salesAPI.getAll({ limit: 100 });
            setSales(data.sales || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
            alert('Failed to fetch sales: ' + (error.response?.data?.error || error.message));
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
        setFormData({ productId: '', quantity: '', sellingPrice: '', customerName: '' });
        setIsModalOpen(true);
    };

    const handleProductChange = (e) => {
        const productId = e.target.value;
        setFormData({ ...formData, productId });

        // Auto-fill selling price
        const selectedProduct = products.find(p => p._id === productId);
        if (selectedProduct) {
            setFormData(prev => ({
                ...prev,
                productId,
                sellingPrice: selectedProduct.sellingPrice
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedProduct = products.find(p => p._id === formData.productId);
        if (selectedProduct && parseInt(formData.quantity) > selectedProduct.stock) {
            alert(`Insufficient stock! Available: ${selectedProduct.stock}`);
            return;
        }

        try {
            const saleData = {
                productId: formData.productId,
                quantity: parseInt(formData.quantity),
                sellingPrice: parseFloat(formData.sellingPrice),
                customerName: formData.customerName,
            };

            await salesAPI.create(saleData);

            await fetchSales();
            await fetchProducts(); // Refresh to get updated stock
            setIsModalOpen(false);
            setFormData({ productId: '', quantity: '', sellingPrice: '', customerName: '' });
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Failed to create sale: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!currentStore) {
        return (
            <div>
                <h1>💰 Sales</h1>
                <Card className="text-center">
                    <p>Please select a store to view sales</p>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-xl">
                <h1>💰 Sales</h1>
                <Button onClick={handleOpenModal}>
                    + Record Sale
                </Button>
            </div>

            {sales.length === 0 ? (
                <Card className="text-center">
                    <p>No sales recorded yet</p>
                </Card>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale._id}>
                                    <td data-label="Date">
                                        {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                                    </td>
                                    <td data-label="Product">{sale.productId?.name || 'N/A'}</td>
                                    <td data-label="Customer">{sale.customerName || '-'}</td>
                                    <td data-label="Quantity">{sale.quantity}</td>
                                    <td data-label="Unit Price">₹{parseFloat(sale.sellingPrice).toFixed(2)}</td>
                                    <td data-label="Total Amount" style={{ fontWeight: 600 }}>
                                        ₹{parseFloat(sale.totalAmount).toFixed(2)}
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
                title="Record New Sale"
            >
                <form onSubmit={handleSubmit}>
                    <Select
                        label="Product"
                        value={formData.productId}
                        onChange={handleProductChange}
                        options={products.map(p => ({
                            value: p._id,
                            label: `${p.name} (Stock: ${p.stock})`
                        }))}
                        required
                    />

                    <Input
                        label="Customer Name"
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                        label="Selling Price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        required
                    />

                    {formData.quantity && formData.sellingPrice && (
                        <div className="badge badge-info" style={{ width: '100%', marginBottom: '1rem' }}>
                            Total Amount: ₹{(parseFloat(formData.quantity) * parseFloat(formData.sellingPrice)).toFixed(2)}
                        </div>
                    )}

                    <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" style={{ flex: 1 }}>
                            Record Sale
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
