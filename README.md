# Internship LMS — Full Stack Platform

A production-ready Internship Learning Management System built for IT companies. Features real-time notifications, task management, attendance tracking, performance analytics, certificate generation, and more.

## Tech Stack

**Frontend:** React 18 + Vite · Tailwind CSS · Redux Toolkit · Recharts · Framer Motion · Socket.IO Client · React Hook Form · Lucide Icons

**Backend:** Node.js · Express.js · MongoDB + Mongoose · JWT Auth · Socket.IO · Nodemailer · Cloudinary · PDFKit · ExcelJS

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier works)
- Gmail account with App Password enabled

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run seed       # Creates admin: admin@company.com / Admin@123
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 3. Access

| Role  | URL                        | Credentials              |
|-------|----------------------------|--------------------------|
| Admin | http://localhost:5173/login | admin@company.com / Admin@123 |
| Intern| http://localhost:5173/login | (created by admin)       |

---

## Features

### Admin Panel
- Dashboard with analytics, charts, top performers
- Intern management (create, edit, bulk import via Excel)
- Project management with milestones and progress tracking
- Task assignment with priority levels and deadlines
- Attendance management + manual override
- Team creation and management
- Certificate generation (PDF + QR code)
- Support ticket management with replies
- Excel/PDF report exports
- Real-time notifications via Socket.IO

### Intern Panel
- Personal dashboard with internship progress bar
- Task view, submission (file upload, GitHub link, live demo)
- Resubmission of rejected tasks
- Attendance check-in/check-out
- Monthly attendance history
- Certificate download
- Support ticket creation and tracking
- Profile management

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Deployment

| Service   | Platform         |
|-----------|-----------------|
| Frontend  | Vercel           |
| Backend   | Render / Railway |
| Database  | MongoDB Atlas    |
| Storage   | Cloudinary       |

### Deploy Backend to Render
1. Connect your GitHub repo
2. Set Build Command: `npm install`
3. Set Start Command: `node server.js`
4. Add all environment variables

### Deploy Frontend to Vercel
1. Connect repo, set framework to Vite
2. Set `VITE_API_URL` to your Render backend URL

---

## API Endpoints

| Route | Description |
|-------|------------|
| `POST /api/auth/login` | Login |
| `GET /api/interns` | List all interns (admin) |
| `POST /api/interns` | Create intern |
| `POST /api/interns/bulk-import` | Excel import |
| `GET /api/tasks` | List tasks |
| `POST /api/tasks` | Create task |
| `POST /api/tasks/submit` | Submit task (intern) |
| `GET /api/attendance/my` | My attendance |
| `POST /api/attendance/check-in` | Check in |
| `GET /api/dashboard/admin` | Admin dashboard data |
| `GET /api/dashboard/intern` | Intern dashboard data |
| `POST /api/certificates/generate` | Generate certificate |
| `GET /api/reports/interns/excel` | Download Excel report |

---

## Folder Structure

```
lms/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # Express routes
│   ├── middleware/       # Auth, logging
│   ├── services/        # Email service
│   ├── sockets/         # Socket.IO handler
│   ├── config/          # Cloudinary config
│   ├── scripts/         # Seed script
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── admin/   # Admin pages
        │   ├── intern/  # Intern pages
        │   └── auth/    # Login, forgot password
        ├── components/  # Reusable components
        ├── layouts/     # AdminLayout, InternLayout
        ├── redux/       # State management
        ├── services/    # API, socket services
        └── App.jsx
```

---

## License
MIT
# LMS_Portal_New
