import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import './CreateStore.css';

function CreateStore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<'medusa' | 'woocommerce'>('medusa');
  const [template, setTemplate] = useState('starter');

  const createMutation = useMutation({
    mutationFn: storeApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      navigate(`/stores/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    createMutation.mutate({ name, engine, template });
  };

  return (
    <div className="create-store">
      <h2>Create New Store</h2>
      <form onSubmit={handleSubmit} className="create-store-form">
        <div className="form-group">
          <label htmlFor="name">Store Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Store"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="engine">Store Engine</label>
          <select
            id="engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value as 'medusa' | 'woocommerce')}
          >
            <option value="medusa">MedusaJS</option>
            <option value="woocommerce" disabled>
              WooCommerce (Coming Soon)
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="template">Template</label>
          <select
            id="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="starter">Starter</option>
          </select>
        </div>

        {createMutation.isError && (
          <div className="error-message">
            Failed to create store. Please try again.
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateStore;
