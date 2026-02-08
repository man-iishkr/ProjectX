import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getLeaves, approveLeave, rejectLeave, type Leave } from '../../api/leave.api';
import { holidayAPI, type Holiday } from '../../api/holiday.api';
import { PlusCircle, Check, X, Trash2, Calendar as CalendarIcon, ClipboardList, PartyPopper } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import LeaveList from './LeaveList';

const LeaveCalendar: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'calendar' | 'approvals' | 'holidays' | 'my-leaves'>('calendar');
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    // Holiday Form State
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [leavesRes, holidaysData] = await Promise.all([
                getLeaves(),
                holidayAPI.getAll()
            ]);
            if (leavesRes.success) {
                setLeaves(leavesRes.data);
            }
            setHolidays(holidaysData); // Assuming holidayAPI returns data directly, need to check if consistent
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveLeave(id);
            fetchData();
        } catch (error) {
            alert('Failed to approve leave');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                await rejectLeave(id, reason);
                fetchData();
            } catch (error) {
                alert('Failed to reject leave');
            }
        }
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await holidayAPI.create(newHoliday);
            setNewHoliday({ name: '', date: '', description: '' });
            fetchData();
            alert('Holiday added!');
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Failed to add holiday');
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (window.confirm('Delete this holiday?')) {
            try {
                await holidayAPI.delete(id);
                fetchData();
            } catch (error) {
                alert('Failed to delete holiday');
            }
        }
    };

    // Transform data for calendar
    const getEvents = () => {
        const leaveEvents = leaves.map(leave => {
            // FullCalendar end date is exclusive, so we need to add 1 day to the inclusive end date stored in DB
            const endDate = new Date(leave.endDate);
            endDate.setDate(endDate.getDate() + 1);

            return {
                id: leave._id,
                title: `${leave.employee?.name || 'Unknown'} - ${leave.leaveType}`,
                start: leave.startDate,
                end: endDate.toISOString().split('T')[0], // Ensure YYYY-MM-DD
                allDay: true,
                backgroundColor:
                    leave.status === 'approved' ? '#22c55e' :
                        leave.status === 'rejected' ? '#ef4444' :
                            leave.status === 'cancelled' ? '#6b7280' :
                                '#f59e0b',
                borderColor: 'transparent'
            };
        });

        const holidayEvents = holidays.map(holiday => ({
            id: holiday._id,
            title: `🌴 ${holiday.name}`,
            start: holiday.date,
            allDay: true,
            backgroundColor: '#8b5cf6', // Violet for holidays
            borderColor: '#7c3aed',
            display: 'block'
        }));

        return [...leaveEvents, ...holidayEvents];
    };

    // Tab Button Component
    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Header and Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-2">
                <h2 className="text-2xl font-semibold">Leave Management</h2>

                <div className="flex gap-1 overflow-x-auto">
                    <TabButton id="calendar" label="Calendar" icon={CalendarIcon} />
                    {(user?.role === 'employee' || user?.role === 'hq') && (
                        <TabButton id="my-leaves" label="My Leaves" icon={ClipboardList} />
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <TabButton id="approvals" label="Approve Requests" icon={ClipboardList} />
                            <TabButton id="holidays" label="Official Holidays" icon={PartyPopper} />
                        </>
                    )}
                </div>
            </div>

            {/* TAB CONTENT: MY LEAVES (Employee/HQ) */}
            {activeTab === 'my-leaves' && (
                <Card>
                    <CardHeader><CardTitle>My Leave History</CardTitle></CardHeader>
                    <CardContent>
                        <LeaveList embedded={true} />
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: CALENDAR */}
            {activeTab === 'calendar' && (
                <Card>
                    <CardContent className="pt-6">
                        {loading ? <div>Loading...</div> : (
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={getEvents()}
                                height="auto"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                }}
                            />
                        )}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-amber-500"></div>Pending</div>
                            <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-green-500"></div>Approved</div>
                            <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-red-500"></div>Rejected</div>
                            <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-violet-500"></div>Holiday</div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: APPROVALS (Admin Only) */}
            {activeTab === 'approvals' && (
                <Card>
                    <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
                    <CardContent>
                        <Table
                            data={leaves.filter(l => l.status === 'pending')}
                            columns={[
                                { header: 'Employee', accessor: (row) => row.employee?.name || 'Unknown' },
                                { header: 'Type', accessor: 'leaveType' },
                                { header: 'From', accessor: (row) => new Date(row.startDate).toLocaleDateString() },
                                { header: 'To', accessor: (row) => new Date(row.endDate).toLocaleDateString() },
                                { header: 'Reason', accessor: 'reason' },
                                { header: 'Applied On', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
                            ]}
                            actions={(row) => (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(row._id)}>
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(row._id)}>
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            )}
                        />
                        {leaves.filter(l => l.status === 'pending').length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">No pending requests</div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: HOLIDAYS (Admin Only) */}
            {activeTab === 'holidays' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* List Holidays */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Official Holidays List</CardTitle></CardHeader>
                            <CardContent>
                                <Table
                                    data={holidays}
                                    columns={[
                                        { header: 'Holiday Name', accessor: 'name' },
                                        { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                                        { header: 'Description', accessor: (row) => row.description || '-' },
                                    ]}
                                    actions={(row) => (
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(row._id)}>
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add Holiday Form */}
                    <div>
                        <Card>
                            <CardHeader><CardTitle>Add New Holiday</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddHoliday} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Holiday Name</label>
                                        <Input
                                            value={newHoliday.name}
                                            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                            placeholder="e.g. Diwali"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Date</label>
                                        <Input
                                            type="date"
                                            value={newHoliday.date}
                                            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Description</label>
                                        <Input
                                            value={newHoliday.description}
                                            onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Holiday
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveCalendar;
