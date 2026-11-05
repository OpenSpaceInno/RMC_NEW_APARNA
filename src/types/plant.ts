export interface Plant {
  id: string;
  code: string;
  name: string;
  location: string;
  city: string;
  capacityPerHour: number; // m3/hour
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'active' | 'maintenance' | 'inactive';
  userCount?: number;
  activeSessions?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PLANTS: Plant[] = [
  {
    id: 'PL01',
    code: 'PLANT_001',
    name: 'Plant 01 • Shamshabad Central',
    location: 'Plot 42, Hardware Park, Shamshabad',
    city: 'Hyderabad',
    capacityPerHour: 120,
    contactPerson: 'K. V. Rao',
    contactPhone: '+91 98490 12345',
    contactEmail: 'shamshabad.plant@aparna-rmc.com',
    status: 'active',
    userCount: 8,
    activeSessions: 3,
  },
  {
    id: 'PL02',
    code: 'PLANT_002',
    name: 'Plant 02 • Miyapur Metro',
    location: 'Sy. No. 108, IDA Bollaram Rd, Miyapur',
    city: 'Hyderabad',
    capacityPerHour: 90,
    contactPerson: 'S. N. Reddy',
    contactPhone: '+91 98490 23456',
    contactEmail: 'miyapur.plant@aparna-rmc.com',
    status: 'active',
    userCount: 5,
    activeSessions: 2,
  },
  {
    id: 'PL03',
    code: 'PLANT_003',
    name: 'Plant 03 • Gachibowli Tech Zone',
    location: 'Nanakramguda Financial District',
    city: 'Hyderabad',
    capacityPerHour: 150,
    contactPerson: 'P. Srinivas',
    contactPhone: '+91 98490 34567',
    contactEmail: 'gachibowli.plant@aparna-rmc.com',
    status: 'active',
    userCount: 6,
    activeSessions: 4,
  },
  {
    id: 'PL04',
    code: 'PLANT_004',
    name: 'Plant 04 • Medchal Industrial',
    location: 'Phase-II IDA, Medchal Highway',
    city: 'Hyderabad',
    capacityPerHour: 60,
    contactPerson: 'V. Raman',
    contactPhone: '+91 98490 45678',
    contactEmail: 'medchal.plant@aparna-rmc.com',
    status: 'maintenance',
    userCount: 3,
    activeSessions: 0,
  },
];
