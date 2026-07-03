# Design Document: Password Reset

## Overview

This document describes the architecture and implementation plan for the Forgot Password / Reset Password feature in RevoGen. The feature follows the same patterns already established in the codebase: `crypto.randomBytes` for token generation, bcrypt for password hashing, MailService (Brevo) for email dispatch, and the Sora-font dark/light CSS pattern for frontend pages.

The flow is:

1. User visits `/forgot-password`, submits email
2. Backend generates a 64-char hex token, stores it with a 30-minute expiry on the User record, dispatches a reset email
3. User clicks the link in the email, lands on `/reset-password?token=<token>`
4. Frontend validates the token via `GET /auth/validate-reset-token` on page mount
5. User submits a new password; backend hashes it, updates the record, nulls the token fields

---

## Architecture

The feature touches three backend files and two new frontend pages. No new modules or services are introduced — everything plugs into existing NestJS modules.

```
Backend (NestJS / Prisma / PostgreSQL)
├── prisma/schema.prisma          — already has resetPasswordToken + resetPasswordExpires
├── src/auth/dto/
│   ├── forgot-password.dto.ts    — NEW
│   └── reset-password.dto.ts     — NEW
├── src/auth/auth.service.ts      — ADD: forgotPassword(), resetPassword(), validateResetToken()
├── src/auth/auth.controller.ts   — ADD: 3 routes
└── src/mail/mail.service.ts      — ADD: sendResetPasswordEmail()

Frontend (Next.js / TypeScript)
├── app/forgot-password/page.tsx  — NEW
├── app/reset-password/page.tsx   — NEW
└── app/login/page.tsx            — MODIFY: href on "Forgot password?" anchor
```

---

## Components

### 1. DTOs

**`ForgotPasswordDto`** (`src/auth/dto/forgot-password.dto.ts`)

```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

**`ResetPasswordDto`** (`src/auth/dto/reset-password.dto.ts`)

```typescript
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

---

### 2. AuthService — New Methods

#### `forgotPassword(dto: ForgotPasswordDto)`

```typescript
async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
  const GENERIC_MSG = 'If that email is registered, a reset link has been sent.';

  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

  if (!user) {
    return { success: true, message: GENERIC_MSG };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await this.prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires },
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  // Fire-and-forget — never let mail failure affect the response
  this.mailService
    .sendResetPasswordEmail(user.email, user.name, resetUrl)
    .catch((err) => this.logger.error(`Reset email failed for ${user.email}: ${err.message}`));

  return { success: true, message: GENERIC_MSG };
}
```

#### `validateResetToken(token: string)`

```typescript
async validateResetToken(token: string): Promise<{ valid: boolean }> {
  const user = await this.prisma.user.findFirst({
    where: { resetPasswordToken: token },
  });

  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
    return { valid: false };
  }

  return { valid: true };
}
```

#### `resetPassword(dto: ResetPasswordDto)`

```typescript
async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
  const user = await this.prisma.user.findFirst({
    where: { resetPasswordToken: dto.token },
  });

  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
    throw new BadRequestException('Invalid or expired reset token.');
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { success: true, message: 'Password reset successful.' };
}
```

---

### 3. AuthController — New Routes

```typescript
@Post('forgot-password')
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto);
}

@Get('validate-reset-token')
validateResetToken(@Query('token') token: string) {
  return this.authService.validateResetToken(token);
}

@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto);
}
```

All three routes require no `@UseGuards` — they are public endpoints.

---

### 4. MailService — `sendResetPasswordEmail`

Follows the same HTML style as `sendVerificationEmail`: blue `#2563eb` heading, inline-styled CTA button, fallback link.

```typescript
async sendResetPasswordEmail(email: string, name: string, resetUrl: string): Promise<void> {
  await this.sendEmail(
    email,
    'Reset Your RevoGen Password',
    `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:30px">
      <h1 style="color:#2563eb">RevoGen AI</h1>
      <p>Hello <b>${name}</b>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <br>
      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          background:#2563eb;
          color:white;
          text-decoration:none;
          padding:14px 28px;
          border-radius:8px;
          font-weight:bold;
        ">
        Reset Password
      </a>
      <br><br>
      <small>This link expires in <b>30 minutes</b>. If you did not request a password reset, you can safely ignore this email.</small>
      <br><br>
      If the button doesn't work, copy this link:
      <br><br>
      ${resetUrl}
      <hr>
      <p style="color:#666">Team RevoGen AI</p>
    </div>
    `,
  );
}
```

---

### 5. Frontend — ForgotPasswordPage

**Route:** `/forgot-password`  
**File:** `app/forgot-password/page.tsx`

Key behaviors:
- Sora font, `rg-root light` / `rg-root dark` CSS pattern matching login page
- Email input + submit button
- Client-side guard: empty email → inline error, no fetch
- `POST ${API_BASE_URL}/auth/forgot-password` with `{ email }`
- On any response (success or error): show success popup with generic message
- Popup auto-dismisses after 3 seconds, then redirects to `/login`
- Loading state: button disabled + spinner while in-flight
- Network/server error: show inline error message
- "Back to Login" link at the bottom

State shape:
```typescript
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [showPopup, setShowPopup] = useState(false);
const [dark, setDark] = useState(false);
```

---

### 6. Frontend — ResetPasswordPage

**Route:** `/reset-password`  
**File:** `app/reset-password/page.tsx`

