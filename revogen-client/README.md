# revogen-client

The Revogen web app — Next.js 16 (App Router), React 19, TypeScript.

See the [main README](../README.md) for the full overview, architecture and setup.

## Quick start

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
npm run dev -- -p 3001
```

Open http://localhost:3001 (the API must be running on port 3000).

## Where things live

| Path | What |
|---|---|
| `app/page.tsx`, `app/(marketing)/` | Landing and marketing pages |
| `app/login`, `app/register`, … | Auth pages (`components/auth/`) |
| `app/dashboard`, `practice`, `my-results`, `resumes`, `assigned-tests` | Candidate area (`components/candidate/`) |
| `app/candidate/tests/[attemptId]/{basic,pro}` | Coding exam (`components/coding-test/`) |
| `app/tests/` | MCQ exam and thank-you page |
| `app/admin/`, `app/pro-admin/` | Recruiter and super-admin areas |
| `lib/auth.ts` | Session cookie helpers (`getToken`, `setSession`, `clearSession`) |
