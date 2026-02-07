import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft, Zap, Box, Layers } from 'lucide-react';
import { createStore } from '../api';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Input } from '../components/Input';
import { Link } from 'react-router-dom';

const CreateStore = () => {
    const navigate = useNavigate();
    const [engine, setEngine] = useState('medusa');
    const [template, setTemplate] = useState('starter');

    const mutation = useMutation({
        mutationFn: createStore,
        onSuccess: (data) => {
            navigate(`/stores/${data.id}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ engine, template });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link to="/">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-white">New Store</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* Engine Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300">E-Commerce Engine</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setEngine('medusa')}
                                    className={`cursor-pointer rounded-xl border p-4 transition-all ${engine === 'medusa' ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                                >
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Zap className={`h-5 w-5 ${engine === 'medusa' ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <span className="font-semibold text-white">Medusa.js</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Headless, modular commerce engine. Best for customization.</p>
                                </div>

                                <div
                                    onClick={() => setEngine('woo')} // Placeholder for now
                                    className={`cursor-pointer rounded-xl border p-4 transition-all opacity-50 cursor-not-allowed border-slate-700 bg-slate-800`}
                                >
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Box className="h-5 w-5 text-slate-400" />
                                        <span className="font-semibold text-white">WooCommerce</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Coming soon.</p>
                                </div>
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300">Starter Template</label>
                            <div className="grid grid-cols-1 gap-4">
                                <div
                                    onClick={() => setTemplate('starter')}
                                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center justify-between ${template === 'starter' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                            <Layers className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">Default Starter</h4>
                                            <p className="text-xs text-slate-400">Next.js Storefront + Admin</p>
                                        </div>
                                    </div>
                                    {template === 'starter' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Requesting Provisioning...' : 'Create Store'}
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default CreateStore;
