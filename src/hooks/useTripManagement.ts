import { useState, useEffect, useCallback } from 'react';
import { Trip, TripEvent, TripFormData, TripStats, TripStatus, GPSConfig } from '@/types/tripManagement';
import { useToast } from '@/hooks/use-toast';
import { GPSLocation } from '@/types/trip';
import { api } from '@/lib/api';

const generateTripNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TRP${year}${month}${day}-${random}`;
};

const createInitialTrips = (): Trip[] => {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;
  const MIN = 60 * 1000;

  return [
    // Today's trips
    {
      id: 'trip-001',
      tripNumber: 'TRP261006-001',
      vehicleId: 'v-001',
      vehicleRegNo: 'MH12AB1234',
      driverId: 'd-001',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98765 43210',
      customerId: 'c-001',
      customerName: 'ABC Construction Ltd',
      customerContact: '+91 22 2345 6789',
      material: 'M25 RMC',
      quantity: 18500,
      unit: 'kg',
      origin: {
        name: 'RMC Plant Thane',
        address: 'Industrial Area, Thane West, Maharashtra',
        location: { latitude: 19.1000, longitude: 72.9000 },
      },
      destination: {
        name: 'Bandra Site',
        address: 'Plot 45, Bandra West, Mumbai',
        location: { latitude: 19.0596, longitude: 72.8295 },
      },
      waypoints: [],
      scheduledStartTime: new Date(now - 60 * MIN).toISOString(),
      actualStartTime: new Date(now - 55 * MIN).toISOString(),
      estimatedArrival: new Date(now + 15 * MIN).toISOString(),
      status: 'in_transit',
      totalDistance: 25,
      distanceCovered: 18.5,
      distanceRemaining: 6.5,
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777,
        timestamp: new Date().toISOString(),
        speed: 35,
        heading: 225,
      },
      gpsConfig: {
        deviceId: 'GPS-001',
        isEnabled: true,
        trackingInterval: 30,
        lastPing: new Date().toISOString(),
        signalStrength: 'strong',
      },
      priority: 'high',
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-002',
      tripNumber: 'TRP261006-002',
      vehicleId: 'v-002',
      vehicleRegNo: 'MH14CD5678',
      driverId: 'd-002',
      driverName: 'Suresh Patil',
      driverPhone: '+91 98765 43211',
      customerId: 'c-002',
      customerName: 'XYZ Developers',
      customerContact: '+91 22 3456 7890',
      material: 'M30 RMC',
      quantity: 20000,
      unit: 'kg',
      origin: {
        name: 'RMC Plant Thane',
        address: 'Industrial Area, Thane West, Maharashtra',
        location: { latitude: 19.1000, longitude: 72.9000 },
      },
      destination: {
        name: 'Andheri Project',
        address: 'MIDC, Andheri East, Mumbai',
        location: { latitude: 19.1197, longitude: 72.8464 },
      },
      waypoints: [],
      scheduledStartTime: new Date(now + 30 * MIN).toISOString(),
      estimatedArrival: new Date(now + 90 * MIN).toISOString(),
      status: 'scheduled',
      totalDistance: 18,
      distanceCovered: 0,
      distanceRemaining: 18,
      gpsConfig: {
        deviceId: 'GPS-002',
        isEnabled: true,
        trackingInterval: 30,
        signalStrength: 'offline',
      },
      priority: 'normal',
      createdAt: new Date(now - 1 * HOUR).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'trip-003',
      tripNumber: 'TRP261006-003',
      vehicleId: 'v-003',
      vehicleRegNo: 'MH04EF9012',
      driverId: 'd-003',
      driverName: 'Amit Sharma',
      driverPhone: '+91 98765 43212',
      customerId: 'c-003',
      customerName: 'Metro Builders',
      customerContact: '+91 22 4567 8901',
      material: 'M20 RMC',
      quantity: 15000,
      unit: 'kg',
      origin: {
        name: 'RMC Plant Thane',
        address: 'Industrial Area, Thane West, Maharashtra',
        location: { latitude: 19.1000, longitude: 72.9000 },
      },
      destination: {
        name: 'Powai Site',
        address: 'Hiranandani Gardens, Powai, Mumbai',
        location: { latitude: 19.1176, longitude: 72.9060 },
      },
      waypoints: [],
      scheduledStartTime: new Date(now - 3 * HOUR).toISOString(),
      actualStartTime: new Date(now - 3 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 2 * HOUR).toISOString(),
      actualArrival: new Date(now - 2.1 * HOUR).toISOString(),
      completedAt: new Date(now - 1.5 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 12,
      distanceCovered: 12,
      distanceRemaining: 0,
      gpsConfig: {
        deviceId: 'GPS-003',
        isEnabled: true,
        trackingInterval: 30,
        lastPing: new Date(now - 1.5 * HOUR).toISOString(),
        signalStrength: 'offline',
      },
      priority: 'normal',
      createdAt: new Date(now - 4 * HOUR).toISOString(),
      updatedAt: new Date(now - 1.5 * HOUR).toISOString(),
    },
    {
      id: 'trip-004',
      tripNumber: 'TRP261006-004',
      vehicleId: 'v-004',
      vehicleRegNo: 'MH01GH3456',
      driverId: 'd-004',
      driverName: 'Pradeep Singh',
      driverPhone: '+91 98765 43213',
      customerId: 'c-001',
      customerName: 'ABC Construction Ltd',
      customerContact: '+91 22 2345 6789',
      material: 'M35 RMC',
      quantity: 22000,
      unit: 'kg',
      origin: {
        name: 'RMC Plant Thane',
        address: 'Industrial Area, Thane West, Maharashtra',
        location: { latitude: 19.1000, longitude: 72.9000 },
      },
      destination: {
        name: 'Worli Site',
        address: 'Worli Sea Face, Mumbai',
        location: { latitude: 19.0178, longitude: 72.8183 },
      },
      waypoints: [],
      scheduledStartTime: new Date(now - 90 * MIN).toISOString(),
      actualStartTime: new Date(now - 85 * MIN).toISOString(),
      estimatedArrival: new Date(now - 30 * MIN).toISOString(),
      status: 'delayed',
      totalDistance: 28,
      distanceCovered: 20,
      distanceRemaining: 8,
      currentLocation: {
        latitude: 19.0350,
        longitude: 72.8400,
        timestamp: new Date().toISOString(),
        speed: 15,
        heading: 200,
      },
      gpsConfig: {
        deviceId: 'GPS-004',
        isEnabled: true,
        trackingInterval: 15,
        lastPing: new Date().toISOString(),
        signalStrength: 'moderate',
      },
      notes: 'Heavy traffic on Western Express Highway',
      priority: 'urgent',
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Historical trips (Day 1 to Day 25)
    {
      id: 'trip-005',
      tripNumber: 'TRP261005-001',
      vehicleId: 'v-001',
      vehicleRegNo: 'MH12AB1234',
      driverId: 'd-001',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98765 43210',
      customerId: 'c-004',
      customerName: 'Lodha Infra Projects',
      material: 'M40 RMC',
      quantity: 21000,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Lodha Crown Tower', address: 'Majiwada, Thane', location: { latitude: 19.2183, longitude: 72.9781 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 1 * DAY - 4 * HOUR).toISOString(),
      actualStartTime: new Date(now - 1 * DAY - 3.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 1 * DAY - 3 * HOUR).toISOString(),
      actualArrival: new Date(now - 1 * DAY - 3.1 * HOUR).toISOString(),
      completedAt: new Date(now - 1 * DAY - 2.5 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 14,
      distanceCovered: 14,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 1 * DAY - 5 * HOUR).toISOString(),
      updatedAt: new Date(now - 1 * DAY - 2.5 * HOUR).toISOString(),
    },
    {
      id: 'trip-006',
      tripNumber: 'TRP261005-002',
      vehicleId: 'v-002',
      vehicleRegNo: 'MH14CD5678',
      driverId: 'd-002',
      driverName: 'Suresh Patil',
      driverPhone: '+91 98765 43211',
      customerId: 'c-005',
      customerName: 'L&T Coastal Road J.V.',
      material: 'M45 High-Strength RMC',
      quantity: 24000,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Coastal Road Marine Lines Pier', address: 'Marine Drive, Mumbai', location: { latitude: 18.9438, longitude: 72.8232 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 1 * DAY - 8 * HOUR).toISOString(),
      actualStartTime: new Date(now - 1 * DAY - 7.9 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 1 * DAY - 6.8 * HOUR).toISOString(),
      actualArrival: new Date(now - 1 * DAY - 6.7 * HOUR).toISOString(),
      completedAt: new Date(now - 1 * DAY - 6 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 36,
      distanceCovered: 36,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'high',
      createdAt: new Date(now - 1 * DAY - 9 * HOUR).toISOString(),
      updatedAt: new Date(now - 1 * DAY - 6 * HOUR).toISOString(),
    },
    {
      id: 'trip-007',
      tripNumber: 'TRP261004-001',
      vehicleId: 'v-003',
      vehicleRegNo: 'MH04EF9012',
      driverId: 'd-003',
      driverName: 'Amit Sharma',
      driverPhone: '+91 98765 43212',
      customerId: 'c-002',
      customerName: 'XYZ Developers',
      material: 'M30 RMC',
      quantity: 19500,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'BKC Business Park Site', address: 'BKC, Mumbai', location: { latitude: 19.0657, longitude: 72.8688 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 2 * DAY - 5 * HOUR).toISOString(),
      actualStartTime: new Date(now - 2 * DAY - 4.9 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 2 * DAY - 4.1 * HOUR).toISOString(),
      actualArrival: new Date(now - 2 * DAY - 4.0 * HOUR).toISOString(),
      completedAt: new Date(now - 2 * DAY - 3.5 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 22,
      distanceCovered: 22,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 2 * DAY - 6 * HOUR).toISOString(),
      updatedAt: new Date(now - 2 * DAY - 3.5 * HOUR).toISOString(),
    },
    {
      id: 'trip-008',
      tripNumber: 'TRP261003-001',
      vehicleId: 'v-004',
      vehicleRegNo: 'MH01GH3456',
      driverId: 'd-004',
      driverName: 'Pradeep Singh',
      driverPhone: '+91 98765 43213',
      customerId: 'c-003',
      customerName: 'Metro Builders',
      material: 'M25 RMC',
      quantity: 17500,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Ghatkopar Metro Pillar #42', address: 'LBS Marg, Ghatkopar', location: { latitude: 19.0860, longitude: 72.9080 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 3 * DAY - 6 * HOUR).toISOString(),
      actualStartTime: new Date(now - 3 * DAY - 5.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 3 * DAY - 5.2 * HOUR).toISOString(),
      actualArrival: new Date(now - 3 * DAY - 5.1 * HOUR).toISOString(),
      completedAt: new Date(now - 3 * DAY - 4.5 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 11,
      distanceCovered: 11,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 3 * DAY - 7 * HOUR).toISOString(),
      updatedAt: new Date(now - 3 * DAY - 4.5 * HOUR).toISOString(),
    },
    {
      id: 'trip-009',
      tripNumber: 'TRP261002-001',
      vehicleId: 'v-001',
      vehicleRegNo: 'MH12AB1234',
      driverId: 'd-005',
      driverName: 'Ganesh Shinde',
      driverPhone: '+91 98765 43214',
      customerId: 'c-001',
      customerName: 'ABC Construction Ltd',
      material: 'M35 RMC',
      quantity: 21500,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Kandivali Skyrise Pod', address: 'Kandivali East, Mumbai', location: { latitude: 19.2060, longitude: 72.8540 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 4 * DAY - 3 * HOUR).toISOString(),
      actualStartTime: new Date(now - 4 * DAY - 2.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 4 * DAY - 1.8 * HOUR).toISOString(),
      actualArrival: new Date(now - 4 * DAY - 1.7 * HOUR).toISOString(),
      completedAt: new Date(now - 4 * DAY - 1.2 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 27,
      distanceCovered: 27,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'high',
      createdAt: new Date(now - 4 * DAY - 4 * HOUR).toISOString(),
      updatedAt: new Date(now - 4 * DAY - 1.2 * HOUR).toISOString(),
    },
    {
      id: 'trip-010',
      tripNumber: 'TRP261001-001',
      vehicleId: 'v-002',
      vehicleRegNo: 'MH14CD5678',
      driverId: 'd-001',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98765 43210',
      customerId: 'c-004',
      customerName: 'Lodha Infra Projects',
      material: 'M30 RMC',
      quantity: 19800,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Palava City Sector 5', address: 'Kalyan-Shil Road', location: { latitude: 19.1670, longitude: 73.0780 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 5 * DAY - 7 * HOUR).toISOString(),
      actualStartTime: new Date(now - 5 * DAY - 6.9 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 5 * DAY - 6.1 * HOUR).toISOString(),
      actualArrival: new Date(now - 5 * DAY - 6.0 * HOUR).toISOString(),
      completedAt: new Date(now - 5 * DAY - 5.3 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 19,
      distanceCovered: 19,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 5 * DAY - 8 * HOUR).toISOString(),
      updatedAt: new Date(now - 5 * DAY - 5.3 * HOUR).toISOString(),
    },
    {
      id: 'trip-011',
      tripNumber: 'TRP260929-001',
      vehicleId: 'v-003',
      vehicleRegNo: 'MH04EF9012',
      driverId: 'd-002',
      driverName: 'Suresh Patil',
      driverPhone: '+91 98765 43211',
      customerId: 'c-005',
      customerName: 'L&T Coastal Road J.V.',
      material: 'M40 RMC',
      quantity: 23000,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Sewri-Nhava Sheva Ramp', address: 'Sewri East', location: { latitude: 19.0010, longitude: 72.8590 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 7 * DAY - 4 * HOUR).toISOString(),
      actualStartTime: new Date(now - 7 * DAY - 3.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 7 * DAY - 2.9 * HOUR).toISOString(),
      actualArrival: new Date(now - 7 * DAY - 2.8 * HOUR).toISOString(),
      completedAt: new Date(now - 7 * DAY - 2.1 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 24,
      distanceCovered: 24,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'urgent',
      createdAt: new Date(now - 7 * DAY - 5 * HOUR).toISOString(),
      updatedAt: new Date(now - 7 * DAY - 2.1 * HOUR).toISOString(),
    },
    {
      id: 'trip-012',
      tripNumber: 'TRP260925-001',
      vehicleId: 'v-004',
      vehicleRegNo: 'MH01GH3456',
      driverId: 'd-006',
      driverName: 'Vikram Jadhav',
      driverPhone: '+91 98765 43215',
      customerId: 'c-002',
      customerName: 'XYZ Developers',
      material: 'M25 RMC',
      quantity: 18000,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Chembur East Colony', address: 'Chembur, Mumbai', location: { latitude: 19.0600, longitude: 72.8990 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 11 * DAY - 5 * HOUR).toISOString(),
      actualStartTime: new Date(now - 11 * DAY - 4.9 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 11 * DAY - 4.2 * HOUR).toISOString(),
      actualArrival: new Date(now - 11 * DAY - 4.1 * HOUR).toISOString(),
      completedAt: new Date(now - 11 * DAY - 3.5 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 16,
      distanceCovered: 16,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 11 * DAY - 6 * HOUR).toISOString(),
      updatedAt: new Date(now - 11 * DAY - 3.5 * HOUR).toISOString(),
    },
    {
      id: 'trip-013',
      tripNumber: 'TRP260920-001',
      vehicleId: 'v-001',
      vehicleRegNo: 'MH12AB1234',
      driverId: 'd-003',
      driverName: 'Amit Sharma',
      driverPhone: '+91 98765 43212',
      customerId: 'c-003',
      customerName: 'Metro Builders',
      material: 'M30 RMC',
      quantity: 20500,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Airoli Knowledge Park', address: 'Airoli, Navi Mumbai', location: { latitude: 19.1550, longitude: 72.9960 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 16 * DAY - 6 * HOUR).toISOString(),
      actualStartTime: new Date(now - 16 * DAY - 5.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 16 * DAY - 5.2 * HOUR).toISOString(),
      actualArrival: new Date(now - 16 * DAY - 5.1 * HOUR).toISOString(),
      completedAt: new Date(now - 16 * DAY - 4.4 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 13,
      distanceCovered: 13,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'normal',
      createdAt: new Date(now - 16 * DAY - 7 * HOUR).toISOString(),
      updatedAt: new Date(now - 16 * DAY - 4.4 * HOUR).toISOString(),
    },
    {
      id: 'trip-014',
      tripNumber: 'TRP260915-001',
      vehicleId: 'v-002',
      vehicleRegNo: 'MH14CD5678',
      driverId: 'd-004',
      driverName: 'Pradeep Singh',
      driverPhone: '+91 98765 43213',
      customerId: 'c-001',
      customerName: 'ABC Construction Ltd',
      material: 'M35 RMC',
      quantity: 22500,
      unit: 'kg',
      origin: { name: 'RMC Plant Thane', address: 'Thane West', location: { latitude: 19.1000, longitude: 72.9000 } },
      destination: { name: 'Vashi Bridge Ramp Pier', address: 'Vashi, Navi Mumbai', location: { latitude: 19.0770, longitude: 72.9860 } },
      waypoints: [],
      scheduledStartTime: new Date(now - 21 * DAY - 4 * HOUR).toISOString(),
      actualStartTime: new Date(now - 21 * DAY - 3.8 * HOUR).toISOString(),
      estimatedArrival: new Date(now - 21 * DAY - 3.0 * HOUR).toISOString(),
      actualArrival: new Date(now - 21 * DAY - 2.9 * HOUR).toISOString(),
      completedAt: new Date(now - 21 * DAY - 2.2 * HOUR).toISOString(),
      status: 'completed',
      totalDistance: 21,
      distanceCovered: 21,
      distanceRemaining: 0,
      gpsConfig: { isEnabled: true, trackingInterval: 30 },
      priority: 'high',
      createdAt: new Date(now - 21 * DAY - 5 * HOUR).toISOString(),
      updatedAt: new Date(now - 21 * DAY - 2.2 * HOUR).toISOString(),
    },
  ];
};

const mockEvents: TripEvent[] = [
  {
    id: 'evt-001',
    tripId: 'trip-001',
    type: 'created',
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    description: 'Trip created and scheduled',
    createdBy: 'System',
  },
  {
    id: 'evt-002',
    tripId: 'trip-001',
    type: 'dispatched',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    description: 'Vehicle dispatched from plant',
    location: {
      latitude: 19.1000,
      longitude: 72.9000,
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      speed: 0,
      heading: 0,
    },
    createdBy: 'Dispatcher',
  },
  {
    id: 'evt-003',
    tripId: 'trip-001',
    type: 'started',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    description: 'Trip started, vehicle in transit',
    createdBy: 'System',
  },
];

export const useTripManagement = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with MySQL data (fallback to initial mock data)
  useEffect(() => {
    setIsLoading(true);
    api.getTrips()
      .then(data => {
        if (data && data.length > 0) {
          setTrips(data);
        } else {
          setTrips(createInitialTrips());
        }
      })
      .catch((err) => {
        console.warn('Backend API offline, using fallback trips:', err);
        setTrips(createInitialTrips());
      })
      .finally(() => setIsLoading(false));

    setEvents(mockEvents);
  }, []);

  // Simulate GPS updates for active trips
  useEffect(() => {
    const interval = setInterval(() => {
      setTrips(prevTrips =>
        prevTrips.map(trip => {
          if (!['in_transit', 'dispatched', 'delayed'].includes(trip.status)) return trip;
          if (!trip.gpsConfig.isEnabled) return trip;

          // Simulate GPS movement
          const currentLoc = trip.currentLocation || {
            latitude: trip.origin.location.latitude,
            longitude: trip.origin.location.longitude,
            timestamp: new Date().toISOString(),
            speed: 0,
            heading: 0,
          };

          const newLocation: GPSLocation = {
            latitude: currentLoc.latitude + (Math.random() - 0.5) * 0.005,
            longitude: currentLoc.longitude + (Math.random() - 0.5) * 0.005,
            timestamp: new Date().toISOString(),
            speed: Math.max(0, (currentLoc.speed || 30) + (Math.random() - 0.5) * 10),
            heading: (currentLoc.heading + (Math.random() - 0.5) * 20) % 360,
          };

          const distanceIncrement = (newLocation.speed / 3600) * (trip.gpsConfig.trackingInterval);
          const newDistanceCovered = Math.min(
            trip.distanceCovered + distanceIncrement,
            trip.totalDistance
          );

          return {
            ...trip,
            currentLocation: newLocation,
            distanceCovered: newDistanceCovered,
            distanceRemaining: trip.totalDistance - newDistanceCovered,
            gpsConfig: {
              ...trip.gpsConfig,
              lastPing: new Date().toISOString(),
              signalStrength: Math.random() > 0.1 ? 'strong' : 'moderate',
            },
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const getStats = useCallback((): TripStats => {
    const total = trips.length;
    const scheduled = trips.filter(t => t.status === 'scheduled').length;
    const inProgress = trips.filter(t => ['dispatched', 'in_transit', 'at_destination', 'unloading'].includes(t.status)).length;
    const completed = trips.filter(t => t.status === 'completed').length;
    const cancelled = trips.filter(t => t.status === 'cancelled').length;
    const delayed = trips.filter(t => t.status === 'delayed').length;

    const completedTrips = trips.filter(t => t.status === 'completed' && t.completedAt && t.actualStartTime);
    const avgDeliveryTime = completedTrips.length > 0
      ? completedTrips.reduce((sum, t) => {
          const start = new Date(t.actualStartTime!).getTime();
          const end = new Date(t.completedAt!).getTime();
          return sum + (end - start) / 60000;
        }, 0) / completedTrips.length
      : 0;

    const onTimeTrips = completedTrips.filter(t => {
      const actual = new Date(t.actualArrival || t.completedAt!).getTime();
      const estimated = new Date(t.estimatedArrival).getTime();
      return actual <= estimated + 15 * 60000; // 15 min buffer
    }).length;
    const onTimeDeliveryRate = completedTrips.length > 0
      ? (onTimeTrips / completedTrips.length) * 100
      : 100;

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      delayed,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
    };
  }, [trips]);

  const createTrip = useCallback((formData: TripFormData): Trip => {
    const now = new Date().toISOString();
    const scheduledStart = new Date(formData.scheduledStartTime);
    const avgSpeed = 30; // km/h
    const estimatedDuration = (formData.estimatedDistance / avgSpeed) * 60 * 60000; // ms

    const resolvedVehicleRegNo = formData.vehicleRegNo || 
      (formData.vehicleId === 'v-001' ? 'MH12AB1234' : 
       formData.vehicleId === 'v-002' ? 'MH14CD5678' : 
       formData.vehicleId === 'v-003' ? 'MH04EF9012' : 
       formData.vehicleId === 'v-004' ? 'MH01GH3456' : 'MH02JK7890');

    const resolvedDriverName = formData.driverName || 
      (formData.driverId === 'd-001' ? 'Rajesh Kumar' : 
       formData.driverId === 'd-002' ? 'Suresh Patil' : 
       formData.driverId === 'd-003' ? 'Amit Sharma' : 
       formData.driverId === 'd-004' ? 'Pradeep Singh' : 'Ganesh Shinde');

    const resolvedDriverPhone = formData.driverPhone || '+91 98765 43210';

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      tripNumber: generateTripNumber(),
      vehicleId: formData.vehicleId,
      vehicleRegNo: resolvedVehicleRegNo,
      driverId: formData.driverId,
      driverName: resolvedDriverName,
      driverPhone: resolvedDriverPhone,
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerContact: formData.customerContact,
      material: formData.material,
      quantity: formData.quantity,
      unit: formData.unit,
      origin: {
        name: formData.origin.name,
        address: formData.origin.address,
        location: { latitude: formData.origin.latitude, longitude: formData.origin.longitude },
      },
      destination: {
        name: formData.destination.name,
        address: formData.destination.address,
        location: { latitude: formData.destination.latitude, longitude: formData.destination.longitude },
      },
      waypoints: [],
      scheduledStartTime: formData.scheduledStartTime,
      estimatedArrival: new Date(scheduledStart.getTime() + estimatedDuration).toISOString(),
      status: 'scheduled',
      totalDistance: formData.estimatedDistance,
      distanceCovered: 0,
      distanceRemaining: formData.estimatedDistance,
      gpsConfig: {
        deviceId: formData.gpsDeviceId,
        isEnabled: formData.enableGPS,
        trackingInterval: 30,
        signalStrength: 'offline',
      },
      notes: formData.notes,
      priority: formData.priority,
      createdAt: now,
      updatedAt: now,
    };

    setTrips(prev => [newTrip, ...prev]);

    // Add creation event
    const event: TripEvent = {
      id: `evt-${Date.now()}`,
      tripId: newTrip.id,
      type: 'created',
      timestamp: now,
      description: 'Trip created and scheduled',
      createdBy: 'System',
    };
    setEvents(prev => [event, ...prev]);

    // Dispatch audit event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'trips',
        action: 'CREATED',
        entityId: newTrip.tripNumber,
        entityType: 'Trip Dispatch',
        details: `Trip ${newTrip.tripNumber} scheduled for ${newTrip.customerName} (${resolvedVehicleRegNo}, ${newTrip.material})`,
        severity: 'info',
        performedBy: { id: 'DISP-OPS', name: 'Fleet Coordinator', role: 'Dispatcher' },
      }
    }));

    toast({
      title: 'Trip Created',
      description: `Trip ${newTrip.tripNumber} has been scheduled`,
    });

    return newTrip;
  }, [toast]);

  const updateTrip = useCallback((tripId: string, updates: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(trip =>
        trip.id === tripId
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      )
    );

    toast({
      title: 'Trip Updated',
      description: 'Trip details have been updated',
    });
  }, [toast]);

  const updateTripStatus = useCallback((tripId: string, status: TripStatus) => {
    const now = new Date().toISOString();
    let currentTripNumber = tripId;
    
    setTrips(prev =>
      prev.map(trip => {
        if (trip.id !== tripId) return trip;
        currentTripNumber = trip.tripNumber;

        const updates: Partial<Trip> = { status, updatedAt: now };

        if (status === 'dispatched' || status === 'in_transit') {
          if (!trip.actualStartTime) {
            updates.actualStartTime = now;
          }
        } else if (status === 'at_destination') {
          updates.actualArrival = now;
        } else if (status === 'completed') {
          updates.completedAt = now;
          updates.distanceCovered = trip.totalDistance;
          updates.distanceRemaining = 0;
        }

        return { ...trip, ...updates };
      })
    );

    // Add status change event
    const eventTypeMap: Record<TripStatus, TripEvent['type']> = {
      scheduled: 'created',
      dispatched: 'dispatched',
      in_transit: 'started',
      at_destination: 'arrived',
      unloading: 'unloading_started',
      completed: 'completed',
      cancelled: 'cancelled',
      delayed: 'delay_detected',
    };

    const event: TripEvent = {
      id: `evt-${Date.now()}`,
      tripId,
      type: eventTypeMap[status],
      timestamp: now,
      description: `Trip status changed to ${status.replace('_', ' ')}`,
      createdBy: 'System',
    };
    setEvents(prev => [event, ...prev]);

    // Dispatch audit event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'trips',
        action: status === 'delayed' ? 'ANOMALY_DETECTED' : status === 'completed' ? 'VERIFICATION_PASSED' : 'STATUS_CHANGE',
        entityId: currentTripNumber,
        entityType: 'Trip Dispatch',
        details: `Trip status updated to ${status.replace('_', ' ').toUpperCase()}`,
        severity: status === 'delayed' || status === 'cancelled' ? 'warning' : 'info',
        performedBy: { id: 'SYS-GPS', name: 'Trip Manager', role: 'System' },
      }
    }));

    toast({
      title: 'Status Updated',
      description: `Trip status changed to ${status.replace('_', ' ')}`,
    });
  }, [toast]);

  const cancelTrip = useCallback((tripId: string, reason?: string) => {
    updateTripStatus(tripId, 'cancelled');
    
    if (reason) {
      const event: TripEvent = {
        id: `evt-${Date.now()}`,
        tripId,
        type: 'note_added',
        timestamp: new Date().toISOString(),
        description: `Cancellation reason: ${reason}`,
        createdBy: 'System',
      };
      setEvents(prev => [event, ...prev]);
    }

    // Dispatch audit event
    window.dispatchEvent(new CustomEvent('rmc-audit-event', {
      detail: {
        module: 'trips',
        action: 'OVERRIDE_APPLIED',
        entityId: tripId,
        entityType: 'Trip Dispatch',
        details: `Trip cancelled. Reason: ${reason || 'Manual cancellation by controller'}`,
        severity: 'warning',
        performedBy: { id: 'PLANT-MGR', name: 'Plant Manager', role: 'Manager' },
      }
    }));
  }, [updateTripStatus]);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setEvents(prev => prev.filter(e => e.tripId !== tripId));
    
    toast({
      title: 'Trip Deleted',
      description: 'Trip has been removed',
    });
  }, [toast]);

  const getTripEvents = useCallback((tripId: string): TripEvent[] => {
    return events.filter(e => e.tripId === tripId).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events]);

  const addTripNote = useCallback((tripId: string, note: string) => {
    const event: TripEvent = {
      id: `evt-${Date.now()}`,
      tripId,
      type: 'note_added',
      timestamp: new Date().toISOString(),
      description: note,
      createdBy: 'User',
    };
    setEvents(prev => [event, ...prev]);

    toast({
      title: 'Note Added',
      description: 'Trip note has been added',
    });
  }, [toast]);

  const updateGPSConfig = useCallback((tripId: string, gpsConfig: Partial<GPSConfig>) => {
    setTrips(prev =>
      prev.map(trip =>
        trip.id === tripId
          ? { ...trip, gpsConfig: { ...trip.gpsConfig, ...gpsConfig }, updatedAt: new Date().toISOString() }
          : trip
      )
    );

    toast({
      title: 'GPS Configuration Updated',
      description: gpsConfig.isEnabled ? 'GPS tracking enabled' : 'GPS tracking disabled',
    });
  }, [toast]);

  const getActiveTrips = useCallback(() => {
    return trips.filter(t => ['dispatched', 'in_transit', 'at_destination', 'unloading', 'delayed'].includes(t.status));
  }, [trips]);

  const getScheduledTrips = useCallback(() => {
    return trips.filter(t => t.status === 'scheduled');
  }, [trips]);

  return {
    trips,
    events,
    selectedTrip,
    setSelectedTrip,
    isLoading,
    getStats,
    createTrip,
    updateTrip,
    updateTripStatus,
    cancelTrip,
    deleteTrip,
    getTripEvents,
    addTripNote,
    updateGPSConfig,
    getActiveTrips,
    getScheduledTrips,
  };
};
