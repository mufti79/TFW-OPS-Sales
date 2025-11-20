import React, { useMemo, useState } from 'react';
import { Operator, Counter } from '../types';

interface TicketSalesExpertiseReportProps {
  ticketSalesPersonnel: Operator[];
  dailyAssignments: Record<string, Record<string, number[]>>;
  counters: Counter[];
}

interface ExpertiseData {
    personnelId: number;
    personnelName: string;
    uniqueCountersCount: number;
    counterDetails: { name: string; count: number }[];
}

const TicketSalesExpertiseReport: React.FC<TicketSalesExpertiseReportProps> = ({ ticketSalesPersonnel, dailyAssignments, counters }) => {
  const [expandedPersonnelId, setExpandedPersonnelId] = useState<number | null>(null);

  const expertiseData = useMemo<ExpertiseData[]>(() => {
    // Map<personnelId, Map<counterId, count>>
    const personnelCounterMap = new Map<number, Map<string, number>>();
    // FIX: Explicitly providing generic types to `new Map` ensures TypeScript correctly infers `counterIdToNameMap` as `Map<string, string>`.
    const counterIdToNameMap = new Map<string, string>(counters.map(c => [c.id.toString(), c.name]));

    // Populate the map with assignment counts
    Object.values(dailyAssignments).forEach(dayAssignments => {
      Object.entries(dayAssignments).forEach(([counterId, personnelIdValue]) => {
        // FIX: Handle both old (number) and new (number[]) data formats by casting to `any`.
        const personnelIdValueCasted = personnelIdValue as any;
        const personnelIds = Array.isArray(personnelIdValueCasted) ? personnelIdValueCasted : [personnelIdValueCasted];
        personnelIds.forEach((personnelId: number) => {
            // Ensure the personnel exists in the map
            if (!personnelCounterMap.has(personnelId)) {
                personnelCounterMap.set(personnelId, new Map());
            }
            const counterCounts = personnelCounterMap.get(personnelId)!;
            
            // Increment count for the specific counter
            counterCounts.set(counterId, (counterCounts.get(counterId) || 0) + 1);
        });
      });
    });

    // Convert map to a sorted array of expertise data
    return ticketSalesPersonnel.map(personnel => {
        const counterCounts = personnelCounterMap.get(personnel.id);
        
        let counterDetails: { name: string; count: number }[] = [];
        if (counterCounts) {
            counterDetails = Array.from(counterCounts.entries())
                .map(([counterId, count]: [string, number]) => {
                    // FIX: Type 'unknown' is not assignable to type 'string'. With `counterIdToNameMap` correctly typed, `.get()` returns `string | undefined`, which works as intended.
                    const name: string = counterIdToNameMap.get(counterId) || 'Unknown Counter';
                    return {
                        name,
                        count: count,
                    };
                })
                .sort((a, b) => b.count - a.count); // Sort by count descending
        }
        
        return {
            personnelId: personnel.id,
            personnelName: personnel.name,
            uniqueCountersCount: counterDetails.length,
            counterDetails: counterDetails,
        };
    })
    .sort((a, b) => b.uniqueCountersCount - a.uniqueCountersCount);

  }, [ticketSalesPersonnel, dailyAssignments, counters]);

  return (
    <div className="flex flex-col">
       <div className="flex justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                Ticket Sales Expertise Report
            </h1>
        </div>

        {expertiseData.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 font-semibold text-center w-24">Rank</th>
                  <th className="p-4 font-semibold">Personnel Name</th>
                  <th className="p-4 font-semibold text-right">Unique Counters Worked</th>
                  <th className="p-4 font-semibold text-center w-32">Details</th>
                </tr>
              </thead>
              <tbody>
                {expertiseData.map((item, index) => (
                    <React.Fragment key={item.personnelId}>
                        <tr className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                            <td className="p-4 font-bold text-xl text-center text-gray-400">{index + 1}</td>
                            <td className="p-4 font-medium text-lg">{item.personnelName}</td>
                            <td className="p-4 text-right font-bold text-2xl text-teal-400 tabular-nums">{item.uniqueCountersCount}</td>
                            <td className="p-4 text-center">
                                {item.uniqueCountersCount > 0 && (
                                <button
                                    onClick={() => setExpandedPersonnelId(expandedPersonnelId === item.personnelId ? null : item.personnelId)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all"
                                >
                                    {expandedPersonnelId === item.personnelId ? 'Hide' : 'Show'} Details
                                </button>
                                )}
                            </td>
                        </tr>
                        {expandedPersonnelId === item.personnelId && (
                            <tr className="bg-gray-900/70 border-t border-gray-700">
                                <td colSpan={4} className="p-4">
                                    <h4 className="font-semibold text-gray-300 mb-2">Assignment Frequency:</h4>
                                    <ul className="space-y-1">
                                        {item.counterDetails.map(detail => 
                                            <li key={detail.name} className="flex justify-between items-center text-gray-400">
                                                <span>{detail.name}</span>
                                                <span className="font-bold text-teal-300 bg-gray-700/50 px-2 py-0.5 rounded-md text-sm">{detail.count} {detail.count > 1 ? 'days' : 'day'}</span>
                                            </li>
                                        )}
                                    </ul>
                                </td>
                            </tr>
                        )}
                   </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400">No assignment data available.</h2>
            <p className="text-gray-500">This report will populate once personnel are assigned to counters.</p>
          </div>
        )}
    </div>
  );
};

export default TicketSalesExpertiseReport;