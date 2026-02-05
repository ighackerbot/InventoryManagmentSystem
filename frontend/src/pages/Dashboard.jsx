import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Card } from '../components/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Line, ComposedChart
} from 'recharts';

export const Dashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        total_sales: 0,
        total_purchases: 0,
        current_stock: 0,
        net_revenue: 0,
        recent_sales: [],
        recent_purchases: [],
        salesByProduct: [],
        stockByProduct: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch directly from Supabase
            const [salesRes, purchasesRes, productsRes] = await Promise.all([
                supabase.from('sales').select('*, product:products(name)'),
                supabase.from('purchases').select('*, product:products(name)'),
                supabase.from('products').select('id, name, stock')
            ]);

            const sales = salesRes.data || [];
            const purchases = purchasesRes.data || [];
            const products = productsRes.data || [];

            // Calculate totals
            const total_sales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
            const total_purchases = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
            const current_stock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
            const net_revenue = total_sales - total_purchases;

            // Get recent activity (last 5)
            const recent_sales = [...sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
            const recent_purchases = [...purchases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

            // Aggregate sales by product for chart
            const salesMap = {};
            sales.forEach(s => {
                const name = s.product?.name || 'Unknown';
                if (!salesMap[name]) salesMap[name] = { name, sales: 0, revenue: 0 };
                salesMap[name].sales += s.quantity || 0;
                salesMap[name].revenue += s.total_amount || 0;
            });
            const salesByProduct = Object.values(salesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

            // Stock by product for pie chart
            const stockByProduct = products
                .filter(p => p.stock > 0)
                .map(p => ({ name: p.name, value: p.stock }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            setStats({
                total_sales,
                total_purchases,
                current_stock,
                net_revenue,
                recent_sales,
                recent_purchases,
                salesByProduct,
                stockByProduct
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return <div className="flex justify-center p-xl"><div className="spinner"></div></div>;
    }

    return (
        <div className="container mt-lg">
            <h1>Dashboard Report</h1>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-value">{formatCurrency(stats.total_sales)}</div>
                    <div className="stat-label">Total Sales</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--gradient-accent)' }}>
                    <div className="stat-value">{formatCurrency(stats.total_purchases)}</div>
                    <div className="stat-label">Total Purchases</div>
                </div>
                <div className="stat-card" style={{ background: stats.net_revenue >= 0 ? '#10B981' : '#EF4444' }}>
                    <div className="stat-value">{formatCurrency(stats.net_revenue)}</div>
                    <div className="stat-label">Net Revenue</div>
                </div>
                <div className="stat-card" style={{ background: '#F59E0B' }}>
                    <div className="stat-value">{stats.current_stock}</div>
                    <div className="stat-label">Current Stock Units</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-lg mt-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
                <Card>
                    <h2 className="text-center mb-lg">Sales Overview</h2>
                    {stats.salesByProduct.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={stats.salesByProduct} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                                    <YAxis yAxisId="left" orientation="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue (₹)' : 'Units Sold']} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="sales" name="Units Sold" fill="#8884d8" />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#82ca9d" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p className="text-center text-gray-500">No sales data to display</p>}
                </Card>

                <Card>
                    <h2 className="text-center mb-lg">Stock Levels</h2>
                    {stats.stockByProduct.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.stockByProduct}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {stats.stockByProduct.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'][index % 10]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p className="text-center text-gray-500">No stock data to display</p>}
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-lg mt-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card">
                    <h2 className="mb-md">Recent Sales</h2>
                    {stats.recent_sales?.length > 0 ? (
                        <div className="table-container" style={{ boxShadow: 'none', background: 'transparent' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_sales.map(s => (
                                        <tr key={s.id}>
                                            <td data-label="Product">{s.product?.name}</td>
                                            <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</td>
                                            <td data-label="Date">{new Date(s.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-500">No recent sales</p>}
                    <div className="mt-md">
                        <a href="/sales" className="btn btn-sm btn-primary">View All Sales</a>
                    </div>
                </div>

                <div className="card">
                    <h2 className="mb-md">Recent Purchases</h2>
                    {stats.recent_purchases?.length > 0 ? (
                        <div className="table-container" style={{ boxShadow: 'none', background: 'transparent' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_purchases.map(p => (
                                        <tr key={p.id}>
                                            <td data-label="Product">{p.product?.name}</td>
                                            <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(p.total_amount)}</td>
                                            <td data-label="Date">{new Date(p.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-500">No recent purchases</p>}
                    <div className="mt-md">
                        <a href="/purchases" className="btn btn-sm btn-secondary">View All Purchases</a>
                    </div>
                </div>
            </div>
        </div>
    );
};


