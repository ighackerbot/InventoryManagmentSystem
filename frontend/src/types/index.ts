// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'coadmin' | 'staff';

export interface User {
    id: string;
    name: string;
    email: string;
    roleType: UserRole;
    createdAt?: string;
}

export interface Store {
    id: string;
    name: string;
    type: string;
    role: UserRole;
    currency?: string;
}

export interface Product {
    _id: string;
    storeId: string;
    name: string;
    sku?: string;
    description?: string;
    stock: number;
    costPrice?: number;
    sellingPrice: number;
    lowStockThreshold: number;
    isLowStock?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface SaleProduct {
    _id: string;
    name: string;
    sku?: string;
    costPrice?: number;
    sellingPrice?: number;
}

export interface Sale {
    _id: string;
    storeId: string;
    productId: string | SaleProduct;
    quantity: number;
    sellingPrice: number;
    totalAmount: number;
    customerName?: string;
    createdBy: string | { _id: string; name: string; email: string };
    createdAt: string;
    updatedAt?: string;
}

export interface Purchase {
    _id: string;
    storeId: string;
    productId: string | SaleProduct;
    quantity: number;
    costPrice: number;
    totalAmount: number;
    supplierName?: string;
    createdBy: string | { _id: string; name: string; email: string };
    createdAt: string;
    updatedAt?: string;
}

export interface DashboardStats {
    totalSales: number;
    totalPurchases: number;
    currentStock: number;
    netRevenue: number;
    recentSales: Sale[];
    recentPurchases: Purchase[];
    topProducts: Array<{ _id: string; name: string; totalQuantity: number; totalRevenue: number }>;
    lowStockProducts: Array<{ _id: string; name: string; stock: number; lowStockThreshold: number }>;
}

// ─── Auth Context Types ───────────────────────────────────────────────────────

export interface AuthContextValue {
    user: User | null;
    stores: Store[];
    currentStore: Store | null;
    loading: boolean;
    isGuest: boolean;
    signUp: (name: string, email: string, password: string, storeName: string, storeType: string, role: string, adminCode: string, teamCapacity: number) => Promise<unknown>;
    joinStore: (name: string, email: string, password: string, role: string, adminCode: string) => Promise<unknown>;
    signIn: (email: string, password: string) => Promise<unknown>;
    staffLogin: (email: string, password: string) => Promise<unknown>;
    signOut: () => Promise<void>;
    continueAsGuest: () => Promise<unknown>;
    switchStore: (storeId: string) => void;
    createStore: (storeName: string, storeType: string, adminPin: string, teamCapacity: number) => Promise<unknown>;
    refreshStores: () => Promise<Store[]>;
    isAdmin: () => boolean;
    isStaff: () => boolean;
    hasRole: (roles: UserRole[]) => boolean;
}
