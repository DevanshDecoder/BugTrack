# 🐛 BugTrack — Issue Tracking Platform

A modern, production-ready MERN-stack issue tracking and sprint management platform engineered for agile development teams.

---

## 🌟 Features Implemented

### 1. Issue Management — Core Feature
- **Full CRUD operations**: Create, edit, inspect, and delete tickets.
- **Priority matrix**: `Low`, `Medium`, `High`, and `Critical` (with visual indicators and pulse badges).
- **Status lifecycle**: `Open`, `In Progress`, `Resolved`, and `Closed`.
- **Assignment**: Assign issues to team members with fallback initials avatar rendering.
- **Auto-generated ticket keys**: Project-prefixed sequential keys (e.g. `BUG-1`, `BUG-2`, `MOB-1`).

### 2. Interactive Kanban Board
- **Status-based columns**: Visual swimlanes for `Open`, `In Progress`, `Resolved`, and `Closed`.
- **Drag-and-drop workflow**: Native HTML5 drag-and-drop for moving cards between columns.
- **Real-time synchronization**: Instant background updates (`PATCH /api/issues/:id/status`) with optimistic local updates.
- **Rich ticket cards**: Key, severity badge, title, tags, assignee avatar, and quick status shift shortcuts.

### 3. Dashboard and Analytics
- **KPI Summary Cards**: Total issues, open bugs, in-progress tasks, resolved count, and critical alerts.
- **Status Distribution**: Donut chart powered by **Recharts**.
- **Priority Breakdown**: Bar chart categorizing issues across all severity tiers.
- **7-Day Velocity Trends**: Area chart displaying newly opened vs resolved issues over time.
- **Team Workload**: Stacked horizontal chart showcasing assigned active vs completed tickets per developer.
- **Recent Activity Feed**: Real-time project audit stream tracking status changes, reassignments, and comments.

### 4. Authentication and Team Permissions (RBAC)
- **Secure Authentication**: JWT token authentication with bcrypt password hashing.
- **Multi-project architecture**: Multiple projects per user with custom key prefixes (e.g., `BUG`, `CORE`).
- **Role-Based Access Control**:
  - 👑 **Admin**: Full control over project settings, members, role updates, and ticket deletion.
  - 💻 **Developer**: Create, assign, edit details, and transition issue statuses on Kanban.
  - 📝 **Reporter**: Report issues, participate in discussions, and update self-reported items.

### 5. Issue Discussion and Audit Trail
- **Discussions & Comments**: Threaded commentary with author avatars, timestamps, and delete controls.
- **Audit Trail & Activity Log**: Automatically logs status transitions, priority updates, and assignee reallocations.
- **Multi-attribute Search & Filtering**: Instant search by ticket key or text, combined with status, priority, and assignee filters.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modular, fast Single Page Application (SPA) |
| **Styling** | Tailwind CSS | Utility-first, responsive interface |
| **Icons** | Lucide React | Clean, lightweight modern icons |
| **Charts** | Recharts | SVG dashboard data visualization |
| **Backend** | Node.js + Express.js | Modular RESTful API with RBAC middleware |
| **Database** | MongoDB + Mongoose | Schemas for Users, Projects, Issues, Comments, and Activities |
| **Authentication** | JWT + bcryptjs | Token-based stateless authentication |
| **Testing** | Vitest + Supertest | Automated API endpoint integration testing |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port `27017` or a **MongoDB Atlas** connection string.

### 2. Backend Setup
```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install

# (Optional) Verify or customize .env
# Default: MONGODB_URI=mongodb://127.0.0.1:27017/bugtrack

# Seed database with realistic demo issues, users, and audit logs
npm run seed

# Run automated tests
npm test

# Start backend dev server (port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd client

# Install dependencies
npm install

# Start frontend dev server (port 3000)
npm run dev
```

Now open your browser at **`http://localhost:3000`**.

---

## 👥 Seed Demo Accounts

The database seed script (`npm run seed`) preloads three role-ready test accounts:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bugtrack.io` | `password123` | Full administrative control over projects and team |
| **Developer** | `dev@bugtrack.io` | `password123` | Core engineering role for assigning and resolving tickets |
| **Reporter** | `reporter@bugtrack.io` | `password123` | QA / Product role for logging issues and discussions |

*(You can also click the quick-login pills on the login screen to fill credentials instantly!)*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated profile
- `GET /api/auth/users` — Directory of registered users

### Projects
- `GET /api/projects` — List projects current user belongs to
- `POST /api/projects` — Create a new project workspace
- `GET /api/projects/:projectId` — Project metadata and members
- `PUT /api/projects/:projectId` — Update project name/description *(Admin only)*
- `DELETE /api/projects/:projectId` — Delete project and cascade tickets *(Admin only)*
- `POST /api/projects/:projectId/members` — Add member with role *(Admin only)*
- `PUT /api/projects/:projectId/members/:userId` — Update member role *(Admin only)*
- `DELETE /api/projects/:projectId/members/:userId` — Remove member *(Admin only)*

### Issues
- `GET /api/issues?projectId=...` — Filtered issue list (supports `search`, `status`, `priority`, `assignee`)
- `POST /api/issues` — Create a ticket
- `GET /api/issues/:id` — Issue details
- `PUT /api/issues/:id` — Update issue attributes
- `PATCH /api/issues/:id/status` — Quick status update (Kanban drag-and-drop)
- `DELETE /api/issues/:id` — Delete issue *(Admin or Reporter)*

### Comments & History
- `GET /api/issues/:issueId/comments` — Issue comment thread
- `POST /api/issues/:issueId/comments` — Post comment
- `DELETE /api/issues/:issueId/comments/:commentId` — Delete comment
- `GET /api/analytics/project/:projectId` — Full dashboard metrics, trends, and workload
- `GET /api/analytics/issues/:issueId/activities` — Issue audit history
