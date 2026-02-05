import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
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
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        product_id: '',
        quantity: '',
        unit_price: '',
        customer: '',
    });

    useEffect(() => {
        fetchSales();
        fetchProducts();
    }, []);

    // const fetchSales = async () => {
    //     try {
    //         const { data, error } = await supabase
    //             .from('sales')
    //             .select('*, product:products(name)')
    //             .order('created_at', { ascending: false });

    //         if (error) throw error;
    //         setSales(data || []);
    //     } catch (error) {
    //         console.error('Error fetching sales:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const fetchSales = async () => {
        try {
            const { data, error } = await supabase
                .from('sales')
                .select(`
              id,
              created_at,
              product_name,
              customer,
              quantity,
              unit_price,
              total_amount
            `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
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
        setFormData({ product_id: '', quantity: '', unit_price: '', customer: '' });
        setIsModalOpen(true);
    };

    const handleProductChange = (e) => {
        const productId = e.target.value;
        setFormData({ ...formData, product_id: productId });

        // Auto-fill price
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
            setFormData(prev => ({ ...prev, product_id: productId, unit_price: selectedProduct.price }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedProduct = products.find(p => p.id === formData.product_id);
        if (selectedProduct && parseInt(formData.quantity) > selectedProduct.stock) {
            alert(`Insufficient stock! Available: ${selectedProduct.stock}`);
            return;
        }

        try {
            const total_amount = parseFloat(formData.quantity) * parseFloat(formData.unit_price);

            const { error } = await supabase
                .from('sales')
                .insert([{
                    product_id: formData.product_id,
                    quantity: parseInt(formData.quantity),
                    unit_price: parseFloat(formData.unit_price),
                    total_amount,
                    customer: formData.customer,
                    user_id: user.id,
                }]);

            if (error) {
                // Check for duplicate sale error
                if (error.code === '23505') {
                    alert('Duplicate sale detected! This sale appears to be a duplicate.');
                } else {
                    throw error;
                }
                return;
            }

            // Update product stock
            await supabase
                .from('products')
                .update({ stock: selectedProduct.stock - parseInt(formData.quantity) })
                .eq('id', formData.product_id);

            await fetchSales();
            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Failed to create sale: ' + error.message);
        }
    };

    if (loading) return <LoadingSpinner />;

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
                                <tr key={sale.id}>
                                    <td data-label="Date">
                                        {new Date(sale.created_at).toLocaleDateString('en-GB')}
                                    </td>
                                    {/* <td data-label="Product">{sale.product?.name}</td> */}
                                    <td data-label="Product">{sale.product_name ? sale.product_name : sale.product?.name}</td>

                                    <td data-label="Customer">{sale.customer}</td>
                                    <td data-label="Quantity">{sale.quantity}</td>
                                    <td data-label="Unit Price">₹{parseFloat(sale.unit_price).toFixed(2)}</td>
                                    <td data-label="Total Amount" style={{ fontWeight: 600 }}>₹{parseFloat(sale.total_amount).toFixed(2)}</td>
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
                        value={formData.product_id}
                        onChange={handleProductChange}
                        options={products.map(p => ({
                            value: p.id,
                            label: `${p.name} (Stock: ${p.stock})`
                        }))}
                        required
                    />

                    <Input
                        label="Customer Name"
                        type="text"
                        value={formData.customer}
                        onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
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
