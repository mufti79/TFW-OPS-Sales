import React from 'react';
import { CounterWithSales } from '../types';
import CounterCard from './CounterCard';

interface TicketSalesViewProps {
  countersWithSales: CounterWithSales[];
  onSalesChange: (counterId: number, newCount: number) => void;
}

const TicketSalesView: React.FC<TicketSalesViewProps> = ({ countersWithSales, onSalesChange }) => {
  if (countersWithSales.length === 0) {
    return (
        <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
                Ticket Sales Dashboard
            </h1>
            <p className="text-xl text-gray-400">
                No ticket counters have been configured.
            </p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {countersWithSales.map(counter => (
            <CounterCard
                key={counter.id}
                counterData={counter}
                onSalesChange={onSalesChange}
            />
        ))}
    </div>
  );
};

export default TicketSalesView;
