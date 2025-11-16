import React, { useMemo } from 'react';
import { Operator, PackageSalesRecord } from '../types';

interface SalesOfficerDashboardProps {
  ticketSalesPersonnel: Operator[];
  packageSales: PackageSalesRecord[];
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const SalesOfficerDashboard: React.FC<SalesOfficerDashboardProps> = ({ ticketSalesPersonnel, packageSales, startDate, endDate, onStartDateChange, onEndDateChange }) => {
    
    const salesForRange = useMemo(() => {
        if (new Date(endDate) < new Date(startDate)) return [];
        return packageSales.filter(r => r.date >= startDate && r.date <= endDate);
    }, [packageSales, startDate, endDate]);
    
    const aggregatedSalesByPersonnel = useMemo(() => {
        const map = new Map<number, Omit<PackageSalesRecord, 'date' | 'personnelId'>>();
        
        salesForRange.forEach(record => {
            const existing = map.get(record.personnelId) || {
                xtremeQty: 0, xtremeAmount: 0,
                kiddoQty: 0, kiddoAmount: 0,
                vipQty: 0, vipAmount: 0,
            };

            existing.xtremeQty += record.xtremeQty || 0;
            existing.xtremeAmount += record.xtremeAmount || 0;
            existing.kiddoQty += record.kiddoQty || 0;
            existing.kiddoAmount += record.kiddoAmount || 0;
            existing.vipQty += record.vipQty || 0;
            existing.vipAmount += record.vipAmount || 0;
            
            map.set(record.personnelId, existing);
        });
        return map;
    }, [salesForRange]);

    const rangeTotals = useMemo(() => {
        return salesForRange.reduce((acc, record) => {
            acc.xtremeQty += record.xtremeQty || 0;
            acc.xtremeAmount += record.xtremeAmount || 0;
            acc.kiddoQty += record.kiddoQty || 0;
            acc.kiddoAmount += record.kiddoAmount || 0;
            acc.vipQty += record.vipQty || 0;
            acc.vipAmount += record.vipAmount || 0;
            acc.totalQty += (record.xtremeQty || 0) + (record.kiddoQty || 0) + (record.vipQty || 0);
            acc.totalAmount += (record.xtremeAmount || 0) + (record.kiddoAmount || 0) + (record.vipAmount || 0);
            return acc;
        }, { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, totalQty: 0, totalAmount: 0 });
    }, [salesForRange]);
    
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
            "Total Qty",
            "Total Amount (BDT)"
        ];

        const rows = ticketSalesPersonnel
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(personnel => {
                const sales = aggregatedSalesByPersonnel.get(personnel.id);
                const totalQty = sales ? (sales.xtremeQty || 0) + (sales.kiddoQty || 0) + (sales.vipQty || 0) : 0;
                const totalAmount = sales ? (sales.xtremeAmount || 0) + (sales.kiddoAmount || 0) + (sales.vipAmount || 0) : 0;
                const rowData = [
                    `"${personnel.name.replace(/"/g, '""')}"`,
                    sales?.xtremeQty || 0,
                    sales?.xtremeAmount || 0,
                    sales?.kiddoQty || 0,
                    sales?.kiddoAmount || 0,
                    sales?.vipQty || 0,
                    sales?.vipAmount || 0,
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
                        <th className="p-3 font-semibold whitespace-nowrap">Personnel Name</th>
                        <th className="p-3 font-semibold text-right whitespace-nowrap">Xtreme (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right whitespace-nowrap">Kiddo (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right whitespace-nowrap">VIP (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right whitespace-nowrap">Total (Qty / Amt BDT)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map((personnel, index) => {
                            const sales = aggregatedSalesByPersonnel.get(personnel.id);
                            const totalQty = sales ? (sales.xtremeQty || 0) + (sales.kiddoQty || 0) + (sales.vipQty || 0) : 0;
                            const totalAmount = sales ? (sales.xtremeAmount || 0) + (sales.kiddoAmount || 0) + (sales.vipAmount || 0) : 0;
                            return (
                                <tr key={personnel.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                                    <td className="p-3 font-medium">{personnel.name}</td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                                        {sales ? `${sales.xtremeQty.toLocaleString()} / ${sales.xtremeAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                                        {sales ? `${sales.kiddoQty.toLocaleString()} / ${sales.kiddoAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                    <td className="p-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                                        {sales ? `${sales.vipQty.toLocaleString()} / ${sales.vipAmount.toLocaleString()}` : '0 / 0'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-lg text-teal-400 tabular-nums whitespace-nowrap">
                                        {totalQty.toLocaleString()} / {totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                         {ticketSalesPersonnel.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">No ticket sales personnel found.</td>
                            </tr>
                         )}
                    </tbody>
                    <tfoot className="bg-gray-700/50 border-t-2 border-teal-500">
                        <tr>
                            <td className="p-3 font-bold text-lg">TOTAL</td>
                             <td className="p-3 text-right font-bold tabular-nums whitespace-nowrap">
                                {rangeTotals.xtremeQty.toLocaleString()} / {rangeTotals.xtremeAmount.toLocaleString()}
                            </td>
                             <td className="p-3 text-right font-bold tabular-nums whitespace-nowrap">
                                {rangeTotals.kiddoQty.toLocaleString()} / {rangeTotals.kiddoAmount.toLocaleString()}
                            </td>
                             <td className="p-3 text-right font-bold tabular-nums whitespace-nowrap">
                                {rangeTotals.vipQty.toLocaleString()} / {rangeTotals.vipAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-bold text-xl text-teal-300 tabular-nums whitespace-nowrap">
                                {rangeTotals.totalQty.toLocaleString()} / {rangeTotals.totalAmount.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesOfficerDashboard;