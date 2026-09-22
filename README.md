# 🏢 PropKart Panel

> **Dynamic Form Builder, Telecaller Operations & Property Submission Management Portal**  
> Operational command center for PropKart administrators and telecallers to build dynamic registration forms, track live submissions, manage owner outreach, and convert verified leads into active property inventory.

---

## 🌟 Overview

**PropKart Panel** is the administrative and operational desk of the PropKart ecosystem. It allows administrators to dynamically design and publish property listing forms without code redeployments, while providing telecallers and operations staff with real-time tooling to manage and process property submissions.

```
┌─────────────────────────────────────────────────────────┐
│              PropKart Panel (Admin / Ops)               │
│  • Dynamic Form Builder      • Real-time Operations     │
│  • 3-Way Lead Sharing        • Telecaller Call Logs     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼ HTTPS / WSS
┌─────────────────────────────────────────────────────────┐
│               Shared Backend API & VPS                  │
│       Node.js / Express • PostgreSQL • Traefik          │
└──────────────────────────▲──────────────────────────────┘
                           │
                           ▼ HTTPS
┌─────────────────────────────────────────────────────────┐
│              PropKart Connect (Public App)              │
│  • Dynamic Form Wizard       • Live Draft Recovery      │
│  • Public Property Showcase  • Media & GPS Capture      │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🛠️ Dynamic Form Builder & Versioning
- **No-Code Schema Editor:** Add, edit, reorder, and configure sections and fields in real time.
- **Rich Dynamic Field Types:**
  - Standard Inputs: Full Name, Phone (+91), Email, Short Text, Multi-line Address.
  - Selections: Dropdowns, Single-select Radio cards, Multi-select Checkboxes.
  - Real Estate Specifics: Property Type, Expected Price/Rent (₹), Area (sq. ft), Direction & Landmark.
  - Rich Media: High-res Photos (up to 50), Walkthrough Videos (up to 30).
  - Geolocation: Google Maps Coordinates & Navigation URLs.
  - Compliance: Declarations, terms consent, and custom operational notes.
- **Live Interactive Previews:** Toggle between **Desktop View** and **Mobile Device View (390px)** to test UI/UX responsiveness before going live.
- **Strict Version Control:** Forms follow a safe lifecycle (`Draft` → `Preview` → `Publish`). Historical submissions remain linked to their original form schema version so updates never corrupt existing data.

### 📋 Operations Desk & Pipeline Management
- **Real-Time Pipeline:** Submissions stream in live via WebSocket / Supabase Realtime without requiring manual page refresh.
- **Workflow Stages:** Track submissions through structured stages: `New`, `Contact Pending`, `Contacted`, `Details Verified`, `In Progress`, `Converted`, `Not Interested`, `Rejected`, `Archived`.
- **Search & Filtering:** Multi-field filtering across Property Type, Lead Status, City, Assigned Agent, and Date range, with instant full-text search.
- **Telecaller Action Hub:**
  - 🟢 **Direct WhatsApp:** Trigger contextual pre-filled WhatsApp templates.
  - 📞 **Direct Dial:** One-click `tel:` calling and instant number copying.
  - ✉️ **Email Outreach:** Pre-composed verification emails.
  - 🗺️ **GPS Navigation:** Directly open and inspect exact property coordinates in Google Maps.
  - 📝 **Call Logging:** Record customer interactions, scheduled site visits, and disposition notes.
  - 🏆 **Convert to Inventory:** Promote verified submissions into the primary PropKart properties database with a single click.

### 📤 3-Way Dynamic Property Sharing
- **1. Dynamic Public Showcase Link:** Generates an official, shareable link (`https://propconnect.nbpropertytech.com/?view=<id>`) displaying verified property specifications and image galleries.
- **2. Instant WhatsApp Cards:** Formats key property highlights (dimensions, configuration, pricing, verified features) into ready-to-send WhatsApp messages.
- **3. Multi-Page PDF Dossier:** Client-side vector PDF generation that compiles high-resolution property photos, verified specifications, and company branding into a formal presentation dossier.

---

## 🔐 Security & Architecture

- **Zero Hardcoded Secrets:** All runtime configurations rely on environment variables and GitHub Actions Secrets.
- **AES-256-GCM Data Encryption:** Sensitive owner information (contact details, address, personal remarks) is stored encrypted at rest.
- **In-Memory Decryption:** Sensitive data is decrypted in memory only for authorized operators with authenticated JWT sessions.
- **Strict Role-Based Access & Rate Limiting:** Brute-force protection on authentication endpoints and secure HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`).

---

## 💻 Tech Stack

- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS, PostCSS
- **Icons:** Lucide React
- **Document Generation:** jsPDF
- **State & Networking:** Axios, Context API, Supabase Realtime Client

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `>= 18.0.0`
- **npm:** `>= 9.0.0`

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/propkartnbpropertytech-blip/PropKart_Panel.git
cd PropKart_Panel

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env

# 4. Start the development server with Hot Module Replacement (HMR)
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port indicated in your terminal).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Builds optimized production bundle in `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm test` | Runs the test suite |

---

## 🌐 CI/CD & Production Deployment

Continuous deployment is automated using GitHub Actions. Pushes to the `main` branch trigger a production build and secure transfer to the production host.

- **Workflow File:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **Production URL:** `https://panel.nbpropertytech.com`

### Configuring GitHub Secrets

To enable automated deployment, define the following variables in your GitHub repository under **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example / Format |
|---|---|---|
| `VPS_HOST` | Production server IP or hostname | `<your-server-ip>` |
| `VPS_USERNAME` | SSH user with deployment permissions | `root` or `deploy-user` |
| `VPS_SSH_KEY` | Dedicated OpenSSH Private Key (recommended) | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_SSH_PASSWORD` | Fallback SSH password (if key is omitted) | `<your-ssh-password>` |
| `VPS_PORT` | SSH daemon port (default: `22`) | `22` |

> 🔒 **Security Notice:** Never commit secrets, raw IP addresses, or private keys to source code or git history. All sensitive values must remain strictly within GitHub Secrets and server-side `.env` files.

---

## 📄 License

Proprietary software. All rights reserved by **NB Property Technology**.
