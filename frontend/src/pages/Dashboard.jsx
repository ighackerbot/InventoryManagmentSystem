import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../utils/api';
import { Card } from '../components/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

export const Dashboard = () => {
    const { currentStore } = useAuth();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPurchases: 0,
        currentStock: 0,
        netRevenue: 0,
        recentSales: [],
        recentPurchases: [],
        topProducts: [],
        lowStockProducts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentStore) {
            fetchStats();
        }
    }, [currentStore]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data } = await reportsAPI.getDashboard();
            setStats(data || {});
        } catch (error) {
            console.error('Error fetching stats:', error);
            alert('Failed to load dashboard: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return <div className="flex justify-center p-xl"><div className="spinner"></div></div>;
    }

    if (!currentStore) {
        return (
            <div className="container mt-lg">
                <h1>📊 Dashboard</h1>
                <Card className="text-center">
                    <p>Please select a store to view the dashboard</p>
                </Card>
            </div>
        );
    }

    // Prepare chart data
    const salesByProduct = (stats.topProducts || []).map(p => ({
        name: p.name,
        sales: p.totalQuantity,
        revenue: p.totalRevenue
    }));

    const stockByProduct = (stats.lowStockProducts || []).map(p => ({
        name: p.name,
        value: p.stock
    }));

    return (
        <div className="container mt-lg">
            <h1>📊 Dashboard - {currentStore.name}</h1>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-value">{formatCurrency(stats.totalSales)}</div>
                    <div className="stat-label">Total Sales</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--gradient-accent)' }}>
                    <div className="stat-value">{formatCurrency(stats.totalPurchases)}</div>
                    <div className="stat-label">Total Purchases</div>
                </div>
                <div className="stat-card" style={{ background: stats.netRevenue >= 0 ? '#10B981' : '#EF4444' }}>
                    <div className="stat-value">{formatCurrency(stats.netRevenue)}</div>
                    <div className="stat-label">Net Revenue</div>
                </div>
                <div className="stat-card" style={{ background: '#F59E0B' }}>
                    <div className="stat-value">{stats.currentStock || 0}</div>
                    <div className="stat-label">Current Stock Units</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-lg mt-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
                <Card>
                    <h2 className="text-center mb-lg">Top Products by Sales</h2>
                    {salesByProduct.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={salesByProduct} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                    <h2 className="text-center mb-lg">Low Stock Products</h2>
                    {stockByProduct.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockByProduct}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {stockByProduct.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'][index % 10]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p className="text-center text-gray-500">No low stock products</p>}
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-lg mt-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card">
                    <h2 className="mb-md">Recent Sales</h2>
                    {stats.recentSales?.length > 0 ? (
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
                                    {stats.recentSales.map(s => (
                                        <tr key={s._id}>
                                            <td data-label="Product">{s.productId?.name || 'N/A'}</td>
                                            <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                                            <td data-label="Date">{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
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
                    {stats.recentPurchases?.length > 0 ? (
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
                                    {stats.recentPurchases.map(p => (
                                        <tr key={p._id}>
                                            <td data-label="Product">{p.productId?.name || 'N/A'}</td>
                                            <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(p.totalAmount)}</td>
                                            <td data-label="Date">{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
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
