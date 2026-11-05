# CivicAI — AI-Assisted Civic Issue Reporting and Resolution Platform

CivicAI empowers residents to report public infrastructure and civic service problems, providing municipal administrators a structured, clear workflow to review, prioritize, assign, and resolve them with advisory artificial intelligence.

---

## 1. System Architecture

- **Frontend:** React 18 + Vite (Hosted on Vercel)
- **Backend:** Node.js + Express.js REST API (Hosted on Render)
- **Database:** MongoDB Atlas via Mongoose
- **Image Storage:** Cloudinary (Production on Render) / Local Disk (`/uploads`) for local development
- **AI Intelligence:** Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK
- **Design System:** Strict Light-Mode-only modern civic-tech UI

---

## 2. Key Features

- **Fast Citizen Reporting:** <60s submission with address/landmark geocoding and optional photo attachment.
- **Human-in-the-Loop Advisory AI:** Google Gemini generates instant summaries, suggests official categories, calculates severity priorities (`LOW`, `MEDIUM`, `HIGH`), and recommends municipal departments.
- **Semantic Duplicate Detection:** Scans regional complaints to flag duplicate issues without discarding citizen records.
- **Dual-Mode Image Storage Adapter:** Seamlessly uses local disk storage in development and Cloudinary in Render production with binary magic-byte validation.
- **100% Immutable Public Audit Trail:** Timestamped status transitions (`SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` / `REJECTED`) with public officer notes.
- **Confidential Staff Records:** Internal admin notes (`adminNotes`) for crew dispatch are strictly isolated from citizen endpoints.
- **Server-Side Aggregated Analytics:** Real MongoDB `$facet` aggregation pipelines power status meters, category bars, and live activity streams.

---

## 3. Repository Structure

```text
civicai/
├── frontend/                     # React 18 + Vite client (Vercel)
│   ├── src/
│   │   ├── components/           # Common components (Buttons, Cards, Badges, Modals)
│   │   ├── context/              # AuthContext (HttpOnly cookie session state)
│   │   ├── pages/                # Landing, Auth, Dashboards, Report Form, Detail
│   │   ├── routes/               # ProtectedRoutes (CitizenRoute, AdminRoute, GuestRoute)
│   │   ├── services/             # API client services (authService, complaintService)
│   │   └── styles/               # Light-mode CSS tokens and global stylesheets
│   └── public/                   # SVG vector assets (logos, banners, heroes)
├── backend/                      # Node.js + Express.js API (Render)
│   ├── src/
│   │   ├── config/               # db.js (Mongoose Atlas), env.js (Validation)
│   │   ├── constants/            # Centralized Enums (Roles, Statuses, Categories)
│   │   ├── controllers/          # authController.js, complaintController.js
│   │   ├── middleware/           # auth.js, role.js (requireAdmin), rateLimit.js
│   │   ├── models/               # User.js, Complaint.js, RevokedToken.js
│   │   ├── routes/               # authRoutes.js, complaintRoutes.js
│   │   ├── services/
│   │   │   ├── ai/               # geminiService.js, complaintAnalysisService.js
│   │   │   └── storage/          # imageStorage.js, localStorageProvider.js, cloudinaryStorageProvider.js
│   │   └── utils/                # Tests, seedAdmin.js, sessionManager.js, migrateStorage.js
│   ├── public/uploads/           # Local development image storage
│   └── server.js                 # Server entry point
├── docs/                         # Specification & architecture documentation
│   ├── prd.md
│   ├── architecture.md
│   ├── rules.md
│   ├── design.md
│   ├── task.md
│   └── memory.md
└── README.md
```

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js >= 18.x (tested on Node.js v24)
- npm >= 9.x
- MongoDB Atlas active cluster (or local MongoDB URI)
- Google Gemini API Key
- *(Optional for dev / Required for Render)* Cloudinary Account (Cloud Name, API Key, API Secret)

### Step 1: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/civicai?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Admin Seed Account (provisioned automatically on startup)
ADMIN_SEED_EMAIL=admin@civicai.org
ADMIN_SEED_PASSWORD=CivicAdmin#2026
ADMIN_SEED_NAME=Municipal Administrator

# Image Storage Adapter (local for dev, cloudinary for Render)
STORAGE_PROVIDER=local
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend:
```bash
npm run dev
```

### Step 2: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Configure `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Automated Test Suites

Run each test suite against MongoDB Atlas and the live API:

