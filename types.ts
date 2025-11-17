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

export interface HandoverRecord {
  id: number; // timestamp for unique key
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string for precise time
  counterId: number;
  fromPersonnelId: number;
  fromPersonnelName: string;
  toPersonnelId: number;
  toPersonnelName: string;
  assignerName: string;
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
}