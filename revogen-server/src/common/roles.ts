import { ValidationPipe } from '@nestjs/common';

/**
 * Account roles. `role` is a plain string column, so these are the only values
 * the app ever writes. "Candidate" and "Recruiter" are the names shown in the UI.
 */
export const ROLES = {
  CANDIDATE: 'USER',
  RECRUITER: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  /** Blocked from signing in; a super admin picks the role again on reactivation. */
  SUSPENDED: 'SUSPENDED',
} as const;

/** Roles a person may choose when signing up. */
export const SELF_SIGNUP_ROLES: string[] = [ROLES.CANDIDATE, ROLES.RECRUITER];

/** Roles a super admin may assign. */
export const ASSIGNABLE_ROLES: string[] = [ROLES.CANDIDATE, ROLES.RECRUITER, ROLES.SUPER_ADMIN];

export const ROLE_LABEL: Record<string, string> = {
  USER: 'Candidate',
  ADMIN: 'Recruiter',
  SUPER_ADMIN: 'Super admin',
  SUSPENDED: 'Suspended',
};

/**
 * Strict request-body validation for one route or controller: runs the DTO's
 * class-validator rules, drops nothing silently (unknown fields are an error),
 * and converts to the DTO class. Applied per route because several older DTOs
 * have no decorators and a global pipe would reject them.
 */
export const strictBody = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

/** Like strictBody, for query strings: unknown params are ignored, numbers are converted. */
export const queryParams = () =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
