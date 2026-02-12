import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { getTargets, deleteAnnualTarget } from '../../api/target.api';
import { getHQs } from '../../api/hq.api';
import TargetForm from './TargetForm';
import { useAuth } from '../../context/AuthContext';

const TargetList: React.FC = () => {
    const { user } = useAuth();
    const [targets, setTargets] = useState<any[]>([]);
    const [processedData, setProcessedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Filter State
    const [hqs, setHqs] = useState<any[]>([]);
    const [selectedHq, setSelectedHq] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

    useEffect(() => {
        if (user?.role === 'employee' || user?.role === 'hq') {
            const hqId = typeof user.hq === 'string' ? user.hq : user.hq?._id;
            setSelectedHq(hqId);
        }
        loadData();
    }, [user]);

    useEffect(() => {
        processAndFilterData();
    }, [targets, selectedHq, selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [targetRes, hqRes] = await Promise.all([
                getTargets(),
                getHQs()
            ]);

            if (targetRes.success) {
                setTargets(targetRes.data);
                // Extract unique years
                const years = Array.from(new Set(targetRes.data.map((t: any) => t.year))).sort() as number[];
                if (years.length > 0) {
                    const current = new Date().getFullYear();
                    if (!years.includes(current)) years.push(current);
                    setAvailableYears(years.sort((a, b) => b - a));
                }
            }
            if (hqRes.success) {
                setHqs(hqRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const processAndFilterData = () => {
        // 1. Group by key (hqId_year)
        const groups: { [key: string]: any } = {};

        targets.forEach(t => {
            const hqId = t.hq._id || t.hq;
            const hqName = t.hq.name || 'Unknown HQ';
            const key = `${hqId}_${t.year}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    hqId,
                    hqName,
                    year: t.year,
                    months: new Array(12).fill(0),
                    total: 0
                };
            }
            groups[key].months[t.month - 1] = t.targetValue;
            groups[key].total += t.targetValue;
        });

        // 2. Convert to array
        let result = Object.values(groups);

        // 3. Filter
        if (selectedHq) {
            result = result.filter(r => r.hqId === selectedHq);
        }
        if (selectedYear) {
            result = result.filter(r => r.year === selectedYear);
        }

        setProcessedData(result);
    };

    const handleFormSuccess = () => {
        loadData();
    };

    const handleDelete = async (row: any) => {
        if (window.confirm(`Are you sure you want to delete targets for ${row.hqName} - ${row.year}?`)) {
            try {
                await deleteAnnualTarget(row.hqId, row.year);
                setTargets(prev => prev.filter(t => !((t.hq._id === row.hqId || t.hq === row.hqId) && t.year === row.year)));
            } catch (err) {
                console.error(err);
                alert('Failed to delete targets');
            }
        }
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Construct columns dynamically? Table component expects fixed columns maybe.
    // Let's make columns for each month.
    const columns = [
        { header: 'HQ', accessor: 'hqName' },
        { header: 'Year', accessor: 'year' },
        ...months.map((m, idx) => ({
            header: m,
            accessor: (row: any) => row.months[idx]?.toLocaleString() || '-'
        })),
        { header: 'Total', accessor: (row: any) => row.total.toLocaleString() }
    ];

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Targets</h2>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        Construct Annual Target
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-lg shadow mb-6 border">
                <div className="flex items-center gap-4">
                    <div className="w-64">
                        <label className="block text-sm font-medium mb-1 text-foreground">Filter by HQ</label>
                        <select
                            value={selectedHq || (user?.role === 'hq' ? (typeof user.hq === 'string' ? user.hq : user.hq?._id) : '')}
                            onChange={(e) => setSelectedHq(e.target.value)}
                            className="w-full border p-2 rounded disabled:bg-muted disabled:text-muted-foreground bg-background"
                            disabled={user?.role === 'hq'}
                        >
                            <option value="">All HQs</option>
                            {hqs.map(hq => (
                                <option key={hq._id} value={hq._id}>{hq.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium mb-1 text-foreground">Filter by Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full border p-2 rounded bg-background"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <Table
                data={processedData}
                columns={columns}
                actions={(row) => (
                    <>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => handleDelete(row)}
                                className="text-red-600 hover:text-red-900"
                            >
                                Delete
                            </button>
                        )}
                    </>
                )}
            />

            {showForm && (
                <TargetForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default TargetList;
