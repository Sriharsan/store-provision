import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { storeApi, Store } from '../services/api';
import './StoreList.css';

function StoreList() {
  const navigate = useNavigate();
  const { data: stores, isLoading, error } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: storeApi.getAll,
    refetchInterval: 5000, // Poll every 5 seconds
  });

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

  if (isLoading) {
    return <div className="loading">Loading stores...</div>;
  }

  if (error) {
    return (
      <div className="error error-with-help">
        <p>Cannot reach the API.</p>
        <p className="error-help">
          Start the backend in another terminal:
          <br />
          <code>cd backend &amp;&amp; npm run dev</code>
          <br />
          Then refresh this page.
        </p>
      </div>
    );
  }

  return (
    <div className="store-list">
      <div className="store-list-header">
        <h2>Stores</h2>
        <button className="btn-primary" onClick={() => navigate('/create')}>
          Create New Store
        </button>
      </div>

      {stores && stores.length === 0 ? (
        <div className="empty-state">
          <p>No stores yet. Create your first store!</p>
        </div>
      ) : (
        <table className="stores-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Engine</th>
              <th>Status</th>
              <th>URL</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores?.map((store) => (
              <tr key={store.id}>
                <td>{store.name}</td>
                <td>{store.engine}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(store.status)}`}>
                    {store.status}
                  </span>
                </td>
                <td>
                  {store.url ? (
                    <a href={store.url} target="_blank" rel="noopener noreferrer">
                      {store.url}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{new Date(store.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn-link"
                    onClick={() => navigate(`/stores/${store.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StoreList;
