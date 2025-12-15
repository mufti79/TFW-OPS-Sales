
import React, { useMemo, useState, useEffect } from 'react';
// FIX: Imported PackageSalesData from types.ts to use the shared type definition.
import { Operator, PackageSalesRecord, PackageSalesData } from '../types';
import { Role } from '../hooks/useAuth';
import DeveloperAttribution from './DeveloperAttribution';

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
    const [xtremeQtyWithDiscount, setXtremeQtyWithDiscount] = useState(0);
    const [xtremeDiscount, setXtremeDiscount] = useState(0);
    const [kiddoQty, setKiddoQty] = useState(0);
    const [kiddoQtyWithDiscount, setKiddoQtyWithDiscount] = useState(0);
    const [kiddoDiscount, setKiddoDiscount] = useState(0);
    const [vipQty, setVipQty] = useState(0);
    const [vipQtyWithDiscount, setVipQtyWithDiscount] = useState(0);
    const [vipDiscount, setVipDiscount] = useState(0);
    const [otherSales, setOtherSales] = useState<OtherSaleItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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
        setXtremeQtyWithDiscount(record?.xtremeQtyWithDiscount || 0);
        setXtremeDiscount(record?.xtremeDiscountPercentage || 0);
        setKiddoQty(record?.kiddoQty || 0);
        setKiddoQtyWithDiscount(record?.kiddoQtyWithDiscount || 0);
        setKiddoDiscount(record?.kiddoDiscountPercentage || 0);
        setVipQty(record?.vipQty || 0);
        setVipQtyWithDiscount(record?.vipQtyWithDiscount || 0);
        setVipDiscount(record?.vipDiscountPercentage || 0);

        const existingOtherSales = record?.otherSales || [];
        if(record?.otherAmount > 0 && existingOtherSales.length === 0) {
            setOtherSales([{ id: `item-${Date.now()}`, category: 'Uncategorized', amount: record.otherAmount }]);
        } else {
            setOtherSales(existingOtherSales.map((item: any) => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })));
        }
    }, [correctionDate, personnel.id]); // Removed existingSalesData from dependencies
    
    const handleAddOtherSale = () => setOtherSales(prev => [...prev, { id: `item-${Date.now()}`, category: '', amount: 0 }]);
    const handleRemoveOtherSale = (id: string) => setOtherSales(prev => prev.filter(item => item.id !== id));
    const handleOtherSaleChange = (id: string, field: 'category' | 'amount', value: string | number) => {
        setOtherSales(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'amount') {
                    return { ...item, amount: Math.max(0, Number(value) || 0) };
                }
                return { ...item, category: String(value) };
            }
            return item;
        }));
    };

    const calculatePackageAmount = (qtyNoDiscount: number, qtyWithDiscount: number, price: number, discountPercent: number) => {
        const amountNoDiscount = qtyNoDiscount * price;
        const grossWithDiscount = qtyWithDiscount * price;
        const discountAmount = grossWithDiscount * (discountPercent / 100);
        const amountWithDiscount = grossWithDiscount - discountAmount;
        return amountNoDiscount + amountWithDiscount;
    };

    const handleSaveClick = async () => {
        if (isSaving) return; // Prevent double-clicks
        
        setIsSaving(true);
        
        try {
            const prices = { xtreme: 1200, kiddo: 800, vip: 2500 };
            
            const xtremeAmount = calculatePackageAmount(xtremeQty, xtremeQtyWithDiscount, prices.xtreme, xtremeDiscount);
            const kiddoAmount = calculatePackageAmount(kiddoQty, kiddoQtyWithDiscount, prices.kiddo, kiddoDiscount);
            const vipAmount = calculatePackageAmount(vipQty, vipQtyWithDiscount, prices.vip, vipDiscount);
            
            const salesData = {
                xtremeQty,
                xtremeAmount,
                xtremeQtyWithDiscount,
                xtremeDiscountPercentage: xtremeDiscount,
                kiddoQty,
                kiddoAmount,
                kiddoQtyWithDiscount,
                kiddoDiscountPercentage: kiddoDiscount,
                vipQty,
                vipAmount,
                vipQtyWithDiscount,
                vipDiscountPercentage: vipDiscount,
                otherSales: otherSales.map(({ category, amount }) => ({ category, amount }))
            };
            
            console.log('Saving sales data:', salesData); // Debug log
            
            // Call onSave and wait a moment for state propagation
            onSave(correctionDate, personnel.id, salesData);
            
            // Give Firebase time to propagate the change before closing
            await new Promise(resolve => setTimeout(resolve, 500));
            
            onClose();
        } catch (error) {
            console.error('Error saving sales data:', error);
            alert('Failed to save sales data. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-busy={isSaving}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                        <div className="bg-gray-900 px-6 py-4 rounded-lg shadow-xl border border-teal-500">
                            <div className="flex items-center gap-3">
                                <svg className="animate-spin h-8 w-8 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-white font-semibold text-lg">Saving changes...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">Correct Sales for</h2>
                            <p className="text-teal-400 font-semibold">{personnel.name}</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            disabled={isSaving}
                            className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Close modal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="correction-date" className="block text-sm font-medium text-gray-300">Date to Correct</label>
                            <select 
                                id="correction-date" 
                                value={correctionDate} 
                                onChange={e => setCorrectionDate(e.target.value)} 
                                disabled={isSaving}
                                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {datesInRange.map(date => <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-200">Package Sales (No Discount)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <div><label htmlFor="xtreme-qty" className="block text-sm font-medium text-purple-400">Xtreme Qty</label><input id="xtreme-qty" type="number" value={xtremeQty} onChange={e => setXtremeQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                               <div><label htmlFor="kiddo-qty" className="block text-sm font-medium text-pink-400">Kiddo Qty</label><input id="kiddo-qty" type="number" value={kiddoQty} onChange={e => setKiddoQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                               <div><label htmlFor="vip-qty" className="block text-sm font-medium text-yellow-400">VIP Qty</label><input id="vip-qty" type="number" value={vipQty} onChange={e => setVipQty(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" /></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-orange-400">Package Sales (With Discount)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="xtreme-qty-disc" className="block text-sm font-medium text-purple-400">Xtreme Qty</label>
                                    <input id="xtreme-qty-disc" type="number" value={xtremeQtyWithDiscount} onChange={e => setXtremeQtyWithDiscount(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="xtreme-disc" className="block text-sm font-medium text-purple-400">Discount %</label>
                                    <input id="xtreme-disc" type="number" value={xtremeDiscount} onChange={e => setXtremeDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" max="100" step="0.1" />
                                </div>
                                <div>
                                    <label htmlFor="kiddo-qty-disc" className="block text-sm font-medium text-pink-400">Kiddo Qty</label>
                                    <input id="kiddo-qty-disc" type="number" value={kiddoQtyWithDiscount} onChange={e => setKiddoQtyWithDiscount(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="kiddo-disc" className="block text-sm font-medium text-pink-400">Discount %</label>
                                    <input id="kiddo-disc" type="number" value={kiddoDiscount} onChange={e => setKiddoDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" max="100" step="0.1" />
                                </div>
                                <div>
                                    <label htmlFor="vip-qty-disc" className="block text-sm font-medium text-yellow-400">VIP Qty</label>
                                    <input id="vip-qty-disc" type="number" value={vipQtyWithDiscount} onChange={e => setVipQtyWithDiscount(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="vip-disc" className="block text-sm font-medium text-yellow-400">Discount %</label>
                                    <input id="vip-disc" type="number" value={vipDiscount} onChange={e => setVipDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg" min="0" max="100" step="0.1" />
                                </div>
                            </div>
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
                    <button 
                        onClick={onClose} 
                        disabled={isSaving}
                        className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveClick} 
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Save Correction'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SalesOfficerDashboard: React.FC<SalesOfficerDashboardProps> = ({ ticketSalesPersonnel, packageSales, startDate, endDate, onStartDateChange, onEndDateChange, role, onEditSales, otherSalesCategories }) => {
    const [editingPersonnel, setEditingPersonnel] = useState<Operator | null>(null);
    const [expandedPersonnelId, setExpandedPersonnelId] = useState<number | null>(null);
    const [showTotalBreakdown, setShowTotalBreakdown] = useState(false);

    const handleEditClick = (personnel: Operator) => {
        setEditingPersonnel(personnel);
    };

    const handleCloseModal = () => {
        setEditingPersonnel(null);
    };
    
    const aggregatedSalesByPersonnel = useMemo(() => {
        const map = new Map<number, {
            xtremeQty: number; xtremeAmount: number; kiddoQty: number; kiddoAmount: number; vipQty: number; vipAmount: number;
            otherSales: { category: string; amount: number }[];
            totalDiscount: number;
        }>();
        if (new Date(endDate) < new Date(startDate)) return map;

        for (const date in packageSales) {
            if (date >= startDate && date <= endDate) {
                for (const personnelIdStr in packageSales[date]) {
                    const personnelId = Number(personnelIdStr);
                    const record = packageSales[date][personnelIdStr] as any;
                    const existing = map.get(personnelId) || { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, otherSales: [], totalDiscount: 0 };
                    
                    existing.xtremeQty += record.xtremeQty || 0; existing.xtremeAmount += record.xtremeAmount || 0;
                    existing.kiddoQty += record.kiddoQty || 0; existing.kiddoAmount += record.kiddoAmount || 0;
                    existing.vipQty += record.vipQty || 0; existing.vipAmount += record.vipAmount || 0;
                    
                    const recordOtherSales = record.otherSales || (record.otherAmount > 0 ? [{ category: 'Uncategorized', amount: record.otherAmount }] : []);
                    const otherTotal = recordOtherSales.reduce((s:number, i:{amount:number}) => s + i.amount, 0);
                    existing.otherSales = [...existing.otherSales, ...recordOtherSales];
                    
                    const gross = (record.xtremeAmount || 0) + (record.kiddoAmount || 0) + (record.vipAmount || 0) + otherTotal;
                    
                    // Calculate Discount
                    let discount = 0;
                    if (record.discountFixed && record.discountFixed > 0) {
                        discount = record.discountFixed;
                    } else if (record.discountPercentage && record.discountPercentage > 0) {
                        discount = gross * (record.discountPercentage / 100);
                    }
                    existing.totalDiscount += discount;
                    
                    map.set(personnelId, existing);
                }
            }
        }
        return map;
    }, [packageSales, startDate, endDate]);

    const rangeTotals = useMemo(() => {
        const totals = { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, otherAmount: 0, totalQty: 0, totalAmount: 0, totalDiscount: 0, netAmount: 0, otherBreakdown: '' };
        const otherSalesByCategory = new Map<string, number>();

        for(const sales of aggregatedSalesByPersonnel.values()) {
            const otherTotalForRow = sales.otherSales.reduce((s, i) => s + i.amount, 0);
            totals.xtremeQty += sales.xtremeQty; totals.xtremeAmount += sales.xtremeAmount;
            totals.kiddoQty += sales.kiddoQty; totals.kiddoAmount += sales.kiddoAmount;
            totals.vipQty += sales.vipQty; totals.vipAmount += sales.vipAmount;
            totals.otherAmount += otherTotalForRow;
            totals.totalQty += sales.xtremeQty + sales.kiddoQty + sales.vipQty;
            
            const gross = sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotalForRow;
            totals.totalAmount += gross;
            totals.totalDiscount += sales.totalDiscount;
            totals.netAmount += (gross - sales.totalDiscount);

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
        const headers = ["Personnel Name", "Xtreme Qty", "Xtreme Amount", "Kiddo Qty", "Kiddo Amount", "VIP Qty", "VIP Amount", "Other Amount", "Other Sales Breakdown", "Total Qty", "Gross Amount", "Discount", "Net Amount"];
        const rows = ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map(p => {
            const sales = aggregatedSalesByPersonnel.get(p.id);
            const otherTotal = sales ? sales.otherSales.reduce((s, i) => s + i.amount, 0) : 0;
            const otherBreakdown = sales ? sales.otherSales.map(i => `${i.category}: ${i.amount}`).join('; ') : '';
            const totalQty = sales ? sales.xtremeQty + sales.kiddoQty + sales.vipQty : 0;
            const gross = sales ? sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotal : 0;
            const discount = sales ? sales.totalDiscount : 0;
            const net = gross - discount;
            return [`"${p.name}"`, sales?.xtremeQty || 0, sales?.xtremeAmount || 0, sales?.kiddoQty || 0, sales?.kiddoAmount || 0, sales?.vipQty || 0, sales?.vipAmount || 0, otherTotal, `"${otherBreakdown}"`, totalQty, gross, discount, net].join(',');
        });
        const totalRow = [`"TOTAL"`, rangeTotals.xtremeQty, rangeTotals.xtremeAmount, rangeTotals.kiddoQty, rangeTotals.kiddoAmount, rangeTotals.vipQty, rangeTotals.vipAmount, rangeTotals.otherAmount, "", rangeTotals.totalQty, rangeTotals.totalAmount, rangeTotals.totalDiscount, rangeTotals.netAmount].join(',');
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
                    <div className="relative">
                        <button onClick={() => setShowTotalBreakdown(!showTotalBreakdown)} className="w-full text-center cursor-pointer">
                            <p className="text-sm text-gray-400 flex items-center justify-center gap-1">Other <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></p>
                            <p className="text-lg font-bold">{rangeTotals.otherAmount.toLocaleString()} BDT</p>
                        </button>
                        {showTotalBreakdown && rangeTotals.otherAmount > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-md py-2 px-3 border border-gray-600 shadow-lg z-10 text-left">
                                <h4 className="font-bold mb-1 text-sm">Other Sales Breakdown</h4>
                                <pre className="whitespace-pre-wrap font-sans">{rangeTotals.otherBreakdown}</pre>
                            </div>
                        )}
                    </div>
                    <div className="col-span-2 md:col-span-1 border-t-2 md:border-t-0 md:border-l-2 border-teal-500 pt-4 md:pt-0 md:pl-4">
                        <p className="text-md font-bold text-gray-300">Net Total</p>
                        <p className="text-2xl font-bold text-teal-400">{rangeTotals.netAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} BDT</p>
                        {rangeTotals.totalDiscount > 0 && <p className="text-xs text-orange-400">Discount: -{rangeTotals.totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>}
                    </div>
                </div>
            </div>
            {(role === 'admin' || role === 'sales-officer') && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                    <p className="text-sm text-blue-200">
                        💡 <span className="font-semibold">Tip:</span> Click the <span className="inline-block px-2 py-0.5 bg-blue-600 rounded text-xs">✏️ Edit</span> button or <span className="font-semibold">double-click any row</span> to edit sales data.
                    </p>
                </div>
            )}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto border border-gray-700">
                <table className="w-full text-left min-w-[1024px]">
                    <thead className="bg-gray-700/50"><tr>
                        <th className="p-3 font-semibold">Personnel Name</th>
                        <th className="p-3 font-semibold text-right">Xtreme (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Kiddo (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">VIP (Qty/Amt)</th>
                        <th className="p-3 font-semibold text-right">Other Amt</th>
                        <th className="p-3 font-semibold text-right">Discount</th>
                        <th className="p-3 font-semibold text-right">Net Amount</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                    </tr></thead>
                    <tbody>
                        {ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map((personnel, index) => {
                            const sales = aggregatedSalesByPersonnel.get(personnel.id);
                            const otherTotal = sales ? sales.otherSales.reduce((s, i) => s + i.amount, 0) : 0;
                            const gross = sales ? sales.xtremeAmount + sales.kiddoAmount + sales.vipAmount + otherTotal : 0;
                            const discount = sales ? sales.totalDiscount : 0;
                            const net = gross - discount;
                            const isExpanded = expandedPersonnelId === personnel.id;
                            const canEdit = role === 'admin' || role === 'sales-officer';
                            
                            return (
                                <React.Fragment key={personnel.id}>
                                    <tr 
                                        className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700 ${canEdit ? 'cursor-pointer hover:bg-gray-700/70 transition-colors' : ''}`}
                                        onDoubleClick={() => canEdit && handleEditClick(personnel)}
                                        title={canEdit ? "Double-click to edit" : ""}
                                    >
                                        <td className="p-3 font-medium flex items-center">
                                            {sales && sales.otherSales.length > 0 && otherTotal > 0 && (
                                                <button onClick={(e) => { e.stopPropagation(); setExpandedPersonnelId(isExpanded ? null : personnel.id); }} className="mr-2 p-1 rounded-full hover:bg-gray-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                                </button>
                                            )}
                                            {personnel.name}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">{sales ? `${sales.xtremeQty.toLocaleString()} / ${sales.xtremeAmount.toLocaleString()}` : '0 / 0'}</td>
                                        <td className="p-3 text-right tabular-nums">{sales ? `${sales.kiddoQty.toLocaleString()} / ${sales.kiddoAmount.toLocaleString()}` : '0 / 0'}</td>
                                        <td className="p-3 text-right tabular-nums">{sales ? `${sales.vipQty.toLocaleString()} / ${sales.vipAmount.toLocaleString()}` : '0 / 0'}</td>
                                        <td className="p-3 text-right tabular-nums">{otherTotal.toLocaleString()}</td>
                                        <td className="p-3 text-right tabular-nums text-orange-400">{discount > 0 ? `-${discount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '0'}</td>
                                        <td className="p-3 text-right font-bold text-lg text-teal-400 tabular-nums">{net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="p-3 text-center">
                                            {canEdit && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(personnel); }} 
                                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md hover:shadow-lg"
                                                    aria-label={`Edit sales for ${personnel.name}`}
                                                >
                                                    ✏️ Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {isExpanded && sales && sales.otherSales.length > 0 && otherTotal > 0 && (
                                        <tr className="bg-gray-900/50">
                                            <td colSpan={8} className="p-4">
                                                <div className="pl-8">
                                                    <h4 className="font-semibold text-gray-300 mb-2">Other Sales Breakdown for {personnel.name}:</h4>
                                                    <ul className="space-y-1 text-sm">
                                                        {sales.otherSales.filter(s => s.amount > 0).map((sale, i) => (
                                                            <li key={i} className="flex justify-between max-w-sm">
                                                                <span className="text-gray-400">{sale.category || 'Uncategorized'}:</span>
                                                                <span className="font-semibold text-gray-200">{sale.amount.toLocaleString()} BDT</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-700/50 border-t-2 border-teal-500"><tr>
                        <td className="p-3 font-bold text-lg">TOTAL</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.xtremeQty.toLocaleString()} / ${rangeTotals.xtremeAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.kiddoQty.toLocaleString()} / ${rangeTotals.kiddoAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{`${rangeTotals.vipQty.toLocaleString()} / ${rangeTotals.vipAmount.toLocaleString()}`}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{rangeTotals.otherAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold tabular-nums text-orange-400">-{rangeTotals.totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="p-3 text-right font-bold text-xl text-teal-300 tabular-nums">{rangeTotals.netAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="p-3"></td>
                    </tr></tfoot>
                </table>
            </div>
            {editingPersonnel && <EditSalesModal personnel={editingPersonnel} onClose={handleCloseModal} onSave={onEditSales} startDate={startDate} endDate={endDate} existingSalesData={packageSales} otherSalesCategories={otherSalesCategories} />}
            
            <DeveloperAttribution />
        </div>
    );
};

export default SalesOfficerDashboard;