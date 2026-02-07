# How to Start the Platform

## Option 1: Python Script (Cross-platform) ⭐ Recommended

**Single command to start both services:**

```bash
python app.py
```

**Requirements:**
- Python 3.6+
- Node.js and npm installed

**Features:**
- Automatically installs dependencies if needed
- Shows output from both services
- Graceful shutdown with Ctrl+C
- Cross-platform (Windows, Mac, Linux)

---

## Option 2: Windows Batch File

**Double-click or run:**
```bash
start.bat
```

**Or in PowerShell:**
```powershell
.\start.bat
```

**Features:**
- Opens two separate windows (one for backend, one for dashboard)
- Easy to see logs from each service
- Close windows individually to stop

---

## Option 3: Linux/Mac Shell Script

**Make executable and run:**
```bash
chmod +x start.sh
./start.sh
```

**Features:**
- Runs both services in background
- Press Ctrl+C to stop both
- Single terminal window

---

## Option 4: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```

---

## Access the Platform

Once started:
- **Dashboard:** http://localhost:3000
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Metrics:** http://localhost:3001/metrics

---

## Troubleshooting

### "Node.js not found"
Install Node.js from: https://nodejs.org/

### "Python not found" (for app.py)
Install Python from: https://www.python.org/downloads/

### Port already in use
- Backend uses port 3001
- Dashboard uses port 3000
- Kill existing processes or change ports in config files

### Services won't start
1. Check Node.js version: `node --version` (should be 18+)
2. Delete `node_modules` and reinstall: `npm install`
3. Check for errors in the terminal output
