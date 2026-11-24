<div align="center">

<img src="revogen-client/public/revogen-icon.svg" alt="Revogen logo" width="88" height="88" />

# Revogen

**Technical hiring, on evidence.**

Resume screening, MCQ rounds and proctored coding tests in one place —
so recruiters shortlist on real work, and candidates get a fair shot.

[**Live site**](https://revo-gen.vercel.app) ·
[Features](#-features) ·
[How it works](#-how-it-works) ·
[Tech stack](#-tech-stack) ·
[Run it locally](#-run-it-locally)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)

</div>

---

## ✨ Why Revogen

Most technical hiring is a patchwork: a job board, a Google Form for MCQs, a separate coding site, and a spreadsheet to track it all — with no record of what happened while the candidate was taking the test.

Revogen puts the whole loop in one app:

| | |
|---|---|
| 📄 **Screen** | Upload a resume, pick one of 20 roles, and see which skills match and which are missing. |
| 🧪 **Assess** | Send an MCQ round, a coding test, or both — invites go out by email. |
| 🛡️ **Proctor** | Fullscreen, tab and copy/paste monitoring on every test; camera, screen share and face checks on Pro. |
| 📊 **Decide** | Every attempt comes back with a score, the submitted code, and a timestamped integrity report. |

---

## 🚀 Features

### For recruiters

- **Coding tests** — build tests from a question bank (arrays to DP, easy to hard). Code runs in a sandbox (Judge0) in **C, C++, Java, Python and JavaScript**, against visible and **hidden** test cases.
- **Flexible output checks** per problem: exact match, ignore order, set compare, or floating-point tolerance — so correct answers aren't failed over formatting.
- **MCQ rounds** — tests split into modules, built from your own MCQ bank.
- **Invite by email** — candidates who don't have an account yet get a *pending* invite that attaches to them automatically when they sign up.
- **Two proctoring levels**

  | Check | Basic | Pro |
  |---|:---:|:---:|
  | Fullscreen required, exits logged | ✅ | ✅ |
  | Tab switches and focus loss logged | ✅ | ✅ |
  | Right-click, copy and paste blocked | ✅ | ✅ |
  | Auto-submit at 5 warnings or when time runs out | ✅ | ✅ |
  | Camera + microphone required | — | ✅ |
  | Entire-screen share required | — | ✅ |
  | Face detection (no face / more than one face) | — | ✅ |
  | Evidence screenshots on flagged events | — | ✅ |

- **Results and reports** — per-candidate score, code per question, risk score and integrity timeline.
- **Revo Credits** — pay per assessment; re-inviting the same candidate never charges twice.

### For candidates

- **Bento dashboard** with the next test, ATS score, results and practice at a glance — light and dark mode.
- **Resume ATS check** against **20 industry roles** (or a pasted job description): must-have skills count 70%, nice-to-haves 30%, with specific tips on what to add.
- **Practice tests** and a results history with a score trend.
- **A focused test workspace** — pre-start checklist, question tabs, problem/editor split, run against examples, submit for a score, and nothing lost: unsubmitted code is submitted for you when you finish.

---

## 🔄 How it works

```mermaid
flowchart LR
    R([Recruiter]) -->|creates test, invites by email| T[Coding / MCQ test]
    T -->|email invite| C([Candidate])
    C -->|signs up — pending invite attaches| W[Test workspace]
    W -->|run / submit code| J[(Judge0 sandbox)]
    W -->|proctoring events + screenshots| P[(Integrity log)]
    W -->|final submit| S[Score + code + report]
    S --> R
```

```mermaid
flowchart TB
    subgraph Client ["revogen-client · Next.js 16 (Vercel)"]
      L[Landing + marketing] --- A[Auth pages]
      A --- CA[Candidate area]
      A --- RA[Recruiter area]
      CA --- EX[Exam workspace<br/>Monaco · MediaPipe]
    end
    subgraph Server ["revogen-server · NestJS 11 (Render)"]
      API[REST API + JWT] --- AN[Resume analysis<br/>skill dictionary · 20 roles]
      API --- CT[Tests · attempts · credits]
    end
    Client -->|HTTPS| API
    API --> DB[(PostgreSQL · Neon<br/>via Prisma)]
    API --> J0[(Judge0)]
    API --> CL[(Cloudinary<br/>resumes · screenshots)]
    API --> M[(Brevo email)]
```

---

## 🧰 Tech stack

| Layer | Tools |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Exam workspace** | Monaco editor, MediaPipe face detection, Screen Capture + Media APIs |
| **Backend** | NestJS 11, Passport JWT, class-validator |
| **Database** | PostgreSQL on Neon, Prisma ORM |
| **Code execution** | Judge0 (via RapidAPI) |
| **Files & email** | Cloudinary (resumes, proctoring screenshots), Brevo (transactional email) |
| **Hosting** | Vercel (client), Render (API) |

---

## 📁 Project structure

```text
RevoGen/
├── revogen-client/                 # Next.js app
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── (marketing)/            # Features, solutions, assessments, resume AI, about, contact
│   │   ├── login/ register/ …      # Auth (login, sign-up, verify, reset)
│   │   ├── dashboard/ practice/ my-results/ resumes/ assigned-tests/   # Candidate area
│   │   ├── candidate/tests/[attemptId]/{basic,pro}/                    # Coding exam
│   │   ├── tests/                  # MCQ exam + thank-you page
│   │   ├── admin/                  # Recruiter area
│   │   └── pro-admin/              # Super-admin
│   ├── components/
│   │   ├── site/                   # Marketing shell (nav, footer, theme)
│   │   ├── auth/                   # Login / register shell
│   │   ├── candidate/              # Bento theme + footer
│   │   └── coding-test/            # Shared exam workspace + proctoring
│   └── lib/                        # API base URL, session helpers
│
└── revogen-server/                 # NestJS API
    ├── prisma/                     # Schema, migrations, seed scripts
    └── src/
        ├── auth/ users/            # JWT auth, accounts
        ├── analysis/ resumes/      # Resume parsing, 20-role ATS scoring
        ├── coding-tests/ coding-attempts/ coding-submissions/ judge0/
        ├── tests/ question-bank/   # MCQ tests
        ├── credits/ dashboard/ mail/ cloudinary/
        └── common/                 # Shared helpers (invitations, attempt guards)
```

---

## 💻 Run it locally

### Prerequisites

- **Node.js 20+** and npm
- A **PostgreSQL** database (Neon or local)
- Accounts for **Judge0 on RapidAPI**, **Cloudinary** and **Brevo** (only needed for code execution, uploads and email)

### 1 · API (`revogen-server`)

```bash
cd revogen-server
npm install
```

Create `revogen-server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=a-long-random-string
CLIENT_URL=http://localhost:3001

RAPIDAPI_KEY=your-judge0-rapidapi-key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

BREVO_API_KEY=...
```

Apply the schema and start the API (port **3000**):

```bash
npx prisma generate
npx prisma migrate deploy   # applies existing migrations only
npm run start:dev
```

> [!CAUTION]
> **Never** run `prisma migrate reset`, `prisma migrate dev` or `prisma db push --force-reset` / `--accept-data-loss` against a database with real data — they can **wipe it**. Use `migrate deploy` for existing migrations, and review any new migration SQL before applying it.

### 2 · Web app (`revogen-client`)

```bash
cd revogen-client
npm install
```

Create `revogen-client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Start it on port **3001** (the API's CORS allows this origin):

```bash
npm run dev -- -p 3001
```

Open **http://localhost:3001**.

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| server | `npm run start:dev` | API with hot reload |
| server | `npm test` | Unit tests (in-memory fakes — no database needed) |
| server | `npm run build` | Production build (`dist/`) |
| server | `npm run seed:questions` | Seed the question bank |
| client | `npm run dev` | Next.js dev server |
| client | `npm run build` | Production build |
| client | `npm run lint` | ESLint |

---

## 🔒 Security notes

- Sessions use a JWT (7-day expiry) stored in a session cookie: refreshing keeps you signed in, closing the browser signs you out, and expired tokens are cleared automatically.
- Hidden test cases never leave the server; candidates only see pass/fail for them.
- Every candidate action on a test checks ownership, status and the time limit on the server — the client timer is for display only.
- Recruiters can only read results, submissions and reports for tests they created.

Found a security issue? Please report it privately to the maintainers rather than opening a public issue.

---

## 🗺️ Roadmap

- [ ] Restyle the recruiter area to match the new design
- [ ] Evidence-weighted ATS score (skills used in experience vs. only listed)
- [ ] Refund credits for invitations removed before the candidate starts
- [ ] Email notifications when results are released
- [ ] CI that runs tests, lint and build before every deploy

---

<div align="center">

Built in **Hyderabad** 🇮🇳 · © Revogen. All rights reserved.

</div>
