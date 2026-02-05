import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    FlaskConical,
    Truck,
    Map,
    Target,
    Package,
    Receipt,
    PhoneCall,
    Wallet,
    FileSpreadsheet,
    Building2,
    Calendar,
    PlusCircle
} from 'lucide-react';

interface SidebarItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
}

interface SidebarProps {
    items?: SidebarItem[];
}

const defaultAdminItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Employees', path: '/admin/employees', icon: <Users className="h-4 w-4" /> },
    { label: 'Doctors', path: '/admin/doctors', icon: <Stethoscope className="h-4 w-4" /> },
    { label: 'Chemists', path: '/admin/chemists', icon: <FlaskConical className="h-4 w-4" /> },
    { label: 'Stockists', path: '/admin/stockists', icon: <Truck className="h-4 w-4" /> },
    { label: 'HQ Management', path: '/admin/hqs', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Routing', path: '/admin/routing', icon: <Map className="h-4 w-4" /> },
    { label: 'Targets', path: '/admin/targets', icon: <Target className="h-4 w-4" /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <PlusCircle className="h-4 w-4" /> },
    { label: 'Products', path: '/admin/inventory/products', icon: <Package className="h-4 w-4" /> },
    { label: 'Stock', path: '/admin/inventory/stock', icon: <Package className="h-4 w-4" /> },
    { label: 'Expenses', path: '/admin/expenses', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Call Reports', path: '/admin/calls', icon: <PhoneCall className="h-4 w-4" /> },
    { label: 'Leave Calendar', path: '/admin/leave', icon: <Calendar className="h-4 w-4" /> },
    { label: 'Salary', path: '/admin/salary', icon: <Wallet className="h-4 w-4" /> },
    { label: 'Excel Import', path: '/admin/import', icon: <FileSpreadsheet className="h-4 w-4" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ items = defaultAdminItems }) => {
    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 flex flex-col z-20 text-slate-300">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl text-white">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        F
                    </div>
                    Field ERP
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {items.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                        : "hover:bg-slate-800 hover:text-white"
                                )
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-semibold text-sm text-white">Need Help?</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-3">Check our documentation.</p>
                    <button className="text-xs bg-slate-700 text-white border-0 px-2 py-1.5 rounded-md shadow-sm w-full font-medium hover:bg-slate-600 transition-colors">
                        Documentation
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
