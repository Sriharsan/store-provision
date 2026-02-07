import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi, eventApi, Store, StoreEvent } from '../services/api';
import './StoreDetail.css';

function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ['stores', id],
    queryFn: () => storeApi.getById(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<StoreEvent[]>({
    queryKey: ['events', id],
    queryFn: () => eventApi.getByStoreId(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this store?')) {
      return;
    }
    try {
      await storeApi.delete(id);
      navigate('/');
    } catch (error) {
      alert('Failed to delete store');
    }
  };

  if (storeLoading) {
    return <div className="loading">Loading store details...</div>;
  }

  if (!store) {
    return <div className="error">Store not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'status-ready';
      case 'PROVISIONING':
        return 'status-provisioning';
      case 'FAILED':
        return 'status-failed';
      case 'DELETING':
        return 'status-deleting';
      default:
        return 'status-requested';
    }
  };

  return (
    <div className="store-detail">
      <div className="store-detail-header">
        <button className="btn-link" onClick={() => navigate('/')}>
          ← Back to Stores
        </button>
        <h2>{store.name}</h2>
        {store.status === 'READY' && (
          <button className="btn-danger" onClick={handleDelete}>
            Delete Store
          </button>
        )}
      </div>

      <div className="store-detail-content">
        <div className="store-info-card">
          <h3>Store Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Status</label>
              <span className={`status-badge ${getStatusColor(store.status)}`}>
                {store.status}
              </span>
            </div>
            <div className="info-item">
              <label>Engine</label>
              <span>{store.engine}</span>
            </div>
            <div className="info-item">
              <label>Template</label>
              <span>{store.template || 'starter'}</span>
            </div>
            <div className="info-item">
              <label>Namespace</label>
              <span>{store.namespace}</span>
            </div>
            {store.url && (
              <div className="info-item">
                <label>Store URL</label>
                <a href={store.url} target="_blank" rel="noopener noreferrer">
                  {store.url}
                </a>
              </div>
            )}
            <div className="info-item">
              <label>Created</label>
              <span>{new Date(store.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {store.errorMessage && (
            <div className="error-message">
              <strong>Error:</strong> {store.errorMessage}
            </div>
          )}
        </div>

        <div className="events-card">
          <h3>Events Timeline</h3>
          {eventsLoading ? (
            <div className="loading">Loading events...</div>
          ) : events && events.length > 0 ? (
            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="event-content">
                    <div className="event-action">{event.action.toUpperCase()}</div>
                    {event.message && <div className="event-message">{event.message}</div>}
                    {event.error && (
                      <div className="event-error">Error: {event.error}</div>
                    )}
                    <div className={`event-status ${getStatusColor(event.status)}`}>
                      {event.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoreDetail;
