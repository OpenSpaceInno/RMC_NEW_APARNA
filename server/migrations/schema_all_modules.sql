-- =========================================================================
-- COMPLETE RMC SYSTEM DATABASE SCHEMA FOR MYSQL
-- =========================================================================

-- 1. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(50) PRIMARY KEY,
  registration_no VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  capacity DECIMAL(10,2),
  capacity_unit VARCHAR(20) DEFAULT 'ton',
  fuel_type VARCHAR(20) DEFAULT 'diesel',
  status VARCHAR(30) DEFAULT 'available',
  current_driver VARCHAR(100),
  current_driver_phone VARCHAR(50),
  last_maintenance DATE,
  next_maintenance DATE,
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  odometer DECIMAL(12,2) DEFAULT 0,
  fuel_efficiency DECIMAL(6,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reg (registration_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. VEHICLE MAINTENANCE RECORDS
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  type VARCHAR(30),
  description TEXT,
  cost DECIMAL(12,2),
  odometer_reading INT,
  performed_at DATETIME,
  performed_by VARCHAR(100),
  next_due_at DATETIME,
  next_due_odometer INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_v_maint (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. VEHICLE DOCUMENTS
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  document_no VARCHAR(100),
  issued_at DATE,
  expires_at DATE,
  document_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_v_docs (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  date_of_joining DATE,
  status VARCHAR(30) DEFAULT 'available',
  photo TEXT,
  emergency_contact JSON,
  license JSON,
  assigned_vehicle VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_trips INT DEFAULT 0,
  total_distance DECIMAL(12,2) DEFAULT 0,
  current_trip_id VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver_status (status),
  INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. DRIVER TRIP ASSIGNMENTS
CREATE TABLE IF NOT EXISTS driver_trip_assignments (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) NOT NULL,
  driver_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50),
  material VARCHAR(100),
  quantity DECIMAL(10,2),
  customer VARCHAR(150),
  destination TEXT,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  status VARCHAR(30) DEFAULT 'assigned',
  distance DECIMAL(10,2) DEFAULT 0,
  duration INT,
  rating DECIMAL(3,2),
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_d_trips (driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. WEIGHBRIDGE SESSIONS
CREATE TABLE IF NOT EXISTS weighbridge_sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tare_weight DECIMAL(10,2),
  gross_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  driver_name VARCHAR(100),
  material VARCHAR(100),
  destination TEXT,
  evidence JSON,
  status VARCHAR(30) DEFAULT 'tare',
  operator_id VARCHAR(50),
  operator_name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wb_vehicle (vehicle_reg_no),
  INDEX idx_wb_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. WEIGH SLIPS
CREATE TABLE IF NOT EXISTS weigh_slips (
  slip_number VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  tare_weight DECIMAL(10,2),
  gross_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  material VARCHAR(100),
  driver_name VARCHAR(100),
  destination TEXT,
  operator_name VARCHAR(100),
  evidence JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. LOADING BAYS
CREATE TABLE IF NOT EXISTS loading_bays (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'available',
  current_session JSON,
  capacity INT DEFAULT 50,
  location VARCHAR(100),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. LOADING SESSIONS
CREATE TABLE IF NOT EXISTS loading_sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  bay_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  mix_design_id VARCHAR(50),
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  materials JSON,
  quality_checks JSON,
  overall_progress INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'in_progress',
  operator_id VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_load_bay (bay_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. DISPATCH APPROVALS
CREATE TABLE IF NOT EXISTS dispatches (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  material VARCHAR(100),
  quantity DECIMAL(10,2),
  unit VARCHAR(20) DEFAULT 'm³',
  customer VARCHAR(150),
  documentation JSON,
  route JSON,
  plate_images JSON,
  status VARCHAR(30) DEFAULT 'pending',
  approved_by VARCHAR(100),
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_disp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. TRIPS & LIVE TRACKING
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(50) PRIMARY KEY,
  trip_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_id VARCHAR(50),
  vehicle_reg_no VARCHAR(50) NOT NULL,
  driver_id VARCHAR(50),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(50),
  customer_id VARCHAR(50),
  customer_name VARCHAR(150),
  customer_contact VARCHAR(100),
  material VARCHAR(100),
  quantity DECIMAL(10,2),
  unit VARCHAR(20) DEFAULT 'm³',
  origin JSON,
  destination JSON,
  waypoints JSON,
  scheduled_start_time DATETIME,
  actual_start_time DATETIME,
  estimated_arrival DATETIME,
  actual_arrival DATETIME,
  completed_at DATETIME,
  status VARCHAR(30) DEFAULT 'scheduled',
  total_distance DECIMAL(10,2) DEFAULT 0,
  distance_covered DECIMAL(10,2) DEFAULT 0,
  distance_remaining DECIMAL(10,2) DEFAULT 0,
  current_location JSON,
  gps_config JSON,
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trip_status (status),
  INDEX idx_trip_reg (vehicle_reg_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. TRIP EVENTS
CREATE TABLE IF NOT EXISTS trip_events (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type VARCHAR(50),
  description TEXT,
  location JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_t_events (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. EXIT VERIFICATIONS
CREATE TABLE IF NOT EXISTS exit_verifications (
  id VARCHAR(50) PRIMARY KEY,
  verification_id VARCHAR(50) UNIQUE NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  exit_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  exit_weight DECIMAL(10,2) NOT NULL,
  entry_weight DECIMAL(10,2),
  loading_weight DECIMAL(10,2),
  weight_difference DECIMAL(10,2) NOT NULL,
  plate_images JSON,
  status VARCHAR(30) DEFAULT 'pending',
  operator_id VARCHAR(50),
  operator_name VARCHAR(100),
  remarks TEXT,
  anomaly_reason TEXT,
  incident_id VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ev_status (status),
  INDEX idx_ev_reg (vehicle_reg_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(50) PRIMARY KEY,
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(30) NOT NULL,
  status VARCHAR(30) DEFAULT 'reported',
  location VARCHAR(100),
  reported_by VARCHAR(100),
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_to VARCHAR(100),
  assigned_at DATETIME,
  investigation_notes TEXT,
  resolved_at DATETIME,
  resolution TEXT,
  vehicle_reg_no VARCHAR(50),
  related_module VARCHAR(50),
  tags JSON,
  evidence JSON,
  comments JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inc_status (status),
  INDEX idx_inc_sev (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. FUEL RECORDS
CREATE TABLE IF NOT EXISTS fuel_records (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  driver_id VARCHAR(50),
  driver_name VARCHAR(100),
  trip_id VARCHAR(50),
  trip_number VARCHAR(50),
  fuel_type VARCHAR(20) DEFAULT 'diesel',
  quantity DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  odometer_reading INT NOT NULL,
  fuel_station VARCHAR(150),
  location VARCHAR(150),
  receipt_number VARCHAR(100),
  date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fuel_vehicle (vehicle_id),
  INDEX idx_fuel_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. MAINTENANCE TASKS
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'scheduled',
  priority VARCHAR(20) DEFAULT 'medium',
  scheduled_date DATETIME NOT NULL,
  completed_date DATETIME,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2),
  technician VARCHAR(100),
  parts JSON,
  notes TEXT,
  next_due_date DATE,
  next_due_odometer INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_maint_status (status),
  INDEX idx_maint_veh (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. PARTS INVENTORY
CREATE TABLE IF NOT EXISTS parts_inventory (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  quantity INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  supplier VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_address TEXT,
  customer_email VARCHAR(100),
  customer_phone VARCHAR(50),
  customer_gst VARCHAR(50),
  trip_ids JSON,
  items JSON,
  subtotal DECIMAL(14,2) DEFAULT 0,
  tax_amount DECIMAL(14,2) DEFAULT 0,
  discount_amount DECIMAL(14,2) DEFAULT 0,
  total_amount DECIMAL(14,2) DEFAULT 0,
  paid_amount DECIMAL(14,2) DEFAULT 0,
  balance_amount DECIMAL(14,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  terms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inv_status (status),
  INDEX idx_inv_cust (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50),
  invoice_number VARCHAR(50),
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) DEFAULT 'completed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pay_inv (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. INVENTORY ITEMS (RAW MATERIALS)
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  current_stock DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 0,
  max_stock DECIMAL(12,2) DEFAULT 1000,
  reorder_level DECIMAL(12,2) DEFAULT 0,
  reorder_quantity DECIMAL(12,2) DEFAULT 0,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total_value DECIMAL(14,2) DEFAULT 0,
  location VARCHAR(100),
  supplier VARCHAR(150),
  supplier_contact VARCHAR(100),
  last_received DATE,
  last_consumed DATE,
  expiry_date DATE,
  is_low_stock BOOLEAN DEFAULT FALSE,
  is_overstock BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inv_sku (sku),
  INDEX idx_inv_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  item_sku VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  previous_stock DECIMAL(12,2) NOT NULL,
  new_stock DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(14,2) DEFAULT 0,
  reference_number VARCHAR(100),
  trip_id VARCHAR(50),
  supplier_id VARCHAR(50),
  notes TEXT,
  performed_by VARCHAR(100),
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. REORDER ALERTS
CREATE TABLE IF NOT EXISTS reorder_alerts (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  item_sku VARCHAR(100) NOT NULL,
  current_stock DECIMAL(12,2) NOT NULL,
  reorder_level DECIMAL(12,2) NOT NULL,
  reorder_quantity DECIMAL(12,2) NOT NULL,
  supplier VARCHAR(150),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(30) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  entity_type VARCHAR(100),
  performed_by JSON,
  details TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  previous_state JSON,
  new_state JSON,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_module (module),
  INDEX idx_audit_time (timestamp),
  INDEX idx_audit_sev (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. GENERATED REPORTS
CREATE TABLE IF NOT EXISTS generated_reports (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  parameters JSON,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(100),
  file_url TEXT,
  file_size INT,
  status VARCHAR(30) DEFAULT 'completed',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