Key behaviors:
- Reads `?token=` via `useSearchParams` inside a `<Suspense>` boundary (same pattern as verify-email page)
- On mount: if token absent → show invalid state immediately; if token present → call `GET /auth/validate-reset-token?token=<token>`
- If `{ valid: false }` or no token → render expired/invalid card with "Forgot Password?" button → `/forgot-password`
- If `{ valid: true }` → render password form with "New Password" + "Confirm Password" fields
- Client-side validation before submitting:
  - Passwords must match → inline error if not
  - Password must be ≥ 8 chars → inline error if not
- `POST ${API_BASE_URL}/auth/reset-password` with `{ token, password }`
- On success → replace form with success card ("✅ Password Changed"), auto-redirect to `/login` after 2 seconds
- On API error → display `data.message`
- Loading state: button disabled + spinner while in-flight
- Sora font, `rg-root light` / `rg-root dark` matching login page

State shape:
```typescript
type Stage = 'loading' | 'invalid' | 'form' | 'success';
const [stage, setStage] = useState<Stage>('loading');
const [password, setPassword] = useState('');
const [confirm, setConfirm] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [countdown, setCountdown] = useState(2);
const [dark, setDark] = useState(false);
```

---

### 7. LoginPage Modification

Single change in `app/login/page.tsx`:

```tsx
// Before
<a href="#" className="rg-forgot">Forgot password?</a>

// After
<a href="/forgot-password" className="rg-forgot">Forgot password?</a>
```

---

## Data Models

No schema changes required — the `resetPasswordToken` and `resetPasswordExpires` fields already exist in the Prisma schema as of the initial migration.

```prisma
model User {
  // ... existing fields ...
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
}
```

---

## Error Handling

| Scenario | Backend response | Frontend behavior |
|---|---|---|
| Email not in DB | HTTP 200, generic message | Success popup shown |
| Email in DB, mail fails | HTTP 200, generic message | Success popup shown; error logged server-side |
| Token not found | HTTP 200 `{ valid: false }` (validate) / HTTP 400 (reset) | Invalid state UI / error message |
| Token expired | HTTP 200 `{ valid: false }` (validate) / HTTP 400 (reset) | Invalid state UI / error message |
| Passwords don't match | — (client guard) | Inline error, no API call |
| Password < 8 chars | HTTP 400 via DTO validation | Inline error (or API error displayed) |
| Network error on submit | — | Inline error message displayed |

---

## Security Considerations

- **Enumeration prevention**: `forgotPassword` returns the same message and HTTP 200 regardless of whether the email exists, preventing user enumeration.
- **Token entropy**: 32 bytes from `crypto.randomBytes` = 256 bits of entropy (same as the existing email verification token).
- **Token expiry**: 30-minute window. Token is nulled immediately after a successful reset, preventing reuse.
- **No auth required**: All three new endpoints are public — no JWT guard needed, matching the pattern of `verify-email`.
- **bcrypt rounds**: 10 rounds, consistent with `register()`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Response indistinguishability for forgot-password

*For any* email string (whether registered or not), calling `forgotPassword()` SHALL return HTTP 200 with the message `"If that email is registered, a reset link has been sent."` — the response MUST be identical in both cases.

**Validates: Requirements 2.1, 2.6**

---

### Property 2: Reset token is a valid 64-character hex string

*For any* call to `forgotPassword()` that matches an existing user, the generated `resetPasswordToken` stored on the User record SHALL be a 64-character lowercase hexadecimal string (matching `/^[0-9a-f]{64}$/`).

**Validates: Requirements 2.2**

---

### Property 3: Reset token expiry is 30 minutes from generation time

*For any* call to `forgotPassword()` that generates a token, the `resetPasswordExpires` value stored on the User record SHALL be within a ±5-second window of `Date.now() + 30 * 60 * 1000`.

**Validates: Requirements 2.3**

---

### Property 4: Token persistence round-trip

*For any* user with a valid email, after calling `forgotPassword()` with that email, a subsequent `prisma.user.findFirst({ where: { resetPasswordToken: <token> } })` SHALL return that user — the token stored equals the token generated.

**Validates: Requirements 2.4**

---

### Property 5: Token validation returns correct validity for all token states

*For any* token string:
- If it matches a User record and `resetPasswordExpires > now` → `validateResetToken` SHALL return `{ valid: true }`
- If it matches no User record → SHALL return `{ valid: false }`
- If it matches a User record but `resetPasswordExpires <= now` → SHALL return `{ valid: false }`

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 6: Password reset hashing round-trip

*For any* new password string of 8 or more characters with a valid non-expired token, after calling `resetPassword()`, the stored password hash SHALL satisfy `bcrypt.compare(newPassword, storedHash) === true`.

**Validates: Requirements 5.4, 5.5**

---

### Property 7: Token nullification after successful reset

*For any* successful call to `resetPassword()`, the User record's `resetPasswordToken` and `resetPasswordExpires` SHALL both be `null` after the operation completes.

**Validates: Requirements 5.6**

---

### Property 8: Reset email contains required content

*For any* `(name, resetUrl)` pair passed to `sendResetPasswordEmail()`, the generated HTML email body SHALL contain the recipient's `name`, the exact `resetUrl` string, and the text `"30 minutes"`.

**Validates: Requirements 3.3, 3.4, 3.5**

---

### Property 9: Client-side password validation rejects mismatched or short passwords

*For any* pair of password strings where either the two values differ or either value has fewer than 8 characters, the ResetPasswordPage SHALL display an inline validation error and SHALL NOT call `POST /auth/reset-password`.

**Validates: Requirements 7.6, 7.7**
