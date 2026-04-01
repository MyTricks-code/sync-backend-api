<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=32&pause=1000&color=4285F4&center=true&vCenter=true&width=600&lines=SYNC+AIT+%E2%80%94+Backend+API;Powering+the+NEXUS+Ecosystem" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/MyTricks-code/sync-backend-api/stargazers"><img src="https://img.shields.io/github/stars/MyTricks-code/sync-backend-api?style=for-the-badge&color=4285F4" alt="Stars"/></a>
  <a href="https://github.com/MyTricks-code/sync-backend-api/network/members"><img src="https://img.shields.io/github/forks/MyTricks-code/sync-backend-api?style=for-the-badge&color=EA4335" alt="Forks"/></a>
  <a href="https://github.com/MyTricks-code/sync-backend-api/issues"><img src="https://img.shields.io/github/issues/MyTricks-code/sync-backend-api?style=for-the-badge&color=FBBC04" alt="Issues"/></a>
  <img src="https://img.shields.io/badge/Node.js-Express-34A853?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Express"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
</p>

<br/>

> **The official REST API powering [⛓️‍💥 NEXUS](https://github.com/Jitesh-Yadav01/NEXUS) — aiming to be the central nervous system for all student clubs at the Army Institute of Technology, Pune.**
> Built with ❤️ by the **FE Members of GDG AIT**.

---

## 🌐 Live

| Service | URL |
|---------|-----|
| 🖥️ Frontend (NEXUS) | [syncaitpune.vercel.app](https://sync-ait.vercel.app/) |
| ⚙️ Backend API Root | `/` → `SYNC AIT BACKEND API` |

---

## 🔒 Overview

`sync-backend-api` is a production-grade **Node.js + Express** REST API that drives the NEXUS platform. It handles everything from secure authentication flows (local + Google OAuth) to dynamic form management and task creation — all persisted in a **MongoDB** database via Mongoose.

---

## ✨ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (ESModules) |
| **Framework** | Express v5 |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (httpOnly Cookies) + Google OAuth 2.0 |
| **Email** | Nodemailer + Resend |
| **Security** | bcrypt, CORS with credentials |
| **Dev Tool** | Nodemon |

---


### Prerequisites
- Node.js `v18+`
- A running MongoDB instance (local or Atlas)
- Google OAuth credentials (for Google login)
- SMTP credentials for email (Nodemailer / Resend)

### 1. Clone the repository

```bash
git clone https://github.com/MyTricks-code/sync-backend-api.git
cd sync-backend-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Server
PORT=8000
ORIGIN=http://localhost:5173

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# Resend (alternative email provider)
RESEND_API_KEY=your_resend_api_key
```

### 4. Run in development

```bash
npm run dev
```

The server will start on `http://localhost:8000`.

---

## 📡 API Reference

All routes are prefixed with `/api`.

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:-------------:|-------------|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login with email & password |
| `POST` | `/logout` | ❌ | Logout (clears cookie) |
| `POST` | `/verify-otp` | ✅ | Send email verification OTP |
| `POST` | `/verify-account` | ✅ | Verify account with OTP |
| `POST` | `/forget-password` | ❌ | Send forgot-password OTP |
| `POST` | `/verify-forget-otp` | ❌ | Verify OTP & reset password |
| `POST` | `/update-user-info` | ✅ | Update profile information |
| `POST` | `/google-auth` | ❌ | Sign in / Sign up via Google |
| `GET` | `/get-user-info` | ✅ | Fetch authenticated user's profile |

### 📋 Forms — `/api/forms`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:-------------:|-------------|
| `POST` | `/create-form` | ✅ | Create a new form |
| `GET` | `/get-user-forms` | ✅ | Fetch all forms created by user |
| `PUT` | `/edit-form` | ✅ | Edit an existing form |
| `DELETE` | `/delete-form` | ✅ | Delete a form |
| `GET` | `/get-public-forms` | ✅ | Get all public forms |
| `GET` | `/get-form/:formId` | ✅ | Get a specific form by ID |

### 📨 Responses — `/api/response`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:-------------:|-------------|
| Managed by `responseController` | | ✅ | Form response submission & retrieval |

### ✅ Tasks — `/api/task`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:-------------:|-------------|
| `POST` | `/create-task` | ✅ | Create a new task |

---

## 🧱 Project Structure

```
sync-backend/
├── config/
│   ├── mongoDB.js       # MongoDB connection setup
│   └── nodeMailer.js    # Nodemailer transporter config
├── controllers/
│   ├── userController.js    # Auth & user management logic
│   ├── googleAuth.js        # Google OAuth handler
│   ├── formController.js    # Form CRUD operations
│   ├── responseController.js# Form response handling
│   └── taskController.js    # Task creation logic
├── helpers/             # Utility functions (email senders, etc.)
├── middlewares/
│   └── userAuth.js      # JWT authentication middleware
├── models/
│   ├── userModel.js     # User schema (local + Google auth)
│   ├── formsModel.js    # Form schema
│   ├── responseModel.js # Response schema
│   └── taskModel.js     # Task schema
├── routes/
│   ├── authRoutes.js
│   ├── formRoutes.js
│   ├── responseRoutes.js
│   └── taskRoutes.js
├── index.js             # App entry point
└── package.json
```

---

## 🔑 Auth Flow

```
┌─────────────┐     Register/Login      ┌──────────────┐
│   Client    │ ──────────────────────► │  Express API │
│  (NEXUS FE) │ ◄─────────────────────  │              │
└─────────────┘   httpOnly JWT Cookie   └──────┬───────┘
                                               │
                    ┌──────────────────────────┼──────────┐
                    ▼                          ▼          ▼
              Email OTP              Google OAuth 2.0   MongoDB
              Verification           (google-auth-lib)
```

Tokens are stored as **httpOnly cookies** — never exposed to JavaScript — for maximum security.

---


> 🔗 **Explore the full NEXUS ecosystem:** [github.com/Jitesh-Yadav01/NEXUS](https://github.com/Jitesh-Yadav01/NEXUS)

---

<p align="center">
  <sub>© 2025–26 GDG AIT Pune Frontend Team · Built for AIT Pune's student community 🎓</sub>
</p>
