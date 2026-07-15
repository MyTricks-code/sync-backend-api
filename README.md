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
| 🖥️ Frontend (NEXUS) | [sync-ait.vercel.app](https://sync-ait.vercel.app/) |
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

> **Note — Email/Password auth is intentionally disabled.**
> Applicants must sign in and register via Google OAuth only.
> The commented-out routes and controller functions are preserved in
> `routes/authRoutes.js` and `controllers/userController.js` and can be
> re-enabled by uncommenting them there.

| Method | Endpoint | Auth Required | Status | Description |
|--------|----------|:-------------:|:------:|-------------|
| ~~`POST`~~ | ~~`/register`~~ | ❌ | 🚫 Disabled | ~~Register a new user with email & password~~ |
| ~~`POST`~~ | ~~`/login`~~ | ❌ | 🚫 Disabled | ~~Login with email & password~~ |
| `POST` | `/logout` | ❌ | ✅ Active | Logout (clears cookie) |
| ~~`POST`~~ | ~~`/verify-otp`~~ | ✅ | 🚫 Disabled | ~~Send email verification OTP~~ |
| ~~`POST`~~ | ~~`/verify-account`~~ | ✅ | 🚫 Disabled | ~~Verify account with OTP~~ |
| ~~`POST`~~ | ~~`/forget-password`~~ | ❌ | 🚫 Disabled | ~~Send forgot-password OTP~~ |
| ~~`POST`~~ | ~~`/verify-forget-otp`~~ | ❌ | 🚫 Disabled | ~~Verify OTP & reset password~~ |
| `POST` | `/update-user-info` | ✅ | ✅ Active | Update profile information |
| `POST` | `/google-auth` | ❌ | ✅ Active | Sign in / Sign up via Google |
| `GET` | `/get-user-info` | ✅ | ✅ Active | Fetch authenticated user's profile |

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

## 🛰️ Event Scraping

The backend automatically pulls new posts from every AIT club's Instagram, figures out which ones announce an upcoming event, and emails those events to every registered user. It's a single job — `runScrapeJob()` in `jobs/scrape.job.js` — but it moves through several stages, uses Gemini as an intelligent filter, and has fallbacks at every step so a slow API or one bad post doesn't sink the whole run.

### When it runs

| Trigger | Path | Behavior |
|---|---|---|
| Scheduled cron | `POST /api/events/scrape` | Called by cron-job.org. Skips silently if a scrape ran less than a week ago. |
| Manual force | `POST /api/events/scrape/trigger` | Bypasses the weekly guard. Refetches the last 8 days of posts in the background. |
| Boot trigger | *(automatic)* | Fires once when Mongo connects on server start. |

The weekly guard reads the newest `ScrapeLog` document. If a scrape finished under 7 days ago and `force` isn't set, the job exits with a "skipped" message and never touches Apify or Gemini.

### The pipeline

Top to bottom, one stage at a time:

1. **Guard check** — Skip if last scrape was less than 7 days ago (unless `force`).
2. **Scrape from Apify** — Fires the `apify/instagram-post-scraper` Actor with all ~28 club handles in one call. Up to 10 posts per handle, filtered to posts newer than `sinceDate` (defaults to 8 days back), 120s timeout, 1024 MB memory. Runs synchronously — the job waits for the dataset before continuing.
3. **Normalise + filter** — Trim each raw post down to only what we need (`instagramId`, `caption`, `postUrl`, `clubHandle`, `postedAt`, `imageUrl`, `likesCount`). Anything with a caption shorter than 10 characters is dropped as noise.
4. **Save new posts** — Insert each into the `posts` collection, keyed on `instagramId`. Posts already in the DB are skipped. Genuinely new posts are collected into `newPosts[]`.
5. **Pick what to classify**
    - **Normal run:** send only the newly-saved posts to Gemini.
    - **Forced run:** send every normalised post that doesn't yet have an `Event` row (so posts scraped before but never successfully classified get another shot).
    - If the list is empty, Gemini is skipped entirely.
6. **Classify + save events** — Send the list through `classifyPostBatch()` (see next section). Each returned event is upserted into the `events` collection by `instagramId`. The post's caption becomes the event `description`, and its `clubHandle` is resolved to an `Organization` document via `findOrg()`. Events that are truly new (upserted, not modified) are collected for emailing.
7. **Send emails** — For each new event, ask Gemini to write a subject line + HTML body + plain-text version, then blast it to every user. `Promise.allSettled` collects the results so a single failed send doesn't block the rest.
8. **Write scrape log** — Persist a `ScrapeLog` with counts + duration. Logs auto-expire after 1 week via a Mongo TTL index.

### How the classifier handles queues, retries, and fallbacks

`classifyPostBatch()` in `helpers/classifyService.js` is where most of the complexity lives. It has to stay under Gemini's rate limits, gracefully hop between models when daily quotas run out, and never let one bad chunk take down a whole batch.

**Startup safety.** If `GEMINI_API_KEY` is missing from the environment, the module refuses to load. This is deliberate — without an API key the SDK silently falls back to Google's default credentials, which then fails with a confusing `"Could not load the default credentials"` error at request time.

**Chunking.** Posts are split into groups of 8. Each group is one Gemini API call. Small chunks mean a small blast radius when something fails.

**Bounded concurrency (2 in-flight).** At most 2 chunks talk to Gemini at the same time. The two workers start 1.5s apart so the very first calls don't hit the API in the exact same millisecond.

**Adaptive spacing.** Between chunks, a worker sleeps `4s × delayMultiplier`. The multiplier starts at `1` and moves on its own:
- shrinks 10% after each success (`× 0.9`, floor `1`) — go faster when Gemini is happy
- grows 50% after each failure (`× 1.5`, cap `4`) — back off when it's angry

**Model chain.** For every chunk, three models are tried in order, falling through on quota or repeated failure:

1. `gemini-2.5-flash` — primary, best quality
2. `gemini-2.5-flash-lite` — faster, lighter, separate quota pool
3. `gemini-2.0-flash-lite` — older, yet another quota pool

**Per-model retries (up to 3 attempts).** Retryable errors:
- **429 rate limit** — reads the server's `Retry-Info` hint (e.g. "wait 5s") and tries again.
- **503 overload** — exponential backoff: 5s → 10s → 20s, capped at 30s.
- **Timeout (45s)** — every request is wrapped in a timeout; a hang is treated like a 503.

Anything else (400, 401, malformed request) throws immediately and the chunk is abandoned with `[]`.

**Daily-quota is special.** A 429 with a `perDay` quota violation won't clear by waiting. When that happens:
- The offending model is added to an `exhaustedModels` set scoped to this batch.
- The current chunk falls through to the next model in the chain.
- **Every later chunk in the batch skips that model too** — no point in re-hitting a dead model just to receive the same rejection.

**Total-exhaustion short-circuit.** If a chunk runs out of models *and* the exhaustion set already covers the whole chain, the batch flips `dailyQuotaHit = true`. Every remaining chunk sees the flag on entry and returns `[]` immediately — no wasted API calls once we're sure the day is done.

**Parsing the response.** Gemini is asked for raw JSON via `responseMimeType: "application/json"`. On top of that:
- Markdown fences (```` ```json ... ``` ````) are stripped defensively.
- If the model leaks prose around the JSON, the parser falls back to the substring from the first `[` to the last `]`.
- On a parse failure, the API call is retried up to the retry limit before the chunk is abandoned.
- If the response body comes back empty, the model's `finishReason` (e.g. `SAFETY`, `MAX_TOKENS`, `RECITATION`) is logged so you can tell *why* nothing came back.

**Validation + dedupe.** Every classified item is:
- Date-coerced to `YYYY-MM-DD` (accepts a few common formats).
- Rejected if `instagramId` is missing, the date is malformed, or the date doesn't resolve to a real calendar day.
- Deduplicated by `instagramId` within the chunk, and once more across chunks when the batch finishes.

**What the caller sees.** Even if half the chunks fail, the caller still gets whatever succeeded. A bad chunk returns `[]` — errors are logged but never propagated up.

### Fallbacks in the email step

`generateEventEmail()` also calls Gemini (this time `gemini-2.0-flash`) to write a per-event subject, HTML body, and plain-text version. If Gemini fails, throws, or returns malformed JSON, a hardcoded HTML template ships instead so recipients still get a usable email. Individual per-user delivery failures are captured by `Promise.allSettled` and don't block the rest of the recipient list.

---


> 🔗 **Explore the full NEXUS ecosystem:** [github.com/Jitesh-Yadav01/NEXUS](https://github.com/Jitesh-Yadav01/NEXUS)

---

<p align="center">
  <sub>© 2025–26 GDG AIT Pune Frontend Team · Built for AIT Pune's student community 🎓</sub>
</p>
