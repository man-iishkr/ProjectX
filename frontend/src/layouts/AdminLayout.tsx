import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            <Sidebar />
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

export default AdminLayout;
