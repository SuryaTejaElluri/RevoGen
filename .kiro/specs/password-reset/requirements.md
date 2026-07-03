# Requirements Document

## Introduction

This document specifies requirements for the Forgot Password / Reset Password feature in RevoGen. The feature allows both USER and ADMIN account holders to recover access to their accounts by requesting a password reset via email. The flow involves requesting a reset link, receiving a time-limited email, visiting the reset page, and submitting a new password. The feature reuses the existing MailService (Brevo API), AuthService, User model, and frontend UI style (Sora font, dark/light mode) already established in the application.

## Glossary

- **AuthService**: The NestJS service at `src/auth/auth.service.ts` responsible for authentication logic including registration, login, email verification, and password reset.
- **MailService**: The NestJS service at `src/mail/mail.service.ts` responsible for sending transactional emails via the Brevo API.
- **ResetToken**: A 32-byte cryptographically random hex string (64 hex characters) generated via `crypto.randomBytes(32).toString('hex')`, stored as plain text in the `User.resetPasswordToken` field.
- **ResetExpiry**: A `DateTime` value set to 30 minutes after token generation, stored in `User.resetPasswordExpires`.
- **ForgotPasswordDto**: The NestJS DTO containing a single validated email field for the `POST /auth/forgot-password` endpoint.
- **ResetPasswordDto**: The NestJS DTO containing `token` (string) and `password` (string, minimum 8 characters) fields for the `POST /auth/reset-password` endpoint.
- **ForgotPasswordPage**: The Next.js page at `app/forgot-password/page.tsx` where a user submits their email to request a reset link.
- **ResetPasswordPage**: The Next.js page at `app/reset-password/page.tsx` where a user submits a new password using the token from the URL query parameter.
- **LoginPage**: The existing Next.js page at `app/login/page.tsx`.
- **CLIENT_URL**: The environment variable holding the base URL of the frontend application (e.g., `https://revogen.com`).
- **BREVO_API_KEY**: The environment variable holding the Brevo transactional email API key.

---

## Requirements

### Requirement 1: Database Schema Extension

**User Story:** As a developer, I want the User model to store password reset token data, so that reset requests can be validated server-side.

#### Acceptance Criteria

1. THE User model SHALL include an optional `resetPasswordToken` field of type `String?`.
2. THE User model SHALL include an optional `resetPasswordExpires` field of type `DateTime?`.
3. THE User model SHALL retain all existing fields, including `verificationToken` and `verificationTokenExpires`, without modification.

---

### Requirement 2: Forgot Password Endpoint

**User Story:** As a registered user, I want to request a password reset link via my email address, so that I can regain access to my account without revealing whether the email exists in the system.

#### Acceptance Criteria

1. WHEN a `POST /auth/forgot-password` request is received with a valid email format, THE AuthService SHALL respond with HTTP 200 and the message `"If that email is registered, a reset link has been sent."` regardless of whether the email exists in the database.
2. WHEN a `POST /auth/forgot-password` request is received and the email matches a User record, THE AuthService SHALL generate a ResetToken using `crypto.randomBytes(32).toString('hex')`.
3. WHEN a ResetToken is generated, THE AuthService SHALL set `resetPasswordExpires` to exactly 30 minutes from the current server time.
4. WHEN a ResetToken is generated, THE AuthService SHALL persist the `resetPasswordToken` and `resetPasswordExpires` values to the matching User record.
5. WHEN a ResetToken is persisted, THE MailService SHALL send a reset password email to the user's address containing a reset URL in the format `${CLIENT_URL}/reset-password?token={resetToken}`.
6. WHEN a `POST /auth/forgot-password` request is received and the email does not match any User record, THE AuthService SHALL respond with HTTP 200 and the message `"If that email is registered, a reset link has been sent."` without sending any email or revealing email absence.
7. WHEN the reset email dispatch fails, THE AuthService SHALL log the error and still return HTTP 200 to the caller.
8. THE `POST /auth/forgot-password` endpoint SHALL accept requests from both USER and ADMIN role accounts.

---

### Requirement 3: Reset Password Email

**User Story:** As a user who requested a reset, I want to receive a well-formatted email containing a reset link, so that I can navigate to the reset page easily.

#### Acceptance Criteria

1. THE MailService SHALL expose a `sendResetPasswordEmail(email: string, name: string, resetUrl: string)` method.
2. WHEN `sendResetPasswordEmail` is called, THE MailService SHALL send an email using the existing `sendEmail()` private method and the Brevo API.
3. WHEN the reset email is sent, THE MailService SHALL address the recipient by name in the email body.
4. WHEN the reset email is sent, THE MailService SHALL include the `resetUrl` as a clickable link in the email body.
5. WHEN the reset email is sent, THE MailService SHALL state that the link expires in 30 minutes.
6. WHEN the reset email is sent, THE MailService SHALL use the sender name `RevoGen AI` and the configured sender email address.

---

### Requirement 4: Validate Reset Token Endpoint

**User Story:** As a frontend page, I want to validate a reset token before showing the password form, so that expired or invalid tokens are detected immediately on page load.

#### Acceptance Criteria

1. WHEN a `GET /auth/validate-reset-token?token={value}` request is received, THE AuthService SHALL look up the User whose `resetPasswordToken` matches the provided `token` value.
2. WHEN a matching User is found and `resetPasswordExpires` is in the future, THE AuthService SHALL respond with HTTP 200 and the body `{ "valid": true }`.
3. WHEN no matching User is found, THE AuthService SHALL respond with HTTP 200 and the body `{ "valid": false }`.
4. WHEN a matching User is found and `resetPasswordExpires` is in the past or equal to the current time, THE AuthService SHALL respond with HTTP 200 and the body `{ "valid": false }`.
5. THE `GET /auth/validate-reset-token` endpoint SHALL be accessible without authentication.

