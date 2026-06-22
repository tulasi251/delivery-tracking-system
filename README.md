# 🚚 Delivery Tracking CLI

An interactive terminal app for managing and tracking deliveries in real time — built with Node.js.

## Features

- 🔐 Role-based login (Driver / Manager)
- 📦 Driver: accept jobs, start transit, track live GPS, mark delivered
- 🛡️ Manager: fleet overview, live coordinates, order detail, auto-refresh
- 📍 GPS simulation with animated progress bar (updates every 3s)
- 💾 Session persistence across restarts via `session.json`

## Getting Started

```bash
npm install
npm start
# or
node cli/index.js
```

## Test Credentials

| Role    | Email               | Password |
|---------|---------------------|----------|
| Driver  | driver@test.com     | 123456   |
| Manager | ops@test.com        | 123456   |

## Project Structure

```
delivery-tracking/
├── cli/
│   ├── index.js          ← Entry point
│   ├── store.js          ← State management + session persistence
│   ├── trackingService.js← GPS simulation
│   ├── auth.js           ← Login / logout
│   ├── driver.js         ← Driver dashboard
│   ├── manager.js        ← Manager dashboard
│   └── ui.js             ← Terminal UI helpers (chalk, tables, banners)
└── package.json
```

## Controls

- **Arrow keys** — navigate menus
- **Enter** — select option
- **Ctrl+C** — exit cleanly

## Driver Flow

1. Login → see available jobs table
2. **Accept a job** → status becomes `Picked Up`
3. **Start Transit** → GPS simulation begins, coordinates update every 3s
4. **Live Track** → watch the animated progress bar in real time
5. **Mark Delivered** → job moves to completed history

## Manager Flow

1. Login → see fleet stats (Total / Pending / In Transit / Delivered)
2. View all orders with live GPS coordinates
3. **View order detail** → see full route info + ASCII progress bar
4. **Auto-refresh** → dashboard refreshes every 5 seconds automatically
5. **Reset demo data** → all orders back to Pending