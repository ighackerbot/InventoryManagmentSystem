import clsx from 'clsx';

export const cn = (...inputs) => clsx(inputs);

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatCompactCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (value, options = {}) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(value));

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'IM';

export const getTrend = (current, baseline) => {
  if (!baseline) {
    return { value: current ? 100 : 0, direction: current >= 0 ? 'up' : 'down' };
  }

  const delta = ((current - baseline) / Math.abs(baseline)) * 100;
  return {
    value: Math.abs(delta),
    direction: delta >= 0 ? 'up' : 'down',
  };
};

export const groupTransactionsByDay = (transactions = [], amountKey = 'totalAmount') => {
  const map = new Map();

  transactions.forEach((item) => {
    const date = new Date(item.createdAt);
    const label = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
    const previous = map.get(label) || 0;
    map.set(label, previous + (Number(item[amountKey]) || 0));
  });

  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
};

export const paginate = (items = [], page = 1, pageSize = 8) => {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};
