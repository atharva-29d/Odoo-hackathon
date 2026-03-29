# Reimbursement Management System

Hackathon-ready full-stack MVP for reimbursements with a React + Tailwind frontend, FastAPI backend, Firebase Firestore persistence, JWT auth, OCR receipt scanning, and multi-step approvals.

## Folder Structure

```text
.
|-- backend
|   |-- app
|   |   |-- api
|   |   |   `-- routes
|   |   |-- core
|   |   |-- models
|   |   |-- services
|   |   `-- utils
|   |-- scripts
|   |-- uploads
|   |-- main.py
|   `-- requirements.txt
|-- frontend
|   |-- src
|   |   |-- api
|   |   |-- components
|   |   |-- contexts
|   |   |-- hooks
|   |   |-- layouts
|   |   |-- pages
|   |   `-- utils
|   `-- package.json
`-- README.md
```

## Features

- Signup creates a company plus the first admin user.
- JWT login with role-based access for admin, manager, and employee.
- Firestore collections for `companies`, `users`, `expenses`, and `approvals`.
- Admin user management with manager assignment and approval-role assignment.
- Employee expense submission with validation and receipt OCR autofill.
- Multi-step approval workflow: Manager -> Finance -> Director.
- Hybrid approval rule support:
  - `percentage`: approve once at least 60% of steps approve.
  - `specific`: approve once a CFO-designated approver approves.
  - `hybrid`: either rule works.
- Responsive SaaS-style dashboard with cards, tables, sidebar navigation, and mobile support.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Python FastAPI
- Database: Firebase Firestore
- Auth: JWT
- OCR: `pytesseract`

## Firebase Setup

1. Create a Firebase project.
2. Open Firebase Console -> Build -> Firestore Database.
3. Create the Firestore database in Native mode.
4. Open Project Settings -> Service accounts.
5. Generate a new private key JSON file.
6. Save that JSON on your machine, for example:

```text
C:\Users\labhe\Downloads\firebase-service-account.json
```

7. In `backend/.env`, set:

```env
FIREBASE_CREDENTIALS_PATH=C:\Users\labhe\Downloads\firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Local Run Instructions

### 1. Backend setup

```powershell
cd "c:\Users\labhe\OneDrive\Desktop\odoo hackthon\backend"
Copy-Item .env.example .env
pip install -r requirements.txt
python scripts\seed.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

### 2. Frontend setup

```powershell
cd "c:\Users\labhe\OneDrive\Desktop\odoo hackthon\frontend"
Copy-Item .env.example .env
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Demo Credentials

- Admin: `admin@acme.local` / `password123`
- Manager: `manager@acme.local` / `password123`
- Employee: `employee@acme.local` / `password123`

## Main API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Users

- `GET /api/users`
- `POST /api/users`

### Expenses

- `POST /api/expenses`
- `GET /api/expenses/my`
- `GET /api/expenses`
- `POST /api/expenses/ocr`

### Approvals

- `GET /api/approvals/pending`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/reject`

## Sample Data

The seed script creates:

- One company: `Acme Reimbursements`
- One admin
- One manager
- Two employees
- One pending expense
- One approved expense

## Notes

- The frontend polls every 15 seconds so judge demos show live Firestore-backed changes without manual refresh.
- OCR requires Tesseract to be installed locally. If it is not on PATH, set `TESSERACT_CMD` in `backend/.env`.
- Firestore is the source of truth for all business data. No static JSON is used for app records.

## Verification

- Python source compiles with `python -m compileall backend\app backend\scripts backend\main.py`.
- Frontend production build previously passed with `npm run build`.
- Full backend runtime still depends on valid Firebase credentials in `backend/.env`.