```bash
cd backend

# Storage Adapter & Cloudinary test (validation, local disk, Cloudinary, fallback)
npm run test:storage

# Authentication test (registration, HttpOnly cookies, session revocation, roles)
npm run test:auth

# Complaint workflow test (submissions, validation, admin triage, private notes)
npm run test:complaints

# AI intelligence test (Gemini analysis, schema validation, retry policy, duplicates)
npm run test:ai

# Dashboard metrics test (single-pass $facet aggregation, isolation, meters)
npm run test:dashboard
```

To verify the frontend build:
```bash
cd frontend
npm run build
```

---

## 6. Cloudinary Storage & Migration Guide

CivicAI includes a clean storage adapter that decouples image storage from the database and frontend.

### Storage Modes
1. **Local Mode (`STORAGE_PROVIDER=local`):**
   - Stores files in `backend/public/uploads/`.
   - Served via `http://localhost:5000/uploads/...`.
   - Ideal for local development with zero external dependencies.
2. **Cloudinary Mode (`STORAGE_PROVIDER=cloudinary`):**
   - Automatically activates when `STORAGE_PROVIDER=cloudinary` is set on Render.
   - Uploads directly via the official Cloudinary SDK over HTTPS.
   - Stores `secure_url` (HTTPS) and `public_id` in the MongoDB Complaint document.
   - Images survive container teardowns, restarts, and redeployments on Render.

### Migrating Existing Local Images to Cloudinary
If you have complaints with local `/uploads/...` images and want to migrate them to Cloudinary:

```bash
cd backend

# 1. Preview changes without modifying database (Dry Run)
npm run migrate:storage

# 2. Execute migration and update database records
npm run migrate:storage -- --execute
```

---

## 7. Render & Vercel Deployment Instructions

### Backend on Render (Web Service)
1. Create a **New Web Service** connected to your repository.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables on Render:**
   - `PORT`: `5000` (or let Render assign)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `JWT_SECRET`: *A strong random 64-character secret*
   - `CLIENT_ORIGIN`: `https://your-civicai-frontend.vercel.app`
   - `GEMINI_API_KEY`: *Your Google Gemini API Key*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `STORAGE_PROVIDER`: `cloudinary`
   - `CLOUDINARY_CLOUD_NAME`: *Your Cloudinary cloud name*
   - `CLOUDINARY_API_KEY`: *Your Cloudinary API key*
   - `CLOUDINARY_API_SECRET`: *Your Cloudinary API secret*

### Frontend on Vercel
1. Create a **New Project** importing the repository.
2. **Framework Preset:** Vite
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables on Vercel:**
   - `VITE_API_BASE_URL`: `https://your-civicai-backend.onrender.com/api/v1`

---

## 8. API Overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Server & Database health status |
| `POST`| `/api/v1/auth/register` | Public | Citizen registration |
| `POST`| `/api/v1/auth/login` | Public | Authenticates citizen or admin |
| `POST`| `/api/v1/auth/logout` | Authenticated | Revokes session & clears cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Current user profile |
| `GET` | `/api/v1/complaints/metrics/mine` | Citizen | Live user aggregated metrics |
| `GET` | `/api/v1/complaints/metrics/overview`| Admin | Complete queue $facet analytics |
| `POST`| `/api/v1/complaints` | Citizen | Submit issue with optional photo |
| `GET` | `/api/v1/complaints/mine` | Citizen | User's complaints list |
| `GET` | `/api/v1/complaints` | Admin | Filtered administrative queue |
| `GET` | `/api/v1/complaints/:id` | Owner/Admin | Detail view (private notes filtered) |
| `POST`| `/api/v1/complaints/:id/ai/analyze` | Owner/Admin | Re-run Gemini AI triage |
| `POST`| `/api/v1/complaints/:id/ai/confirm` | Admin | Confirm & adopt AI recommendations |
| `PATCH`| `/api/v1/complaints/:id/status` | Admin | Transition status & log audit note |
| `PATCH`| `/api/v1/complaints/:id/triage` | Admin | Change category, priority, department |
| `POST`| `/api/v1/complaints/:id/notes` | Admin | Append internal staff note |

---

## 9. Ethics & Public Tech Guarantees

- **Advisory AI Only:** Machine recommendations assist human operators; all official assignments and status changes require verified municipal staff authorization.
- **Privacy by Design:** Resident emails and passwords are never exposed; staff internal notes are strictly segregated from public audit records.
- **Light Mode Accessibility:** High-contrast text, clear visual cues, responsive mobile layouts ($\ge 44\text{px}$ touch targets), and graceful error states.

---

# 10. Team Members & Registration Numbers

-Uday Bavireddy--241FA04283
-P.Sathwik     --241FA04E19
-T.Hari Krishna--241FA04348
