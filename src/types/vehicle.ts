export interface Vehicle {
  id: string;
  registrationNo: string;
  type: 'truck' | 'tanker' | 'trailer' | 'pickup';
  make: string;
  model: string;
  year: number;
  capacity: number;
  capacityUnit: 'kg' | 'ton' | 'liters';
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  status: 'available' | 'in_transit' | 'maintenance' | 'inactive';
  currentDriver?: string;
  currentDriverPhone?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  odometer: number;
  fuelEfficiency: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'inspection';
  description: string;
  cost: number;
  odometerReading: number;
  performedAt: string;
  performedBy: string;
  nextDueAt?: string;
  nextDueOdometer?: number;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: 'registration' | 'insurance' | 'fitness' | 'permit' | 'pollution';
  documentNo: string;
  issuedAt: string;
  expiresAt: string;
  documentUrl?: string;
}

export interface VehicleStats {
  totalVehicles: number;
  available: number;
  inTransit: number;
  maintenance: number;
  inactive: number;
  expiringDocuments: number;
}
