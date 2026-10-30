# WQB HR & Payroll Management System

WQB is a full-stack HR and payroll management application for managing employees, attendance, leave, payroll, payslips, and administrative reporting.

## Features

- Role-based authentication and protected routes
- Forgot-password flow with email verification code
- Employee directory and employee profile management
- Attendance tracking for Present, Absent, Late, and Half Day
- Leave applications, leave types, balances, and approval history
- Calendar for leave and workforce events
- Payroll generation and payroll dashboard
- Salary components, allowances, deductions, loans, advances, and arrears
- Payslip access for employees
- Admin overview with employee, attendance, and leave details
- Responsive layout for desktop, tablet, and mobile screens
- Sidebar search with direct navigation
- Light and dark themes
- Employee image upload support

## Technology Stack

### Frontend

- React 19
- Vite
- React Router
- React Bootstrap and Bootstrap
- Axios
- FullCalendar
- Lucide React
- XLSX and jsPDF for reports and exports

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs password hashing
- Nodemailer for password-reset emails
- Multer for file uploads

## Project Structure

```text
WQB/
├── backend/
│   ├── Model/
│   ├── Routes/
│   ├── uploads/
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── AdminPanel/
│       ├── Component/
│       ├── Pages/
│       ├── Payroll_D/
│       └── Service/
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB local server or MongoDB Atlas
- Gmail SMTP app password for the forgot-password email flow

## Installation

```bash
git clone https://github.com/Abdul-Rehman155/WQB.git
cd WQB

cd backend
npm install

cd ../frontend
npm install
```

## Environment Configuration

Create `backend/.env` from the provided example:

```bash
cd backend
copy .env.example .env
```

Update the values in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wqb
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
SMTP_USER=your-gmail-address
SMTP_APP_PASSWORD=your-gmail-app-password
SMTP_FROM_NAME=WQB
```

For Gmail, use a Google App Password instead of the normal Gmail password. Never commit `.env` or any other secret file.

The frontend uses `http://localhost:5000/api` by default. To use another backend URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Running Locally

Start the backend:

```bash
cd backend
node server.js
```

For backend development with automatic restart:

```bash
npx nodemon server.js
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the application at [http://localhost:5173](http://localhost:5173).

The backend runs at [http://localhost:5000](http://localhost:5000).

## Available Frontend Commands

Run these commands from `frontend/`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Run Oxlint
```

## Main Routes

| Route | Purpose | Access |
|---|---|---|
| `/login` | Login and password reset | Public |
| `/dashboard` | Employee dashboard | Authenticated users |
| `/employees` | Employee directory | Authenticated users |
| `/calendar` | Calendar and events | Authenticated users |
| `/attendance` | Attendance management | Authenticated users |
| `/leave` | Leave applications | Authenticated users |
| `/leave/balances` | Leave balances | Authenticated users |
| `/admin` | Admin overview and history | Admin |
| `/payroll` | Payroll management | Admin, HR, Salary Clerk |
| `/payroll-deshboard` | Payroll analytics dashboard | Admin, HR, Salary Clerk |
| `/payroll/payslips` | Employee payslips | Authenticated users |
| `/payroll/components` | Salary components | Admin, HR, Salary Clerk |

## Backend API Groups

The backend exposes API groups under `/api`, including:

- `/api/auth`
- `/api/employee` and `/api/employees`
- `/api/attendance`
- `/api/events`
- `/api/departments`
- `/api/employee-types`
- `/api/office-types`
- `/api/payroll`
- `/api/salary-components`
- `/api/leave-types`
- `/api/leaves`

Uploaded employee images are served from `/uploads`.

## Production Notes

1. Use a secure, long random value for `JWT_SECRET`.
2. Use MongoDB Atlas or a secured MongoDB instance in production.
3. Set `CLIENT_URL` to the deployed frontend URL.
4. Set `VITE_API_URL` to the deployed backend API URL before building the frontend.
5. Configure Gmail SMTP with an app password for password reset.
6. Do not commit `.env`, uploaded files, `node_modules`, or `frontend/dist`.
7. Use HTTPS for both frontend and backend deployments.

## License

This project is currently maintained as a private project by Abdul-Rehman155.