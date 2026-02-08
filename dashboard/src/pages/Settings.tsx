const Settings = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-white">Platform Settings</h1>

            <div className="space-y-6">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Platform Defaults</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-400">Default CPU Limit</label>
                            <div className="mt-1 p-3 bg-slate-900 rounded-md text-slate-200 border border-slate-700">1000m</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400">Default Memory Limit</label>
                            <div className="mt-1 p-3 bg-slate-900 rounded-md text-slate-200 border border-slate-700">1Gi</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400">Storage Class</label>
                            <div className="mt-1 p-3 bg-slate-900 rounded-md text-slate-200 border border-slate-700">local-path</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400">Registry</label>
                            <div className="mt-1 p-3 bg-slate-900 rounded-md text-slate-200 border border-slate-700">docker.io</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                        <div>
                            <p className="font-medium text-white">Admin User</p>
                            <p className="text-sm text-slate-400">admin@storepro.io</p>
                        </div>
                        <span className="ml-auto px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">Administrator</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
