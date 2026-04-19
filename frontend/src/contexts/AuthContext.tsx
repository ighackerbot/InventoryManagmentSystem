import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, guestAPI, storesAPI, setCurrentStore, getCurrentStore } from '../utils/api';
import type { AuthContextValue, User, Store, UserRole } from '../types/index';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedStores = localStorage.getItem('stores');
        const currentStoreId = getCurrentStore();

        if (token && savedUser) {
            const parsedUser: User = JSON.parse(savedUser);
            const parsedStores: Store[] = savedStores ? JSON.parse(savedStores) : [];
            setUser(parsedUser);
            setStores(parsedStores);
            if (currentStoreId && parsedStores.length > 0) {
                const store = parsedStores.find(s => s.id === currentStoreId);
                setCurrentStoreState(store || parsedStores[0]);
            } else if (parsedStores.length > 0) {
                setCurrentStoreState(parsedStores[0]);
                setCurrentStore(parsedStores[0].id);
            }
        } else {
            const guestId = localStorage.getItem('guestId');
            if (guestId) setIsGuest(true);
        }
        setLoading(false);
    }, []);

    const continueAsGuest = async () => {
        const { data } = await guestAPI.start();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('stores', JSON.stringify(data.stores));
        localStorage.setItem('guestId', data.user.email);
        if (data.stores?.length > 0) {
            setCurrentStore(data.stores[0].id);
            setCurrentStoreState(data.stores[0]);
        }
        setUser(data.user);
        setStores(data.stores || []);
        setIsGuest(true);
        return data;
    };

    const signUp = async (name: string, email: string, password: string, storeName: string, storeType: string, role: string, adminCode: string, teamCapacity: number) => {
        const { data } = await authAPI.signup({ name, email, password, storeName, storeType, role, adminCode, teamCapacity });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const userStores: Store[] = [{ id: data.store.id, name: data.store.name, type: data.store.type, role: data.store.role || 'admin' }];
        localStorage.setItem('stores', JSON.stringify(userStores));
        setCurrentStore(data.store.id);
        setUser(data.user);
        setStores(userStores);
        setCurrentStoreState(userStores[0]);
        return data;
    };

    const joinStore = async (name: string, email: string, password: string, role: string, adminCode: string) => {
        const { data } = await authAPI.joinStore({ name, email, password, role, adminCode });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const userStores: Store[] = data.stores || [{ id: data.store.id, name: data.store.name, type: data.store.type, role: data.store.role }];
        localStorage.setItem('stores', JSON.stringify(userStores));
        setCurrentStore(userStores[0].id);
        setUser(data.user);
        setStores(userStores);
        setCurrentStoreState(userStores[0]);
        return data;
    };

    const signIn = async (email: string, password: string) => {
        const { data } = await authAPI.signin({ email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('stores', JSON.stringify(data.stores));
        if (data.stores?.length > 0) {
            setCurrentStore(data.stores[0].id);
            setCurrentStoreState(data.stores[0]);
        }
        setUser(data.user);
        setStores(data.stores || []);
        return data;
    };

    const staffLogin = async (email: string, password: string) => {
        const { data } = await authAPI.staffLogin({ email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('stores', JSON.stringify(data.stores));
        if (data.stores?.length > 0) {
            setCurrentStore(data.stores[0].id);
            setCurrentStoreState(data.stores[0]);
        }
        setUser(data.user);
        setStores(data.stores || []);
        return data;
    };

    const signOut = async () => {
        try {
            if (!isGuest) await authAPI.signout();
        } catch (error) {
            console.error('Signout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('stores');
            localStorage.removeItem('currentStoreId');
            localStorage.removeItem('guestId');
            setUser(null);
            setStores([]);
            setCurrentStoreState(null);
            setIsGuest(false);
        }
    };

    const switchStore = (storeId: string) => {
        const store = stores.find(s => s.id === storeId);
        if (store) { setCurrentStore(storeId); setCurrentStoreState(store); }
    };

    const refreshStores = async (): Promise<Store[]> => {
        const { data } = await storesAPI.getAll();
        const formattedStores: Store[] = data.map((s: { _id: string; name: string; type: string; user_role: UserRole }) => ({
            id: s._id, name: s.name, type: s.type, role: s.user_role
        }));
        localStorage.setItem('stores', JSON.stringify(formattedStores));
        setStores(formattedStores);
        return formattedStores;
    };

    const createStore = async (storeName: string, storeType: string, adminPin: string, teamCapacity: number) => {
        const { data } = await storesAPI.create({ name: storeName, type: storeType, adminPin, teamCapacity });
        const updatedStores = await refreshStores();
        const newStore = updatedStores.find(s => s.id === data._id);
        if (newStore) { setCurrentStore(newStore.id); setCurrentStoreState(newStore); }
        return data;
    };

    const isAdmin = () => !!(currentStore && (currentStore.role === 'admin' || currentStore.role === 'coadmin'));
    const isStaff = () => !!(currentStore && currentStore.role === 'staff');
    const hasRole = (roles: UserRole[]) => !!(currentStore && roles.includes(currentStore.role));

    const value: AuthContextValue = {
        user, stores, currentStore, loading, isGuest,
        signUp, joinStore, signIn, staffLogin, signOut, continueAsGuest,
        switchStore, createStore, refreshStores, isAdmin, isStaff, hasRole
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
