import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ExternalLink, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { getStores } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const Dashboard = () => {
    const { data: stores, isLoading, isError, refetch } = useQuery({
        queryKey: ['stores'],
        queryFn: getStores,
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'READY': return 'success';
            case 'PROVISIONING': return 'warning';
            case 'FAILED': return 'destructive';
            case 'DELETING': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-slate-400 mt-2">Manage your e-commerce stores and deployments.</p>
                </div>
                <Link to="/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Store
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Your Stores</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">Loading stores...</div>
                    ) : isError ? (
                        <div className="text-center py-10 text-red-500">Failed to load stores.</div>
                    ) : stores?.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
                            <p className="text-slate-400 mb-4">No stores found.</p>
                            <Link to="/create">
                                <Button variant="secondary">Create your first store</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {stores.map((store: any) => (
                                <div key={store.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:border-blue-500/50 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs ring-1 ring-blue-500/20">
                                                    {store.engine === 'medusa' ? 'M' : 'W'}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{store.id.substring(0, 8)}...</h3>
                                                    <p className="text-xs text-slate-500 capitalize">{store.engine} • {store.template}</p>
                                                </div>
                                            </div>
                                            <Badge variant={getStatusColor(store.status) as any}>
                                                {store.status}
                                            </Badge>
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">URL</span>
                                                <span className="text-slate-300 truncate max-w-[150px]">{store.url || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Created</span>
                                                <span className="text-slate-300">{new Date(store.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-6 flex gap-2">
                                        <Link to={`/stores/${store.id}`} className="flex-1">
                                            <Button variant="secondary" className="w-full">
                                                Manage
                                            </Button>
                                        </Link>
                                        {store.url && (
                                            <a href={store.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" className="px-3">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
