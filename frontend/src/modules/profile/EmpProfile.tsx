import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Mail, Phone, MapPin, Building2, Calendar } from 'lucide-react';

const EmpProfile: React.FC = () => {
    const { user } = useAuth();

    // This is a simplified version - in production, fetch full employee details
    const employeeData = {
        name: user?.name || 'N/A',
        email: user?.email || 'N/A',
        employeeId: user?.employeeId || 'N/A',
        role: user?.role || 'N/A',
        designation: 'Medical Representative',
        phone: '+91 9876543210',
        location: 'Mumbai, Maharashtra',
        hq: 'West Zone HQ',
        joinDate: 'Jan 15, 2024'
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Employee Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {employeeData.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="font-semibold text-lg">{employeeData.name}</h3>
                    <p className="text-sm text-muted-foreground">{employeeData.designation}</p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {employeeData.employeeId}</p>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employeeData.email}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employeeData.phone}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employeeData.location}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employeeData.hq}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Joined: {employeeData.joinDate}</span>
                    </div>
                </div>

                <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Quick Stats</div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">Role</div>
                            <div className="font-medium text-sm capitalize">{employeeData.role}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <div className="font-medium text-sm text-green-600">Active</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmpProfile;
