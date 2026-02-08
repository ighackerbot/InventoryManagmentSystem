import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, setCurrentStore, getCurrentStore } from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [stores, setStores] = useState([]);
    const [currentStore, setCurrentStoreState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedStores = localStorage.getItem('stores');
        const currentStoreId = getCurrentStore();

        if (token && savedUser) {
            const parsedUser = JSON.parse(savedUser);
            const parsedStores = savedStores ? JSON.parse(savedStores) : [];

            setUser(parsedUser);
            setStores(parsedStores);

            // Set current store if exists
            if (currentStoreId && parsedStores.length > 0) {
                const store = parsedStores.find(s => s.id === currentStoreId);
                setCurrentStoreState(store || parsedStores[0]);
            } else if (parsedStores.length > 0) {
                // Auto-select first store
                setCurrentStoreState(parsedStores[0]);
                setCurrentStore(parsedStores[0].id);
            }
        }

        setLoading(false);
    }, []);

    const signUp = async (name, email, password, storeName, storeType) => {
        try {
            const { data } = await authAPI.signup({
                name,
                email,
                password,
                storeName,
                storeType
            });

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Save store info
            const userStores = [data.store];
            localStorage.setItem('stores', JSON.stringify(userStores));

            // Set current store
            setCurrentStore(data.store.id);

            // Update state
            setUser(data.user);
            setStores(userStores);
            setCurrentStoreState(data.store);

            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data } = await authAPI.signin({ email, password });

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('stores', JSON.stringify(data.stores));

            // Set current store (first store by default)
            if (data.stores && data.stores.length > 0) {
                setCurrentStore(data.stores[0].id);
                setCurrentStoreState(data.stores[0]);
            }

            // Update state
            setUser(data.user);
            setStores(data.stores || []);

            return data;
        } catch (error) {
            console.error('Signin error:', error);
            throw error;
        }
    };

    const staffLogin = async (email, password) => {
        try {
            const { data } = await authAPI.staffLogin({ email, password });

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('stores', JSON.stringify(data.stores));

            // Set current store (first store by default)
            if (data.stores && data.stores.length > 0) {
                setCurrentStore(data.stores[0].id);
                setCurrentStoreState(data.stores[0]);
            }

            // Update state
            setUser(data.user);
            setStores(data.stores || []);

            return data;
        } catch (error) {
            console.error('Staff login error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await authAPI.signout();
        } catch (error) {
            console.error('Signout error:', error);
        } finally {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('stores');
            localStorage.removeItem('currentStoreId');

            // Clear state
            setUser(null);
            setStores([]);
            setCurrentStoreState(null);
        }
    };

    const switchStore = (storeId) => {
        const store = stores.find(s => s.id === storeId);
        if (store) {
            setCurrentStore(storeId);
            setCurrentStoreState(store);
        }
    };

    const isAdmin = () => {
        if (!currentStore) return false;
        return currentStore.role === 'admin' || currentStore.role === 'coadmin';
    };

    const isStaff = () => {
        if (!currentStore) return false;
        return currentStore.role === 'staff';
    };

    const hasRole = (roles) => {
        if (!currentStore) return false;
        return roles.includes(currentStore.role);
    };

    const value = {
        user,
        stores,
        currentStore,
        loading,
        signUp,
        signIn,
        staffLogin,
        signOut,
        switchStore,
        isAdmin,
        isStaff,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
