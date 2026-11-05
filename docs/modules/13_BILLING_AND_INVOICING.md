# Module 13: Commercial Billing & SAP VF01 Invoicing
## Engineering & Enhancement Blueprint

---

### Document Information
- **Module ID:** `MOD-13-BILLING-INVOICE`
- **Module Name:** Customer Invoicing, GST Compliance & SAP VF01/VF02 Billing Sync
- **Primary Routes:** `/billing`
- **Core Files:**
  - [`src/pages/Billing.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/pages/Billing.tsx)
  - [`src/components/billing/InvoiceFormDialog.tsx`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/components/billing/InvoiceFormDialog.tsx)
  - [`src/hooks/useBilling.ts`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/src/hooks/useBilling.ts)
  - [`server/routes/billing.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/routes/billing.js)
  - [`server/sap-connector.js`](file:///d:/Projects/AntiGravity/Aparna_RMC_App/rmc-gate-to-exit-main/server/sap-connector.js)
- **Database Tables:** `invoices`, `payments`, `sap_billing_sync`

---

## 1. Module Overview & Business Scope

The **Billing & Invoicing Module** bridges completed concrete deliveries with enterprise accounts receivable and tax compliance. 

In commercial RMC contracts in India, concrete invoicing must comply with Goods and Services Tax (GST) laws (HSN Code 3824 50 10: Non-refractory mortars and concretes at 18% GST).

### Core Business Objectives:
1. **Automated Invoice Generation:** Aggregating completed trips and net delivered concrete volumes ($m^3$) into compliant GST tax invoices.
2. **SAP S/4HANA Billing Document Sync:** Direct creation of SAP Billing Documents (`BAPI_BILLINGDOC_CREATEMULTIPLE` - Transaction `VF01` / `VF02`, Billing Type `F2`) and Financial Accounting documents (FI `1000xxxxxx`).
3. **Pumping & Detention Charges:** Line-item invoicing for concrete pumping charges (per $m^3$), vertical pipeline setup charges, and truck detention waiting charges.
4. **Payment Reconciliation:** Tracking bank transfers (NEFT / RTGS) and customer outstanding balances.

---

## 2. Component Architecture & UI Wireframe

### Component Hierarchy
```
src/pages/Billing.tsx
├── useBilling (src/hooks/useBilling.ts)
├── Financial KPI Cards (Total Revenue, Paid Invoices, Outstanding Receivables, Overdue Invoices)
├── Search & Filter Bar (Customer, Invoice #, Date Range, Status: Draft/Sent/Paid/Overdue)
├── Invoices Table:
│   ├── Invoice # & Customer Name (Aparna Constructions, L&T, My Home)
│   ├── Issue Date, Due Date, Total Amount, Balance Outstanding
│   ├── SAP Sync Status Badge (VF01 Doc #90001842)
│   └── Action Buttons: [View Invoice], [Record Payment], [Sync to SAP], [Download PDF]
│
├── InvoiceFormDialog.tsx (Create invoice from delivered trips with line items)
└── PaymentDialog.tsx (Record NEFT/RTGS bank reference and reconcile balance)
```

---

## 3. Backend Services & Routing Architecture

### Endpoints in `server/routes/billing.js`
- `GET /api/billing/invoices`: Returns customer invoices with payment statuses and trip mappings.
- `POST /api/billing/invoices`: Creates new tax invoice from delivered batches.
- `POST /api/billing/invoices/:id/sap-sync`: Posts invoice to SAP S/4HANA via `BAPI_BILLINGDOC_CREATEMULTIPLE`.
- `POST /api/billing/payments`: Records payment receipt against invoice.

---

## 4. API Contracts & Telemetry Specifications

### `POST /api/billing/invoices/:id/sap-sync`
- **Response (200 OK):**
```json
{
  "success": true,
  "invoiceNumber": "INV-RMC-2026-4891",
  "sapBillingDoc": "90001842",
  "sapAccountingDoc": "10004921",
  "billingType": "F2",
  "totalAmount": 38400.00,
  "status": "synced",
  "syncedAt": "2026-10-28T22:35:00.000Z"
}
```

---

## 5. Database Schema & Data Dictionary

### Table: `invoices`
```sql
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_gst VARCHAR(50),
  trip_ids JSON,
  items JSON,                           -- Array of line items: concrete, pumping, detention
  subtotal DECIMAL(14,2) DEFAULT 0,
  tax_amount DECIMAL(14,2) DEFAULT 0,   -- 18% GST (9% CGST + 9% SGST or 18% IGST)
  total_amount DECIMAL(14,2) DEFAULT 0,
  paid_amount DECIMAL(14,2) DEFAULT 0,
  balance_amount DECIMAL(14,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',   -- 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inv_status (status),
  INDEX idx_inv_cust (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. Business Logic & Tax Formulas

1. **GST Calculation (HSN 3824 50 10):**
   $$\text{Subtotal} = \sum (\text{Quantity } m^3 \times \text{Rate per } m^3) + \text{Pumping Charges} + \text{Detention Charges}$$
   $$\text{CGST (9\%)} = \text{Subtotal} \times 0.09 \quad (\text{Intra-State Telangana})$$
   $$\text{SGST (9\%)} = \text{Subtotal} \times 0.09 \quad (\text{Intra-State Telangana})$$
   $$\text{Total Invoice Amount} = \text{Subtotal} + \text{CGST} + \text{SGST}$$

---

## 7. Current Implementation vs Production Reality (Gaps)

| Feature | Current State | Production Reality Gap | Solution / Action Item |
| :--- | :--- | :--- | :--- |
| **E-Invoicing QR Code (IRN)** | Standard printed PDF. | Indian tax law mandates real-time Government E-Invoicing (NIC Portal) with cryptographically signed QR code & IRN (Invoice Reference Number) for B2B transactions. | Integrate ClearTax / Masters India E-Invoicing API to stamp signed IRN onto invoices before customer sending. |

---

## 8. Future Enhancement Blueprint & Extension Hooks

1. **Customer Credit Limit Lock:**
   - Automatically block new sales order dispatches in the Loading Console if the customer's overdue balance exceeds their approved credit limit ($> ₹ 50\text{ Lakhs}$).

---

## 9. Developer "How-To" Playbook: Step-by-Step Feature Extension

### Scenario: Adding Government Invoice Reference Number (IRN) to Invoices

#### Step 1: Database Migration
```sql
ALTER TABLE invoices ADD COLUMN irn_hash VARCHAR(100) DEFAULT NULL AFTER invoice_number;
ALTER TABLE invoices ADD COLUMN signed_qr_code TEXT DEFAULT NULL AFTER irn_hash;
```

#### Step 2: TypeScript Interface Update
In `src/types/billing.ts`:
```typescript
export interface Invoice {
  ...
  irnHash?: string;
  signedQrCode?: string;
}
```

#### Step 3: Print Template Update
Render the signed government QR code on the invoice PDF.

