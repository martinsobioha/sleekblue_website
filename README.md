# Sleekblue Media Houz — Platform Engine

> **Enterprise Grade Printing, Corporate Branding & Digital Commerce Platform**
> Built for high-volume retail printing operations in Owerri, Imo State, Nigeria.

[![CI Pipeline](https://github.com/sleekblue/website/actions/workflows/ci.yml/badge.svg)](https://github.com/sleekblue/website/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Build Status](https://img.shields.io/badge/build-passing-success.svg)](package.json)

---

## 📐 System Architecture

This repository currently contains **two distinct application/data paths**. Do not treat them as one unified database-backed system without an explicit migration plan.

- **Storefront and existing site operations:** React/Vite frontend served by the Express application. The repository's architecture documents describe JSON-file persistence for several storefront records, including orders and CMS data.
- **Sticker Balance:** a React page that calls Supabase directly for customer balances, deliveries, usage history and customer-link RPCs.
- **Business Book:** a separate Supabase-backed business workflow with its own migration under `supabase/migrations`.

The live production source and deployment status must be verified with the site operator; this repository's `main` branch alone does not prove what is running at `sleekbluemedia.com`.

Before changing shared data architecture, review [the Sticker Balance foundation audit](docs/STICKER_BALANCE_AUDIT.md) and the existing [architecture document](docs/ARCHITECTURE.md).

---

## 🛠️ Key Technical Specifications

* **Frontend Stack**: React 19, React Router v7, TipTap Rich Text Editor, Custom Glassmorphic Design Token System.
* **Backend Stack**: Express 5, Node.js 18+, Helmet Security Headers, Compression (Gzip + Brotli), Express Rate Limiter, JWT Authentication, Bcrypt Password Hashing.
* **Build System**: Vite 6, Rollup Code-Splitting (`vendor`, `react`, `router`, `editor` chunks), PostCSS.
* **Testing & CI/CD**: Native Node.js Test Runner (`node --test`), GitHub Actions Automated CI Workflow.

---

## 🚀 Quick Start & Installation

### Prerequisites
* Node.js `>= 18.0.0`
* npm `>= 9.0.0`

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/sleekblue/sleekblue_website.git
cd sleekblue_website

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev

# 6. Build & run production server
npm run build
npm start
```

---

## 🔒 Environment Variables Specification

Configure the following variables in `.env` or your hosting provider's panel:

| Variable | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Number | No | Web server port (Default: `3000`) |
| `NODE_ENV` | String | Yes | Environment mode (`development` or `production`) |
| `JWT_SECRET` | String | Yes | Min 32-character secret key for signing admin authentication tokens |
| `ADMIN_USERNAME` | String | Yes | Admin portal login username |
| `ADMIN_PASSWORD` | String | Yes | Admin portal login password |

---

## 🧪 Automated Testing

Run the test suite using Node's native test runner:

```bash
npm test
```

Test coverage includes:
- Pricing engine & volume batch discount calculations.
- Order minimum quantity constraint validation.
- Input validation and email sanitization helpers.

---

## 📄 License

This project is proprietary software developed for **Sleekblue Media Houz**. All rights reserved.
