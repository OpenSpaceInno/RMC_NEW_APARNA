# 🗄️ MySQL Local Database Setup Guide

## Quick Setup (10 minutes)

### Prerequisites
- MySQL Server installed on your machine
- Node.js installed (for backend server)

### Step 1: Install MySQL (if not installed)

#### Windows:
1. Download MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Run installer and select "MySQL Server"
3. Set root password (or leave empty for development)
4. Complete installation

#### Mac (using Homebrew):
```bash
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Configure Database Connection

Edit `server/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=rmc_gate_system

PORT=3001
NODE_ENV=development
```

**Note**: If you don't have a MySQL password, leave `DB_PASSWORD` empty.

### Step 4: Start Backend Server
```bash
cd server
npm start
```

You should see:
```
✅ MySQL Database connected successfully!
✅ Database tables created successfully!
🚀 Server running on http://localhost:3001
```

### Step 5: Initialize Database from Frontend
1. Open: http://localhost:8080/database-setup
2. Click "Initialize Database"
3. Wait for success message

### Step 6: View Live Cameras
1. Go to: http://localhost:8080/gate-monitor
2. See 2 camera feeds automatically!

---

## What Gets Created

### Database: `rmc_gate_system`

### Tables:
1. **camera_devices**
   - Stores camera information
   - Fields: device_id, name, model, location, ip_address, status, etc.

2. **device_rtsp_config**
   - Stores RTSP streaming settings
   - Fields: device_id, enabled, direct_url, port, username, password, etc.

3. **device_network_config**
   - Stores network configuration
   - Fields: device_id, ip_address, subnet_mask, gateway, dns, etc.

---

## Running Both Servers

You need to run TWO servers:

### Terminal 1: Frontend (Vite)
```bash
npm run dev
```
Runs on: http://localhost:8080

### Terminal 2: Backend (Express + MySQL)
```bash
cd server
npm start
```
Runs on: http://localhost:3001

---

## Troubleshooting

### "MySQL connection failed"
**Solutions**:
1. Check if MySQL is running:
   ```bash
   # Windows
   services.msc (look for MySQL)
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. Verify credentials in `server/.env`
3. Try connecting with MySQL Workbench or command line:
   ```bash
   mysql -u root -p
   ```

### "Cannot find module 'mysql2'"
**Solution**:
```bash
cd server
npm install
```

### "Port 3001 already in use"
**Solution**: Change PORT in `server/.env` to another port (e.g., 3002)

### "Access denied for user 'root'"
**Solutions**:
1. Reset MySQL root password
2. Or create a new MySQL user:
   ```sql
   CREATE USER 'rmc_user'@'localhost' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON rmc_gate_system.* TO 'rmc_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
   Then update `server/.env` with new credentials

### Frontend can't connect to backend
**Solutions**:
1. Check backend is running on port 3001
2. Verify `VITE_API_URL` in `.env` is set to `http://localhost:3001/api`
3. Check browser console for CORS errors
4. Restart both servers

---

## API Endpoints

Once backend is running, these endpoints are available:

### Health Check
```
GET http://localhost:3001/api/health
```

### Database
```
POST http://localhost:3001/api/init-db
GET  http://localhost:3001/api/db-status
```

### Cameras
```
GET    http://localhost:3001/api/cameras
GET    http://localhost:3001/api/cameras/:deviceId
POST   http://localhost:3001/api/cameras
PUT    http://localhost:3001/api/cameras/:deviceId
DELETE http://localhost:3001/api/cameras/:deviceId
```

### RTSP Config
```
GET  http://localhost:3001/api/rtsp-config/:deviceId
POST http://localhost:3001/api/rtsp-config
```

### Network Config
```
GET  http://localhost:3001/api/network-config/:deviceId
POST http://localhost:3001/api/network-config
```

---

## Development Workflow

### Start Development:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev  # Uses nodemon for auto-restart
```

### Check Database:
```bash
mysql -u root -p
USE rmc_gate_system;
SHOW TABLES;
SELECT * FROM camera_devices;
SELECT * FROM device_rtsp_config;
```

### Reset Database:
```bash
mysql -u root -p
DROP DATABASE rmc_gate_system;
```
Then restart backend server (it will recreate tables)

---

## Production Deployment

### Backend:
1. Set `NODE_ENV=production` in `.env`
2. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name rmc-backend
   ```

### Database:
1. Use proper MySQL user (not root)
2. Set strong password
3. Configure firewall rules
4. Enable SSL connections
5. Regular backups

### Frontend:
1. Build production bundle:
   ```bash
   npm run build
   ```
2. Serve with nginx or similar
3. Update `VITE_API_URL` to production backend URL

---

## Benefits of MySQL vs Supabase

✅ **Local Control**: Full control over your data
✅ **No Internet Required**: Works offline
✅ **No External Dependencies**: No third-party service
✅ **Better Performance**: Direct local connection
✅ **Cost**: Free (no subscription)
✅ **Privacy**: Data stays on your server

---

## Next Steps

After setup:
1. ✅ Backend server running
2. ✅ MySQL database created
3. ✅ Tables initialized
4. ✅ Frontend connected to backend
5. ✅ Gate Monitor shows live cameras
6. (Optional) Configure real camera RTSP URLs
7. (Optional) Set up HLS proxy for browser playback

---

**Estimated Time**: 10 minutes
**Difficulty**: Easy
**Requirements**: MySQL + Node.js
