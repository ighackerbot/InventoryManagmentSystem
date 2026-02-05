import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
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
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        product_id: '',
        quantity: '',
        unit_price: '',
        supplier: '',
    });

    useEffect(() => {
        fetchPurchases();
        fetchProducts();
    }, []);

    const fetchPurchases = async () => {
        try {
            const { data, error } = await supabase
                .from('purchases')
                .select('*, product:products(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPurchases(data || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleOpenModal = () => {
        setFormData({ product_id: '', quantity: '', unit_price: '', supplier: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const total_amount = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
            const selectedProduct = products.find(p => p.id === formData.product_id);

            const { error } = await supabase
                .from('purchases')
                .insert([{
                    product_id: formData.product_id,
                    quantity: parseInt(formData.quantity),
                    unit_price: parseFloat(formData.unit_price),
                    total_amount,
                    supplier: formData.supplier,
                    user_id: user.id,
                }]);

            if (error) throw error;

            // Update product stock
            await supabase
                .from('products')
                .update({ stock: selectedProduct.stock + parseInt(formData.quantity) })
                .eq('id', formData.product_id);

            await fetchPurchases();
            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating purchase:', error);
            alert('Failed to create purchase: ' + error.message);
        }
    };

    if (loading) return <LoadingSpinner />;

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
                                <tr key={purchase.id}>
                                    <td data-label="Date">{new Date(purchase.created_at).toLocaleDateString()}</td>
                                    <td data-label="Product">{purchase.product?.name}</td>
                                    <td data-label="Supplier">{purchase.supplier}</td>
                                    <td data-label="Quantity">{purchase.quantity}</td>
                                    <td data-label="Unit Price">₹{parseFloat(purchase.unit_price).toFixed(2)}</td>
                                    <td data-label="Total Amount" style={{ fontWeight: 600 }}>₹{parseFloat(purchase.total_amount).toFixed(2)}</td>
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
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        options={products.map(p => ({
                            value: p.id,
                            label: `${p.name} (Current Stock: ${p.stock})`
                        }))}
                        required
                    />

                    <Input
                        label="Supplier Name"
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        required
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
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        required
                    />

                    {formData.quantity && formData.unit_price && (
                        <div className="badge badge-info" style={{ width: '100%', marginBottom: '1rem' }}>
                            Total Amount: ₹{(parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)}
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
