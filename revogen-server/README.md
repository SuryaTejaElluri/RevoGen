# revogen-server

The Revogen API — NestJS 11, Prisma, PostgreSQL.

See the [main README](../README.md) for the full overview, architecture, environment variables and setup.

## Quick start

```bash
npm install
# create .env (see the main README for the variables)
npx prisma generate
npx prisma migrate deploy   # applies existing migrations only
npm run start:dev           # http://localhost:3000
```

> [!CAUTION]
> The database may hold real data. **Never** run `prisma migrate reset`, `prisma migrate dev`, or `prisma db push --force-reset` / `--accept-data-loss` against it — they can wipe everything.

## Tests

```bash
npm test
```

Unit tests use in-memory fakes of Prisma and Judge0, so they never touch a database. Some of Nest's generated `*.spec.ts` placeholders currently fail because they don't provide `PrismaService`; the feature specs (`analysis`, `coding-tests`, `coding-attempts`) pass.

## Modules

| Module | What |
|---|---|
| `auth`, `users` | Registration, email verification, JWT login |
| `analysis`, `resumes` | Resume text extraction and 20-role ATS scoring |
| `coding-tests`, `coding-attempts`, `coding-submissions`, `judge0` | Coding tests, invitations, attempts, sandboxed execution |
| `tests`, `question-bank` | MCQ tests |
| `credits`, `dashboard`, `mail`, `cloudinary` | Revo Credits, dashboard stats, email, file storage |
| `super-admin` | Super admin API: users, roles, credits, MCQ and coding banks, overview |
| `common` | Shared helpers (roles, validation, wallets, invitation linking, attempt guards) |
