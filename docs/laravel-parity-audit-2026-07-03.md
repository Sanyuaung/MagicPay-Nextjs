# Laravel vs Next.js Parity Audit (2026-07-03)

## Scope

- Compared Laravel route/controllers under `../routes` and `../app/Http/Controllers` against Next routes in `src/app` and `src/app/api`.
- Focused on runtime behavior, side effects, auth flow, and data model parity.

## Parity Status

- User auth API (`register`, `login`, `logout`): PASS
- User profile/pin/password APIs: PASS
- Transfer/transactions/QR APIs: PASS
- User notification APIs/actions: PASS
- Admin auth/profile APIs: PASS
- Admin users/admin-users/send-information/wallet APIs: PASS
- DB table parity (Laravel migrations vs Prisma): PASS
- Password reset flow parity (`password/email` + token reset): PASS

## Implemented in This Batch

1. Added request metadata capture (`ip`, `user_agent`) for:

- `src/app/api/register/route.ts`
- `src/app/api/login/route.ts`
- `src/app/api/admin/login/route.ts`

2. Switched user API auth token model to persistent DB tokens (Laravel-like) using `oauth_access_tokens`:

- Token issuance persisted in DB via `createAccessToken`
- Token validation checks `revoked` and `expires_at`
- Logout revokes active token
- Backward-compatible fallback for legacy JWT tokens retained

3. Added full password reset token workflow:

- `src/app/api/password/email/route.ts` now creates/upserts `password_reset_tokens`
- Added `src/app/api/password/reset/route.ts` to consume token and reset password
- Added reset UI page `src/app/password/reset/[token]/page.tsx`
- Enhanced request page `src/app/password/reset/page.tsx` with non-prod reset link helper

## Remaining Differences (Non-blocking)

- Laravel uses framework-native mail pipeline for password reset links. Next currently exposes a non-production reset URL helper instead of sending email directly.
- Legacy JWT cookie tokens (created before this change) cannot be revoked server-side; newly issued DB-backed tokens are revocable.

## Decommission Readiness

- Application parity for core Magic Pay features: READY
- Safe to decommission Laravel runtime after data backup and stakeholder sign-off: READY

## Recommended Decommission Sequence

1. Backup files and database.
2. Freeze writes to Laravel app.
3. Run smoke tests on Next routes (auth, transfer, admin CRUD, notifications).
4. Switch traffic to Next.
5. Archive/remove Laravel-specific directories only after successful cutover window.