---

### Requirement 5: Reset Password Endpoint

**User Story:** As a user with a valid reset token, I want to submit a new password, so that my account password is updated and the reset token is invalidated.

#### Acceptance Criteria

1. WHEN a `POST /auth/reset-password` request is received with a `token` and `password`, THE AuthService SHALL look up the User whose `resetPasswordToken` matches the provided `token`.
2. WHEN no matching User is found, THE AuthService SHALL respond with HTTP 400 and the message `"Invalid or expired reset token."`.
3. WHEN a matching User is found and `resetPasswordExpires` is in the past or equal to the current time, THE AuthService SHALL respond with HTTP 400 and the message `"Invalid or expired reset token."`.
4. WHEN a matching User is found and the token has not expired, THE AuthService SHALL hash the new password using bcrypt with 10 salt rounds.
5. WHEN the new password is hashed, THE AuthService SHALL update the User record with the new hashed password.
6. WHEN the User record is updated with the new password, THE AuthService SHALL set `resetPasswordToken` to `null` and `resetPasswordExpires` to `null` on the same User record.
7. WHEN all updates succeed, THE AuthService SHALL respond with HTTP 200 and the message `"Password reset successful."`.
8. THE `ResetPasswordDto` SHALL require `password` to be a string with a minimum length of 8 characters.
9. THE `ResetPasswordDto` SHALL require `token` to be a non-empty string.

---

### Requirement 6: Forgot Password Page

**User Story:** As a user who has forgotten their password, I want a dedicated page where I can enter my email to request a reset link, so that the process is clear and accessible.

#### Acceptance Criteria

1. THE ForgotPasswordPage SHALL be accessible at the route `/forgot-password`.
2. THE ForgotPasswordPage SHALL render using the Sora font and support dark and light mode using the same CSS class pattern (`rg-root light` / `rg-root dark`) as the LoginPage.
3. THE ForgotPasswordPage SHALL include an email input field and a submit button.
4. WHEN the submit button is clicked and the email field is empty, THE ForgotPasswordPage SHALL display an inline validation error without making an API call.
5. WHEN the submit button is clicked with a non-empty email value, THE ForgotPasswordPage SHALL call `POST /auth/forgot-password` with the entered email.
6. WHEN the API response is received, THE ForgotPasswordPage SHALL display a success popup message regardless of whether the email exists.
7. WHEN the success popup is displayed, THE ForgotPasswordPage SHALL redirect the user to `/login` after the popup is dismissed or after a 3-second auto-dismiss timer.
8. THE ForgotPasswordPage SHALL include a "Back to Login" link that navigates to `/login`.
9. WHILE a request is in progress, THE ForgotPasswordPage SHALL disable the submit button and display a loading indicator.
10. IF the API call fails due to a network or server error, THEN THE ForgotPasswordPage SHALL display an error message to the user.

---

### Requirement 7: Reset Password Page

**User Story:** As a user who clicked a reset link in their email, I want a page where I can enter and confirm a new password, so that I can securely update my credentials.

#### Acceptance Criteria

1. THE ResetPasswordPage SHALL be accessible at the route `/reset-password`.
2. WHEN the ResetPasswordPage loads, THE ResetPasswordPage SHALL read the `token` query parameter from the URL.
3. WHEN the `token` query parameter is present on load, THE ResetPasswordPage SHALL call `GET /auth/validate-reset-token?token={token}` before rendering the password form.
4. WHEN the validate endpoint returns `{ "valid": false }` or the `token` query parameter is absent, THE ResetPasswordPage SHALL display an expired/invalid token state with a visible "Forgot Password?" button that links to `/forgot-password`.
5. WHEN the validate endpoint returns `{ "valid": true }`, THE ResetPasswordPage SHALL display a form with a "New Password" input and a "Confirm Password" input.
6. WHEN the form is submitted and the "New Password" value does not match the "Confirm Password" value, THE ResetPasswordPage SHALL display an inline error message and SHALL NOT call `POST /auth/reset-password`.
7. WHEN the form is submitted and the "New Password" value is fewer than 8 characters, THE ResetPasswordPage SHALL display an inline error message and SHALL NOT call `POST /auth/reset-password`.
8. WHEN the form is submitted with matching passwords of 8 or more characters, THE ResetPasswordPage SHALL call `POST /auth/reset-password` with the `token` and the new password.
9. WHEN `POST /auth/reset-password` returns a success response, THE ResetPasswordPage SHALL replace the form with a success card displaying a "✅ Password Changed" message.
10. WHEN the success card is displayed, THE ResetPasswordPage SHALL automatically redirect the user to `/login` after 2 seconds.
11. IF `POST /auth/reset-password` returns an error response, THEN THE ResetPasswordPage SHALL display the error message returned by the API.
12. WHILE a request is in progress, THE ResetPasswordPage SHALL disable the submit button and display a loading indicator.
13. THE ResetPasswordPage SHALL render using the Sora font and support dark and light mode matching the LoginPage style.

---

### Requirement 8: Login Page Integration

**User Story:** As a user on the login page, I want the "Forgot password?" link to navigate to the forgot password page, so that the recovery flow is discoverable.

#### Acceptance Criteria

1. THE LoginPage SHALL set the `href` attribute of the "Forgot password?" anchor element to `/forgot-password`.
2. THE LoginPage SHALL retain all existing layout, styles, and functionality when the href is updated.
