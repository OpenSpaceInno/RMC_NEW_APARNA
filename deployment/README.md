# Aparna RMC Gate-to-Exit Enterprise System - Production Deployment Guide
## Plant PL01 (Shamshabad Terminal & Satellite Units)

---

### Overview
This directory contains production deployment configurations, process definitions, reverse proxy setups, and automated maintenance scripts for deploying the Aparna RMC Gate-to-Exit application on industrial plant edge servers.

```
deployment/
├── ecosystem.config.cjs    # PM2 Process Manager (Core Server + SAP Sync Worker)
├── nginx.conf              # Production NGINX Reverse Proxy (SSL, WebSocket, HLS)
├── .env.production         # Industrial environment variable template
├── backup-rmc-db.sh        # Automated daily MySQL backup script with 30-day rotation
└── README.md               # Step-by-step production setup runbook (this document)
```

---

## 1. Operating System & Server Prerequisites
- **Target OS:** Ubuntu Server 22.04 LTS (x86_64) or Windows Server 2022 Datacenter
- **Node.js:** v20.x LTS or v22.x LTS (`node -v`)
- **Database:** MySQL Server 8.0+ running on port 3306
- **Reverse Proxy:** NGINX 1.18+ (`nginx -v`)
- **Process Manager:** PM2 (`npm install -g pm2`)
- **Video Transmuxer:** MediaMTX v1.9.0+

---

## 2. Step-by-Step Installation Runbook

### Step 1: Clone & Install Dependencies
```bash
# 1. Clone repository to /opt
sudo mkdir -p /opt/rmc-gate-system
sudo chown -R $USER:$USER /opt/rmc-gate-system
cd /opt/rmc-gate-system
git clone <repository_url> .

# 2. Install Frontend Dependencies & Build Production Bundle
npm ci
npm run build

# 3. Install Server Dependencies
cd server
npm ci --omit=dev
cd ..
```

### Step 2: Configure Environment Variables
```bash
cp deployment/.env.production server/.env
# Edit credentials for plant LAN:
nano server/.env
```

### Step 3: Database Initialization & Hardening
```bash
# 1. Create Dedicated Service Account in MySQL
mysql -u root -p -e "
  CREATE DATABASE IF NOT EXISTS rmc_gate_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'rmc_prod_svc'@'localhost' IDENTIFIED BY 'SecureIndustrialPassword@2026';
  GRANT ALL PRIVILEGES ON rmc_gate_system.* TO 'rmc_prod_svc'@'localhost';
  FLUSH PRIVILEGES;
"

# 2. Run Database Schema Migrations
cd server
node --input-type=module -e "import('./migrations/run_migration.js').then(m => m.runCompleteMigration())"
cd ..
```

### Step 4: PM2 Process Management Setup
```bash
# Start Core Server and SAP Queue Worker under PM2
pm2 start deployment/ecosystem.config.cjs --env production

# Save Process List for Auto-Start on System Boot
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME
```

### Step 5: NGINX Reverse Proxy & SSL Setup
```bash
# 1. Copy NGINX configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/rmc-gate.conf
sudo ln -s /etc/nginx/sites-available/rmc-gate.conf /etc/nginx/sites-enabled/

# 2. Generate or Install Corporate TLS Certificates
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
# Place aparna_rmc_plant.crt and aparna_rmc_plant.key into the directories

# 3. Test & Reload NGINX
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Automated Daily Backup Schedule
```bash
sudo chmod +x /opt/rmc-gate-system/deployment/backup-rmc-db.sh
# Add to crontab to run daily at 02:00 AM IST
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/rmc-gate-system/deployment/backup-rmc-db.sh >> /var/log/rmc_backup.log 2>&1") | crontab -
```

---

## 3. Physical Peripheral Commissioning Commands

### Testing RS-232 Scale Indicator COM / TCP Port
```bash
# Probe Indicator over Modbus TCP / Moxa Serial Port:
nc -zv 192.168.0.150 4001
# Stream live continuous weight output:
nc 192.168.0.150 4001
```

### Testing Moxa ioLogik E1214 Barrier Relay
```bash
# Probe Modbus TCP Port 502:
nc -zv 192.168.0.160 502
```

### Testing MediaMTX Live RTSP Camera Streams
```bash
curl -I http://127.0.0.1:8888/cam-inbound/index.m3u8
```

---

## 4. Disaster Recovery & Troubleshooting

| Symptom | Probable Cause | Resolution Action |
|---|---|---|
| Scale displays `DISCONNECTED` | Moxa NPort IP changed or cable severed | Run `ping 192.168.0.150` and verify DB9 null-modem pinout (2-TXD, 3-RXD, 5-GND). |
| ANPR Camera feed black | RTSP credentials expired or camera offline | Probe `rtsp://192.168.0.101:554` via VLC or `ffprobe`. |
| Barrier does not lift on PGI | Moxa relay disconnected or loop detector active | Check PM2 worker log: `pm2 logs rmc-core-server`. Verify loop sensor. |
| SAP document status `queued` | Corporate WAN tunnel down | Inspect `sap_sync_queue` table; verify SCC connection at `https://192.168.0.200:8443`. |

