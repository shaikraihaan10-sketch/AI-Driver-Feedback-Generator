# 🚌 AI Driver Performance Feedback Script Generator
### Manivtha Tours & Travels — Driver Performance Portal

A **full-stack, AI-powered SaaS web application** for generating professional monthly driver performance review scripts using OpenAI GPT.

---

## 🚀 Quick Start

### Prerequisites
No global Node.js or MongoDB installation required — everything is bundled!

### Step 1: Start the Backend API Server
Open a PowerShell terminal and run:
```powershell
.\start-backend.ps1
```
The backend will start at **http://localhost:5000** and seed the database with:
- 👤 **Admin Account:** `admin@manivtha.com` / `password123`
- 👤 **Manager Account:** `manager@manivtha.com` / `password123`
- 🚗 **5 Sample Drivers** (Ramesh Kumar, Suresh Patel, Amit Sharma, Priya Nair, Jagdish Singh)

### Step 2: Start the Frontend Dev Server
Open a **second** PowerShell terminal and run:
```powershell
.\start-frontend.ps1
```
The app will be available at **http://localhost:5173**

---

## 🔑 OpenAI API Configuration

To enable real AI generation (instead of the built-in template fallback):

**Option 1 — Environment Variable (Backend):**
```
backend/.env → OPENAI_API_KEY=sk-your-key-here
```

**Option 2 — In-App Settings (Manager):**
1. Log in → click **Settings** in the sidebar
2. Scroll to **OpenAI API Credentials**
3. Enter your API key and select your model (GPT-4o recommended)

> Without a key, the app uses a high-quality built-in template generator that produces properly structured coaching scripts.

---

## 📁 Project Structure
```
project/
├── backend/
│   ├── controllers/        # authController, driverController, feedbackController, analyticsController
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # db.js (hybrid DB), Schemas.js
│   ├── routes/             # auth, drivers, feedback, analytics, admin
│   ├── data/               # Local JSON file database (auto-created)
│   ├── server.js           # Express entry point + seeding
│   └── .env                # Configuration file
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout (Sidebar + Navbar)
│   │   ├── context/        # AuthContext, ThemeContext, ToastContext
│   │   └── pages/          # Login, Dashboard, GenerateFeedback, History, Analytics, Settings, AdminPanel
│   ├── tailwind.config.js
│   └── index.html
├── node-bin/               # Portable Node.js (v22.13.0)
├── start-backend.ps1       # Backend launcher
└── start-frontend.ps1      # Frontend launcher
```

---

## ✨ Features

| Feature | Status |
|---------|--------|
| JWT Authentication (Login / Register) | ✅ |
| Glassmorphism Dark/Light UI | ✅ |
| 3-Step Feedback Generation Wizard | ✅ |
| OpenAI GPT Integration | ✅ |
| Offline Template Fallback | ✅ |
| Voice Input (Web Speech API) | ✅ |
| Draft Auto-Save | ✅ |
| Keyboard Shortcut (Ctrl+Enter) | ✅ |
| Driver Autocomplete Quick-Select | ✅ |
| AI Script Copy / Download PDF / TXT / Print | ✅ |
| Script Rating System | ✅ |
| History with Search, Filter, Pagination | ✅ |
| Custom SVG Analytics Charts | ✅ |
| Admin Panel — Driver/Manager CRUD | ✅ |
| Database Backup & Restore (JSON) | ✅ |
| Framer Motion Animations | ✅ |
| Responsive Mobile/Tablet/Desktop | ✅ |
| File-based DB Fallback (no MongoDB needed) | ✅ |

---

## 🛠️ API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Manager login |
| POST | `/api/auth/register` | Register new manager |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update-profile` | Update profile/password |
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/:id` | Update driver |
| DELETE | `/api/drivers/:id` | Delete driver |
| POST | `/api/feedback/generate-feedback` | Generate AI script |
| GET | `/api/feedback/history` | List history |
| GET | `/api/feedback/history/:id` | Get single record |
| DELETE | `/api/feedback/history/:id` | Delete record |
| POST | `/api/feedback/rating/:id` | Rate a script |
| GET | `/api/analytics` | Get analytics metrics |
| GET | `/api/admin/backup` | Download DB backup |
| POST | `/api/admin/restore` | Restore DB backup |
