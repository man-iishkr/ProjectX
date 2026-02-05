import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { leaveAPI, type Leave } from '../../api/leave.api';
import { PlusCircle } from 'lucide-react';

const LeaveCalendar: React.FC = () => {
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const data = await leaveAPI.getAll();
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    // Transform leaves to calendar events
    const events = leaves.map(leave => ({
        id: leave._id,
        title: `${leave.employee.name} - ${leave.leaveType}`,
        start: leave.startDate,
        end: leave.endDate,
        backgroundColor:
            leave.status === 'approved' ? '#22c55e' :
                leave.status === 'rejected' ? '#ef4444' :
                    leave.status === 'cancelled' ? '#6b7280' :
                        '#f59e0b',
        borderColor:
            leave.status === 'approved' ? '#16a34a' :
                leave.status === 'rejected' ? '#dc2626' :
                    leave.status === 'cancelled' ? '#4b5563' :
                        '#d97706'
    }));

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Leave Calendar</CardTitle>
                    <Button size="sm" variant="outline">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Apply Leave
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Loading calendar...</div>
                    </div>
                ) : (
                    <div className="leave-calendar-wrapper">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            height="auto"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            eventClick={(info) => {
                                // Handle event click - show leave details
                                console.log('Leave clicked:', info.event.id);
                            }}
                        />
                    </div>
                )}

                <div className="mt-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-amber-500"></div>
                        <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-green-500"></div>
                        <span>Approved</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-red-500"></div>
                        <span>Rejected</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-gray-500"></div>
                        <span>Cancelled</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaveCalendar;
