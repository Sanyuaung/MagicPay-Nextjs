# MagicPay Nextjs

MagicPay Nextjs is a Next.js implementation of the Magic Pay app and admin panel.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL

## Requirements

- Node.js 20+
- npm
- PostgreSQL database

## Setup

1. Install dependencies:

   npm install

2. Create environment file:

   Copy .env.example to .env and fill values.

3. Generate Prisma client:

   npm run prisma:generate

4. Push schema to database:

   npm run prisma:push

5. Run development server:

   npm run dev

## Useful Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run typecheck
- npm run prisma:push:reset
- npm run seed:laravel
- npm run seed:admin

## Notes

- For local parity testing with the Laravel project, use the seed scripts in scripts/.
- Keep API response structure compatible with Laravel parity routes.
