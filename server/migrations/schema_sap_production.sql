-- =========================================================================
-- SAP S/4HANA PRODUCTION ENTERPRISE CONNECTION SCHEMA
-- =========================================================================

-- 1. SAP PRODUCTION CONNECTION CONFIGURATION
CREATE TABLE IF NOT EXISTS sap_connection_config (
  id VARCHAR(50) PRIMARY KEY,
  connection_type VARCHAR(50) NOT NULL DEFAULT 'odata_cloud_connector', -- 'odata_cloud_connector', 'rfc_netweaver', 'simulation'
  system_id VARCHAR(50) DEFAULT 'PRD_S4H',
  system_name VARCHAR(100) DEFAULT 'SAP S/4HANA Enterprise 2023',
  host VARCHAR(200) DEFAULT 'sap-s4h.aparna-rmc.internal',
  port INT DEFAULT 44300,
  client VARCHAR(10) DEFAULT '100',
  sysnr VARCHAR(10) DEFAULT '00',
  username VARCHAR(100) DEFAULT 'RMC_GATE_SVC',
  password_masked VARCHAR(100) DEFAULT '••••••••••••',
  btp_destination_url VARCHAR(300) DEFAULT 'https://connectivity.aparna-rmc.btp.eu10.hana.ondemand.com',
  odata_base_url VARCHAR(300) DEFAULT 'https://sap-s4h.aparna-rmc.internal:44300/sap/opu/odata/sap',
  use_cloud_connector TINYINT(1) DEFAULT 1,
  cloud_connector_location_id VARCHAR(100) DEFAULT 'HYD_RMC_PLANT_01',
  timeout_ms INT DEFAULT 12000,
  is_active TINYINT(1) DEFAULT 1,
  last_tested_at DATETIME,
  last_test_status VARCHAR(50) DEFAULT 'connected',
  last_test_latency_ms INT DEFAULT 18,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SAP BILLING & INVOICING TRANSACTIONS (VF01 / VF02)
CREATE TABLE IF NOT EXISTS sap_billing_sync (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50),
  invoice_number VARCHAR(50),
  delivery_number VARCHAR(50),
  sales_order VARCHAR(50),
  customer_code VARCHAR(50),
  customer_name VARCHAR(150),
  concrete_grade VARCHAR(100),
  batch_volume_m3 DECIMAL(10,2),
  net_weight_kg DECIMAL(12,2),
  subtotal_amount DECIMAL(14,2),
  tax_amount DECIMAL(14,2),
  total_amount DECIMAL(14,2),
  sap_billing_doc VARCHAR(50), -- SAP VF01/VF02 Billing Document (9000xxxxxx)
  sap_accounting_doc VARCHAR(50), -- Financial Accounting Document (FI 1000xxxxxx)
  billing_type VARCHAR(20) DEFAULT 'F2', -- Standard Invoice
  company_code VARCHAR(20) DEFAULT '1000',
  sales_org VARCHAR(20) DEFAULT '1000',
  dist_channel VARCHAR(20) DEFAULT '10',
  division VARCHAR(20) DEFAULT '00',
  payment_terms VARCHAR(50) DEFAULT 'NT30',
  status VARCHAR(30) DEFAULT 'synced', -- 'synced', 'pending', 'error'
  payload_json JSON,
  response_json JSON,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_billing_inv (invoice_number),
  INDEX idx_billing_del (delivery_number),
  INDEX idx_billing_doc (sap_billing_doc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. RESILIENT ASYNCHRONOUS SAP SYNC QUEUE WITH RETRY AUDIT
CREATE TABLE IF NOT EXISTS sap_sync_queue (
  id VARCHAR(50) PRIMARY KEY,
  sync_category VARCHAR(50) NOT NULL, -- 'GOODS_RECEIPT_MIGO', 'GOODS_ISSUE_VL02N', 'BILLING_VF01', 'PURCHASE_ORDER_QUERY'
  reference_id VARCHAR(100), -- PO number, Delivery number, or Invoice number
  target_endpoint VARCHAR(200),
  status VARCHAR(30) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'retry'
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  last_attempt_at DATETIME,
  next_retry_at DATETIME,
  error_message TEXT,
  payload_json JSON,
  response_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_queue_status (status),
  INDEX idx_queue_cat (sync_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
