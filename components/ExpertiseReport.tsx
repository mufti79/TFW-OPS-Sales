
import React, { useMemo, useState } from 'react';
import { Operator, Ride } from '../types';

interface ExpertiseReportProps {
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number[] | number>>;
  rides: Ride[];
}

interface ExpertiseData {
    operatorId: number;
    operatorName: string;
    uniqueRidesCount: number;
    rideNames: string[];
}

const ExpertiseReport: React.FC<ExpertiseReportProps> = ({ operators, dailyAssignments, rides }) => {
  const [expandedOperatorId, setExpandedOperatorId] = useState<number | null>(null);

  const expertiseData = useMemo<ExpertiseData[]>(() => {
    const operatorRideMap = new Map<number, Set<string>>();
    const rideIdToNameMap = new Map(rides.map(r => [r.id.toString(), r.name]));

    // Populate the map with all unique ride IDs for each operator
    Object.values(dailyAssignments).forEach(dayAssignments => {
      Object.entries(dayAssignments).forEach(([rideId, operatorIdValue]) => {
        // FIX: Handle both old (number) and new (number[]) data formats by casting to `any`.
        const operatorIdValueCasted = operatorIdValue as any;
        const operatorIds = Array.isArray(operatorIdValueCasted) ? operatorIdValueCasted : [operatorIdValueCasted];
        operatorIds.forEach((operatorId: number) => {
            if (!operatorRideMap.has(operatorId)) {
                operatorRideMap.set(operatorId, new Set());
            }
            operatorRideMap.get(operatorId)!.add(rideId);
        });
      });
    });

    // Convert map to a sorted array of expertise data
    return operators.map(operator => {
        const rideIds = operatorRideMap.get(operator.id);
        const rideNames = rideIds 
            ? Array.from(rideIds)
                .map(id => rideIdToNameMap.get(id) || 'Unknown Ride')
                .sort()
            : [];
        
        return {
            operatorId: operator.id,
            operatorName: operator.name,
            uniqueRidesCount: rideNames.length,
            rideNames: rideNames,
        };
    })
    .sort((a, b) => b.uniqueRidesCount - a.uniqueRidesCount);

  }, [operators, dailyAssignments, rides]);

  return (
    <div className="flex flex-col">
       <div className="flex justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Operator Expertise Report
            </h1>
        </div>

        {expertiseData.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 font-semibold text-center w-24">Rank</th>
                  <th className="p-4 font-semibold">Operator Name</th>
                  <th className="p-4 font-semibold text-right">Unique Rides Operated</th>
                  <th className="p-4 font-semibold text-center w-32">Details</th>
                </tr>
              </thead>
              <tbody>
                {expertiseData.map((item, index) => (
                    <React.Fragment key={item.operatorId}>
                        <tr className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                            <td className="p-4 font-bold text-xl text-center text-gray-400">{index + 1}</td>
                            <td className="p-4 font-medium text-lg">{item.operatorName}</td>
                            <td className="p-4 text-right font-bold text-2xl text-purple-400 tabular-nums">{item.uniqueRidesCount}</td>
                            <td className="p-4 text-center">
                                {item.uniqueRidesCount > 0 && (
                                <button
                                    onClick={() => setExpandedOperatorId(expandedOperatorId === item.operatorId ? null : item.operatorId)}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all"
                                >
                                    {expandedOperatorId === item.operatorId ? 'Hide' : 'Show'} Rides
                                </button>
                                )}
                            </td>
                        </tr>
                        {expandedOperatorId === item.operatorId && (
                            <tr className="bg-gray-900/70 border-t border-gray-700">
                                <td colSpan={4} className="p-4">
                                    <h4 className="font-semibold text-gray-300 mb-2">Operated Rides/Games:</h4>
                                    <ul className="columns-1 sm:columns-2 md:columns-3 gap-x-6 list-disc list-inside text-gray-400">
                                    {item.rideNames.map(name => <li key={name} className="mb-1">{name}</li>)}
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
            <p className="text-gray-500">This report will populate once operators are assigned to rides and data is collected.</p>
          </div>
        )}
    </div>
  );
};

export default ExpertiseReport;
