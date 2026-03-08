import React, { useRef, useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { getSettings } from '../../api/settings.api';

interface SalarySlipProps {
    isOpen: boolean;
    onClose: () => void;
    salary: any;
}

const toWords = (num: number): string => {
    if (!num) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const translate = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + translate(n % 100));
        if (n < 100000) return translate(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 === 0 ? '' : translate(n % 1000));
        if (n < 10000000) return translate(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 === 0 ? '' : translate(n % 100000));
        return translate(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 === 0 ? '' : translate(n % 10000000));
    };
    return translate(num).trim();
};

const SalarySlip: React.FC<SalarySlipProps> = ({ isOpen, onClose, salary }) => {
    const slipRef = useRef<HTMLDivElement>(null);
    const [companyInfo, setCompanyInfo] = useState({ name: 'Loading...', address: '' });

    useEffect(() => {
        if (isOpen) {
            getSettings().then(data => {
                setCompanyInfo({
                    name: data.COMPANY_NAME || 'Maneesh Pharmaceuticals Ltd.',
                    address: ''
                });
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = slipRef.current?.innerHTML;
        const originalContents = document.body.innerHTML;
        const origTitle = document.title;

        // Hide browser header title during print
        document.title = '\u200b';

        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();

            // Restore state
            document.title = origTitle;
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Salary Slip"
            maxWidth="max-w-3xl"
        >
            <div className="max-h-[80vh] overflow-y-auto">
                <style>
                    {`
                        @media print {
                            @page { margin: 0; }
                            body { margin: 1cm; -webkit-print-color-adjust: exact; }
                        }
                    `}
                </style>
                <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>

                <div className="p-8 bg-white text-black" ref={slipRef} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>

                    {/* Watermark Background (Optional depending on logo format) */}
                    <div className="absolute inset-0 z-0 opacity-5 pointer-events-none flex items-center justify-center">
                        <img src="/logo.png" alt="" className="w-1/2" />
                    </div>

                    <div className="relative z-10">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold uppercase tracking-tight text-[#0a3055]">{companyInfo.name}</h1>
                            </div>
                            <div className="flex flex-col items-end">
                                <img src="/logo.png" alt="Company Logo" className="h-16 object-contain mb-2" />
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4 tracking-wider">
                                Payslip for the month of {new Date(salary.period.year, salary.period.month - 1).toLocaleString('default', { month: 'long' })} {salary.period.year}
                            </h2>
                        </div>

                        {/* Employee Details Grid */}
                        <div className="border-2 border-slate-800 mb-6 flex text-sm">
                            {/* Column 1 */}
                            <div className="flex-1 border-r-2 border-slate-800 p-0">
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Employee No.</div>
                                    <div className="px-2 py-1 font-bold">{salary.employee.username || 'N/A'}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Name</div>
                                    <div className="px-2 py-1 font-bold">{salary.employee.name}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300 bg-slate-50">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Department</div>
                                    <div className="px-2 py-1">{salary.employee.employeeInfo?.department || 'Sales & Marketing'}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Designation</div>
                                    <div className="px-2 py-1 capitalize">{salary.employee.role || 'N/A'}</div>
                                </div>
                                <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Category</div>
                                    <div className="px-2 py-1">{salary.employee.designation || 'N/A'}</div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Date of Joining</div>
                                    <div className="px-2 py-1">{salary.employee.joiningDate ? new Date(salary.employee.joiningDate).toLocaleDateString() : 'N/A'}</div>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="flex-1 p-0">
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">U.A.N.</div>
                                    <div className="px-2 py-1">{salary.employee.aadharCard || 'N/A'}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300 bg-slate-50">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300">Location</div>
                                    <div className="px-2 py-1">{salary.employee.address || salary.employee.city || 'N/A'}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300"></div>
                                    <div className="px-2 py-1"></div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300 bg-slate-50">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300"></div>
                                    <div className="px-2 py-1"></div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-slate-300">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300"></div>
                                    <div className="px-2 py-1"></div>
                                </div>
                                <div className="grid grid-cols-2 bg-slate-50">
                                    <div className="px-2 py-1 font-semibold border-r border-slate-300"></div>
                                    <div className="px-2 py-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary Grid */}
                        <div className="border-2 border-slate-800 mb-6 text-sm overflow-hidden flex flex-wrap bg-slate-100/50">
                            {[
                                { label: 'Calendar Days', val: salary.workingDays?.total || 0 },
                                { label: 'W. Offs/Holidays', val: (salary.workingDays?.sundays || 0) + (salary.workingDays?.holidays || 0) },
                                { label: 'Present Days', val: salary.workingDays?.present || 0 },
                                { label: 'Net Worked', val: salary.workingDays?.present || 0 }, // Using Present for now
                                { label: 'Leave Days', val: salary.workingDays?.leaves || 0 },
                                { label: 'L.W.P. Days', val: salary.workingDays?.absent || 0 },
                                { label: 'Paid Days', val: (salary.workingDays?.total || 0) - (salary.workingDays?.absent || 0) }
                            ].map((stat, idx) => (
                                <div key={idx} className={`p-2 text-center flex-1 border-slate-300 ${idx !== 6 ? 'border-r' : ''}`}>
                                    <div className="font-semibold text-[11px] mb-1 leading-tight tracking-tight uppercase text-slate-600">{stat.label}</div>
                                    <div className="font-bold text-base">{stat.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Financial Table */}
                        <div className="border-2 border-slate-800 mb-6">
                            <div className="grid grid-cols-4 bg-slate-800 text-white font-bold text-sm text-center">
                                <div className="border-r border-slate-600 p-2 text-left">EARNINGS</div>
                                <div className="border-r border-slate-600 p-2">AMOUNT IN ₹</div>
                                <div className="border-r border-slate-600 p-2 text-left">DEDUCTIONS</div>
                                <div className="p-2">AMOUNT IN ₹</div>
                            </div>

                            <div className="grid grid-cols-4 text-sm font-medium">
                                {/* Row 1 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3">BASIC PAY</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right">{salary.earnings?.basicPay?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3">P.F.</div>
                                <div className="border-b border-slate-300 p-2 text-right">{salary.deductions?.pf?.toLocaleString() || 0}</div>

                                {/* Row 2 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3 bg-slate-50">H.R.A.</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right bg-slate-50">{salary.earnings?.hra?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3 bg-slate-50 text-red-600 text-xs flex items-center">Loss of Pay ({salary.workingDays?.absent || 0} Days)</div>
                                <div className="border-b border-slate-300 p-2 text-right bg-slate-50 text-red-600">{salary.deductions?.lop?.toLocaleString() || 0}</div>

                                {/* Row 3 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3">EDU. ALLOWANCE</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right">{salary.earnings?.eduAllow?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3">PROF. TAX (If Any)</div>
                                <div className="border-b border-slate-300 p-2 text-right">{salary.deductions?.tax?.toLocaleString() || 0}</div>

                                {/* Row 4 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3 bg-slate-50">CONVEYANCE</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right bg-slate-50">{salary.earnings?.conveyance?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3 bg-slate-50">TDS / INSURANCE</div>
                                <div className="border-b border-slate-300 p-2 text-right bg-slate-50">{salary.deductions?.insurance?.toLocaleString() || 0}</div>

                                {/* Row 5 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3">SPL. ALLOWANCE</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right">{salary.earnings?.splAllow?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3"></div>
                                <div className="border-b border-slate-300 p-2 text-right"></div>

                                {/* Row 6 */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3 bg-slate-50">VME</div>
                                <div className="border-b border-r border-slate-300 p-2 text-right bg-slate-50">{salary.earnings?.vme?.toLocaleString() || 0}</div>
                                <div className="border-b border-r border-slate-300 p-2 bg-slate-50"></div>
                                <div className="border-b border-slate-300 p-2 text-right bg-slate-50"></div>

                                {/* Empty Fillers */}
                                <div className="border-b border-r border-slate-300 p-2 pl-3 h-8"></div>
                                <div className="border-b border-r border-slate-300 p-2 text-right h-8"></div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3 h-8"></div>
                                <div className="border-b border-slate-300 p-2 text-right h-8"></div>

                                <div className="border-b border-r border-slate-300 p-2 pl-3 h-8 bg-slate-50"></div>
                                <div className="border-b border-r border-slate-300 p-2 text-right h-8 bg-slate-50"></div>
                                <div className="border-b border-r border-slate-300 p-2 pl-3 h-8 bg-slate-50"></div>
                                <div className="border-b border-slate-300 p-2 text-right h-8 bg-slate-50"></div>

                                {/* Dynamic Fillers */}
                                <div className="border-b-2 border-r border-slate-800 p-2 pl-3 font-bold uppercase">Total Earnings</div>
                                <div className="border-b-2 border-r border-slate-800 p-2 text-right font-bold text-lg">₹ {salary.totalEarnings?.toLocaleString() || 0}</div>
                                <div className="border-b-2 border-r border-slate-800 p-2 pl-3 font-bold uppercase">Total Deductions</div>
                                <div className="border-b-2 border-slate-800 p-2 text-right font-bold text-lg text-red-700">₹ {salary.totalDeductions?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        {/* Net Details & Signatures */}
                        <div className="flex border-2 border-slate-800 mb-8 p-0 text-sm">
                            <div className="flex-1 p-4 border-r-2 border-slate-800 flex flex-col justify-center">
                                <div className="font-bold mb-1 uppercase text-xs tracking-wider text-slate-500">Net Amount Payable</div>
                                <div className="font-bold italic text-lg capitalize">{toWords(salary.netPayable)} Rupees Only.</div>
                            </div>
                            <div className="w-1/3 p-4 flex flex-col justify-center items-end bg-green-50">
                                <div className="font-bold mb-1 uppercase text-xs tracking-wider text-slate-500">Net Pay</div>
                                <div className="text-3xl font-black text-green-700">₹{salary.netPayable?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-16 px-8 text-sm font-semibold tracking-wide uppercase text-slate-600">
                            <div className="border-t-2 border-slate-400 pt-2 w-48 text-center">Employer's Sig.</div>
                            <div className="border-t-2 border-slate-400 pt-2 w-48 text-center">Employee's Sig.</div>
                        </div>

                        <div className="mt-8 text-center text-xs text-slate-400 italic font-medium">
                            This is a computer generated Payslip and does not require a physical signature.
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );

};

export default SalarySlip;
