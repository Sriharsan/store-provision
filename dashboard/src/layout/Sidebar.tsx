import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, ShoppingBag } from 'lucide-react';
import { cn } from '../components/Button';

const Sidebar = () => {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Create Store', href: '/create', icon: PlusCircle },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <ShoppingBag className="mr-2 h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold tracking-tight text-white">StorePro</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {links.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            to={link.href}
                            className={cn(
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-blue-600/10 text-blue-500'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <link.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-500' : 'text-slate-400')} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    <div className="ml-3">
                        <p className="text-xs font-medium text-white">Admin User</p>
                        <p className="text-xs text-slate-500">admin@storepro.io</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
