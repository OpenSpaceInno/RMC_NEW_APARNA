export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicleRegNo: string;
  driverId?: string;
  driverName?: string;
  tripId?: string;
  tripNumber?: string;
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  quantity: number; // liters
  pricePerUnit: number;
  totalCost: number;
  odometerReading: number;
  fuelStation: string;
  location?: string;
  receiptNumber?: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelEfficiency {
  vehicleId: string;
  vehicleRegNo: string;
  avgKmPerLiter: number;
  totalFuelConsumed: number;
  totalDistanceCovered: number;
  totalCost: number;
  period: string;
}

export interface FuelStats {
  totalRecords: number;
  totalFuelConsumed: number;
  totalCost: number;
  avgCostPerLiter: number;
  avgKmPerLiter: number;
  mostEfficientVehicle?: FuelEfficiency;
  leastEfficientVehicle?: FuelEfficiency;
}

export interface FuelFormData {
  vehicleId: string;
  driverId?: string;
  tripId?: string;
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  quantity: number;
  pricePerUnit: number;
  odometerReading: number;
  fuelStation: string;
  location?: string;
  receiptNumber?: string;
  date: string;
  notes?: string;
}

export interface FuelFilters {
  vehicleId?: string;
  driverId?: string;
  fuelType?: string;
  dateRange?: { start: string; end: string };
}
