# HRMS — Human Resource Management System

**Every workday, perfectly aligned.**

A full-stack HR Management System built on the MERN stack (MongoDB, Express, React + Vite, Node.js). Covers secure authentication, role-based access, employee profile management, attendance tracking, leave/time-off management, and payroll visibility with approval workflows for Admins/HR.

---

## Tech Stack

- **Frontend:** React 19 (Vite), React Router, Tailwind CSS, Axios, react-hot-toast, lucide-react
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas (falls back automatically to an in-memory MongoDB instance if Atlas is unreachable — see [Database Notes](#database-notes))
- **Auth:** JWT + bcrypt password hashing, role-based middleware (`admin`, `hr`, `employee`)
- **File uploads:** Multer (company logos, profile pictures, leave attachments), served from `/server/uploads`

---

## Project Structure

```
HR Management System/
├── server/                 # Express + Mongoose backend
│   ├── config/db.js        # MongoDB connection (Atlas + in-memory fallback)
│   ├── models/              # Company, User, Attendance, TimeOff
│   ├── controllers/         # Route handlers
│   ├── routes/               # Express routers
│   ├── middleware/          # auth, role guards, multer upload, error handler
│   ├── utils/                # login ID generator, JWT helper, salary calculator
│   ├── seedData.js           # Shared seeding logic (used by seed.js and auto-seed-on-boot)
│   ├── seed.js                # CLI: force-reseed demo data
│   ├── index.js               # App entrypoint
│   └── .env                   # MONGO_URI, JWT_SECRET, PORT
├── client/                  # React (Vite) + Tailwind frontend
│   └── src/
│       ├── api/axios.js       # Axios instance with JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/        # Navbar, Layout, Modal, EmployeeCard, SalaryTab, SecurityTab...
│       └── pages/              # SignIn, SignUp, Employees, EmployeeProfile, Attendance, TimeOff
└── package.json              # Root scripts (runs server + client together)
```

---

## Features

### Authentication & Authorization
- Sign Up creates a new company; the **first** person to sign up becomes Admin.
- Auto-generated Login ID format: `[2-letter company code][first 2 letters of first name][first 2 letters of last name][joining year][4-digit serial]` (e.g. `CEJODO20220001`).
- Admin/HR create employees directly — the system auto-generates their Login ID + a temporary password. Employees must set a new password on first login.
- JWT-based sessions, bcrypt-hashed passwords, role-based route guards (`admin`, `hr`, `employee`).

### Employees
- Landing page with a searchable grid of employee cards.
- Live presence dot per card: 🟢 present (checked in) · 🟡 absent · ⚪ on leave.
- Clicking a card opens that employee's profile in **read-only** mode.
- Admin/HR-only **Add Employee** flow.

### Employee Profile
- **Resume** tab — about, what I love about my job, interests/hobbies, skills, certifications.
- **Private Info** tab — address, DOB, gender, marital status, bank details, PAN, UAN, IFSC, date of joining.
- **Salary Info** tab (Admin/HR only) — monthly/yearly wage, configurable salary components (Basic, HRA, Standard Allowance, Performance Bonus, Leave Travel Allowance) as fixed amount or % of wage, auto-calculated Fixed Allowance (remainder), PF contribution (12% of Basic, employee + employer), Professional Tax.
- **Security** tab (own profile only) — change password.
- Employees can edit limited fields on their own profile; Admin can edit everything for anyone.

### Attendance
- Check In / Check Out button in the navbar; status dot updates live.
- Employees see their own attendance history (monthly), with a summary of days present, leave days, and total working days.
- Admin/HR see a day-wise view across all employees, with date navigation and search.
- Approved time-off automatically marks the corresponding attendance days as "leave".

### Time Off
- Leave types: Paid Time Off (24 days/yr), Sick Leave (7 days/yr), Unpaid Leave.
- Employees apply via a modal: type, date range, auto-calculated allocation days, remarks, attachment (required for sick leave).
- Monthly calendar with present/absent/leave markers.
- Admin/HR view all requests and Approve/Reject with comments — approval instantly updates the employee's balance and attendance.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string (optional — see [Database Notes](#database-notes))

### 2. Install dependencies
```bash
npm run install:all
```
This installs dependencies for the root, `/server`, and `/client`.

### 3. Configure environment
`server/.env` (already present, edit as needed):
```
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
PORT=5000
```

### 4. Run the app
```bash
npm run dev
```
This starts the backend (port `5000`) and frontend (port `5173`) together via `concurrently`.

Open **http://localhost:5173**

### 5. Seed demo data (optional — also happens automatically)
```bash
npm run seed
```
Force-reseeds a demo company, 1 admin, 5 employees, ~15 days of attendance history, and sample time-off requests (mixed pending/approved/rejected).

> The server also **auto-seeds on boot** if the database is empty — so a fresh `npm run dev` always has demo data ready without any manual step.

---

## Demo Credentials

*(Regenerated on every fresh seed — check your terminal's startup log for the current values, since the login ID includes the joining year.)*

| Role | Login ID (example) | Password |
|---|---|---|
| Admin | `ODANJO20240001` | `Admin@123` |
| Employee | `ODRASH20240001` | `Welcome@123` |

---

## Database Notes

The backend tries your `MONGO_URI` (Atlas) first. If that connection fails — for example, on a network that blocks MongoDB's TLS port 27017 — it **automatically falls back** to a local in-memory MongoDB instance (`mongodb-memory-server`) so the app never breaks.

- With **Atlas**: data persists normally across restarts.
- With the **in-memory fallback**: data is wiped on every server restart, and the app auto-reseeds fresh demo data each time (login IDs may change slightly since they encode the joining year).

To confirm which mode you're in, check the server startup log:
```
MongoDB connected (Atlas)                     ← persistent
MongoDB connected (in-memory fallback)        ← resets on restart
```

---

## Available Scripts (root)

| Command | Description |
|---|---|
| `npm run install:all` | Install dependencies in root, server, and client |
| `npm run dev` | Run backend + frontend together |
| `npm run server` | Run backend only |
| `npm run client` | Run frontend only |
| `npm run seed` | Force-reseed demo data |
| `npm run build` | Production build of the client |

---

## API Overview

| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/api/auth/signup` | Register a new company + Admin | Public |
| POST | `/api/auth/login` | Log in with Login ID/email + password | Public |
| GET | `/api/auth/me` | Get current user | Authenticated |
| POST | `/api/auth/change-password` | Change password | Authenticated |
| GET | `/api/employees` | List employees | Authenticated |
| GET | `/api/employees/:id` | Get one employee | Authenticated |
| POST | `/api/employees` | Create employee | Admin/HR |
| PUT | `/api/employees/:id` | Update employee | Self or Admin/HR |
| GET | `/api/salary/:employeeId` | Get salary info | Admin/HR |
| PUT | `/api/salary/:employeeId` | Update salary info | Admin/HR |
| POST | `/api/attendance/check-in` | Check in | Authenticated |
| POST | `/api/attendance/check-out` | Check out | Authenticated |
| GET | `/api/attendance/status` | Own today's status | Authenticated |
| GET | `/api/attendance/today-status` | All employees' today status (dots) | Authenticated |
| GET | `/api/attendance/me` | Own attendance history | Authenticated |
| GET | `/api/attendance` | All employees' attendance for a date | Admin/HR |
| POST | `/api/timeoff` | Apply for leave | Authenticated |
| GET | `/api/timeoff/me` | Own leave requests + balance | Authenticated |
| GET | `/api/timeoff` | All leave requests | Admin/HR |
| PUT | `/api/timeoff/:id/review` | Approve/reject a request | Admin/HR |
