import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { holidayAPI, type Holiday } from '../../api/holiday.api';

const DashboardCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const data = await holidayAPI.getAll();
                setHolidays(data);
            } catch (error) {
                console.error('Failed to fetch holidays', error);
            }
        };
        fetchHolidays();
    }, []);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentYear, currentDate.getMonth(), 1).getDay(); // 0 = Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);
    const today = new Date();

    const isHoliday = (day: number) => {
        // Create date object for the day in the current viewed month
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

        return holidays.find(h => {
            const hDate = new Date(h.date).toDateString();
            return hDate === dateStr;
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    {currentMonth} {currentYear}
                </CardTitle>
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-xs font-semibold text-muted-foreground">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map(blank => (
                        <div key={`blank-${blank}`} className="h-10"></div>
                    ))}
                    {days.map(day => {
                        const isToday = day === today.getDate() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getFullYear() === today.getFullYear();

                        const holiday = isHoliday(day);
                        const isWeekend = (startDay + day - 1) % 7 === 0 || (startDay + day - 1) % 7 === 6;

                        return (
                            <div
                                key={day}
                                title={holiday ? holiday.name : ''}
                                className={`
                                    h-10 flex items-center justify-center rounded-md text-sm cursor-pointer hover:bg-slate-100 relative
                                    ${isToday ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                                    ${!isToday && holiday ? 'bg-green-100 text-green-700 font-semibold' : ''}
                                    ${!isToday && !holiday && isWeekend ? 'text-red-500 bg-red-50' : ''}
                                `}
                            >
                                {day}
                                {holiday && !isToday && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-500"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div> Today
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Weekend
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Holiday
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardCalendar;
