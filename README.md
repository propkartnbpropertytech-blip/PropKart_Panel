# 🏢 PropKart Panel

> **Dynamic Form Builder, Telecaller Operations & Property Submission Management Portal**  
> Private operational desk for PropKart administrators and telecallers to manage dynamic registration forms, track live submissions, communicate with property owners, and convert verified leads into inventory.

---

## 🌟 Overview

**PropKart Panel** is the operational command center that dictates the schema and fields rendered on **PropKart Connect**.
When a public owner submits a property via PropKart Connect, PropKart Panel receives the submission in real-time without requiring a full page refresh.

```
PropKart Panel (Admin / Telecaller Portal)
     │                     ▲
     ▼ (Form Builder)      │ (Real-time Submissions)
Shared Backend API & PostgreSQL (Hostinger VPS)
     ▲
     │ (Public Submissions)
PropKart Connect (Public App)
```

---

## ✨ Features

- **Dynamic Form Builder & Editor:**
  - Complete control over form sections and fields.
  - Supported dynamic field types: Full Name, Phone (+91), Email, Short Text, Long Text / Address, Dropdown, Radio Cards, Checkboxes, Multi-select, Currency (₹), Area (sq. ft), Numbers, Photos (configurable limit up to 50), Videos (configurable limit up to 30), Google Maps Location & Coordinates, Direction & Landmark links, Remarks, Owner Declaration.
  - Toggle required/optional, active/inactive, reorder up/down, duplicate fields.
  - Validation rules builder: Min/max lengths, numeric limits, max file count, file size limits.
  - **Live Form Preview:** Switch between **Desktop Frame** and **Mobile Frame (390px)** to test the dynamic form experience in real-time before publishing.
  - **Form Versioning:** Draft -> Preview -> Validate -> Publish. Old submissions stay pinned to the version under which they were submitted so form edits never break historical data.
- **Property Submissions Management:**
  - Live Realtime updates via Supabase Realtime / WebSockets.
  - Status pipeline: `New`, `Contact Pending`, `Contacted`, `Details Verified`, `In Progress`, `Converted`, `Not Interested`, `Rejected`, `Archived`.
  - Multi-attribute search (Name, Phone, Email, Registration Code, City, Address).
  - Filters: Status, Property Type, City, Assigned Telecaller, Date range.
  - Sorting: Newest first, Oldest first.
- **Submission Detail Operations Desk:**
  - **Dynamic Submission Rendering:** Automatically renders all dynamic fields according to the form version schema without frontend code modifications.
  - **Clickable Action Hub:**
    - 🟢 **One-Click WhatsApp:** Opens WhatsApp Web/App with pre-filled, editable property greeting and verification inquiry templates.
    - 📞 **Call Button:** `tel:` link + one-click phone copy.
    - ✉️ **Email Button:** `mailto:` link + one-click email copy.
    - 🗺️ **Google Maps Button:** Opens exact location coordinates or Google Maps link.
    - 🧭 **Direction Button:** Opens landmark navigation link.
    - 🔗 **Share Action:** Formats structured property details to clipboard for WhatsApp/SMS sharing.
    - 📋 **Copy Buttons:** Quick copy for Registration ID, Phone, Address, Maps link.
  - **Media Gallery Viewer:**
    - High-performance thumbnail grid with photo & video counts.
    - Fullscreen Lightbox image viewer with zoom controls, previous/next, and original image download.
    - Embedded video player modal with controls.
  - **Telecaller Workflow & Call Logs:**
    - Update lead status.
    - Assign to telecaller.
    - Add call log notes with call outcomes (e.g. Connected - Interested, Price Negotiation, Site Visit Scheduled).
    - Edit / enrich property details dynamically.
    - **"Convert to Property Inventory" Action:** Pushes verified submission into the main `properties` database table!
- **Operational Dashboard:** Live KPI cards (Total Submissions, Today's Inflow, Pending Contact, Contacted, Converted, Photos/Videos counts).
- **System Audit Trail:** Immutable log of form changes, publishing events, and telecaller actions.

---

## 🛠️ Local Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup
```bash
# 1. Clone repository
git clone https://github.com/propkartnbpropertytech-blip/PropKart_Panel.git
cd PropKart_Panel

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start local development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm test
```

```bash
# Build production bundle
npm run build

# Preview build locally
npm run preview
```

---

## 🚀 CI/CD Pipeline & Automated Deployment (v1.0.0)

Every push to `main` triggers automated build and deployment to the Hostinger VPS via GitHub Actions:

- **Workflow:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **Production URL:** `https://panel.nbpropertytech.com`
- **Zero-Touch Isolation Policy:** The deployment workflow strictly targets `/root/propconnect-stack/panel-dist` and `/root/propconnect-stack/server`, rebuilding only the standalone `propconnect-api` and restarting `propconnect-panel`. It has zero interaction with any other container on the VPS (`traefik`, `propkart-backend`, `supabase-db`, etc.).

### Required GitHub Repository Secrets

Configure the following secrets in **Repository Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example / Recommended Value |
|---|---|---|
| `VPS_HOST` | Hostinger VPS Public IP Address | `200.234.36.120` |
| `VPS_USERNAME` | SSH User | `root` |
| `VPS_SSH_KEY` | Dedicated OpenSSH ed25519 Deployment Private Key | Key generated on VPS (`/root/.ssh/github_actions_deploy_key`) |
| `VPS_SSH_PASSWORD` | Fallback SSH password (if key is not provided) | VPS password |
| `VPS_PORT` | SSH Port (default: `22`) | `22` |

---

## 🔐 Z+ Security & Encryption Hardening

- **Zero Secret Credentials in Git:** All API URLs use relative paths (`/api/v1`), `.env` files are ignored, and zero tokens, passwords, or keys exist in the codebase.
- **AES-256-GCM Database Encryption at Rest:** All sensitive property submission fields (`owner_name`, `owner_phone`, `owner_email`, `address`, `location_url`, `raw_data`) are stored as authenticated AES-256-GCM ciphertexts (`enc:v1:<iv>:<tag>:<cipher>`).
- **In-Memory Decryption:** Decryption occurs strictly in memory for authenticated operators with valid JWT sessions.
- **Login Hardening:** Prefilled credentials removed, anti-user-enumeration messages enforced, and strict `authRateLimit` (max 10 attempts / 15 min).
- **Reverse Proxy Architecture:** Nginx acts as reverse proxy on port 80, terminating SSL via Traefik and proxying `/api/v1/` to `propconnect-api:5050`.

