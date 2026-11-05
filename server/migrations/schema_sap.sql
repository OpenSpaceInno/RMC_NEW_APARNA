-- =========================================================================
-- SAP ERP INTEGRATION SCHEMA FOR RMC WEIGHBRIDGE
-- =========================================================================

-- 1. SAP PURCHASE ORDERS (SAP -> RMC)
CREATE TABLE IF NOT EXISTS sap_purchase_orders (
  po_number VARCHAR(50) PRIMARY KEY,
  vendor_code VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(150) NOT NULL,
  material_code VARCHAR(50) NOT NULL,
  material_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  ordered_qty DECIMAL(12,2) NOT NULL,
  received_qty DECIMAL(12,2) DEFAULT 0,
  pending_qty DECIMAL(12,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'ton',
  plant_code VARCHAR(50) DEFAULT 'PL01',
  storage_location VARCHAR(100) DEFAULT 'SILO-01',
  default_vehicle VARCHAR(50),
  default_driver VARCHAR(100),
  status VARCHAR(30) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sap_po_vendor (vendor_code),
  INDEX idx_sap_po_mat (material_code),
  INDEX idx_sap_po_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SAP WEIGHBRIDGE SYNC TRANSACTIONS (BIDIRECTIONAL)
CREATE TABLE IF NOT EXISTS sap_weighbridge_sync (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50),
  slip_number VARCHAR(50),
  sync_type VARCHAR(30) NOT NULL, -- 'po_ref', 'without_po', 'others'
  po_number VARCHAR(50),
  vendor_name VARCHAR(150),
  material_name VARCHAR(150),
  vehicle_no VARCHAR(50),
  driver_name VARCHAR(100),
  tare_weight DECIMAL(12,2),
  gross_weight DECIMAL(12,2),
  net_weight DECIMAL(12,2),
  sap_doc_number VARCHAR(50), -- SAP MIGO Material Document Number
  movement_type VARCHAR(20) DEFAULT '101', -- 101: GR for PO, 501: Non-PO GR, 201: Cost Center, etc.
  plant_code VARCHAR(50) DEFAULT 'PL01',
  storage_location VARCHAR(100),
  direction VARCHAR(30) DEFAULT 'bidirectional', -- 'sap_to_rmc', 'rmc_to_sap', 'bidirectional'
  status VARCHAR(30) DEFAULT 'synced', -- 'synced', 'pending', 'error'
  notes TEXT,
  payload_json JSON,
  response_json JSON,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_po (po_number),
  INDEX idx_sync_sess (session_id),
  INDEX idx_sync_doc (sap_doc_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
