<div align="center">

# 💉 ShotSecure

**School vaccination management, simplified.**

ShotSecure gives school coordinators a powerful command center to schedule vaccination drives, track immunisation records, and generate compliance reports — eliminating paperwork and reducing administrative errors across every campus.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-shotsecure--uk.vercel.app-blue?style=for-the-badge&logo=vercel)](https://shotsecure-uk.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)

> 🔐 Login with `admin` / `password`

</div>

---

## ✨ Features

- **Student Management** — Add, edit, and delete students with a unique student ID
- **Bulk CSV Import** — Upload a student roster and skip existing records automatically
- **Vaccination Drives** — Schedule drives with a date, vaccine name, and location
- **Vaccination Tracking** — Mark students as vaccinated per drive; one record per student per drive enforced
- **Reports & Export** — Filter by class, vaccine name, and status; export results to CSV
- **Responsive UI** — MUI-powered layout with mobile drawer navigation
- **Simulated Auth** — Login-protected with a static admin credential

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, Vite, Material UI v5, Axios   |
| Backend     | Node.js, Express.js                     |
| Database    | MongoDB, Mongoose ODM                   |
| File Upload | multer, csv-parser                      |
| Testing     | Jest, Supertest (backend), Vitest (frontend) |
| Dev Tooling | nodemon                                 |
| Deployment  | Vercel                                  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI

### Clone

```bash
git clone https://github.com/UtkarshK95/shotsecure.git
cd shotsecure
```

### Running Locally

Open two terminal windows.

**Terminal 1 — Backend**

```bash
cd backend
cp .env.example .env   # edit MONGO_URI if needed
npm install
npm run dev
```

Runs at `http://localhost:5002`

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

---

## 📁 Project Structure

```
shotsecure/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # Static-token auth guard
│   ├── models/
│   │   ├── Drive.js
│   │   └── Student.js
│   ├── routes/
│   │   ├── drives.js
│   │   ├── reports.js
│   │   └── students.js          # Includes /import and /:id/vaccinate
│   ├── uploads/                 # Temp CSV storage — cleared after each import
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Drives.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Students.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── LICENSE
└── README.md
```

---

## 🧪 Available Scripts

### Backend (`/backend`)

| Script          | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start with nodemon (auto-reload)     |
| `npm start`     | Start without nodemon                |
| `npm run seed`  | Populate the database with sample data |
| `npm test`      | Run the full test suite (Jest + Supertest) |

### Frontend (`/frontend`)

| Script               | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Start Vite development server        |
| `npm run build`      | Production build to `dist/`          |
| `npm run preview`    | Preview the production build         |
| `npm test`           | Run the component test suite (Vitest)|
| `npm run test:watch` | Run tests in watch mode              |

---

## 🌱 Seed Data

The seed script populates the database with realistic sample data for local testing.

```bash
cd backend
npm run seed
```

| Entity       | Count | Details                                                              |
|--------------|-------|----------------------------------------------------------------------|
| Drives       | 4     | Hepatitis B (Jan), Polio (Feb), MMR (Apr), COVID-19 Booster (May)   |
| Students     | 20    | Classes 8A, 8B, 9A, 9B, 10A, 10B — named S001 to S020              |
| Vaccinations | ~17   | Mixed spread: fully vaccinated, partially vaccinated, and unvaccinated |

The script is idempotent — safe to run multiple times. Existing records are skipped without error.

### Sample CSV for Bulk Import

A ready-to-use file is included at `backend/seeds/sample-import.csv` with 10 students (S021–S030). All 10 will insert cleanly via the **Import CSV** button on the Students page.

Expected column order:

```
name,class,studentid
Zara Ahmed,8A,S021
Dev Malhotra,8B,S022
```

---

## 🔐 Login Credentials

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `password` |

Authentication is simulated — no real backend session or JWT is used.

---

## 📡 API Reference

Base URL: `http://localhost:5002/api`

All endpoints except `POST /api/login` require the header:

```
Authorization: Bearer admin-token
```

### Students

| Method | Endpoint               | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/students`            | List students (filters: name, class, vaccinated) |
| POST   | `/students`            | Add a student                            |
| PUT    | `/students/:id`        | Update a student                         |
| DELETE | `/students/:id`        | Delete a student                         |
| POST   | `/students/:id/vaccinate` | Mark vaccinated for a drive           |
| POST   | `/students/import`     | Bulk import from CSV                     |

### Drives

| Method | Endpoint      | Description       |
|--------|---------------|-------------------|
| GET    | `/drives`     | List all drives   |
| POST   | `/drives`     | Create a drive    |
| PUT    | `/drives/:id` | Update a drive    |
| DELETE | `/drives/:id` | Delete a drive    |

### Reports

| Method | Endpoint   | Query Params                                          |
|--------|------------|-------------------------------------------------------|
| GET    | `/reports` | `class`, `vaccineName`, `vaccinated` (true/false), `format=csv` |

---

## 🏗️ Architecture Notes

- One vaccination per student per drive is enforced at the database write level in the vaccinate route
- CSV uploads are written to `backend/uploads/` and deleted immediately after parsing
- The frontend Axios instance attaches the stored token to every request via a request interceptor
- `POST /students/import` is declared before `/:id` routes in Express to prevent route shadowing

---

## ☕ Support the Project

- **GitHub:** [https://github.com/UtkarshK95/shotsecure](https://github.com/UtkarshK95/shotsecure)
- **Buy Me a Coffee:** [https://buymeacoffee.com/utkarshk95](https://buymeacoffee.com/utkarshk95)

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/UtkarshK95">Utkarsh Katiyar</a>
</div>
