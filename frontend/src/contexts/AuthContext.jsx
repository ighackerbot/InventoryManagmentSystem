import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, storesAPI, setCurrentStore, getCurrentStore } from '../utils/api';

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

    const signUp = async (name, email, password, storeName, storeType, role, adminCode, teamCapacity) => {
        try {
            console.log('📤 Sending signup request with:', { name, email, storeName, storeType, role, adminCode, teamCapacity });

            const { data } = await authAPI.signup({
                name,
                email,
                password,
                storeName,
                storeType,
                role,
                adminCode,
                teamCapacity
            });

            console.log('📥 Received signup response:', data);

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Save store info
            const userStores = [{
                id: data.store.id,
                name: data.store.name,
                type: data.store.type,
                role: data.store.role || 'admin'
            }];
            console.log('💾 Saving stores:', userStores);
            localStorage.setItem('stores', JSON.stringify(userStores));

            // Set current store
            setCurrentStore(data.store.id);

            // Update state
            setUser(data.user);
            setStores(userStores);
            setCurrentStoreState(userStores[0]);

            console.log('✅ Signup completed successfully');
            return data;
        } catch (error) {
            console.error('❌ Signup error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                fullError: error
            });
            throw error;
        }
    };

    const joinStore = async (name, email, password, role, adminCode) => {
        try {
            console.log('📤 Sending join-store request:', { name, email, role, adminCode: adminCode ? '***' : 'missing' });

            const { data } = await authAPI.joinStore({
                name,
                email,
                password,
                role,
                adminCode
            });

            console.log('📥 Join-store response:', data);

            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Save store info
            const userStores = data.stores || [{
                id: data.store.id,
                name: data.store.name,
                type: data.store.type,
                role: data.store.role
            }];
            localStorage.setItem('stores', JSON.stringify(userStores));

            // Set current store
            setCurrentStore(userStores[0].id);

            // Update state
            setUser(data.user);
            setStores(userStores);
            setCurrentStoreState(userStores[0]);

            console.log('✅ Join-store completed successfully');
            return data;
        } catch (error) {
            console.error('❌ Join-store error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
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

    const refreshStores = async () => {
        try {
            const { data } = await storesAPI.getAll();
            const formattedStores = data.map(s => ({
                id: s._id,
                name: s.name,
                type: s.type,
                role: s.user_role
            }));
            localStorage.setItem('stores', JSON.stringify(formattedStores));
            setStores(formattedStores);
            return formattedStores;
        } catch (error) {
            console.error('Refresh stores error:', error);
            throw error;
        }
    };

    const createStore = async (storeName, storeType, adminPin, teamCapacity) => {
        try {
            const { data } = await storesAPI.create({
                name: storeName,
                type: storeType,
                adminPin,
                teamCapacity
            });

            // Refresh stores list from backend
            const updatedStores = await refreshStores();

            // Auto-switch to the new store
            const newStore = updatedStores.find(s => s.id === data._id);
            if (newStore) {
                setCurrentStore(newStore.id);
                setCurrentStoreState(newStore);
            }

            return data;
        } catch (error) {
            console.error('Create store error:', error);
            throw error;
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
        joinStore,
        signIn,
        staffLogin,
        signOut,
        switchStore,
        createStore,
        refreshStores,
        isAdmin,
        isStaff,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
