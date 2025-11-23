export interface Ride {
  id: number;
  name: string;
  floor: string;
  imageUrl: string;
}

export interface RideWithCount extends Ride {
  count: number;
}

export interface Operator {
  id: number;
  name: string;
}

export interface AttendanceRecord {
    operatorId: number;
    date: string; // YYYY-MM-DD
    attendedBriefing: boolean;
    briefingTime: string | null; // HH:mm
}

// New data structure for Firebase
export type AttendanceData = Record<string, Record<string, {
    attendedBriefing: boolean;
    briefingTime: string | null;
}>>;


export interface Counter {
    id: number;
    name: string;
    location: string;
}

export interface CounterWithSales extends Counter {
  sales: number;
}

export interface HistoryRecord {
  id: number; // Using timestamp for unique ID
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface PackageSalesRecord {
  date: string; // YYYY-MM-DD
  personnelId: number;
  xtremeQty: number;
  xtremeAmount: number;
  kiddoQty: number;
  kiddoAmount: number;
  vipQty: number;
  vipAmount: number;
  otherSales: { category: string; amount: number }[];
}

// FIX: Added the missing 'MaintenanceRecord' interface to resolve the import error in MaintenanceDashboard.tsx.
export interface MaintenanceRecord {
  date: string; // YYYY-MM-DD
  rideName: string;
  hardwareRepaired: boolean;
  softwareIssueSolved: boolean;
  partsReplaced: boolean;
  isOutOfService: boolean;
}