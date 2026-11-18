# 🚲 Smart Bike Ride-Sharing & Cost-Sharing System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-52%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, full-stack, two-wheeler ride-sharing and non-profit cost-sharing platform engineered with **FastAPI**, **React 19 + Vite**, **SQLAlchemy 2.0**, and **Tailwind CSS v4**.

Designed specifically for personal motorcycles, scooters, and electric two-wheelers, the system operates under strict **non-commercial cost-sharing regulations** to eliminate surge pricing, alleviate traffic congestion, and ensure safe, verified daily commutes.

---

## 🗺️ 12-Phase Development Roadmap

| Phase | Module | Focus Area | Status |
|:---:|:---|:---|:---:|
| **01** | **Project Setup** | Folder structure, React + Vite, FastAPI, Python venv, API connection | **Completed** ✅ |
| **02** | **UI/UX Design** | Dark navy design system, responsive navbar, landing page, dashboard layouts | **Completed** ✅ |
| **03** | **Database Design** | Users, Rides, Bookings, Reviews, Reports, BlockedUsers tables & relations | **Completed** ✅ |
| **04** | **User Authentication** | Registration, login, password hashing (bcrypt), JWT, multi-role profiles | **Completed** ✅ |
| **05** | **Offer a Ride** | Starting point, destination, departure time, seats, bike info, fair contribution | **Completed** ✅ |
| **06** | **Find a Ride** | Search, location filtering, date/time filtering, listing active rides | **Completed** ✅ |
| **07** | **Smart Ride Matching** | Location comparison, route similarity scoring, time compatibility | **Completed** ✅ |
| **08** | **Booking Management** | Send requests, accept/reject workflows, booking status, cancellation | **Completed** ✅ |
| **09** | **Cost-Sharing System** | Journey expense estimation, fair passenger contribution breakdown | **Completed** ✅ |
| **10** | **Safety Features** | Phone & document verification, emergency contacts, report/block, reviews | **Completed** ✅ |
| **11** | **Integration & Testing** | End-to-end API testing, booking workflow validation, security audit | **Completed** ✅ |
| **12** | **Deployment & Docs** | Production builds, Docker Compose, project report & demonstration guide | **Completed** ✅ |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- *(Optional)* **Docker & Docker Compose**

---

### 2. Local Development Setup

