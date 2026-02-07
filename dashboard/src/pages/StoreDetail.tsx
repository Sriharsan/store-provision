import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, ExternalLink, Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getStore, deleteStore } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const StoreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: store, isLoading } = useQuery({
        queryKey: ['store', id],
        queryFn: () => getStore(id!),
        refetchInterval: 3000,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteStore(id!),
        onSuccess: () => {
            navigate('/');
        },
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (!store) return <div className="text-center py-20 text-red-500">Store not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            Store {store.id.substring(0, 8)}
                            <Badge variant={store.status === 'READY' ? 'success' : 'secondary'}>{store.status}</Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {store.url && (
                        <a href={store.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">
                                <ExternalLink className="mr-2 h-4 w-4" /> Open Storefront
                            </Button>
                        </a>
                    )}
                    <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending || store.status === 'DELETING'}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                            <span className="text-slate-400">Engine</span>
                            <span className="text-white capitalize">{store.engine}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                            <span className="text-slate-400">Template</span>
                            <span className="text-white capitalize">{store.template}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                            <span className="text-slate-400">URL</span>
                            <a href={store.url} target="_blank" className="text-blue-400 hover:underline truncate max-w-[200px]">{store.url || 'Pending...'}</a>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                            <span className="text-slate-400">Created At</span>
                            <span className="text-white">{new Date(store.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-slate-400">Resources</span>
                            <span className="text-slate-500 text-sm">{store.cpu} CPU / {store.memory} RAM</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Log</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                        {store.events?.map((event: any) => (
                            <div key={event.id} className="flex gap-3">
                                <div className="mt-1">
                                    {event.status === 'READY' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : event.status === 'FAILED' ? (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-slate-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{event.message}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-400">{event.status}</span>
                                        <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!store.events || store.events.length === 0) && (
                            <p className="text-center text-slate-500 py-4">No events logged yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StoreDetail;
