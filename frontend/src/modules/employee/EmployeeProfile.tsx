import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { User, MapPin, Briefcase, Phone, Mail, Award, DollarSign, Calendar } from 'lucide-react';

const EmployeeProfile: React.FC = () => {
    const { user } = useAuth();

    if (!user) return <div>Loading profile...</div>;

    const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 font-semibold">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <CardTitle className="text-xl">{user.name}</CardTitle>
                                <p className="text-slate-500 flex items-center gap-1 mt-1">
                                    <Briefcase className="h-3 w-3" />
                                    {user.designation || 'Employee'}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {user.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow icon={User} label="Username / ID" value={user.username} />
                        <InfoRow icon={MapPin} label="Reporting HQ" value={user.hq?.name || user.hq || 'N/A'} />
                        <InfoRow icon={Phone} label="Contact" value={user.phone || 'Not provided'} />
                        <InfoRow icon={Mail} label="Email" value={user.email || 'Not provided'} />
                        <InfoRow icon={MapPin} label="Base Location" value={user.state || 'N/A'} />
                        <InfoRow icon={Award} label="Division" value={user.division || 'General'} />
                    </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Comp & Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700 uppercase">Monthly Pay</span>
                            </div>
                            <p className="text-2xl font-bold text-green-800">₹{user.monthlyPay?.toLocaleString() || 0}</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700 uppercase">Daily Allowance</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">₹{user.dailyAllowance || 'Standard'}</p>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-xs text-slate-500 mb-2">Distance Travelled (This Month)</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-slate-900">{user.distanceTravelled || 0}</span>
                                <span className="text-sm text-slate-500">km</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EmployeeProfile;
