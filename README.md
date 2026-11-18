# 🚲 Smart Bike Ride-Sharing & Cost-Sharing System

A modern, full-stack, smart bike ride-sharing and cost-sharing platform engineered with **FastAPI**, **React + Vite**, and **Tailwind CSS**.

---

## 🗺️ 12-Phase Structured Roadmap

| Phase | Module | Focus Area | Status |
|:---:|:---|:---|:---:|
| **01** | **Project Setup** | Folder structure, React + Vite, FastAPI, Python venv, API connection | **Completed** ✅ |
| **02** | **UI/UX Design** | Dark navy design system, responsive navbar, landing page, dashboard layouts | **Completed** ✅ |
| **03** | **Database Design** | Users, Rides, Bookings, Reviews, Reports tables & relations | **Completed** ✅ |
| **04** | **User Authentication** | Registration, login, password hashing (bcrypt), JWT, roles | **Completed** ✅ |
| **05** | **Offer a Ride** | Starting point, destination, departure time, seats, bike info, fair contribution | **Completed** ✅ |
| **06** | **Find a Ride** | Search, location filtering, date/time filtering, listing active rides | **Completed** ✅ |
| **07** | **Smart Ride Matching** | Location comparison, route similarity scoring, time compatibility | **Completed** ✅ |
| **08** | **Booking Management** | Send requests, accept/reject workflows, booking status, cancellation | *Next Up* ⏳ |
| **09** | **Cost-Sharing System** | Journey expense estimation, fair passenger contribution breakdown | *Upcoming* |
| **10** | **Safety Features** | Phone & document verification, emergency contacts, report/block, reviews | *Upcoming* |
| **11** | **Integration & Testing** | End-to-end API testing, booking workflow validation, security audit | *Upcoming* |
| **12** | **Deployment & Docs** | Production builds, GitHub documentation, project report & demo | *Upcoming* |

---

## 🚀 Running the Project (Phase 1)

### 1. Backend (FastAPI)
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

Run Backend Tests:
```bash
cd backend
.\venv\Scripts\pytest
```

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm run dev
```
- App URL: [http://localhost:3000](http://localhost:3000)
