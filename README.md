# MagicPay Next.js

MagicPay Next.js is a modern wallet/payment platform with:

- User app flows (register, login, wallet, QR scan/pay, transfer, notifications)
- Admin panel flows (admin auth, users, wallets, wallet requests, send information)
- Laravel parity-focused API behavior for migration-safe rollout

## Quick View

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149ECA)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791)
![Status](https://img.shields.io/badge/Laravel%20Parity-PASS-success)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (request validation)
- bcryptjs + JWT + DB-backed access tokens

## Main Features

### User Features

- Register / login / logout
- Profile update
- Password update and reset flow
- PIN setup and update
- Wallet balance view
- Transfer confirm and transfer complete flow
- QR receive + scan and pay flow
- Transaction history and detail view
- Notification list, mark read/unread, delete

### Admin Features

- Admin login and profile management
- Admin users CRUD
- Admin wallets CRUD
- Add/reduce wallet amount
- Admin wallet top-up request flow (approve/reject)
- Send information (title, message, image, status, type)

### Platform Features

- Laravel parity aligned API response style
- Seed scripts for parity and admin bootstrap
- Risk thresholds helper for admin wallet request analytics

## Core Functional Areas

| Area         | What It Does                                                                |
| ------------ | --------------------------------------------------------------------------- |
| Auth         | Handles user/admin auth, token issue/verify/revoke, cookie/Bearer support   |
| Wallet       | Reads balances, updates amounts, creates wallets when needed                |
| Transfer     | Validates transfer data, checks PIN and balance, runs atomic DB transaction |
| QR           | Decrypts QR payload and verifies secret before resolving recipient          |
| Notification | Creates transaction notifications and supports paging/filtering             |
| Admin Ops    | Manages admin users, wallets, and wallet request approvals                  |
| Validation   | Uses Zod schemas in API routes for input safety                             |

## Security Design

- Password/PIN hashing: Uses `bcrypt` hashing for password and PIN checks.
- Token security: Uses database-backed access tokens (`oauth_access_tokens`) with revoke/expiry checks.
- Role safety: Admin routes validate admin identity and role.
- Input validation: Uses Zod schemas across user and admin APIs.
- Transaction safety: Money transfer uses database transaction for debit/credit consistency.
- Request tracing: Stores request metadata (`ip`, `user_agent`) in auth-related flows.
- QR protection: Validates QR secret key before payment receiver resolution.
- Standard errors: Uses structured success/error JSON helpers for consistent client handling.

## API Response Shape

Most routes return Laravel-style response format:

```json
{
  "result": 1,
  "type": "success",
  "message": "...",
  "data": {}
}
```

Error example:

```json
{
  "result": 0,
  "type": "error",
  "message": "Validation failed.",
  "error": {}
}
```

## Requirements

- Node.js 20+
- npm
- PostgreSQL database

## Environment Variables

Copy `.env.example` to `.env` and configure at least:

| Variable                            | Purpose                                           |
| ----------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                      | PostgreSQL connection string for Prisma           |
| `JWT_SECRET`                        | Secret used for JWT signing/verification          |
| `SECRET_KEY`                        | QR payload secret validation key                  |
| `APP_URL`                           | Base URL used in generated notification web links |
| `APP_NAME` / `NEXT_PUBLIC_APP_NAME` | App display/issuer name                           |

## Setup (Local Development)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file:
   - Copy `.env.example` to `.env`
   - Fill all required values

3. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Push schema to your database:

   ```bash
   npm run prisma:push
   ```

5. (Optional) Seed data:

   ```bash
   npm run seed:laravel
   npm run seed:admin
   ```

6. Start development server:

   ```bash
   npm run dev
   ```

7. Open app:
   - http://localhost:3000

## Sample Login Accounts

Use these test accounts after running seed scripts:

| Account Type | Login Page     | Username                      | Password   | Seed Source            |
| ------------ | -------------- | ----------------------------- | ---------- | ---------------------- |
| Normal User  | `/login`       | Phone: `09788677455`          | `password` | `npm run seed:laravel` |
| Admin User   | `/admin/login` | Email: `admin@gmail.com`      | `password` | `npm run seed:laravel` |
| Super Admin  | `/admin/login` | Email: `admin@magicpay.local` | `Admin123` | `npm run seed:admin`   |

Important:

- Normal user login uses phone + password.
- Admin/super admin login uses email + password.
- If you run both seeders, run `npm run seed:laravel` first and `npm run seed:admin` after it so the super admin account is available.

### Related Pages

| Page            | URL               | Notes                                                    |
| --------------- | ----------------- | -------------------------------------------------------- |
| User Login      | `/login`          | Use normal user account (phone + password)               |
| Admin Login     | `/admin/login`    | Use admin or super admin account (email + password)      |
| User Register   | `/register`       | Create a new normal user account                         |
| Forgot Password | `/password/reset` | Request password reset flow                              |
| User Dashboard  | `/wallet`         | Redirect target after successful normal user login       |
| Admin Dashboard | `/admin`          | Redirect target after successful admin/super admin login |

## NPM Scripts

| Script                          | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `npm run dev`                   | Start local dev server                        |
| `npm run dev:lan`               | Start dev server for LAN testing on port 4200 |
| `npm run build`                 | Build production bundle                       |
| `npm run start`                 | Start production server                       |
| `npm run lint`                  | Run ESLint checks                             |
| `npm run typecheck`             | Run TypeScript type checks                    |
| `npm run prisma:validate`       | Validate Prisma schema                        |
| `npm run prisma:format`         | Format Prisma schema                          |
| `npm run prisma:generate`       | Generate Prisma client                        |
| `npm run prisma:pull`           | Pull DB schema into Prisma                    |
| `npm run prisma:push`           | Push Prisma schema to DB                      |
| `npm run prisma:push:reset`     | Force reset DB and push schema                |
| `npm run prisma:migrate:dev`    | Create/apply migration (dev)                  |
| `npm run prisma:migrate:deploy` | Apply migrations (prod)                       |
| `npm run prisma:migrate:status` | Show migration status                         |
| `npm run prisma:migrate:reset`  | Reset DB with migrations                      |
| `npm run prisma:studio`         | Open Prisma Studio                            |
| `npm run seed:admin`            | Seed default admin data                       |
| `npm run seed:laravel`          | Seed parity data from Laravel source          |
| `npm run smoke:parity`          | Run parity smoke checks (PowerShell)          |

## Project Structure (High-Level)

```text
src/
  app/
    api/                 # User/admin API routes
    admin/               # Admin pages
    ...                  # User pages (login, wallet, transfer, notifications, etc.)
  components/            # Shared UI components
  lib/                   # Auth, crypto, response helpers, resources, utils
prisma/
  schema.prisma          # Database schema
scripts/
  *.js, *.ps1            # Seed and smoke/parity scripts
docs/
  laravel-parity-audit-2026-07-03.md
```

## Deployment Checklist

1. Set production `.env` values securely.
2. Run `npm ci` and `npm run build`.
3. Apply migrations with `npm run prisma:migrate:deploy`.
4. Start service with `npm run start`.
5. Run smoke checks for auth, transfer, and admin critical paths.

## License

Private project. Internal use only unless project owner decides otherwise.
