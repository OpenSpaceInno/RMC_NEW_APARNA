-- ANPR Events and Evidence Tables

-- ANPR Events table
CREATE TABLE IF NOT EXISTS anpr_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    event_type VARCHAR(20) DEFAULT 'ANPR_READ',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    plant_id VARCHAR(50) NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    vehicle_reg_no VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    source VARCHAR(100) NOT NULL,
    status ENUM('pending', 'confirmed', 'rejected', 'manual_override') DEFAULT 'pending',
    operator_note TEXT,
    vehicle_type VARCHAR(50),
    direction ENUM('entry', 'exit') DEFAULT 'entry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_id (event_id),
    INDEX idx_vehicle_reg (vehicle_reg_no),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status),
    INDEX idx_camera (camera_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evidence table (images/videos associated with ANPR events)
CREATE TABLE IF NOT EXISTS anpr_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    evidence_type ENUM('image', 'video') NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    angle ENUM('front', 'side', 'rear', 'plate', 'overview') NOT NULL,
    timestamp DATETIME NOT NULL,
    file_size INT,
    mime_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES anpr_events(event_id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_angle (angle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ANPR Configuration table
CREATE TABLE IF NOT EXISTS anpr_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id VARCHAR(50) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    min_confidence DECIMAL(3,2) DEFAULT 0.70,
    auto_confirm_threshold DECIMAL(3,2) DEFAULT 0.92,
    capture_interval INT DEFAULT 2,
    region VARCHAR(10) DEFAULT 'in',
    webhook_url TEXT,
    processing_mode ENUM('cloud', 'local', 'mock') DEFAULT 'mock',
    api_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES camera_devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default ANPR configurations for gate cameras
INSERT INTO anpr_config (camera_id, enabled, min_confidence, auto_confirm_threshold, region, processing_mode)
VALUES 
    ('cam_gate_1', TRUE, 0.70, 0.92, 'in', 'mock'),
    ('cam_gate_2', TRUE, 0.70, 0.92, 'in', 'mock')
ON DUPLICATE KEY UPDATE
    enabled = VALUES(enabled),
    min_confidence = VALUES(min_confidence);
