# Module 10: Driver Registry & Fuel Dispensing Management
## Engineering & Enhancement Blueprint

---

### Document Information
- **Module ID:** `MOD-10-DRIVER-FUEL`
- **Module Name:** Commercial Driver Management, Heavy License Endorsements & Diesel Dispensing
- **Primary Routes:** `/drivers`, `/fuel`
- **Core Files:**
  - [`src/pages/DriverManagement.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/DriverManagement.tsx)
  - [`src/pages/FuelManagement.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/FuelManagement.tsx)
  - [`src/components/driver/DriverCard.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/driver/DriverCard.tsx)
  - [`src/components/driver/DriverFormDialog.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/driver/DriverFormDialog.tsx)
  - [`src/hooks/useDriverManagement.ts`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/hooks/useDriverManagement.ts)
  - [`src/hooks/useFuelManagement.ts`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/hooks/useFuelManagement.ts)
  - [`server/routes/drivers.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/routes/drivers.js)
  - [`server/routes/fuel.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/routes/fuel.js)
- **Database Tables:** `drivers`, `driver_trip_assignments`, `fuel_records`

---

## 1. Module Overview & Business Scope

The **Driver & Fuel Management Module** monitors driver qualifications, shift allocations, safety performance, and plant fuel dispensing. 

Operating transit mixers requires specialized Heavy Transport Vehicle (HTV) licensing due to the dynamic center of gravity of rotating concrete drums (high rollover risk during high-speed cornering). Fuel represents the second highest operational cost in concrete logistics after cement.

### Core Business Objectives:
1. **Commercial Driver Compliance:** Verification of Commercial Driving License (DL) numbers, state transport endorsements (Heavy Goods / Hazardous), badge numbers, and RTO expiry dates.
2. **Plant Fuel Dispenser Monitoring:** Logging diesel dispensed from on-site consumer pumps (e.g. 20,000L underground diesel storage tank with digital flow meter).
3. **Trip-by-Trip Fuel Mileage Calculation:** Measuring vehicle fuel efficiency ($km/\text{Litre}$) based on trip distance and dispensed diesel, flagging potential fuel pilferage or injector degradation.

---

## 2. Component Architecture & UI Wireframe

### Component Hierarchy
```
src/pages/DriverManagement.tsx
├── Driver Cards Grid:
│   └── DriverCard.tsx (Photo, Name, Employee ID, HTV License #, Expiry Date, Assigned Vehicle, Rating)
│       └── DriverFormDialog.tsx (Add/Edit driver details, emergency contacts, blood group)
│
src/pages/FuelManagement.tsx
├── Fuel Metrics (Total Fuel Consumed, Average Mileage km/L, Monthly Cost INR)
├── Fuel Dispensing Log Table (Date, Vehicle Reg No, Driver Name, Litres, Total Cost, Meter Reading)
└── FuelEntryDialog.tsx (Record new diesel fueling transaction)
```

---

## 3. Backend Services & Routing Architecture

### Endpoints in `server/routes/drivers.js`
- `GET /api/drivers`: List all drivers with assigned vehicle and availability status.
- `POST /api/drivers`: Register new commercial driver.
- `PUT /api/drivers/:id`: Update driver profile, license renewal, or vehicle assignment.
- `DELETE /api/drivers/:id`: Remove driver profile.

### Endpoints in `server/routes/fuel.js`
- `GET /api/fuel`: List all fuel dispensing transactions.
- `POST /api/fuel`: Record new fuel entry, calculate mileage vs previous odometer, and store cost.
- `GET /api/fuel/stats`: Aggregate fleet fuel consumption metrics and efficiency trends.

---

## 4. API Contracts & Telemetry Specifications

### `POST /api/fuel`
- **Request Body:**
```json
{
  "vehicleRegNo": "TS07UA9944",
  "driverId": "drv_001",
  "quantityLitres": 85.00,
  "pricePerLitre": 94.50,
  "totalCost": 8032.50,
  "odometerReading": 84210,
  "fuelStation": "Plant Consumer Pump 01",
  "receiptNumber": "DSL-2026-8941"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "recordId": "fuel_001",
  "previousOdometer": 83980,
  "distanceCoveredKm": 230,
  "calculatedMileageKmL": 2.71,
  "status": "normal_efficiency"
}
```

---

## 5. Database Schema & Data Dictionary

### Table: `drivers`
```sql
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'available', -- 'available' | 'on_trip' | 'off_duty'
  license JSON,                           -- { number, type: 'HTV', expiry: '2028-09-15' }
  assigned_vehicle VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_trips INT DEFAULT 0,
  total_distance DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Table: `fuel_records`
```sql
CREATE TABLE IF NOT EXISTS fuel_records (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  driver_name VARCHAR(100),
  quantity DECIMAL(10,2) NOT NULL,       -- Litres
  price_per_unit DECIMAL(10,2) NOT NULL,  -- INR per Litre
  total_cost DECIMAL(12,2) NOT NULL,
  odometer_reading INT NOT NULL,
  receipt_number VARCHAR(100),
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fuel_vehicle (vehicle_id),
  INDEX idx_fuel_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. Business Logic & Pilferage Safeguards

1. **Fuel Mileage Benchmark (IS Transit Mixers):**
   - Expected Mileage for Loaded 7$m^3$ Transit Mixer: $2.4 - 3.2\text{ km/Litre}$.
   - If calculated mileage drops below $1.8\text{ km/Litre}$, the system flags an `ABNORMAL_FUEL_CONSUMPTION` notice indicating fuel siphon theft or excessive engine idling.
2. **Expired License Dispatch Lock:**
   - If `driver.license.expiry < CURDATE()`, the driver is disabled in the Dispatch Approval assignment picker.

---

## 7. Current Implementation vs Production Reality (Gaps)

| Feature | Current State | Production Reality Gap | Solution / Action Item |
| :--- | :--- | :--- | :--- |
| **Fuel Dispenser Automation** | Manual entry of Litres. | Commercial fuel bowsers use digital pulse meters (e.g. Gilbarco / Tokheim) with RS-485 interfaces. | Connect RS-485 flow meter output directly to server to auto-log fuel quantity without human entry. |
| **Breathalyzer Interlock** | Manual safety check. | Operators should undergo alcohol breathalyzer testing before receiving vehicle keys. | Add biometric breathalyzer station at security gate gate-in. |

---

## 8. Future Enhancement Blueprint & Extension Hooks

1. **RFID Fuel Nozzle Tagging (Automatic Vehicle Recognition):**
   - RFID tag mounted on truck fuel tank inlet communicates with nozzle reader, preventing dispensing into unauthorized private vehicles.
2. **Driver Eco-Driving Scorecard:**
   - Score drivers based on harsh braking, sharp turns with loaded drum, and idle engine hours.

---

## 9. Developer "How-To" Playbook: Step-by-Step Feature Extension

### Scenario: Adding Breathalyzer Alcohol Test Result (PPM) to Driver Shift Log

#### Step 1: Database Migration
```sql
ALTER TABLE drivers ADD COLUMN last_alcohol_test_ppm DECIMAL(4,3) DEFAULT 0.000 AFTER status;
```

#### Step 2: TypeScript Interface Update
In `src/types/driver.ts`:
```typescript
export interface Driver {
  ...
  lastAlcoholTestPpm?: number;
}
```

#### Step 3: UI Card Update
In `DriverCard.tsx`, add a green shield badge `BAC 0.00% [VERIFIED]`.

