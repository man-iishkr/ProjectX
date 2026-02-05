import React from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { Bell, User } from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={logout}>
                        <User className="h-5 w-5" />
                    </Button>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
