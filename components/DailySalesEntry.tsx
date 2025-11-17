import React, { useState, useEffect, useMemo } from 'react';
import { Operator, PackageSalesRecord } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

type PackageSalesData = Record<string, Record<string, Omit<PackageSalesRecord, 'date' | 'personnelId'>>>;

interface DailySalesEntryProps {
  currentUser: Operator;
  selectedDate: string;
  onDateChange: (date: string) => void;
  packageSales: PackageSalesData;
  onSave: (data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => void;
  mySalesStartDate: string;
  onMySalesStartDateChange: (date: string) => void;
  mySalesEndDate: string;
  onMySalesEndDateChange: (date: string) => void;
}

const SalesInput: React.FC<{ label: string; qty: number; onQtyChange: (val: number) => void; amount: number; color: string; }> = ({ label, qty, onQtyChange, amount, color }) => {
    return (
        <div className={`p-4 rounded-lg border ${color}`}>
            <h3 className="text-xl font-bold mb-3">{label} Package</h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor={`${label}-qty`} className="block text-sm font-medium text-gray-400">Quantity Sold</label>
                    <input
                        id={`${label}-qty`}
                        type="number"
                        value={qty}
                        onChange={e => onQtyChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        min="0"
                    />
                </div>
                <div>
                    <label htmlFor={`${label}-amount`} className="block text-sm font-medium text-gray-400">Total Amount (BDT)</label>
                    <input
                        id={`${label}-amount`}
                        type="number"
                        value={amount}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none cursor-not-allowed text-gray-300"
                        min="0"
                    />
                </div>
            </div>
        </div>
    );
};


const DailySalesEntry: React.FC<DailySalesEntryProps> = ({ 
    currentUser, 
    selectedDate, 
    onDateChange, 
    packageSales, 
    onSave,
    mySalesStartDate,
    onMySalesStartDateChange,
    mySalesEndDate,
    onMySalesEndDateChange
}) => {
    const [packagePrices, setPackagePrices] = useLocalStorage('packagePrices', {
        xtreme: 1200,
        kiddo: 800,
        vip: 2500,
    });
    const [xtremeQty, setXtremeQty] = useState(0);
    const [xtremeAmount, setXtremeAmount] = useState(0);
    const [kiddoQty, setKiddoQty] = useState(0);
    const [kiddoAmount, setKiddoAmount] = useState(0);
    const [vipQty, setVipQty] = useState(0);
    const [vipAmount, setVipAmount] = useState(0);

    const originalRecord = useMemo(() => {
        return packageSales[selectedDate]?.[currentUser.id];
    }, [packageSales, selectedDate, currentUser.id]);

    const isDirty = useMemo(() => {
        const currentQty = {
            xtreme: xtremeQty,
            kiddo: kiddoQty,
            vip: vipQty,
        };
        const savedQty = {
            xtreme: originalRecord?.xtremeQty || 0,
            kiddo: originalRecord?.kiddoQty || 0,
            vip: originalRecord?.vipQty || 0,
        };
        return currentQty.xtreme !== savedQty.xtreme || 
               currentQty.kiddo !== savedQty.kiddo || 
               currentQty.vip !== savedQty.vip;
    }, [xtremeQty, kiddoQty, vipQty, originalRecord]);
    
    // Effect to warn user before leaving with unsaved changes
    useEffect(() => {
        if (!isDirty) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = ''; // Required for Chrome
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    // Effect to load existing sales data for the selected date
    useEffect(() => {
        if (originalRecord) {
            setXtremeQty(originalRecord.xtremeQty);
            setXtremeAmount(originalRecord.xtremeAmount);
            setKiddoQty(originalRecord.kiddoQty);
            setKiddoAmount(originalRecord.kiddoAmount);
            setVipQty(originalRecord.vipQty);
            setVipAmount(originalRecord.vipAmount);
        } else {
            // Reset form when date changes and no record is found.
            setXtremeQty(0);
            setKiddoQty(0);
            setVipQty(0);
            setXtremeAmount(0);
            setKiddoAmount(0);
            setVipAmount(0);
        }
    }, [selectedDate, originalRecord]);
    
    // Recalculate amounts if prices change
    useEffect(() => {
        setXtremeAmount(xtremeQty * packagePrices.xtreme);
        setKiddoAmount(kiddoQty * packagePrices.kiddo);
        setVipAmount(vipQty * packagePrices.vip);
    }, [packagePrices, xtremeQty, kiddoQty, vipQty]);


    const handleQtyChange = (packageType: 'xtreme' | 'kiddo' | 'vip', qty: number) => {
        const newQty = Math.max(0, qty || 0);
        switch(packageType) {
            case 'xtreme':
                setXtremeQty(newQty);
                setXtremeAmount(newQty * packagePrices.xtreme);
                break;
            case 'kiddo':
                setKiddoQty(newQty);
                setKiddoAmount(newQty * packagePrices.kiddo);
                break;
            case 'vip':
                setVipQty(newQty);
                setVipAmount(newQty * packagePrices.vip);
                break;
        }
    };
    
    const handlePriceChange = (packageType: 'xtreme' | 'kiddo' | 'vip', price: number) => {
        const newPrice = Math.max(0, price || 0);
        const newPrices = { ...packagePrices, [packageType]: newPrice };
        setPackagePrices(newPrices);
    };

    const totalAmount = useMemo(() => xtremeAmount + kiddoAmount + vipAmount, [xtremeAmount, kiddoAmount, vipAmount]);
    const totalQty = useMemo(() => xtremeQty + kiddoQty + vipQty, [xtremeQty, kiddoQty, vipQty]);

    const handleSave = () => {
        onSave({
            xtremeQty,
            xtremeAmount,
            kiddoQty,
            kiddoAmount,
            vipQty,
            vipAmount,
        });
    };

    const salesSummary = useMemo(() => {
        const summary = { xtremeQty: 0, xtremeAmount: 0, kiddoQty: 0, kiddoAmount: 0, vipQty: 0, vipAmount: 0, totalQty: 0, totalAmount: 0 };
        if (new Date(mySalesEndDate) < new Date(mySalesStartDate)) {
            return summary;
        }

        for (const date in packageSales) {
            if (date >= mySalesStartDate && date <= mySalesEndDate) {
                const daySales = packageSales[date];
                const userRecord = daySales[currentUser.id];
                if (userRecord) {
                    summary.xtremeQty += userRecord.xtremeQty || 0;
                    summary.xtremeAmount += userRecord.xtremeAmount || 0;
                    summary.kiddoQty += userRecord.kiddoQty || 0;
                    summary.kiddoAmount += userRecord.kiddoAmount || 0;
                    summary.vipQty += userRecord.vipQty || 0;
                    summary.vipAmount += userRecord.vipAmount || 0;
                    summary.totalQty += (userRecord.xtremeQty || 0) + (userRecord.kiddoQty || 0) + (userRecord.vipQty || 0);
                    summary.totalAmount += (userRecord.xtremeAmount || 0) + (userRecord.kiddoAmount || 0) + (userRecord.vipAmount || 0);
                }
            }
        }
        return summary;
    }, [packageSales, currentUser.id, mySalesStartDate, mySalesEndDate]);


    const [year, month, day] = selectedDate.split('-').map(Number);
    const displayDate = new Date(year, month - 1, day);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                        My Daily Sales Entry
                    </h1>
                     <p className="text-gray-400">Entries for {displayDate.toLocaleDateString()}</p>
                </div>
                 <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <label htmlFor="sales-date" className="text-sm font-medium text-gray-300">Date:</label>
                    <input
                        id="sales-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                    />
                </div>
            </div>

             <div className="mb-6 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Set Package Prices (BDT)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="xtreme-price" className="block text-sm font-medium text-purple-400">Xtreme Price</label>
                        <input
                            id="xtreme-price"
                            type="number"
                            min="0"
                            value={packagePrices.xtreme}
                            onChange={e => handlePriceChange('xtreme', parseInt(e.target.value, 10))}
                            className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="kiddo-price" className="block text-sm font-medium text-pink-400">Kiddo Price</label>
                        <input
                            id="kiddo-price"
                            type="number"
                            min="0"
                            value={packagePrices.kiddo}
                            onChange={e => handlePriceChange('kiddo', parseInt(e.target.value, 10))}
                            className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="vip-price" className="block text-sm font-medium text-yellow-400">VIP Price</label>
                        <input
                            id="vip-price"
                            type="number"
                            min="0"
                            value={packagePrices.vip}
                            onChange={e => handlePriceChange('vip', parseInt(e.target.value, 10))}
                            className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>
                 <p className="text-xs text-gray-500 mt-3">Note: Prices are saved on this device for future use.</p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 space-y-6">
                <SalesInput label="Xtreme" qty={xtremeQty} onQtyChange={(val) => handleQtyChange('xtreme', val)} amount={xtremeAmount} color="border-purple-500" />
                <SalesInput label="Kiddo" qty={kiddoQty} onQtyChange={(val) => handleQtyChange('kiddo', val)} amount={kiddoAmount} color="border-pink-500" />
                <SalesInput label="VIP" qty={vipQty} onQtyChange={(val) => handleQtyChange('vip', val)} amount={vipAmount} color="border-yellow-500" />
            </div>

            <div className="mt-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <p className="text-lg font-semibold text-gray-300">Total Packages Sold</p>
                    <p className="text-3xl font-bold text-gray-100">{totalQty.toLocaleString()}</p>
                </div>
                 <div className="text-center sm:text-right">
                    <p className="text-lg font-semibold text-gray-300">Total Sales Amount</p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                        {totalAmount.toLocaleString()} BDT
                    </p>
                </div>
            </div>
             <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-8 py-3 font-bold rounded-lg active:scale-95 transition-all text-lg ${
                        isDirty 
                        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-pulse' 
                        : 'bg-green-600 text-white opacity-75 cursor-default'
                    }`}
                >
                    {isDirty ? `Save Sales for ${displayDate.toLocaleDateString('en-CA')}` : 'All Saved'}
                </button>
            </div>

            {/* Sales Summary Section */}
            <div className="mt-12 pt-8 border-t-2 border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-center text-pink-400">My Sales Summary</h2>
                {/* Date Range Picker */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-300">Start:</label>
                        <input
                            id="start-date"
                            type="date"
                            value={mySalesStartDate}
                            onChange={(e) => onMySalesStartDateChange(e.target.value)}
                            className="flex-grow px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-300">End:</label>
                        <input
                            id="end-date"
                            type="date"
                            value={mySalesEndDate}
                            onChange={(e) => onMySalesEndDateChange(e.target.value)}
                            min={mySalesStartDate}
                            className="flex-grow px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                        />
                    </div>
                </div>
                {/* Summary Display */}
                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                        <span className="font-semibold text-purple-400">Xtreme Package</span>
                        <span className="font-bold text-gray-200 tabular-nums">{salesSummary.xtremeQty.toLocaleString()} Qty / {salesSummary.xtremeAmount.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                        <span className="font-semibold text-pink-400">Kiddo Package</span>
                        <span className="font-bold text-gray-200 tabular-nums">{salesSummary.kiddoQty.toLocaleString()} Qty / {salesSummary.kiddoAmount.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                        <span className="font-semibold text-yellow-400">VIP Package</span>
                        <span className="font-bold text-gray-200 tabular-nums">{salesSummary.vipQty.toLocaleString()} Qty / {salesSummary.vipAmount.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t-2 border-teal-500 gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-lg font-semibold text-gray-300">Total Packages</p>
                            <p className="text-3xl font-bold text-gray-100">{salesSummary.totalQty.toLocaleString()}</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-lg font-semibold text-gray-300">Total Amount</p>
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                                {salesSummary.totalAmount.toLocaleString()} BDT
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DailySalesEntry;