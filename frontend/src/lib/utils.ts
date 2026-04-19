import clsx, { ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

export const formatCompactCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
    }).format(Number(amount) || 0);

export const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (value: string | Date, options: Intl.DateTimeFormatOptions = {}) =>
    new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', ...options,
    }).format(new Date(value));

export const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2)
        .map((part) => part[0]?.toUpperCase()).join('') || 'IM';

export interface Trend { value: number; direction: 'up' | 'down'; }

export const getTrend = (current: number, baseline: number): Trend => {
    if (!baseline) return { value: current ? 100 : 0, direction: current >= 0 ? 'up' : 'down' };
    const delta = ((current - baseline) / Math.abs(baseline)) * 100;
    return { value: Math.abs(delta), direction: delta >= 0 ? 'up' : 'down' };
};

export const groupTransactionsByDay = (
    transactions: Array<Record<string, unknown>> = [],
    amountKey = 'totalAmount'
): Array<{ label: string; value: number }> => {
    const map = new Map<string, number>();
    transactions.forEach((item) => {
        const date = new Date(item.createdAt as string);
        const label = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
        const previous = map.get(label) || 0;
        map.set(label, previous + (Number(item[amountKey]) || 0));
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
};

export const paginate = <T>(items: T[] = [], page = 1, pageSize = 8): T[] => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
};
