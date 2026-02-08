import { useState, useEffect } from 'react';
import { productsAPI } from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { isAdmin, currentStore, isStaff } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        lowStockThreshold: '10',
    });

    useEffect(() => {
        if (currentStore) {
            fetchProducts();
        }
    }, [currentStore]);

    useEffect(() => {
        // Filter products based on search
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await productsAPI.getAll({ sortBy: 'name', order: 'asc' });
            setProducts(data || []);
            setFilteredProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to fetch products: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku || '',
                description: product.description || '',
                costPrice: product.costPrice || '',
                sellingPrice: product.sellingPrice || '',
                stock: product.stock || 0,
                lowStockThreshold: product.lowStockThreshold || 10,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                sku: '',
                description: '',
                costPrice: '',
                sellingPrice: '',
                stock: '',
                lowStockThreshold: '10'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            sku: '',
            description: '',
            costPrice: '',
            sellingPrice: '',
            stock: '',
            lowStockThreshold: '10'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const productData = {
                name: formData.name,
                sku: formData.sku || null,
                description: formData.description,
                costPrice: parseFloat(formData.costPrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                stock: parseInt(formData.stock),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
            };

            if (editingProduct) {
                // Update
                await productsAPI.update(editingProduct._id, productData);
            } else {
                // Create
                await productsAPI.create(productData);
            }

            await fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await productsAPI.delete(id);
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product: ' + (error.response?.data?.error || error.message));
        }
    };

    const getStockBadge = (stock, threshold) => {
        if (stock === 0) return <span className="badge badge-error">Out of Stock</span>;
        if (stock <= threshold) return <span className="badge badge-warning">Low Stock</span>;
        if (stock < threshold * 5) return <span className="badge badge-info">Medium Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
    };

    if (loading) return <LoadingSpinner />;

    if (!currentStore) {
        return (
            <div>
                <h1>📦 Products</h1>
                <Card className="text-center">
                    <p>Please select a store to view products</p>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-xl">
                <h1>📦 Products</h1>
                {isAdmin() && (
                    <Button onClick={() => handleOpenModal()}>
                        + Add Product
                    </Button>
                )}
            </div>

            <Card className="mb-lg">
                <Input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Card>

            {filteredProducts.length === 0 ? (
                <Card className="text-center">
                    <p>No products found</p>
                </Card>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Description</th>
                                {!isStaff() && <th>Cost Price</th>}
                                {!isStaff() && <th>Selling Price</th>}
                                <th>Stock</th>
                                <th>Status</th>
                                {isAdmin() && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product._id}>
                                    <td data-label="Name" style={{ fontWeight: 600 }}>{product.name}</td>
                                    <td data-label="SKU">{product.sku || '-'}</td>
                                    <td data-label="Description">{product.description || '-'}</td>
                                    {!isStaff() && (
                                        <td data-label="Cost Price">₹{parseFloat(product.costPrice || 0).toFixed(2)}</td>
                                    )}
                                    {!isStaff() && (
                                        <td data-label="Selling Price">₹{parseFloat(product.sellingPrice || 0).toFixed(2)}</td>
                                    )}
                                    <td data-label="Stock">{product.stock}</td>
                                    <td data-label="Status">{getStockBadge(product.stock, product.lowStockThreshold)}</td>
                                    {isAdmin() && (
                                        <td data-label="Actions">
                                            <div className="flex gap-sm">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleOpenModal(product)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDelete(product._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Product Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        label="SKU (Optional)"
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="PROD-001"
                    />

                    <Input
                        label="Description"
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

                    <Input
                        label="Selling Price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        required
                    />

                    <Input
                        label="Stock Quantity"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                    />

                    <Input
                        label="Low Stock Threshold"
                        type="number"
                        min="0"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                        required
                    />

                    <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" style={{ flex: 1 }}>
                            {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleCloseModal} style={{ flex: 1 }}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
