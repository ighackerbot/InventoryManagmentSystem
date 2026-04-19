import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../utils/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart
} from 'recharts';

interface ProductStat {
    _id: string;
    name: string;
    stock: number;
    total_sold: number;
    total_purchased: number;
    revenue: number;
    cost: number;
    profit_loss: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export const Reports = () => {
    const { currentStore } = useAuth();
    const [stats, setStats] = useState<ProductStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentStore) return;
        const fetchReports = async () => {
            try {
                const { data } = await reportsAPI.getStats();
                setStats(data || []);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [currentStore]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

    const salesData = stats
        .map(item => ({ name: item.name, sales: item.total_sold, revenue: item.revenue }))
        .filter(item => item.sales > 0 || item.revenue > 0)
        .slice(0, 10);

    const stockData = stats
        .map(item => ({ name: item.name, value: item.stock }))
        .filter(item => item.value > 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mt-lg">
            <h1>Reports Dashboard</h1>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Card>
                    <h2 className="text-center mb-lg">Sales Overview</h2>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" orientation="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="sales" name="Units Sold" fill="#8884d8">
                                    {salesData.map((item, index) => (
                                        <Cell key={item.name} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index % 5]} />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#82ca9d" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-center mb-lg">Stock Levels</h2>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stockData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={2} dataKey="value" label>
                                    {stockData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card className="mt-xl">
                <h2 className="mb-lg">Detailed Financial Report</h2>
                <div className="table-container" style={{ maxHeight: 'none', overflow: 'visible' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Total Purchased</th>
                                <th>Total Sold</th>
                                <th>Current Stock</th>
                                <th>Revenue</th>
                                <th>Profit/Loss</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((item) => (
                                <tr key={item._id}>
                                    <td data-label="Product" style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td data-label="Total Purchased">{item.total_purchased}</td>
                                    <td data-label="Total Sold">{item.total_sold}</td>
                                    <td data-label="Current Stock">{item.stock}</td>
                                    <td data-label="Revenue">{formatCurrency(item.revenue)}</td>
                                    <td data-label="Profit/Loss" style={{
                                        color: item.profit_loss >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                                        fontWeight: 600
                                    }}>
                                        {formatCurrency(item.profit_loss)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
