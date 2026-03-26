import { useState } from 'react';
import { Building2, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastProvider';
import { Button } from './Button';
import { Input, Select } from './Input';
import { Modal } from './Modal';

const STORE_TYPES = ['Warehouse & Logistics', 'Retail Shop', 'Godown', 'Branch', 'Distribution Center'];

const StoreSwitcher = () => {
  const { stores, currentStore, switchStore, createStore, isGuest } = useAuth();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    type: 'Retail Shop',
    adminPin: '',
    teamCapacity: 50,
  });

  const handleCreateStore = async (event) => {
    event.preventDefault();
    if (!newStore.name.trim()) return;

    setCreating(true);
    try {
      await createStore(newStore.name, newStore.type, newStore.adminPin, newStore.teamCapacity);
      toast.success('New workspace created successfully.');
      setShowModal(false);
      setNewStore({ name: '', type: 'Retail Shop', adminPin: '', teamCapacity: 50 });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <select
            value={currentStore?.id || ''}
            onChange={(event) => switchStore(event.target.value)}
            className="h-11 rounded-[18px] border border-neutral-200 bg-white pl-10 pr-10 text-sm font-medium text-neutral-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          >
            {(stores || []).map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.role})
              </option>
            ))}
          </select>
        </div>
        {!isGuest ? (
          <Button variant="secondary" size="sm" icon={PlusCircle} onClick={() => setShowModal(true)}>
            New Workspace
          </Button>
        ) : null}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create a new workspace"
        description="Set up another inventory space for a new branch, warehouse, or team."
      >
        <form className="space-y-6" onSubmit={handleCreateStore}>
          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
            <div>
              <h4 className="text-base font-semibold text-neutral-950">Store Info</h4>
              <p className="mt-1 text-sm text-neutral-500">These settings help your team identify and join the right workspace.</p>
            </div>
            <Input
              label="Store name"
              placeholder="North India Distribution Center"
              value={newStore.name}
              onChange={(event) => setNewStore({ ...newStore, name: event.target.value })}
              required
            />
            <Select
              label="Store type"
              value={newStore.type}
              onChange={(event) => setNewStore({ ...newStore, type: event.target.value })}
              options={STORE_TYPES.map((type) => ({ value: type, label: type }))}
            />
          </div>

          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h4 className="text-base font-semibold text-neutral-950">Team Settings</h4>
              <p className="mt-1 text-sm text-neutral-500">Keep onboarding friction low while preserving access control.</p>
            </div>
            <Input
              label="Admin PIN"
              placeholder="Optional"
              value={newStore.adminPin}
              onChange={(event) => setNewStore({ ...newStore, adminPin: event.target.value })}
              hint="Used by teammates joining this workspace"
            />
            <Input
              label="Team capacity"
              type="number"
              min="1"
              max="200"
              value={newStore.teamCapacity}
              onChange={(event) => setNewStore({ ...newStore, teamCapacity: Number(event.target.value) || 50 })}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default StoreSwitcher;
