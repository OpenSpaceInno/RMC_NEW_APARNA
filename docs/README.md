# Aparna RMC Gate-to-Exit Enterprise Documentation Suite
## Master Index & Engineering Blueprint Navigation Guide

---

### Project Overview
The **Aparna RMC Gate-to-Exit System** is an industrial-grade enterprise IoT and ERP integration platform operating at Ready Mix Concrete batching plants. It unites automated optical vehicle ANPR, real-time weighbridge scale indicators, concrete mix batching, dispatch quality assurance, GPS logistics tracking, physical boom barrier gating, and bi-directional **SAP S/4HANA 2023** synchronization.

---

## 📚 Master Documentation Architecture

The documentation suite is structured into high-level system volumes and granular, module-specific engineering blueprints:

### High-Level System Architecture Volumes

| Volume | File Path | Focus & Audience | Key Contents |
| :---: | :--- | :--- | :--- |
| **Vol 1** | [Architecture & System Design](ARCHITECTURE_AND_SYSTEM_DESIGN.md) | Enterprise Architects, Lead Engineers, IT Infrastructure | C4 Architecture Models, Tech Stack Matrix, Plant LAN Deployment Topology, Hardware Peripherals, Edge OCR & RBAC Model. |
| **Vol 2** | [Module-Wise Functional Specifications](MODULE_WISE_FUNCTIONAL_SPECIFICATIONS.md) | Product Managers, Business Analysts, Plant Operations | Master Plant Lifecycle Sequence, Detailed Specs for all 14 Modules (Weighbridge, Gate-In, Exit Gate, QC, Fleet, SAP). |
| **Vol 3** | [Engineering Pack & API Reference](ENGINEERING_PACK_AND_API_REFERENCE.md) | Full-Stack Engineers, SAP ABAP/BAPI Developers | Complete REST API Reference (20 Routers, 70+ Endpoints), SAP RFC & BAPI Signatures, Scale RS-232/Modbus Protocols, 39 DB Tables. |
| **Vol 4** | [Progress, Gap Analysis & Roadmap](PROGRESS_GAP_ANALYSIS_AND_ROADMAP.md) | Executive Leadership, QA, Project Managers | 94.6% Progress Scorecard, Verified Capabilities, Hardware & ERP Gaps, Hardcoded Value Audit, 4-Phase Production Roadmap. |

---

## 📂 Individual Module Engineering & Enhancement Blueprints (`docs/modules/`)

Every module in the system has a dedicated blueprint containing its **Component Tree, REST/WebSocket API Contracts, Database Schema, Business Logic Formulas, Production Gaps, and a Step-by-Step Developer Playbook for Feature Extensions**:

### Phase 1: Core Gate, Weighbridge & SAP RFC Backbone
- [`01_AUTHENTICATION_AND_RBAC.md`](modules/01_AUTHENTICATION_AND_RBAC.md): User accounts, cryptographically signed HS256 JWT session management, salted PBKDF2 hashing, audit logging, RBAC permission matrix, operator identity extraction stamped into SAP payloads. *(100% Production Ready)*
- [`02_INBOUND_GATE_AND_ANPR.md`](modules/02_INBOUND_GATE_AND_ANPR.md): Front gate camera feeds, Edge OCR (Tesseract + Indian RTO grammar normalizer), hardware FTP push ingestion, confidence scoring, plate correction modal.
- [`03_INBOUND_WEIGHBRIDGE_MIGO.md`](modules/03_INBOUND_WEIGHBRIDGE_MIGO.md): Live WebSocket scale streaming (10 Hz), stability detection, `BAPI_PO_GETDETAIL1` balance verification, `BAPI_GOODSMVT_CREATE` (Mvt 101/501), thermal weigh slip printing.
- [`06_OUTBOUND_EXIT_AND_BARRIER.md`](modules/06_OUTBOUND_EXIT_AND_BARRIER.md): Exit weighbridge gross weight capture, net concrete calculation, $\pm 1.5\%$ design tolerance check, tamper seal verification, `BAPI_OUTB_DELIVERY_CONFIRM_DEC` (Mvt 601 PGI), boom barrier relay actuation.
- [`07_SAP_ENTERPRISE_CONNECTOR.md`](modules/07_SAP_ENTERPRISE_CONNECTOR.md): SAP S/4HANA Enterprise RFC Gateway, Cloud Connector BTP vs NetWeaver RFC modes, live handshake prober, interactive BAPI tester console, resilient `sap_sync_queue` retry logic.

