import React, { useState, useEffect } from 'react';
import { getMyTourPrograms, upsertTourProgram } from '../../api/tourProgram.api';
import { Button } from '../../components/ui/Button';
import LocationInput from '../../components/ui/LocationInput';
import { Calendar as CalendarIcon, Save, Send, AlertCircle } from 'lucide-react';

const TourPlanner: React.FC = () => {
    const today = new Date();
    // Default to next month if past the 20th, else current month
    const defaultMonth = today.getDate() > 20 ? (today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2) : today.getMonth() + 1;
    const defaultYear = today.getDate() > 20 && today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();

    const [year, setYear] = useState<number>(defaultYear);
    const [month, setMonth] = useState<number>(defaultMonth);
    const [status, setStatus] = useState<string>('Draft');
    const [remarks, setRemarks] = useState<string>('');
    const [dailyPlans, setDailyPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchPlan();
    }, [year, month]);

    const generateEmptyMonth = () => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const emptyPlans = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isSunday = new Date(year, month - 1, i).getDay() === 0;
            emptyPlans.push({
                date: dateStr,
                isWorkingDay: !isSunday,
                from: '',
                to: '',
                notes: isSunday ? 'Sunday / Off' : ''
            });
        }
        return emptyPlans;
    };

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const res = await getMyTourPrograms({ year, month });
            if (res.success && res.data.length > 0) {
                const program = res.data[0];
                setDailyPlans(program.dailyPlans);
                setStatus(program.status);
                setRemarks(program.remarks || '');
            } else {
                setDailyPlans(generateEmptyMonth());
                setStatus('Draft');
                setRemarks('');
            }
        } catch (error) {
            console.error('Failed to fetch tour program:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (index: number, field: string, value: any) => {
        const updated = [...dailyPlans];
        updated[index][field] = value;
        setDailyPlans(updated);
    };

    const handleSave = async (targetStatus: string) => {
        try {
            const res = await upsertTourProgram({
                year,
                month,
                dailyPlans,
                status: targetStatus
            });
            if (res.success) {
                alert(`Tour Program ${targetStatus === 'Draft' ? 'saved as Draft' : 'Submitted for Approval'}!`);
                fetchPlan(); // Refresh
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save Tour Program');
        }
    };

    const isLocked = ['Pending', 'Approved'].includes(status);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-blue-600" />
                        My Tour Program
                    </h1>
                    <p className="text-muted-foreground mt-1">Plan your operation routes for the month.</p>
                </div>

                <div className="flex gap-4 items-center mt-4 md:mt-0">
                    <select
                        className="p-2 border border-slate-300 rounded-md bg-white shadow-sm"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2 border border-slate-300 rounded-md bg-white shadow-sm"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible mb-6">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold leading-none ${status === 'Approved' ? 'bg-green-100 text-green-800' :
                            status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-slate-200 text-slate-800'
                            }`}>
                            {status}
                        </span>
                    </div>

                    {!isLocked && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleSave('Draft')}>
                                <Save className="h-4 w-4 mr-2" /> Save Draft
                            </Button>
                            <Button size="sm" onClick={() => handleSave('Pending')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="h-4 w-4 mr-2" /> Submit for Approval
                            </Button>
                        </div>
                    )}
                </div>

                {status === 'Rejected' && remarks && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-red-800 dark:text-red-400">Rejection Remarks:</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{remarks}</p>
                        </div>
                    </div>
                )}

                <div className="overflow-visible w-full pb-32">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold w-1/3">From HQ/Station</th>
                                <th className="px-4 py-3 font-semibold w-1/3">To Target Location</th>
                                <th className="px-4 py-3 font-semibold">Notes / Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading plan...</td>
                                </tr>
                            ) : dailyPlans.map((plan, idx) => {
                                const currentDate = new Date(plan.date);
                                const isSunday = !plan.isWorkingDay;

                                return (
                                    <tr key={idx} className={isSunday ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}>
                                        <td className="px-4 py-3 align-top border-r border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                                            <div className={`font-semibold ${isSunday ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {currentDate.getDate().toString().padStart(2, '0')}
                                            </div>
                                            <div className={`text-xs ${isSunday ? 'text-red-500/80 dark:text-red-500/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <LocationInput
                                                value={plan.from}
                                                onChange={(val) => handlePlanChange(idx, 'from', val)}
                                                disabled={isLocked || isSunday}
                                                placeholder={isSunday ? 'Off-Duty' : 'Starting Location...'}
                                                className={isSunday ? 'bg-transparent border-transparent' : ''}
                                            />
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <LocationInput
                                                value={plan.to}
                                                onChange={(val) => handlePlanChange(idx, 'to', val)}
                                                disabled={isLocked || isSunday}
                                                placeholder={isSunday ? 'Off-Duty' : 'Destination Station...'}
                                                className={isSunday ? 'bg-transparent border-transparent' : ''}
                                            />
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <input
                                                type="text"
                                                className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-75 disabled:bg-slate-100 ${isSunday ? 'bg-transparent border-transparent italic text-red-600' : ''}`}
                                                value={plan.notes || ''}
                                                onChange={(e) => handlePlanChange(idx, 'notes', e.target.value)}
                                                disabled={isLocked || isSunday}
                                                placeholder={isSunday ? 'Sunday Off' : 'Optional remarks...'}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TourPlanner;
