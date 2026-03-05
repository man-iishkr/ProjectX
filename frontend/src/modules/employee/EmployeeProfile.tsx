import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { User, MapPin, Briefcase, Phone, Mail, Award, Navigation, Wallet } from 'lucide-react';
import { getMySalary } from '../../api/salary.api';

const EmployeeProfile: React.FC = () => {
    const { user } = useAuth();
    const [distanceKm, setDistanceKm] = useState(0);
    const [estimatedTA, setEstimatedTA] = useState(0);

    useEffect(() => {
        if (user) {
            fetchTravelData();
        }
    }, [user]);

    const fetchTravelData = async () => {
        try {
            const now = new Date();
            const res = await getMySalary({
                year: now.getFullYear(),
                month: now.getMonth() + 1
            });
            const mySalary = res?.data;

            if (mySalary) {
                // Determine TA from Live calculation or Stored allowance
                const ta = mySalary.liveTA !== undefined ? mySalary.liveTA : (mySalary.allowances?.ta || 0);
                const distance = mySalary.liveDistance !== undefined ? Math.round(mySalary.liveDistance) : (ta > 0 ? Math.round(ta / 10) : 0);

                setDistanceKm(distance);
                setEstimatedTA(ta);
            }
        } catch (err) {
            console.error('Failed to fetch travel data:', err);
        }
    };

    if (!user) return <div>Loading profile...</div>;

    const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
        <div className="flex items-center p-3 bg-slate-50 dark:bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 dark:text-foreground font-semibold">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <CardTitle className="text-xl text-foreground">{user.name}</CardTitle>
                                <p className="text-slate-500 dark:text-muted-foreground flex items-center gap-1 mt-1">
                                    <Briefcase className="h-3 w-3" />
                                    {user.designation || 'Employee'}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {user.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow icon={User} label="Username / ID" value={user.username} />
                        <InfoRow icon={MapPin} label="Reporting HQ" value={user.hq?.name || user.hq || 'N/A'} />
                        <InfoRow icon={Phone} label="Contact" value={user.phone || user.mobile || 'Not provided'} />
                        <InfoRow icon={Mail} label="Email" value={user.email || 'Not provided'} />
                        <InfoRow icon={MapPin} label="Base Location" value={`${user.city || ''} ${user.state || ''}`.trim() || 'N/A'} />
                        <InfoRow icon={Award} label="Division" value={user.division || 'General'} />
                        <InfoRow icon={Briefcase} label="Staff Type" value={user.staffType || 'N/A'} />
                        <InfoRow icon={Briefcase} label="Joining Date" value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'} />
                        <InfoRow icon={CardTitle} label="Aadhaar No." value={user.aadharCard || 'N/A'} />
                        <InfoRow icon={CardTitle} label="PAN Card" value={user.panCard || 'N/A'} />
                    </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">This Month</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Navigation className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wider">Distance Travelled</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-50">{distanceKm}</span>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">km</span>
                            </div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-2">Based on approved call report routes</p>
                        </div>

                        <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-4 w-4 text-green-700 dark:text-green-300" />
                                <span className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase tracking-wider">Calculated TA</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">₹</span>
                                <span className="text-3xl font-extrabold text-green-900 dark:text-green-50">{estimatedTA.toLocaleString()}</span>
                            </div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2">Estimated Travel Allowance</p>
                        </div>

                        <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-muted-foreground">Role</span>
                                <span className="font-semibold capitalize text-foreground">{user.role}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-muted-foreground">Monthly Pay (Base)</span>
                                <span className="font-semibold text-foreground">₹{user.monthlyPay?.toLocaleString() || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EmployeeProfile;
