import React, { useMemo, useState, useEffect } from 'react';
import { Operator, PackageSalesRecord } from '../types';
import { Role } from '../hooks/useAuth';

type PackageSalesData = Record<string, Record<string, Omit<PackageSalesRecord, 'date' | 'personnelId'>>>;
type OtherSaleItem = { id: string; category: string; amount: number };

interface SalesOfficerDashboardProps {
  ticketSalesPersonnel: Operator[];
  packageSales: PackageSalesData;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  role: Role;
  onEditSales: (date: string, personnelId: number, data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => void;
  otherSalesCategories: string[];
}

interface EditSalesModalProps {
    personnel: Operator;
    onClose: () => void;
    onSave: (date: string, personnelId: number, data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => void;
    startDate: string;
    endDate: string;
    existingSalesData: PackageSalesData;
    otherSalesCategories: string[];
}

const EditSalesModal: React.FC<EditSalesModalProps> = ({ personnel, onClose, onSave, startDate, endDate, existingSalesData, otherSalesCategories }) => {
    const [correctionDate, setCorrectionDate] = useState(endDate);
    const [xtremeQty, setXtremeQty] = useState(0);
    const [kiddoQty, setKiddoQty] = useState(0);
    const [vipQty, setVipQty] = useState(0);
    const [otherSales, setOtherSales] = useState<OtherSaleItem[]>([]);

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
        const record = existingSalesData[correctionDate]?.[personnel.id] as any;
        setXtremeQty(record?.xtremeQty || 0);
        setKiddoQty(record?.kiddoQty || 0);
        setVipQty(record?.vipQty || 0);
        const existingOtherSales = record?.otherSales || [];
        if(record?.otherAmount > 0 && existingOtherSales.length === 0) {
            setOtherSales([{ id: `item-${Date.now()}`, category: 'Uncategorized', amount: record.otherAmount }]);
        } else {
            setOtherSales(existingOtherSales.map((item: any) => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })));
        }
    }, [correctionDate, personnel.id, existingSalesData]);
    
    const handleAddOtherSale = () => setOtherSales(prev => [...prev, { id: `item-${Date.now()}`, category: '', amount: 0 }]);
    const handleRemoveOtherSale = (id: string) => setOtherSales(prev => prev.filter(item => item.id !== id));
    const handleOtherSaleChange = (id: string, field: 'category' | 'amount', value: string | number) => {
        setOtherSales(prev => prev.map(item => item.id === id ? (field === 'amount' ? { ...item, amount: Math.max(0, Number(value) || 0) } : { ...item, [field]: value }) : item));
    };

    const handleSaveClick = () => {
        const prices = { xtreme: 1200, kiddo: 800, vip: 2500 };
        const salesData = {
            xtremeQty, xtremeAmount: xtremeQty * prices.xtreme,
            kiddoQty, kiddoAmount: kiddoQty * prices.kiddo,
            vipQty, vipAmount: vipQty * prices.vip,
            otherSales: otherSales.map(({ category, amount }) => ({ category, amount })),
        };
        onSave(correctionDate, personnel.id, salesData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up">
                <div className="p-6 max-h-[90vh] overflow-y-auto">
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
                           <div><label htmlFor="xtreme-qty" className="block text-sm font-medium text-gray-400">Xtreme Qty</label><input id="xtreme-qty" type="number" value={xtremeQty} onChange={e => setXtremeQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                           <div><label htmlFor="kiddo-qty" className="block text-sm font-medium text-gray-400">Kiddo Qty</label><input id="kiddo-qty" type="number" value={kiddoQty} onChange={e => setKiddoQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                           <div><label htmlFor="vip-qty" className="block text-sm font-medium text-gray-400">VIP Qty</label><input id="vip-qty" type="number" value={vipQty} onChange={e => setVipQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-600">
                          <h3 className="text-lg font-bold mb-3">Other Sales</h3>
                          <div className="space-y-3">
                              {otherSales.map((item) => (
                                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                                      <div className="col-span-6"><label className="text-xs text-gray-400">Category</label><input type="text" value={item.category} onChange={e => handleOtherSaleChange(item.id, 'category', e.target.value)} list="other-sales-categories" className="w-full px-2 py-1 bg-gray-700 border-gray-500 rounded-md" /></div>
                                      <div className="col-span-4"><label className="text-xs text-gray-400">Amount</label><input type="number" value={item.amount} onChange={e => handleOtherSaleChange(item.id, 'amount', e.target.value)} className="w-full px-2 py-1 bg-gray-700 border-gray-500 rounded-md" min="0" /></div>
                                      <div className="col-span-2"><button onClick={() => handleRemoveOtherSale(item.id)} className="w-full h-8 bg-red-800 text-white rounded-md flex items-center justify-center hover:bg-red-700">&times;</button></div>
                                  </div>
                              ))}
                              <datalist id="other-sales-categories">{otherSalesCategories.map(cat => <option key={cat} value={cat} />)}</datalist>
                              <button onClick={handleAddOtherSale} className="w-full px-3 py-1.5 bg-green-800 text-white font-semibold rounded-md text-xs">+ Add Item</button>
                          </div>
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

const SalesOfficerDashboard: React.FC<SalesOfficerDashboardProps> = ({ ticketSalesPersonnel, packageSales, startDate, endDate, onStartDateChange, onEndDateChange, role, onEditSales, otherSalesCategories }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState<Operator | null>(null);

    const handleEditClick = (personnel: Operator) => {
        setEditingPersonnel(personnel);
        setIsEditModalOpen(true);
    };
    
    const aggregatedSalesByPersonnel = useMemo(() => {
        const map = new Map<number, {
            xtremeQty: number; xtremeAmount: number; kiddoQty: number; kiddoAmount: number; vipQty: number; vipAmount: number;
            otherSales: { category: string; amount: number }[];
        }>();
        if (new Date(endDate) < new Date(startDate)) return map;

        for (const date in packageSales) {
            if (date >= startDate && date <= endDate) {
                for (const personnelIdStr in packageSales[date]) {
                    const personnelId = Number(personnelIdStr);
                    const record = packageSales[date][personnelIdStr] as any;
                    const existing = map.get(personnelId) || { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, otherSales: [] };
                    
                    existing.xtremeQty += record.xtremeQty || 0; existing.xtremeAmount += record.xtremeAmount || 0;
                    existing.kiddoQty += record.kiddoQty || 0; existing.kiddoAmount += record.kiddoAmount || 0;
                    existing.vipQty += record.vipQty || 0; existing.vipAmount += record.vipAmount || 0;
                    
                    const recordOtherSales = record.otherSales || (record.otherAmount > 0 ? [{ category: 'Uncategorized', amount: record.otherAmount }] : []);
                    existing.otherSales = [...existing.otherSales, ...recordOtherSales];
                    
                    map.set(personnelId, existing);
                }
            }
        }
        return map;
    }, [packageSales, startDate, endDate]);

    const rangeTotals = useMemo(() => {
        const totals = { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, otherAmount: 0, totalQty: 0, totalAmount: 0, otherBreakdown: '' };
        const otherSalesByCategory = new Map<string, number>();

        for(const sales of aggregatedSalesByPersonnel.values()) {
            const otherTotalForRow = sales.otherSales.reduce((s, i) => s + i.amount, 0);
            totals.xtremeQty += sales.xtremeQty; totals.xtremeAmount += sales.xtremeAmount;
            totals.kiddoQty += sales.kiddoQty; totals.kiddoAmount += sales.kiddoAmount;
            totals.vipQty += sales.vipQty; totals.vipAmount += sales.vipAmount;
            totals.otherAmount += otherTotalForRow;
            totals.totalQty += sales.xtremeQty + sales.kiddoQty + sales.vipQty;
            totals.totalAmount += sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotalForRow;

            sales.otherSales.forEach(item => {
                if (item.category && item.amount > 0) {
                    otherSalesByCategory.set(item.category, (otherSalesByCategory.get(item.category) || 0) + item.amount);
                }
            });
        }

        totals.otherBreakdown = Array.from(otherSalesByCategory.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by amount descending
            .map(([category, amount]) => `${category}: ${amount.toLocaleString()}`)
            .join('\n');
        
        if (!totals.otherBreakdown) {
            totals.otherBreakdown = 'No categorized other sales';
        }

        return totals;
    }, [aggregatedSalesByPersonnel]);
    
    const formatDisplayDate = (dateStr: string) => new Date(dateStr.split('-').map(Number).join('/')).toLocaleDateString('en-CA');
    const displayDateRange = startDate === endDate ? `for ${formatDisplayDate(startDate)}` : `from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;

    const handleDownload = () => {
        const headers = ["Personnel Name", "Xtreme Qty", "Xtreme Amount", "Kiddo Qty", "Kiddo Amount", "VIP Qty", "VIP Amount", "Other Amount", "Other Sales Breakdown", "Total Qty", "Total Amount (BDT)"];
        const rows = ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map(p => {
            const sales = aggregatedSalesByPersonnel.get(p.id);
            const otherTotal = sales ? sales.otherSales.reduce((s, i) => s + i.amount, 0) : 0;
            const otherBreakdown = sales ? sales.otherSales.map(i => `${i.category}: ${i.amount}`).join('; ') : '';
            const totalQty = sales ? sales.xtremeQty + sales.kiddoQty + sales.vipQty : 0;
            const totalAmount = sales ? sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotal : 0;
            return [`"${p.name}"`, sales?.xtremeQty || 0, sales?.xtremeAmount || 0, sales?.kiddoQty || 0, sales?.kiddoAmount || 0, sales?.vipQty || 0, sales?.vipAmount || 0, otherTotal, `"${otherBreakdown}"`, totalQty, totalAmount].join(',');
        });
        const totalRow = [`"TOTAL"`, rangeTotals.xtremeQty, rangeTotals.xtremeAmount, rangeTotals.kiddoQty, rangeTotals.kiddoAmount, rangeTotals.vipQty, rangeTotals.vipAmount, rangeTotals.otherAmount, "", rangeTotals.totalQty, rangeTotals.totalAmount].join(',');
        const csv = [headers.join(','), ...rows, totalRow].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `TFW_Sales_Dashboard_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    return (
        <div className="flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">Sales Dashboard</h1>
                    <p className="text-gray-400">Viewing sales data {displayDateRange}</p>
                </div>
                 <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                    <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg"><label htmlFor="start-date" className="text-sm font-medium text-gray-300">Start:</label><input id="start-date" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md" /></div>
                    <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg"><label htmlFor="end-date" className="text-sm font-medium text-gray-300">End:</label><input id="end-date" type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} min={startDate} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md" /></div>
                    <button onClick={handleDownload} className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg">Download CSV</button>
                 </div>
            </div>
            <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Total Sales {displayDateRange}</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div><p className="text-sm text-gray-400">Xtreme</p><p className="text-lg font-bold">{rangeTotals.xtremeQty} / {rangeTotals.xtremeAmount.toLocaleString()} BDT</p></div>
                    <div><p className="text-sm text-gray-400">Kiddo</p><p className="text-lg font-bold">{rangeTotals.kiddoQty} / {rangeTotals.kiddoAmount.toLocaleString()} BDT</p></div>
                    <div><p className="text-sm text-gray-400">VIP</p><p className="text-lg font-bold">{rangeTotals.vipQty} / {rangeTotals.vipAmount.toLocaleString()} BDT</p></div>
                    <div className="relative group cursor-pointer" title={rangeTotals.otherBreakdown}>
                        <p className="text-sm text-gray-400">Other</p>
                        <p className="text-lg font-bold">{rangeTotals.otherAmount.toLocaleString()} BDT</p>
                        {rangeTotals.otherAmount > 0 && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap border border-gray-600 shadow-lg z-10">
                                {rangeTotals.otherBreakdown}
                            </span>
                        )}
                    </div>
                    <div className="col-span-2 md:col-span-1 border-t-2 md:border-t-0 md:border-l-2 border-teal-500 pt-4 md:pt-0 md:pl-4"><p className="text-md font-bold text-gray-300">Grand Total</p><p className="text-2xl font-bold text-teal-400">{rangeTotals.totalAmount.toLocaleString()} BDT</p></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto border border-gray-700">
                <table className="w-full text-left min-w-[1024px]">
                    <thead className="bg-gray-700/50"><tr>
                        <th className="p-3 font-semibold">Personnel Name</th>
                        <th className="p-3 font-semibold text-right">Xtreme (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Kiddo (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">VIP (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Other Amt</th>
                        <th className="p-3 font-semibold text-right">Total (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                    </tr></thead>
                    <tbody>
                        {ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map((personnel, index) => {
                            const sales = aggregatedSalesByPersonnel.get(personnel.id);
                            const otherTotal = sales ? sales.otherSales.reduce((s, i) => s + i.amount, 0) : 0;
                            const totalQty = sales ? sales.xtremeQty + sales.kiddoQty + sales.vipQty : 0;
                            const totalAmount = sales ? sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotal : 0;
                            const otherBreakdown = sales && sales.otherSales.length > 0 ? sales.otherSales.filter(s => s.amount > 0).map(s => `${s.category}: ${s.amount.toLocaleString()}`).join('\n') : 'No other sales';
                            
                            return (
                                <tr key={personnel.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                                    <td className="p-3 font-medium">{personnel.name}</td>
                                    <td className="p-3 text-right tabular-nums">{sales ? `${sales.xtremeQty.toLocaleString()} / ${sales.xtremeAmount.toLocaleString()}` : '0 / 0'}</td>
                                    <td className="p-3 text-right tabular-nums">{sales ? `${sales.kiddoQty.toLocaleString()} / ${sales.kiddoAmount.toLocaleString()}` : '0 / 0'}</td>
                                    <td className="p-3 text-right tabular-nums">{sales ? `${sales.vipQty.toLocaleString()} / ${sales.vipAmount.toLocaleString()}` : '0 / 0'}</td>
                                    <td className="p-3 text-right tabular-nums relative group cursor-pointer" title={otherBreakdown}>
                                        {otherTotal.toLocaleString()}
                                        {sales && sales.otherSales.length > 0 && otherTotal > 0 && <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap border border-gray-600 shadow-lg z-10">{otherBreakdown}</span>}
                                    </td>
                                    <td className="p-3 text-right font-bold text-lg text-teal-400 tabular-nums">{`${totalQty.toLocaleString()} / ${totalAmount.toLocaleString()}`}</td>
                                    <td className="p-3 text-center">{(role === 'admin' || role === 'sales-officer') && <button onClick={() => handleEditClick(personnel)} className="px-3 py-1 bg-blue-600 text-white font-semibold rounded-md text-sm">Edit</button>}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-700/50 border-t-2 border-teal-500"><tr>
                        <td className="p-3 font-bold text-lg">TOTAL</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.xtremeQty.toLocaleString()} / ${rangeTotals.xtremeAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.kiddoQty.toLocaleString()} / ${rangeTotals.kiddoAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.vipQty.toLocaleString()} / ${rangeTotals.vipAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{rangeTotals.otherAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-xl text-teal-300 tabular-nums">{`${rangeTotals.totalQty.toLocaleString()} / ${rangeTotals.totalAmount.toLocaleString()}`}</td>
                        <td className="p-3"></td>
                    </tr></tfoot>
                </table>
            </div>
            {isEditModalOpen && editingPersonnel && <EditSalesModal personnel={editingPersonnel} onClose={() => setIsEditModalOpen(false)} onSave={onEditSales} startDate={startDate} endDate={endDate} existingSalesData={packageSales} otherSalesCategories={otherSalesCategories} />}
        </div>
    );
};

export default SalesOfficerDashboard;