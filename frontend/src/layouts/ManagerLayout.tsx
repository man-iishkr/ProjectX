import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    LayoutDashboard,
    Users,
    User,
    Stethoscope,
    FlaskConical,
    Map,
    Target,
    Receipt,
    PhoneCall,
    Calendar,
    Wallet,
    Truck,
    Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ManagerLayout: React.FC = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const baseItems = [
        { label: 'Dashboard', path: '/manager/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'My Profile', path: '/manager/profile', icon: <User className="h-4 w-4" /> },
        { label: 'My Team', path: '/manager/employees', icon: <Users className="h-4 w-4" /> },
        { label: 'Doctors', path: '/manager/doctors', icon: <Stethoscope className="h-4 w-4" /> },
        { label: 'Chemists', path: '/manager/chemists', icon: <FlaskConical className="h-4 w-4" /> },
        { label: 'Stockists', path: '/manager/stockists', icon: <Truck className="h-4 w-4" /> },
        { label: 'Products', path: '/manager/inventory/products', icon: <Package className="h-4 w-4" /> },
        { label: 'Routing', path: '/manager/routing', icon: <Map className="h-4 w-4" /> },
        { label: 'Targets', path: '/manager/targets', icon: <Target className="h-4 w-4" /> },
        { label: 'Call Reports', path: '/manager/calls', icon: <PhoneCall className="h-4 w-4" /> },
        { label: 'Tour Planner', path: '/manager/tour-planner', icon: <Map className="h-4 w-4" /> },
        { label: 'Tour Approvals', path: '/manager/tour-approvals', icon: <Map className="h-4 w-4" /> },
        { label: 'Expense Approval', path: '/manager/expenses', icon: <Receipt className="h-4 w-4" /> },
        { label: 'Leave Management', path: '/manager/leave', icon: <Calendar className="h-4 w-4" /> },
    ];

    // SM gets salary access as well
    const smItems = [
        ...baseItems,
        { label: 'Salary', path: '/manager/salary', icon: <Wallet className="h-4 w-4" /> },
    ];

    const items = user?.role === 'sm' ? smItems : baseItems;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            <Sidebar items={items} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ManagerLayout;
