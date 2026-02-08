import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const StoreSwitcher = () => {
    const { stores, currentStore, switchStore } = useAuth();

    if (!stores || stores.length <= 1) {
        return null; // Don't show switcher if user has only one store
    }

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        switchStore(storeId);
        // Reload the page to fetch new data for the selected store
        window.location.reload();
    };

    return (
        <div className="store-switcher">
            <label htmlFor="store-select" className="store-label">
                Current Store:
            </label>
            <select
                id="store-select"
                value={currentStore?.id || ''}
                onChange={handleStoreChange}
                className="store-select"
            >
                {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                        {store.name} ({store.type}) - {store.role}
                    </option>
                ))}
            </select>
            <Link to="/stores" className="manage-stores-link">
                Manage Stores
            </Link>
        </div>
    );
};

export default StoreSwitcher;
