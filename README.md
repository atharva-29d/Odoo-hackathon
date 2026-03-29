# Reimbursement Management System

Production-style reimbursement platform built with FastAPI, Firebase Firestore, Firebase Authentication, React, Vite, and Tailwind CSS.

## Stack

- Backend: FastAPI
- Database: Firebase Firestore
- Auth: Firebase Authentication with email/password
- Frontend: React + Vite + Tailwind CSS
- State: React Context
- OCR: `pytesseract`
- Live data: Firestore-backed APIs with frontend polling

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
|   |-- .env.example
|   |-- main.py
|   `-- requirements.txt
|-- frontend
|   |-- src
|   |   |-- api
|   |   |-- components
|   |   |-- contexts
|   |   |-- layouts
|   |   |-- pages
|   |   `-- utils
|   `-- .env.example
`-- README.md
```

## What’s Included

- Multi-company signup flow that creates a company and first admin.
- Company currency lookup using the REST Countries API with fallback mapping.
- Firebase Authentication login with backend token verification.
- Firestore-scoped users, expenses, approvals, company settings, and audit logs.
- Multi-level approval flow with admin-configurable workflow steps.
- Conditional approval logic:
  - 60% approval threshold
  - CFO override
  - Hybrid mode
  - Auto-approve below company threshold
  - High-amount flow requiring 3 approvals
- OCR receipt scan for amount, date, and merchant extraction.
- SaaS-style dashboard, approval queue, expense submission, my expenses, and admin panel.

## Firestore Collections

- `companies`
  - `name`
  - `country`
  - `currency`
  - `approval_rule`
  - `approval_threshold`
  - `auto_approve_amount`
  - `high_amount_threshold`
  - `high_amount_required_approvals`
  - `workflow_steps`

- `users`
  - `id` = Firebase Auth UID
  - `email`
  - `name`
  - `role`
  - `company_id`
  - `manager_id`
  - `approval_roles`
  - `department`
  - `title`

- `expenses`
  - `company_id`
  - `employee_id`
  - `submitted_amount`
  - `submitted_currency`
  - `converted_amount`
  - `company_currency`
  - `status`
  - `category`
  - `description`
  - `expense_date`
  - `receipt_image_path`
  - `required_approval_count`
  - `auto_approved`

- `approvals`
  - `expense_id`
  - `company_id`
  - `approver_id`
  - `status`
  - `step_order`
  - `level_key`
  - `level_label`
  - `comment`
  - `is_current`

- `audit_logs`
  - `company_id`
  - `actor_id`
  - `action`
  - `entity_type`
  - `entity_id`
  - `message`
  - `metadata`

## Backend Setup

1. Create a Firebase project.
2. Enable:
   - Firestore Database
   - Authentication -> Email/Password
3. Download a Firebase Admin SDK service account JSON.
4. Copy `backend/.env.example` to `backend/.env`.
5. Fill these values:

```env
APP_NAME=Reimbursement API
CLIENT_URL=http://localhost:5173
FIREBASE_CREDENTIALS_PATH=C:\full\path\to\service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
REST_COUNTRIES_API_URL=https://restcountries.com/v3.1
EXCHANGE_RATE_API_URL=https://api.frankfurter.app
TESSERACT_CMD=
TESSERACT_LANG=eng
HOST=127.0.0.1
PORT=5000
```

6. Install backend dependencies and run:

```powershell
cd "c:\Users\labhe\OneDrive\Desktop\odoo hackthon\backend"
python -m pip install -r requirements.txt
python scripts\seed.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

## Frontend Setup

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install dependencies and start Vite:

```powershell
cd "c:\Users\labhe\OneDrive\Desktop\odoo hackthon\frontend"
npm install
npm run dev
```

Frontend environment file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

Open `http://localhost:5173`.

## Core API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Company

- `GET /api/company/settings`
- `PUT /api/company/settings`
- `GET /api/company/audit-logs`

### Users

- `GET /api/users`
- `POST /api/users`

### Expenses

- `POST /api/expenses`
- `GET /api/expenses`
- `GET /api/expenses/my`
- `GET /api/expenses/pending`
- `POST /api/expenses/{id}/approve`
- `POST /api/expenses/{id}/reject`
- `POST /api/expenses/ocr`

### Compatibility Approval Routes

- `GET /api/approvals/pending`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/reject`

## Demo Seed Data

The seed script creates:

- `Acme Reimbursements`
- `admin@acme.local / password123`
- `manager@acme.local / password123`
- `employee@acme.local / password123`
- `nisha@acme.local / password123`
- pending and approved sample expenses

## Notes

- Login and signup use real Firebase Authentication.
- All business data is company-scoped in Firestore.
- Country currency lookup uses the REST Countries API with fallback mapping.
- Exchange conversion uses Frankfurter live rates with offline fallback values.
- Frontend polling keeps dashboards fresh for demo use without manual refresh.
- OCR requires local Tesseract installation.

## Verification

- Backend source compiled with `python -m compileall backend\app backend\main.py backend\scripts`
- Backend app import passed with `backend\.venv\Scripts\python.exe -c "import main; print(main.app.title)"`
- Frontend production build passed with `npm run build`
- Full runtime still depends on valid Firebase credentials, enabled Auth, and a valid Firebase Web API key
