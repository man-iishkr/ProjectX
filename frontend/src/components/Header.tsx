import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { Bell, User, AlertCircle, CheckCircle, LogOut, Moon, Sun, Menu } from 'lucide-react';
import { notificationAPI, type Notification } from '../api/notification.api';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Profile & Theme State
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    // Dark Mode Effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Logic to check stock only once per 30 mins
    const shouldCheckStock = () => {
        const lastCheck = localStorage.getItem('lastStockCheck');
        const now = Date.now();
        if (!lastCheck) return true;
        return (now - parseInt(lastCheck)) > 30 * 60 * 1000; // 30 minutes
    };

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'hq') {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        const checkStock = shouldCheckStock();
        try {
            const data = await notificationAPI.getNotifications(checkStock);
            setNotifications(data);

            if (checkStock) {
                localStorage.setItem('lastStockCheck', Date.now().toString());
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('lastStockCheck');
        logout();
    };

    const handleNotificationClick = (link: string) => {
        setShowDropdown(false);
        navigate(link);
    };

    const totalCount = notifications.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-30 w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => setShowDropdown(!showDropdown)}>
                        <Bell className="h-5 w-5" />
                        {totalCount > 0 && (
                            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background"></span>
                        )}
                    </Button>

                    {/* Notification Dropdown */}
                    {showDropdown && (
                        <>
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDropdown(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-lg rounded-md overflow-hidden z-50">
                                <div className="p-3 border-b border-border font-medium text-sm flex justify-between items-center">
                                    <span>Notifications</span>
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{totalCount} New</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif.link)}
                                                className="p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {notif.type === 'alert' ?
                                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" /> :
                                                        <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                                    }
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{notif.message}</p>
                                                        {notif.details && (
                                                            <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4">
                                                                {notif.details.slice(0, 3).map((d, i) => (
                                                                    <li key={i}>{d}</li>
                                                                ))}
                                                                {notif.details.length > 3 && <li>+ {notif.details.length - 3} more</li>}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    >
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-border">
                            <User className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                    </Button>

                    {showProfileDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setShowProfileDropdown(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-lg rounded-md p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1 text-foreground">
                                    My Account
                                </div>

                                <button
                                    className="w-full flex items-center justify-between px-2 py-2 text-sm cursor-pointer hover:bg-muted text-foreground rounded-sm transition-colors"
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                >
                                    <span className="flex items-center gap-2">
                                        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                        <span className="font-medium">Dark Mode</span>
                                    </span>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-primary' : 'bg-input'}`}>
                                        <div
                                            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-transform duration-200"
                                            style={{ transform: isDarkMode ? 'translateX(16px)' : 'translateX(0)' }}
                                        />
                                    </div>
                                </button>

                                <div className="my-1 border-t border-border" />

                                <button
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm cursor-pointer hover:bg-destructive/10 text-destructive rounded-sm transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="font-medium">Log out</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
