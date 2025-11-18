import React, { useMemo, useState, useEffect } from 'react';
import { Operator, PackageSalesRecord } from '../types';
import { Role } from '../hooks/useAuth';

type PackageSalesData = Record<string, Record<string, Omit<PackageSalesRecord, 'date' | 'personnelId'>>>;

interface SalesOfficerDashboardProps {
  ticketSalesPersonnel: Operator[];
  packageSales: PackageSalesData;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  role: Role;
  onEditSales: (date: string, personnelId: number, data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => void;
}

interface EditSalesModalProps {
    personnel: Operator;
    onClose: () => void;
    onSave: (date: string, personnelId: number, data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => void;
    startDate: string;
    endDate: string;
    existingSalesData: PackageSalesData;
}

const EditSalesModal: React.FC<EditSalesModalProps> = ({ personnel, onClose, onSave, startDate, endDate, existingSalesData }) => {
    const [correctionDate, setCorrectionDate] = useState(endDate);
    const [xtremeQty, setXtremeQty] = useState(0);
    const [kiddoQty, setKiddoQty] = useState(0);
    const [vipQty, setVipQty] = useState(0);
    const [otherAmount, setOtherAmount] = useState(0);

    const datesInRange = useMemo(() => {
        const dates = [];
        let currentDate = new Date(startDate + 'T00:00:00');
        const lastDate = new Date(endDate + 'T00:00:00');
        while (currentDate <= lastDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates.reverse();
    }, [startDate, endDate]);

    useEffect(() => {
        const record = existingSalesData[correctionDate]?.[personnel.id];
        setXtremeQty(record?.xtremeQty || 0);
        setKiddoQty(record?.kiddoQty || 0);
        setVipQty(record?.vipQty || 0);
        setOtherAmount(record?.otherAmount || 0);
    }, [correctionDate, personnel.id, existingSalesData]);

    const handleSaveClick = () => {
        // These prices should ideally come from a shared config, but are hardcoded for consistency with DailySalesEntry
        const prices = { xtreme: 1200, kiddo: 800, vip: 2500 };
        const salesData = {
            xtremeQty,
            xtremeAmount: xtremeQty * prices.xtreme,
            kiddoQty,
            kiddoAmount: kiddoQty * prices.kiddo,
            vipQty,
            vipAmount: vipQty * prices.vip,
            otherAmount,
        };
        onSave(correctionDate, personnel.id, salesData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">Correct Sales for</h2>
                            <p className="text-teal-400 font-semibold">{personnel.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="correction-date" className="block text-sm font-medium text-gray-300">Date to Correct</label>
                            <select id="correction-date" value={correctionDate} onChange={e => setCorrectionDate(e.target.value)} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg">
                                {datesInRange.map(date => <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString()}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="xtreme-qty" className="block text-sm font-medium text-gray-400">Xtreme Qty</label>
                                <input id="xtreme-qty" type="number" value={xtremeQty} onChange={e => setXtremeQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                            </div>
                             <div>
                                <label htmlFor="kiddo-qty" className="block text-sm font-medium text-gray-400">Kiddo Qty</label>
                                <input id="kiddo-qty" type="number" value={kiddoQty} onChange={e => setKiddoQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                            </div>
                             <div>
                                <label htmlFor="vip-qty" className="block text-sm font-medium text-gray-400">VIP Qty</label>
                                <input id="vip-qty" type="number" value={vipQty} onChange={e => setVipQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="other-amount" className="block text-sm font-medium text-gray-400">Other Sales Amount (BDT)</label>
                            <input id="other-amount" type="number" value={otherAmount} onChange={e => setOtherAmount(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Save Correction</button>
                </div>
            </div>
        </div>
    );
};

const SalesOfficerDashboard: React.FC<SalesOfficerDashboardProps> = ({ ticketSalesPersonnel, packageSales, startDate, endDate, onStartDateChange, onEndDateChange, role, onEditSales }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState<Operator | null>(null);

    const handleEditClick = (personnel: Operator) => {
        setEditingPersonnel(personnel);
        setIsEditModalOpen(true);
    };
    
    const aggregatedSalesByPersonnel = useMemo(() => {
        const map = new Map<number, Omit<PackageSalesRecord, 'date' | 'personnelId'>>();
        if (new Date(endDate) < new Date(startDate)) return map;

        for (const date in packageSales) {
            if (date >= startDate && date <= endDate) {
                const daySales = packageSales[date];
                for (const personnelIdStr in daySales) {
                    const personnelId = Number(personnelIdStr);
                    const record = daySales[personnelIdStr];

                    const existing = map.get(personnelId) || {
                        xtremeQty: 0, xtremeAmount: 0,
                        kiddoQty: 0, kiddoAmount: 0,
                        vipQty: 0, vipAmount: 0,
                        otherAmount: 0,
                    };

                    existing.xtremeQty += record.xtremeQty || 0;
                    existing.xtremeAmount += record.xtremeAmount || 0;
                    existing.kiddoQty += record.kiddoQty || 0;
                    existing.kiddoAmount += record.kiddoAmount || 0;
                    existing.vipQty += record.vipQty || 0;
                    existing.vipAmount += record.vipAmount || 0;
                    existing.otherAmount += record.otherAmount || 0;
                    
                    map.set(personnelId, existing);
                }
            }
        }
        return map;
    }, [packageSales, startDate, endDate]);

    const rangeTotals = useMemo(() => {
        const totals = { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, otherAmount: 0, totalQty: 0, totalAmount: 0 };
        for(const sales of aggregatedSalesByPersonnel.values()) {
            totals.xtremeQty += sales.xtremeQty;
            totals.xtremeAmount += sales.xtremeAmount;
            totals.kiddoQty += sales.kiddoQty;
            totals.kiddoAmount += sales.kiddoAmount;
            totals.vipQty += sales.vipQty;
            totals.vipAmount += sales.vipAmount;
            totals.otherAmount += sales.otherAmount;
            totals.totalQty += sales.xtremeQty + sales.kiddoQty + sales.vipQty;
            totals.totalAmount += sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + sales.otherAmount;
        }
        return totals;
    }, [aggregatedSalesByPersonnel]);
    
    const formatDisplayDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-CA');
    };

    const displayDateRange = startDate === endDate 
        ? `for ${formatDisplayDate(startDate)}`
        : `from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;

    const handleDownload = () => {
        const headers = [
            "Personnel Name",
            "Xtreme Qty", "Xtreme Amount",
            "Kiddo Qty", "Kiddo Amount",
            "VIP Qty", "VIP Amount",
            "Other Amount",
            "Total Qty",
            "Total Amount (BDT)"
        ];

        const rows = ticketSalesPersonnel
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(personnel => {
                const sales = aggregatedSalesByPersonnel.get(personnel.id);
                const totalQty = sales ? (sales.xtremeQty || 0) + (sales.kiddoQty || 0) + (sales.vipQty || 0) : 0;
                const totalAmount = sales ? (sales.xtremeAmount || 0) + (sales.kiddoAmount || 0) + (sales.vipAmount || 0) + (sales.otherAmount || 0) : 0;
                const rowData = [
                    `"${personnel.name.replace(/"/g, '""')}"`,
                    sales?.xtremeQty || 0,
                    sales?.xtremeAmount || 0,
                    sales?.kiddoQty || 0,
                    sales?.kiddoAmount || 0,
                    sales?.vipQty || 0,
                    sales?.vipAmount || 0,
                    sales?.otherAmount || 0,
                    totalQty,
                    totalAmount
                ];
                return rowData.join(',');
            });
        
        const totalRow = [
            `"TOTAL"`,
            rangeTotals.xtremeQty, rangeTotals.xtremeAmount,
            rangeTotals.kiddoQty, rangeTotals.kiddoAmount,
            rangeTotals.vipQty, rangeTotals.vipAmount,
            rangeTotals.otherAmount,
            rangeTotals.totalQty,
            rangeTotals.totalAmount
        ].join(',');

        const csvContent = [headers.join(','), ...rows, totalRow].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const filename = startDate === endDate 
            ? `TFW_Sales_Dashboard_${startDate}.csv`
            : `TFW_Sales_Dashboard_${startDate}_to_${endDate}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                        Sales Dashboard
                    </h1>
                     <p className="text-gray-400">Viewing sales data {displayDateRange}</p>
                </div>
                 <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                    <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-300">Start:</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                        />
                    </div>
                     <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-300">End:</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                            min={startDate}
                            className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                        />
                    </div>
                     <button
                        onClick={handleDownload}
                        className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm"
                    >
                        Download CSV
                    </button>
                 </div>
            </div>

            {/* Daily Summary */}
            <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Total Sales {displayDateRange}</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-400">Xtreme</p>
                        <p className="text-lg font-bold">{rangeTotals.xtremeQty} / {rangeTotals.xtremeAmount.toLocaleString()} BDT</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Kiddo</p>
                        <p className="text-lg font-bold">{rangeTotals.kiddoQty} / {rangeTotals.kiddoAmount.toLocaleString()} BDT</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">VIP</p>
                        <p className="text-lg font-bold">{rangeTotals.vipQty} / {rangeTotals.vipAmount.toLocaleString()} BDT</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Other</p>
                        <p className="text-lg font-bold">{rangeTotals.otherAmount.toLocaleString()} BDT</p>
                    </div>
                    <div className="col-span-2 md:col-span-1 border-t-2 md:border-t-0 md:border-l-2 border-teal-500 pt-4 md:pt-0 md:pl-4">
                        <p className="text-md font-bold text-gray-300">Grand Total</p>
                        <p className="text-2xl font-bold text-teal-400">{rangeTotals.totalAmount.toLocaleString()} BDT</p>
                    </div>
                </div>
            </div>

            {/* Personnel Breakdown */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr>
                        <th className="p-3 font-semibold">Personnel Name</th>
                        <th className="p-3 font-semibold text-right">Xtreme (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Kiddo (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">VIP (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Other Amt</th>
                        <th className="p-3 font-semibold text-right">Total (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map((personnel, index) => {
                            const sales = aggregatedSalesByPersonnel.get(personnel.id);
                            const totalQty = sales ? (sales.xtremeQty || 0) + (sales.kiddoQty || 0) + (sales.vipQty || 0) : 0;
                            const totalAmount = sales ? (sales.xtremeAmount || 0) + (sales.kiddoAmount || 0) + (sales.vipAmount || 0) + (sales.otherAmount || 0) : 0;
                            return (
                                <tr key={personnel.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                                    <td className="p-3 font-medium">{personnel.name}</td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums">
                                        {sales ? `${sales.xtremeQty.toLocaleString()} / ${sales.xtremeAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums">
                                        {sales ? `${sales.kiddoQty.toLocaleString()} / ${sales.kiddoAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums">
                                        {sales ? `${sales.vipQty.toLocaleString()} / ${sales.vipAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                     <td className="p-3 text-right text-gray-300 tabular-nums">
                                        {sales ? sales.otherAmount.toLocaleString() : '0'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-lg text-teal-400 tabular-nums whitespace-nowrap">
                                        {totalQty.toLocaleString()} / {totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        {(role === 'admin' || role === 'sales-officer') && (
                                            <button 
                                                onClick={() => handleEditClick(personnel)}
                                                className="px-3 py-1 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                         {ticketSalesPersonnel.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">No ticket sales personnel found.</td>
                            </tr>
                         )}
                    </tbody>
                    <tfoot className="bg-gray-700/50 border-t-2 border-teal-500">
                        <tr>
                            <td className="p-3 font-bold text-lg">TOTAL</td>
                             <td className="p-3 text-right font-bold tabular-nums">
                                {rangeTotals.xtremeQty.toLocaleString()} / {rangeTotals.xtremeAmount.toLocaleString()}
                            </td>
                             <td className="p-3 text-right font-bold tabular-nums">
                                {rangeTotals.kiddoQty.toLocaleString()} / {rangeTotals.kiddoAmount.toLocaleString()}
                            </td>
                             <td className="p-3 text-right font-bold tabular-nums">
                                {rangeTotals.vipQty.toLocaleString()} / {rangeTotals.vipAmount.toLocaleString()}
                            </td>
                             <td className="p-3 text-right font-bold tabular-nums">
                                {rangeTotals.otherAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-bold text-xl text-teal-300 tabular-nums whitespace-nowrap">
                                {rangeTotals.totalQty.toLocaleString()} / {rangeTotals.totalAmount.toLocaleString()}
                            </td>
                            <td className="p-3"></td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
            </div>
            {isEditModalOpen && editingPersonnel && (
                <EditSalesModal
                    personnel={editingPersonnel}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={onEditSales}
                    startDate={startDate}
                    endDate={endDate}
                    existingSalesData={packageSales}
                />
            )}
        </div>
    );
};

export default SalesOfficerDashboard;