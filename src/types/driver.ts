export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  address: string;
  employeeId: string;
  dateOfJoining: string;
  status: 'available' | 'on_trip' | 'on_leave' | 'suspended' | 'inactive';
  photo?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  license: DriverLicense;
  assignedVehicle?: string;
  rating: number;
  totalTrips: number;
  totalDistance: number; // km
  currentTripId?: string;
}

export interface DriverLicense {
  number: string;
  type: 'LMV' | 'HMV' | 'HPMV' | 'HGMV' | 'Transport';
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  endorsements: string[];
  status: 'valid' | 'expiring_soon' | 'expired' | 'suspended';
}

export interface TripAssignment {
  id: string;
  tripId: string;
  driverId: string;
  vehicleRegNo: string;
  material: string;
  quantity: number;
  customer: string;
  destination: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  distance: number;
  duration?: number; // minutes
  rating?: number;
  feedback?: string;
}

export interface DriverStats {
  totalDrivers: number;
  availableDrivers: number;
  onTripDrivers: number;
  onLeaveDrivers: number;
  licensesExpiringSoon: number;
}
