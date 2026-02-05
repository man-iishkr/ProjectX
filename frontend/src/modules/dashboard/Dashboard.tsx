import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import EmpProfile from '../profile/EmpProfile';
import LeaveCalendar from '../leave/LeaveCalendar';
import Analytics from '../analytics/Analytics';
import ReportCall from '../callReport/ReportCall';
import TargetSection from '../target/TargetSection';
import { TrendingUp, Users, Calendar, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.name}. Here's your overview.
                    </p>
                </div>
            </div>

            {/* Main Dashboard Grid - Following Working Plan Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Sidebar - Col 1-2 */}
                <div className="col-span-2 space-y-6">
                    {/* EMP Profile */}
                    <EmpProfile />

                    {/* Dashboard Mini Stats */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm">Revenue</span>
                                </div>
                                <span className="font-bold text-sm">₹45K</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Active</span>
                                </div>
                                <span className="font-bold text-sm">2,350</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm">Pending</span>
                                </div>
                                <span className="font-bold text-sm">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm">Issues</span>
                                </div>
                                <span className="font-bold text-sm">3</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center Area - Col 3-9 */}
                <div className="col-span-7 space-y-6">
                    {/* Report Call Section */}
                    <ReportCall />

                    {/* Target Section (Large) and Current Month Analytics */}
                    <div className="grid grid-cols-1 gap-6">
                        <TargetSection />
                        <Analytics />
                    </div>
                </div>

                {/* Right Sidebar - Col 10-12 */}
                <div className="col-span-3 space-y-6">
                    {/* Login/Logout */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={logout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Leave Calendar */}
                    <LeaveCalendar />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
