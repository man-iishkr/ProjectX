import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { Bell, User, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationAPI, type Notification } from '../api/notification.api';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

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
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
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
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <User className="h-5 w-5" />
                    </Button>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Overlay to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </header>
    );
};

export default Header;
