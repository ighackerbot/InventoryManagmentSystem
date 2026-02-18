import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORE_TYPES = [
    'Warehouse & Logistics',
    'Retail Shop',
    'Godown',
    'Branch',
    'Distribution Center'
];

const StoreSwitcher = () => {
    const { stores, currentStore, switchStore, createStore } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newStore, setNewStore] = useState({
        name: '',
        type: 'Retail Shop',
        adminPin: '',
        teamCapacity: 50
    });
    const [error, setError] = useState('');

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        switchStore(storeId);
        window.location.reload();
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        if (!newStore.name.trim()) {
            setError('Store name is required');
            return;
        }
        setCreating(true);
        setError('');
        try {
            await createStore(newStore.name, newStore.type, newStore.adminPin, newStore.teamCapacity);
            setShowModal(false);
            setNewStore({ name: '', type: 'Retail Shop', adminPin: '', teamCapacity: 50 });
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create store');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="store-switcher">
                {stores && stores.length > 1 ? (
                    <select
                        value={currentStore?.id || ''}
                        onChange={handleStoreChange}
                        className="store-select"
                        title="Switch Store"
                    >
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name} ({store.role})
                            </option>
                        ))}
                    </select>
                ) : (
                    <span className="store-name-display">
                        🏪 {currentStore?.name || 'No Store'}
                    </span>
                )}

                <button
                    className="btn-add-store"
                    onClick={() => setShowModal(true)}
                    title="Create New Inventory"
                >
                    +
                </button>
            </div>

            {/* Create Store Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3>🏪 Create New Inventory</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateStore}>
                            <div className="form-group">
                                <label className="form-label">Store Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newStore.name}
                                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                                    placeholder="e.g. My Electronics Shop"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Store Type *</label>
                                <select
                                    className="form-input"
                                    value={newStore.type}
                                    onChange={(e) => setNewStore({ ...newStore, type: e.target.value })}
                                >
                                    {STORE_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Admin PIN (for team members to join)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newStore.adminPin}
                                    onChange={(e) => setNewStore({ ...newStore, adminPin: e.target.value })}
                                    placeholder="e.g. 1234"
                                    maxLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Team Capacity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newStore.teamCapacity}
                                    onChange={(e) => setNewStore({ ...newStore, teamCapacity: parseInt(e.target.value) || 50 })}
                                    min={1}
                                    max={200}
                                />
                            </div>

                            <div className="flex gap-md mt-lg">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={creating}
                                    style={{ flex: 1 }}
                                >
                                    {creating ? 'Creating...' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default StoreSwitcher;
