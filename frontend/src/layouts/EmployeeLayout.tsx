import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    LayoutDashboard,
    User,
    Target,
    PhoneCall,
    Receipt,
    Calendar
} from 'lucide-react';

const items = [
    { label: 'Dashboard', path: '/employee/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'My Profile', path: '/employee/profile', icon: <User className="h-4 w-4" /> },
    { label: 'My Target', path: '/employee/target', icon: <Target className="h-4 w-4" /> },
    { label: 'Call Report', path: '/employee/calls', icon: <PhoneCall className="h-4 w-4" /> },
    { label: 'Doctors', path: '/employee/doctors', icon: <User className="h-4 w-4" /> },
    { label: 'Add Expense', path: '/employee/expenses', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Leave Calendar', path: '/employee/leave', icon: <Calendar className="h-4 w-4" /> },
];

const EmployeeLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            <Sidebar items={items} />
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

export default EmployeeLayout;
