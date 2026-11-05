# Module 12: Customer Portal & Electronic Proof of Delivery (e-POD)
## Engineering & Enhancement Blueprint

---

### Document Information
- **Module ID:** `MOD-12-CUSTOMER-EPOD`
- **Module Name:** Customer Delivery Portal, Digital Proof of Delivery (e-POD) & Site Messaging
- **Primary Routes:** `/customer-portal`
- **Core Files:**
  - [`src/pages/CustomerPortal.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/CustomerPortal.tsx)
  - [`src/components/customer/DeliveryCard.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/customer/DeliveryCard.tsx)
  - [`src/components/customer/DeliveryDetailsDialog.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/customer/DeliveryDetailsDialog.tsx)
  - [`src/components/customer/PODViewer.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/customer/PODViewer.tsx)
  - [`src/components/customer/InvoiceViewer.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/customer/InvoiceViewer.tsx)
  - [`src/components/customer/MessageCenter.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/customer/MessageCenter.tsx)
  - [`src/hooks/useCustomerPortal.ts`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/hooks/useCustomerPortal.ts)
- **Database Tables:** `trips`, `invoices`, `sap_outbound_deliveries`

---

## 1. Module Overview & Business Scope

The **Customer Portal & e-POD Module** provides transparent, self-service tracking and digital documentation for Aparna RMC's project developers and contractors (e.g., Aparna Constructions, L&T Construction, My Home Group, Prestige Projects).

In commercial concrete supply, disputes frequently arise over delivered volume, pouring start/end times, waiting truck detention charges, and damaged paper delivery tickets.

### Core Business Objectives:
1. **Live Delivery Status Tracking:** Enabling project site engineers to see incoming transit mixers on an interactive map with accurate ETAs.
2. **Paperless Electronic Proof of Delivery (e-POD):** Capturing site receiver signature, pouring start/finish timestamps, pump line numbers, and delivered concrete volume ($m^3$) on mobile tablets.
3. **Instant Invoice & Delivery Challan Access:** Immediate PDF download of GST-compliant delivery challans as soon as the vehicle clears the plant exit gate.
4. **Site-to-Plant Direct Messaging:** Allowing site engineers to request pacing adjustments (e.g. "Slow down dispatch, pump line choked" or "Speed up, slab pour finishing soon").

---

## 2. Component Architecture & UI Wireframe

### Component Hierarchy
```
src/pages/CustomerPortal.tsx
├── useCustomerPortal (src/hooks/useCustomerPortal.ts)
├── Customer Metrics Banner (Active En Route, Delivered Today, Pending Invoices)
├── Tabs: [Active Deliveries] | [Completed Deliveries] | [Invoices & Dockets] | [Site Messaging]
├── Grid of Deliveries:
│   └── DeliveryCard.tsx
│       ├── OBD #, Project Site, Concrete Grade, Volume (m³)
│       ├── Transit Status (In Transit / Arrived on Site / Poured)
│       └── Actions: [Track Live], [View e-POD], [Download Challan]
│
├── DeliveryDetailsDialog.tsx (Mix design specs, slump certificate, driver contact)
├── PODViewer.tsx (Signed digital receipt with receiver signature & timestamps)
├── InvoiceViewer.tsx (GST commercial invoice view with download)
└── MessageCenter.tsx (Real-time operational chat between site engineer and batching console)
```

---

## 3. Backend Services & e-POD Data Signatures

### Endpoints
- `GET /api/customer/deliveries`: Returns customer-scoped active deliveries.
- `GET /api/customer/pod/:deliveryId`: Returns digitized proof of delivery certificate.
- `POST /api/customer/pod/sign`: Submits site receiver signature and unloading completion.
- `POST /api/customer/messages`: Sends pacing or technical messages to the plant dispatch desk.

---

## 4. API Contracts & Telemetry Specifications

### `POST /api/customer/pod/sign`
- **Request Body:**
```json
{
  "deliveryId": "80012940",
  "receiverName": "K. Venkat Rao (Site In-Charge)",
  "receiverPhone": "+91 98490 11223",
  "unloadedVolumeM3": 7.00,
  "pourStartTime": "2026-10-28T22:35:00.000Z",
  "pourEndTime": "2026-10-28T23:15:00.000Z",
  "waitingTimeMinutes": 15,
  "pumpLineNumber": "BOOM_PUMP_02",
  "signatureDataUrl": "data:image/png;base64,iVBORw0KGgo...",
  "remarks": "Slab pour Tower 4 completed smoothly. Slump 130mm accepted."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "podId": "pod_80012940_verified",
  "signedAt": "2026-10-28T23:16:00.000Z",
  "pdfDownloadUrl": "/api/reports/pod/80012940.pdf",
  "message": "Proof of delivery recorded and synced to SAP billing."
}
```

---

## 5. Database Schema & Data Dictionary

### JSON Structure in `trips.destination`:
```json
{
  "siteName": "Aparna Sarovar Zenith - Tower 4",
  "receiver": {
    "name": "K. Venkat Rao",
    "phone": "+91 98490 11223",
    "signature": "data:image/png;base64,...",
    "signedAt": "2026-10-28T23:16:00Z"
  },
  "pourMetrics": {
    "unloadedVolumeM3": 7.00,
    "waitingMinutes": 15,
    "slumpSiteMm": 125
  }
}
```

---

## 6. Business Logic & Waiting Detention Charges

1. **Free Unloading Time Policy:**
   Standard commercial contracts provide 45 minutes of free unloading time from site arrival. If waiting time $> 45$ minutes, the system automatically calculates truck detention charges ($₹ 1,500\text{ / hour}$) and appends them to the invoice.

---

## 7. Current Implementation vs Production Reality (Gaps)

| Feature | Current State | Production Reality Gap | Solution / Action Item |
| :--- | :--- | :--- | :--- |
| **Site OTP Signature Verification** | Signature canvas. | Construction sites often prefer 4-digit SMS OTP sent to registered site engineer's phone. | Add Twilio/Kaleyra SMS OTP verification service prior to signature submission. |

---

## 8. Future Enhancement Blueprint & Extension Hooks

1. **Concrete Compressive Strength 28-Day Auto-Portal Upload:**
   - Automatically notify customer when 28-day cube crushing test report is ready for download.
2. **Customer Pour Scheduling Calendar:**
   - Allow contractors to book future slab pour slots (e.g. 150 $m^3$ for next Tuesday night) directly through the portal.

---

## 9. Developer "How-To" Playbook: Step-by-Step Feature Extension

### Scenario: Adding Concrete Cube Sample Numbers Recorded on Site

#### Step 1: Update e-POD Sign Form
In `src/components/customer/PODViewer.tsx`, add input for `Site Cube Numbers (e.g. C-101 to C-106)`.

#### Step 2: Verification
Verify that cube numbers print on the generated e-POD PDF.