### Phase 2: Plant Production, Batching & Quality Control
- [`04_BATCHING_PLANT_AND_LOADING.md`](modules/04_BATCHING_PLANT_AND_LOADING.md): Liebherr 2.25 $m^3$ pan mixer bay allocations, M20–M50 mix designs, material target vs actual dosing, and automated inventory depletion.
- [`05_DISPATCH_AND_QC_APPROVAL.md`](modules/05_DISPATCH_AND_QC_APPROVAL.md): Slump cone test protocols (120–140 mm), fresh concrete temperature ($25^\circ\text{C}-32^\circ\text{C}$), compressive test cube sampling (7/28 day), electronic transit docket generation.
- [`14_INVENTORY_AND_RAW_STORES.md`](modules/14_INVENTORY_AND_RAW_STORES.md): Cement silo capacity tracking (OPC 53, PPC, GGBS, Fly Ash), coarse/fine aggregate stockpiles, chemical admixture tanks, automated reorder alerts.

### Phase 3: Fleet Logistics & Operations
- [`08_TRIP_LOGISTICS_AND_GPS.md`](modules/08_TRIP_LOGISTICS_AND_GPS.md): Real-time Leaflet GPS tracking, critical 90-minute concrete setting countdown, circular/polygon geofencing, route deviation and drum rotation monitoring.
- [`09_FLEET_VEHICLE_MANAGEMENT.md`](modules/09_FLEET_VEHICLE_MANAGEMENT.md): Vehicle tare baseline history, heavy transport permits, commercial insurance, state fitness certificate expiries.
- [`10_DRIVER_AND_FUEL_LOGS.md`](modules/10_DRIVER_AND_FUEL_LOGS.md): Commercial HTV driving license endorsements, trip assignments, plant diesel dispensing records, mileage calculations ($km/\text{Litre}$).
- [`11_INCIDENTS_AND_ESCALATIONS.md`](modules/11_INCIDENTS_AND_ESCALATIONS.md): Over/under weight anomaly escalation, broken seal investigations, quality rejection ticket lifecycle.

### Phase 4: Commercial, Invoicing & Device Streaming
- [`12_CUSTOMER_PORTAL_AND_EPOD.md`](modules/12_CUSTOMER_PORTAL_AND_EPOD.md): Customer project sites, delivery notes, receiver digital signature capture on mobile/tablet, waiting detention tracking.
- [`13_BILLING_AND_INVOICING.md`](modules/13_BILLING_AND_INVOICING.md): GST tax invoices (HSN 3824 50 10), payment receipts (NEFT/RTGS), SAP VF01/VF02 Billing Document generation.
- [`15_DEVICE_CONFIG_AND_STREAMING.md`](modules/15_DEVICE_CONFIG_AND_STREAMING.md): Industrial IP camera profiles, RTSP URLs, MediaMTX streaming proxy (`mediamtx.yml`), multi-port TCP socket prober diagnostics (554, 80, 8000).

---

## ⚡ Developer Extension Playbook (Universal SOP)

Any engineer extending or modifying features in any module must follow this 6-step standard operating procedure:

```
[Step 1: DB Migration]        --> Add columns or tables via server/migrations/
[Step 2: Backend Service]     --> Update query and logic in server/routes/ & services
[Step 3: TypeScript Interface]--> Add types in src/types/
[Step 4: API Client Method]   --> Expose typed method in src/lib/api.ts
[Step 5: Frontend UI & State] --> Bind form fields, TanStack Query, and Sonner feedback
[Step 6: End-to-End Test]     --> Write reproducible test script in scratch/
```

---

## 🚀 Quick Technical Start

### 1. Prerequisites
- **Node.js:** v20.x or higher
- **Database:** MySQL 8.0+ running on `127.0.0.1:3306` with database `rmc_gate_system`
- **Video Proxy:** MediaMTX binary (`mediamtx.exe`)

### 2. Running the Server (Port 3001)
```bash
cd server
node index.js
```
*Endpoints:*
- REST API: `http://localhost:3001/api`
- Scale WebSocket Stream: `ws://localhost:3001/scale`
- MediaMTX HLS Proxy: `http://localhost:8888`

### 3. Running the Frontend (Vite)
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in a Chromium-based browser.

### 4. Administrative Credentials
- **Username:** `admin` or `gowri`
- **Password:** `admin123` or `Admin@123`
- **Roles:** Plant Administrator (`plant_admin`), Weighbridge Operator (`weighbridge_operator`)