#### Backend (FastAPI)
```bash
# Navigate to backend
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- **API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

#### Run Backend Automated Tests (52 Tests)
```bash
# From workspace root
backend\venv\Scripts\pytest
```

#### Frontend (React + Vite + Tailwind CSS)
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)

---

### 3. Production Deployment with Docker Compose

To launch the complete application stack (Backend on `:8000`, Nginx Frontend on `:3000`, persistent database volume):
```bash
docker-compose up --build -d
```
Stop the services:
```bash
docker-compose down
```

---

## 🏗️ System Architecture

```
+--------------------------------------------------------------------------+
|                        CLIENT TIER (React 19 + Vite)                     |
|  - Dark Navy High-Contrast Design System (#070b14, #0c1424, #0d1527)     |
|  - Tailwind CSS v4 + Lucide Icons + React Router Dom                     |
|  - Modals: Fair Cost Split, Safety Hub, Review Dialog, Report Modal      |
+--------------------------------------------------------------------------+
                                     |
                                     | RESTful JSON (Axios)
                                     v
+--------------------------------------------------------------------------+
|                     APPLICATION SERVER TIER (FastAPI)                    |
|  - OpenAPI / Swagger Auto-Generated Documentation                        |
|  - JWT Authentication (HS256) & Bcrypt Password Hashing                  |
|  - Smart Ride Matching Engine (Haversine Distance Scoring)               |
|  - Non-Profit Journey Cost Calculator & Commercial Fare Comparison       |
|  - Emergency SOS Dispatcher & National Safety Helplines (112, 1091)      |
+--------------------------------------------------------------------------+
                                     |
                                     | SQLAlchemy 2.0 ORM
                                     v
+--------------------------------------------------------------------------+
|                         DATABASE TIER (SQLite / PostgreSQL)              |
|  - Tables: users, rides, bookings, reviews, reports, blocked_users       |
|  - Constraints: Two-wheeler seat limits (1-2), Foreign Key cascades      |
+--------------------------------------------------------------------------+
```

---

## 📡 REST API Reference

### Health & System
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/health` | Service health status and version info |

### Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register a new user (`rider`, `passenger`, `both`) |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT access token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| `PUT` | `/api/v1/auth/profile` | Update profile information and bike details |

### Rides Management (`/api/v1/rides`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/rides/offer` | Offer / publish a new bike ride |
| `GET` | `/api/v1/rides/my-offered` | List all rides offered by current user |
| `GET` | `/api/v1/rides/search` | Multi-parameter search & filtering |
| `POST` | `/api/v1/rides/smart-match` | AI-scored ranking based on route similarity |
| `GET` | `/api/v1/rides/{id}` | Retrieve ride details by ID |
| `PUT` | `/api/v1/rides/{id}` | Update ride details |
| `PATCH` | `/api/v1/rides/{id}/cancel` | Cancel an offered ride |

### Booking Management (`/api/v1/bookings`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/bookings/request` | Submit a booking request for a ride |
| `GET` | `/api/v1/bookings/my-bookings` | List passenger's booked rides |
| `GET` | `/api/v1/bookings/ride/{id}/requests` | List incoming requests for a ride |
| `PATCH` | `/api/v1/bookings/{id}/accept` | Rider accepts booking (decrements seat) |
| `PATCH` | `/api/v1/bookings/{id}/reject` | Rider rejects booking request |
| `PATCH` | `/api/v1/bookings/{id}/cancel` | Passenger cancels booking (restores seat) |

### Non-Profit Cost-Sharing (`/api/v1/cost`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/cost/estimate` | Estimate journey expenses, fair split, and legal cap |
| `GET` | `/api/v1/cost/presets` | Get standard vehicle presets (Commuter, Sports, EV) |

### Safety & Trust (`/api/v1/safety`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/safety/phone/send-otp` | Request phone verification OTP |
| `POST` | `/api/v1/safety/phone/verify-otp` | Verify OTP and activate phone badge |
| `POST` | `/api/v1/safety/license/verify` | Verify Driving License & activate DL badge |
| `GET/POST`| `/api/v1/safety/emergency-contact` | Manage trusted emergency contact |
| `POST` | `/api/v1/safety/sos` | Trigger Emergency SOS alert with GPS coords |
| `POST` | `/api/v1/safety/block/{user_id}` | Block a user from future ride matches |
| `DELETE`| `/api/v1/safety/unblock/{user_id}` | Unblock a user |
| `GET` | `/api/v1/safety/blocked` | List all blocked users |
| `POST` | `/api/v1/safety/report` | Submit an incident report |
| `GET` | `/api/v1/safety/reports/my` | View reports filed by current user |
| `POST` | `/api/v1/safety/reviews` | Submit 1–5 star rating for completed ride |
| `GET` | `/api/v1/safety/reviews/user/{id}` | View user rating summary and reviews |

---

## 🛡️ Trust & Safety Architecture

- **Mandatory Helmet Verification**: Listings track whether a spare sanitized helmet is provided.
- **Strict Seat Limits**: Enforced maximum of 1 or 2 available seats tailored strictly for two-wheelers.
- **Non-Profit Ceiling**: Legal maximum cap ($\le 70\%$ operating cost) eliminates commercial surge pricing.
- **One-Tap Emergency SOS**: Broadcasts live GPS coordinates to trusted emergency contacts and displays one-click links to Indian National Helplines (**112**, Women Safety **1091**, Police **100**, Ambulance **108**).
- **Mutual Reputation Recalculation**: Ratings automatically update both parties' trust scores upon completion.

---

## 📚 Supplementary Documentation
- [Comprehensive Project Report (PROJECT_REPORT.md)](file:///c:/Users/DELL/Desktop/BikeRideSharing/PROJECT_REPORT.md)
- [Demonstration & Presentation Guide (DEMO_GUIDE.md)](file:///c:/Users/DELL/Desktop/BikeRideSharing/DEMO_GUIDE.md)

---

## 📄 License
This project is licensed under the MIT License.
