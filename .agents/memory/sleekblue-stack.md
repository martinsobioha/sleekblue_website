---
name: Sleekblue stack and admin
description: Core tech stack, ports, auth, and admin access for Sleekblue Media Houz project
---

# Sleekblue Media Houz — Stack

- **Frontend**: React 19 + Vite, port 5000, workflow "Start application" (`cd sleekblue && npm run dev`)
- **Backend**: Express 5, port 3001, workflow "Backend API" (`cd sleekblue && node server.js`)
- **Data**: Flat-file JSON at `sleekblue/site-data.json` (read/written with readJSON/writeJSON helpers)
- **Auth**: JWT (admin only), bcryptjs for password hashing
- **File uploads**: multer — products go to `/uploads/products/`, site assets to `/uploads/site/`
- **Admin URL**: `/sbm-control-2026` — credentials: `admin` / `Sleekblue2026!`
- **WhatsApp**: `2348065275264` (number), `+234 806 527 5264` (display)

**Why:** Single-file flat JSON avoids DB complexity for a content-managed marketing site.
