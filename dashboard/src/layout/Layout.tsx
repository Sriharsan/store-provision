import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto max-w-7xl px-8 py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
