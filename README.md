# ShotSecure

School vaccination management portal — track students, drives, and vaccination records with bulk import and CSV reporting.

**[Live Demo](https://shotsecure-uk.vercel.app)** — login with `admin` / `password`

---

## Overview

ShotSecure is a full-stack MERN application that gives school administrators a single place to manage the complete vaccination lifecycle: register students individually or in bulk, schedule vaccination drives, mark vaccinations, and export filtered reports.

---

## Features

- Student management — add, edit, delete students with a unique student ID
- Bulk CSV import — upload a student roster and skip existing records automatically
- Vaccination drives — schedule drives with a date, vaccine name, and location
- Vaccination tracking — mark a student as vaccinated against a specific drive; one record per student per drive enforced
- Reports — filter by class, vaccine name, and vaccination status; export results to CSV
- Responsive UI — MUI-powered layout with mobile drawer navigation
- Simulated authentication — login protected with a static admin credential

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React 18, Vite, Material UI v5, Axios |
| Backend     | Node.js, Express.js                   |
| Database    | MongoDB, Mongoose ODM                 |
| File upload | multer, csv-parser                    |
| Dev tooling | nodemon                               |

---

## Project Structure

```
shotsecure/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # Static-token auth guard
│   ├── models/
│   │   ├── Drive.js
│   │   └── Student.js
│   ├── routes/
│   │   ├── drives.js
│   │   ├── reports.js
│   │   └── students.js        # Includes /import and /:id/vaccinate
│   ├── uploads/               # Temp CSV storage — cleared after each import
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # Axios instance with auth interceptor
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
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Clone

```bash
git clone https://github.com/UtkarshK95/shotsecure.git
cd shotsecure
```

---

## Running Locally

Open two terminal windows.

**Terminal 1 — Backend**

```bash
cd backend
cp .env.example .env   # edit MONGO_URI if needed
npm install
npm run dev
```

Runs at: `http://localhost:5002`

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at: `http://localhost:5173`

---

## Available Scripts

### Backend (`/backend`)

| Script          | Description                               |
|-----------------|-------------------------------------------|
| `npm run dev`   | Start with nodemon (auto-reload)          |
| `npm start`     | Start without nodemon                     |
| `npm run seed`  | Populate the database with sample data    |
| `npm test`      | Run the full test suite (Jest + Supertest)|

### Frontend (`/frontend`)

| Script               | Description                                    |
|----------------------|------------------------------------------------|
| `npm run dev`        | Start Vite development server                  |
| `npm run build`      | Production build to `dist/`                    |
| `npm run preview`    | Preview the production build                   |
| `npm test`           | Run the component test suite (Vitest)          |
| `npm run test:watch` | Run tests in watch mode during development     |

---

## Seed Data

The seed script populates the database with realistic sample data for local testing.

```bash
cd backend
npm run seed
```

What it creates:

| Entity | Count | Details |
| --- | --- | --- |
| Drives | 4 | Hepatitis B (Jan), Polio (Feb), MMR (Apr), COVID-19 Booster (May) |
| Students | 20 | Classes 8A, 8B, 9A, 9B, 10A, 10B — named S001 to S020 |
| Vaccinations | ~17 | Mixed spread: some students fully vaccinated, partially vaccinated, or unvaccinated |

The script is idempotent — safe to run multiple times. Existing records are skipped without error.

### Sample CSV for bulk import

A ready-to-use CSV file is included at `backend/seeds/sample-import.csv`. It contains 10 students (S021–S030) not present in the seed data, so all 10 will insert cleanly when uploaded via the **Import CSV** button on the Students page.

Expected CSV column order:

```
name,class,studentid
Zara Ahmed,8A,S021
Dev Malhotra,8B,S022
...
```

---

## Login Credentials

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `password` |

Authentication is simulated — no real backend session or JWT is used.

---

## API Reference

Base URL: `http://localhost:5002/api`

All endpoints except `POST /api/login` require the header:

```
Authorization: Bearer admin-token
```

### Students

| Method | Endpoint                      | Description                            |
|--------|-------------------------------|----------------------------------------|
| GET    | `/students`                   | List students (filters: name, class, vaccinated) |
| POST   | `/students`                   | Add a student                          |
| PUT    | `/students/:id`               | Update a student                       |
| DELETE | `/students/:id`               | Delete a student                       |
| POST   | `/students/:id/vaccinate`     | Mark vaccinated for a drive            |
| POST   | `/students/import`            | Bulk import from CSV                   |

**CSV format** (`students/import`):

```
name,class,studentid
Jane Doe,10A,S001
John Smith,10B,S002
```

### Drives

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| GET    | `/drives`      | List all drives           |
| POST   | `/drives`      | Create a drive            |
| PUT    | `/drives/:id`  | Update a drive            |
| DELETE | `/drives/:id`  | Delete a drive            |

### Reports

| Method | Endpoint    | Query Params                                              |
|--------|-------------|-----------------------------------------------------------|
| GET    | `/reports`  | `class`, `vaccineName`, `vaccinated` (true/false), `format=csv` |

---

## Architecture Notes

- One vaccination per student per drive is enforced at the database write level in the vaccinate route.
- CSV uploads are written to `backend/uploads/` and deleted immediately after parsing.
- The frontend Axios instance attaches the stored token to every request via a request interceptor.
- The `POST /students/import` route is declared before `/:id` routes in Express to prevent route shadowing.

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes.

---

## Support

- GitHub: [https://github.com/UtkarshK95](https://github.com/UtkarshK95)
- Buy Me a Coffee: [https://buymeacoffee.com/utkarshk95](https://buymeacoffee.com/utkarshk95)

---

## License

MIT © Utkarsh Katiyar
