# Module 09: Fleet & Vehicle Management
## Engineering & Enhancement Blueprint

---

### Document Information
- **Module ID:** `MOD-09-FLEET-VEHICLES`
- **Module Name:** Fleet Inventory, Tare Baselines & Statutory Compliance
- **Primary Routes:** `/vehicles`
- **Core Files:**
  - [`src/pages/VehicleManagement.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/VehicleManagement.tsx)
  - [`src/components/vehicle/VehicleCard.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/vehicle/VehicleCard.tsx)
  - [`src/components/vehicle/VehicleFormDialog.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/vehicle/VehicleFormDialog.tsx)
  - [`src/components/vehicle/VehicleDetailsDialog.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/vehicle/VehicleDetailsDialog.tsx)
  - [`src/hooks/useVehicleManagement.ts`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/hooks/useVehicleManagement.ts)
  - [`server/routes/vehicles.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/routes/vehicles.js)
- **Database Tables:** `vehicles`, `vehicle_documents`, `vehicle_maintenance`

---

## 1. Module Overview & Business Scope

The **Fleet Management Module** maintains the complete physical and statutory lifecycle of Aparna RMC's transport assets. 

Aparna operates a diversified heavy vehicle fleet:
- **Transit Mixers:** 6 $m^3$, 7 $m^3$, 8 $m^3$, and 10 $m^3$ 3-axle and 4-axle mixer trucks (Tata Prima, Ashok Leyland, BharatBenz).
- **Aggregate Tippers:** 10-wheeler and 12-wheeler heavy dump trucks for raw material quarry transport.
- **Bulk Cement Tankers:** Pressurized pneumatic dry-bulk tankers for cement/fly ash haulage.
- **Stationary Concrete Pumps:** Boom placers and trailer-mounted high-pressure line pumps.

### Core Business Objectives:
1. **Unladen Tare Weight History:** Maintaining dynamic records of vehicle empty weights. Because transit mixer drums gradually accumulate dried concrete buildup ("drum build-up"), tare weights drift upwards over time, requiring periodic recalibration and acid chipping.
2. **Statutory Document Expiry Tracking:** Automated alerts for State RTO Fitness Certificates, National Commercial Permits, Insurance, and PUC certificates. Vehicles with expired documents are automatically blocked at the gate.
3. **Preventative Maintenance Logs:** Tracking oil changes, drum hydraulic gearbox fluid changes, tire wear, and chassis grease cycles.

---

## 2. Component Architecture & UI Wireframe

### Component Hierarchy
```
src/pages/VehicleManagement.tsx
├── useVehicleManagement (src/hooks/useVehicleManagement.ts)
├── Summary Metrics Cards (Total Fleet, Available, On Trip, Maintenance, Expiring Documents)
├── Search & Filter Bar (Registration number, Make, Status)
├── Tabs: [All Vehicles] | [Transit Mixers] | [Tippers] | [Pumps] | [In Maintenance]
├── Grid of Vehicles:
│   └── VehicleCard.tsx
│       ├── Reg No Badge & Make/Model (e.g. BharatBenz 2828C)
│       ├── Capacity (e.g. 7.00 m³ / 18 MT) & Tare Weight (13,420 KG)
│       ├── Statutory Document Health Badges (Insurance, Fitness, Permit)
│       └── Actions: [View Details], [Assign Driver], [Edit], [Maintenance]
│
├── VehicleFormDialog.tsx (Add/Edit vehicle specifications & baseline weights)
└── VehicleDetailsDialog.tsx (Comprehensive vehicle profile, maintenance log, odometer history)
```

---

## 3. Backend Services & Routing Architecture

### Endpoints in `server/routes/vehicles.js`
- `GET /api/vehicles`: List all fleet vehicles with filter by type and operational status.
- `GET /api/vehicles/:id`: Complete profile including attached document expiries and maintenance history.
- `POST /api/vehicles`: Register new fleet asset.
- `PUT /api/vehicles/:id`: Update vehicle specifications, capacity, or assigned driver.
- `PUT /api/vehicles/:id/status`: Change state (`available`, `on_trip`, `maintenance`, `out_of_service`).
- `DELETE /api/vehicles/:id`: Archive vehicle record.

---

## 4. API Contracts & Telemetry Specifications

### `GET /api/vehicles`
- **Response (200 OK):**
```json
[
  {
    "id": "veh_001",
    "registrationNo": "TS07UA9944",
    "type": "transit_mixer",
    "make": "BharatBenz",
    "model": "2828C 6x4 Heavy Duty",
    "year": 2023,
    "capacity": 7.00,
    "capacityUnit": "m³",
    "status": "available",
    "tareWeight": 13420,
    "currentDriver": "K. Narayana",
    "fitnessExpiry": "2027-04-15",
    "insuranceExpiry": "2026-11-20",
    "permitExpiry": "2028-06-30",
    "odometer": 84210.5
  }
]
```

---

## 5. Database Schema & Data Dictionary

### Table: `vehicles`
```sql
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(50) PRIMARY KEY,
  registration_no VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,          -- 'transit_mixer' | 'tipper' | 'cement_tanker' | 'pump'
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  capacity DECIMAL(10,2),
  capacity_unit VARCHAR(20) DEFAULT 'm³',
  status VARCHAR(30) DEFAULT 'available', -- 'available' | 'on_trip' | 'maintenance' | 'out_of_service'
  current_driver VARCHAR(100),
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  odometer DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reg (registration_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. Business Logic & Interlocks

1. **Gate Inbound/Outbound Lockout on Expired Fitness:**
   If `fitness_expiry < CURDATE()`, the Gate Monitor and Exit Verification modules display a red **STATUTORY VIOLATION ALERT** and reject automated gate pass generation until supervisor override.
2. **Tare Drift Detection:**
   If a vehicle's tare weight increases by more than $500\text{ kg}$ over 30 days, the system triggers a `DRUM_CLEANING_REQUIRED` notice indicating internal concrete crust buildup.

---

## 7. Current Implementation vs Production Reality (Gaps)

| Feature | Current State | Production Reality Gap | Solution / Action Item |
| :--- | :--- | :--- | :--- |
| **OBD-II / CAN-Bus Diagnostics** | Manual odometer entry. | Vehicle engine diagnostics (J1939 CAN-bus) can report real-time coolant temp, oil pressure, and fault codes. | Add CAN-bus telematics dongle streaming engine health to server. |
| **Document Upload Storage** | Document number fields. | Requires digital scanned PDF/JPEG storage for RTO compliance inspection. | Add S3/local file upload for PDF inspection certificates. |

---

## 8. Future Enhancement Blueprint & Extension Hooks

1. **Tire Pressure Monitoring System (TPMS) Integration:**
   - Real-time wireless pressure sensors on 10 mixer tires to prevent blowout delays en route to site.
2. **Automated Preventive Service Work Order Generation:**
   - Auto-create maintenance tasks in `maintenance_tasks` every $10,000\text{ km}$ odometer interval.

---

## 9. Developer "How-To" Playbook: Step-by-Step Feature Extension

### Scenario: Adding Drum Water Tank Capacity (Litres) to Transit Mixers

#### Step 1: Database Migration
```sql
ALTER TABLE vehicles ADD COLUMN water_tank_capacity_l INT DEFAULT 800 AFTER capacity_unit;
```

#### Step 2: TypeScript Interface Update
In `src/types/vehicle.ts`:
```typescript
export interface Vehicle {
  ...
  waterTankCapacityL?: number;
}
```

#### Step 3: UI Form Dialog Update
In `src/components/vehicle/VehicleFormDialog.tsx`, add input for `Drum Wash Water Tank (L)`.

