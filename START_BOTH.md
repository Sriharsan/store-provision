# Start Both Dashboard and Backend

The dashboard **proxies API requests to the backend**. If the backend is not running, you'll see:

```
[vite] http proxy error: /api/stores
AggregateError [ECONNREFUSED]
```

## Fix: Run the backend in a second terminal

### Terminal 1 – Backend API (run this first)

```powershell
cd "d:\Store Provisioning\backend"
npm install
npm run dev
```

Wait until you see: `Server running on port 3001`

### Terminal 2 – Dashboard

```powershell
cd "d:\Store Provisioning\dashboard"
npm run dev
```

Then open: **http://localhost:3000**

---

## One-liner (PowerShell)

```powershell
# Start backend in background, then dashboard
cd "d:\Store Provisioning\backend"; Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
cd "d:\Store Provisioning\dashboard"; npm run dev
```

Or use two separate terminals and run `npm run dev` in `backend` and `dashboard` as above.
