import React from 'react';
import { CounterWithSales } from '../types';
import Counter from './Counter';

interface CounterCardProps {
  counterData: CounterWithSales;
  onSalesChange: (counterId: number, newCount: number) => void;
}

const CounterCard: React.FC<CounterCardProps> = ({ counterData, onSalesChange }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300 min-h-[180px]">
      <div>
        <span className="inline-block bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
          {counterData.location}
        </span>
        <h3 className="text-xl font-bold text-gray-100">{counterData.name}</h3>
      </div>
      <Counter count={counterData.sales} onCountChange={(newCount) => onSalesChange(counterData.id, newCount)} />
    </div>
  );
};

export default CounterCard;
