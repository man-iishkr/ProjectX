import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Map,
    Target,
    Package,
    Receipt,
    PhoneCall
} from 'lucide-react';

const items = [
    { label: 'Dashboard', path: '/hq/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Employees', path: '/hq/employees', icon: <Users className="h-4 w-4" /> },
    { label: 'Doctors', path: '/hq/doctors', icon: <Stethoscope className="h-4 w-4" /> },
    { label: 'Routing', path: '/hq/routing', icon: <Map className="h-4 w-4" /> },
    { label: 'Targets', path: '/hq/targets', icon: <Target className="h-4 w-4" /> },
    { label: 'Stockists', path: '/hq/stockists', icon: <Package className="h-4 w-4" /> },
    { label: 'Inventory', path: '/hq/inventory', icon: <Package className="h-4 w-4" /> },
    { label: 'Expenses Approval', path: '/hq/expenses', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Call Reports', path: '/hq/calls', icon: <PhoneCall className="h-4 w-4" /> },
];

const HQLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar items={items} />
            <div className="pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HQLayout;
