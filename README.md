<![CDATA[<div align="center">

# 🏢 ProjectX — Field Force ERP

**A full-stack Enterprise Resource Planning system built for pharmaceutical field operations.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

ProjectX is a comprehensive Field Force ERP designed for **pharmaceutical companies** to manage their on-ground sales operations end-to-end. It provides role-based dashboards for administrators, managers (SM / RSM / ASM), and field employees (BDE) — covering everything from doctor & chemist management to expense tracking, salary processing, and GPS-powered route analytics.

---

## ✨ Key Features

| Module | Description |
|---|---|
| **Authentication & RBAC** | JWT-based auth with role-based access control (Admin, SM, RSM, ASM, BDE) |
| **Employee Management** | Full employee lifecycle — onboarding, profiles, designation hierarchy |
| **Doctor & Chemist Registry** | Manage doctor/chemist databases with field-level association |
| **Call Reports** | Daily Medical Representative (MR) call logging with collaborative reporting |
| **Expense Management** | Submit, approve, and track travel & daily allowances with auto-calculations |
| **Salary & Payroll** | Per-employee salary structures, deductions, and payslip generation |
| **Leave Management** | Apply for leaves, manager approvals, and a shared leave calendar |
| **Tour Programs** | Plan and get approval for weekly/monthly tour schedules |
| **Inventory & Products** | Track product catalogue and stockist-level inventory |
| **Targets & Analytics** | Set and monitor monthly sales targets with visual analytics dashboards |
| **Route & HQ Management** | Manage headquarters, field routes, and station classifications |
| **Stockist Operations** | Manage stockist-target mapping and distribution tracking |
| **Notifications** | In-app notification system for approvals, updates, and alerts |
| **MapmyIndia / Mappls** | Geolocation services — reverse geocoding, address search, distance calculations |
| **Admin Tools** | Bulk data import via Excel (XLSX) |
| **Holiday Calendar** | Company-wide holiday management |

---

## 🏗️ Architecture

```
ProjectX/
├── backend/              # Express.js REST API (Node.js)
│   ├── src/
│   │   ├── config/       # Database & service configurations
│   │   ├── core/         # Error handler, response utilities
│   │   ├── middleware/    # Auth, caching (Redis), file upload
│   │   ├── modules/      # Feature modules (19 modules)
│   │   │   ├── auth/
│   │   │   ├── employee/
│   │   │   ├── doctor/
│   │   │   ├── chemist/
│   │   │   ├── callReport/
│   │   │   ├── expense/
│   │   │   ├── salary/
│   │   │   ├── leave/
│   │   │   ├── tourProgram/
│   │   │   ├── inventory/
│   │   │   ├── target/
│   │   │   ├── analytics/
│   │   │   ├── stockist/
│   │   │   ├── route/
│   │   │   ├── hq/
│   │   │   ├── holiday/
│   │   │   ├── notification/
│   │   │   ├── mappls/
│   │   │   └── admin-tools/
│   │   ├── utils/        # Shared helpers
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Entry point
│   └── Dockerfile
│
├── frontend/             # React 19 SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── api/          # Axios API client layer
│   │   ├── auth/         # Login pages (Admin & Employee)
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React Context (Auth, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Admin / Manager / Employee layouts
│   │   ├── modules/      # Feature pages (17 modules)
│   │   ├── lib/          # Utility libraries
│   │   └── utils/        # Helpers & formatters
│   └── Dockerfile
│
├── docker-compose.yml    # Multi-container orchestration
├── nginx.conf            # Nginx reverse proxy config
└── package.json          # Root workspace scripts
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Express.js 5** | REST API framework |
| **MongoDB + Mongoose 9** | Database & ODM |
| **Redis** | Caching layer |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **Multer** | File uploads |
| **Winston** | Structured logging |
| **XLSX** | Excel import/export |
| **Mappls (MapmyIndia)** | Geolocation & geocoding |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **TanStack React Query** | Server state management |
| **Axios** | HTTP client |
| **Chart.js + react-chartjs-2** | Data visualization |
| **FullCalendar** | Calendar views |
| **Lucide React** | Icon library |
| **Three.js** | 3D rendering (dashboard effects) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerized deployment |
| **Nginx** | Reverse proxy & static file serving |
| **MongoDB Atlas** | Managed cloud database |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** (optional for development, required in production)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ProjectX.git
cd ProjectX
```

### 2. Environment Variables

Create a `.env` file in the **project root** (used by `docker-compose`) and in `backend/`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Redis (Docker)
REDIS_URL=redis://:your_redis_password@redis:6379

# MapmyIndia / Mappls API
MAPPLS_CLIENT_ID=your_mappls_client_id
MAPPLS_CLIENT_SECRET=your_mappls_client_secret

# API Security
API_AUTH_KEY=your_secure_api_key

# Business Configuration
TA_RATE_PER_KM=2.5
ATTENDANCE_DISTANCE_THRESHOLD_METERS=100
HQ_ALLOWANCE_PER_DAY=150
X_STATION_LIMIT_KM=50
X_STATION_ALLOWANCE_PER_DAY=250
OFF_STATION_LIMIT_KM=100
OFF_STATION_ALLOWANCE_PER_DAY=300
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install-all
```

### 4. Start Development Servers

```bash
# Start both backend & frontend concurrently
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| API Health Check | `http://localhost:5000/api/v1/settings` |

---

## 🐳 Docker Deployment

The project includes a production-ready Docker Compose setup with three services:

| Service | Container | Description |
|---|---|---|
| `backend` | `erp_backend` | Node.js API server (port 5000, internal only) |
| `redis` | `erp_redis` | Redis cache with password auth |
| `nginx` | `erp_nginx` | Nginx reverse proxy serving frontend + proxying API |

### Build & Run

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at `http://localhost:80`.

> **Note:** The backend is **not** directly exposed to the host — all API traffic routes through Nginx with API key validation via the `x-api-key` header.

---

## 🔐 Role-Based Access

The system implements a **designation-based reporting hierarchy**:

```
Super Admin (admin)
    └── SM (State Manager)
          └── RSM (Regional Sales Manager)
                └── ASM (Area Sales Manager)
                      └── BDE (Business Development Executive)
```

| Role | Dashboard | Key Capabilities |
|---|---|---|
| **Admin** | `/admin/dashboard` | Full access — employees, payroll, analytics, imports, approvals |
| **SM / RSM / ASM** | `/manager/dashboard` | Team oversight, expense & leave approvals, call monitoring, tour approvals |
| **BDE** | `/employee/dashboard` | Daily calls, personal expenses, tour planning, doctor/chemist management |

---

## 📡 API Structure

All API endpoints follow the pattern: `/api/v1/<resource>`

| Endpoint | Module |
|---|---|
| `/api/v1/auth` | Authentication (login, register, token refresh) |
| `/api/v1/employees` | Employee CRUD & profiles |
| `/api/v1/doctors` | Doctor management |
| `/api/v1/chemists` | Chemist management |
| `/api/v1/call-reports` | Daily call/visit logging |
| `/api/v1/expenses` | Expense submission & approvals |
| `/api/v1/salary` | Salary computation & payslips |
| `/api/v1/leaves` | Leave requests & approvals |
| `/api/v1/tour-programs` | Tour planning & approvals |
| `/api/v1/inventory` | Product & stock management |
| `/api/v1/stockists` | Stockist management |
| `/api/v1/operations` | Stockist-target operations |
| `/api/v1/routes` | Route management |
| `/api/v1/hqs` | Headquarters management |
| `/api/v1/analytics` | Reporting & analytics |
| `/api/v1/holidays` | Holiday calendar |
| `/api/v1/notifications` | Notification system |
| `/api/v1/mappls` | Geolocation services |
| `/api/v1/admin` | Admin tools (bulk import) |
| `/api/v1/settings` | Company settings |

---

## 🧪 Development

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently |
| `npm start` | Start backend only (production) |
| `npm run install-all` | Install deps for both backend & frontend |
| `cd frontend && npm run build` | Build frontend for production |
| `cd frontend && npm run lint` | Run ESLint on frontend |

### Backend Module Convention

Each backend module follows a consistent structure:

```
modules/<name>/
├── <name>.model.js       # Mongoose schema & model
├── <name>.controller.js  # Request handlers
└── <name>.routes.js      # Express router
```

---

## 🔧 Configuration

### Business Rules (via `.env`)

| Variable | Description | Default |
|---|---|---|
| `TA_RATE_PER_KM` | Travel allowance rate per kilometer | `2.5` |
| `ATTENDANCE_DISTANCE_THRESHOLD_METERS` | Geofence radius for attendance | `100` |
| `HQ_ALLOWANCE_PER_DAY` | Daily allowance at HQ station | `150` |
| `X_STATION_LIMIT_KM` | Distance threshold for ex-station | `50` |
| `X_STATION_ALLOWANCE_PER_DAY` | Daily allowance for ex-station | `250` |
| `OFF_STATION_LIMIT_KM` | Distance threshold for off-station | `100` |
| `OFF_STATION_ALLOWANCE_PER_DAY` | Daily allowance for off-station | `300` |

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">

**Built with ❤️ for field force management**

</div>
]]>
