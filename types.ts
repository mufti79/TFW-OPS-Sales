
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

// FIX: Define PackageSalesData type for Firebase data structure to resolve import errors.
export type PackageSalesData = Record<string, Record<string, Omit<PackageSalesRecord, 'date' | 'personnelId'>>>;

// FIX: Added the missing MaintenanceRecord interface to resolve import errors.
export interface MaintenanceRecord {
  date: string; // YYYY-MM-DD
  rideName: string;
  hardwareRepaired: boolean;
  softwareIssueSolved: boolean;
  partsReplaced: boolean;
  isOutOfService: boolean;
}

export interface MaintenanceTicket {
  id: string; // Composite key, e.g., YYYY-MM-DD-rideId
  date: string; // YYYY-MM-DD
  rideId: number;
  rideName: string;
  problem: string;
  status: 'reported' | 'in-progress' | 'solved';
  reportedById: number;
  reportedByName: string;
  assignedToId?: number;
  assignedToName?: string;
  reportedAt: string; // ISO string
  inProgressAt?: string; // ISO string
  solvedAt?: string; // ISO string
  helperIds?: number[];
  helperNames?: string[];
}