# 🏢 ProjectX — Field Force ERP

**A full-stack Enterprise Resource Planning (ERP) system for pharmaceutical field operations.**

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

---

## 📖 Overview

**ProjectX** is a comprehensive **Field Force ERP platform** designed for pharmaceutical companies to manage on-ground sales operations efficiently.

It provides:

- Role-based dashboards (Admin, Managers, Employees)
- Doctor & chemist management
- Expense & payroll automation
- Tour planning and approvals
- GPS-based route analytics

---

## ✨ Key Features

| Module | Description |
|--------|------------|
| 🔐 Authentication & RBAC | JWT-based authentication with role hierarchy |
| 👥 Employee Management | Full lifecycle management with designation hierarchy |
| 🏥 Doctor & Chemist Registry | Maintain field-linked medical contacts |
| 📋 Call Reports | Daily MR activity logging |
| 💰 Expense Management | Automated TA/DA calculation and approvals |
| 🧾 Salary & Payroll | Salary structure, deductions, payslips |
| 🌴 Leave Management | Requests, approvals, shared calendar |
| 🗺️ Tour Programs | Weekly/monthly route planning |
| 📦 Inventory & Products | Product catalog + stock tracking |
| 🎯 Targets & Analytics | Performance dashboards |
| 📍 Route & HQ Management | Field mapping and classification |
| 🏪 Stockist Operations | Distribution tracking |
| 🔔 Notifications | Real-time alerts |
| 🌐 Mappls Integration | Geolocation + distance calculation |
| 📊 Admin Tools | Bulk Excel import/export |
| 📅 Holiday Calendar | Organization-wide scheduling |

---

## 🏗️ Architecture

```bash
ProjectX/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── core/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── modules/
│   │   ├── lib/
│   │   └── utils/
│   └── Dockerfile
│
├── docker-compose.yml
├── nginx.conf
└── package.json
```

---

## 🛠️ Tech Stack

### 🔙 Backend

| Technology | Purpose |
|------------|--------|
| Express.js 5 | REST API |
| MongoDB + Mongoose | Database |
| Redis | Caching |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Helmet | Security |
| express-rate-limit | API protection |
| Multer | File uploads |
| Winston | Logging |
| XLSX | Excel handling |
| Mappls API | Geolocation |

---

### 🎨 Frontend

| Technology | Purpose |
|------------|--------|
| React 19 | UI |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router | Routing |
| React Query | Server state |
| Axios | API calls |
| Chart.js | Analytics |
| FullCalendar | Scheduling |
| Lucide | Icons |
| Three.js | Visual effects |

---

### 🚀 Infrastructure

| Technology | Purpose |
|------------|--------|
| Docker + Compose | Containerization |
| Nginx | Reverse proxy |
| MongoDB Atlas | Cloud DB |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18  
- npm ≥ 9  
- MongoDB (local or Atlas)  
- Redis (optional for dev, required in production)

---

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ProjectX.git
cd ProjectX
```

---

### 2. Environment Setup

#### Root & Backend `.env`

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

JWT_SECRET=your_secret
JWT_EXPIRE=30d

REDIS_URL=redis://:password@redis:6379

MAPPLS_CLIENT_ID=xxx
MAPPLS_CLIENT_SECRET=xxx

API_AUTH_KEY=secure_key

TA_RATE_PER_KM=XX
ATTENDANCE_DISTANCE_THRESHOLD_METERS=XX
HQ_ALLOWANCE_PER_DAY=XX
X_STATION_LIMIT_KM=XX
X_STATION_ALLOWANCE_PER_DAY=XX
OFF_STATION_LIMIT_KM=XX
OFF_STATION_ALLOWANCE_PER_DAY=XX
```

#### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

---

### 3. Install Dependencies

```bash
npm run install-all
```

---

### 4. Run Development Servers

```bash
npm run dev
```

| Service | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health Check | http://localhost:5000/api/v1/settings |

---

## 🐳 Docker Deployment

### Build & Run

```bash
docker-compose up -d --build
```

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

👉 Application runs at: **http://localhost**

> Backend is not exposed publicly. All API traffic flows through **Nginx with API key validation**.

---

## 🔐 Role-Based Access

```
Admin
 └── SM
      └── RSM
           └── ASM
                └── BDE
```

| Role | Access |
|------|--------|
| Admin | Full control |
| SM / RSM / ASM | Team management & approvals |
| BDE | Field operations |

---

## 📡 API Structure

Base format:

```
/api/v1/<resource>
```

Examples:

- `/auth`
- `/employees`
- `/doctors`
- `/call-reports`
- `/expenses`
- `/salary`
- `/analytics`
- `/notifications`

---

## 🧪 Development

### Scripts

| Command | Description |
|--------|------------|
| npm run dev | Run full stack |
| npm start | Backend only |
| npm run install-all | Install dependencies |
| npm run build | Build frontend |
| npm run lint | Lint frontend |

---

### Backend Module Structure

```bash
modules/<name>/
├── model.js
├── controller.js
└── routes.js
```

---

## ⚙️ Configuration (Business Rules)

| Variable | Description |
|----------|------------|
| TA_RATE_PER_KM | Travel allowance rate |
| HQ_ALLOWANCE_PER_DAY | HQ allowance |
| X_STATION_LIMIT_KM | Distance threshold |
| OFF_STATION_ALLOWANCE_PER_DAY | Travel allowance |

---

## 📄 License

This project is licensed under the **ISC License**.

---

## ❤️ Final Note

Built with ❤️ for scalable **field force management systems**.
