# HouseFlow

HouseFlow is a mobile-first MVP for tracking shared house cleaning tasks. It is built with the Next.js App Router, TypeScript, and Tailwind CSS, and is designed for a simple Vercel deployment.

## Current MVP

- Polished mobile-first landing page and app screens
- Mock login with localStorage only
- Mock house members:
  - Jordi, admin, PIN `1234`
  - Rafa, member, PIN `1111`
  - Alex, member, PIN `2222`
- Routes for `/`, `/login`, `/today`, `/week`, `/history`, and `/admin/users`
- Admin-only UI protection for `/admin/users`
- Today task checklist with `Mark done` and `Skip` actions
- Task status persistence in localStorage
- Weekly overview grouped by day
- History view for completed and skipped tasks
- Reusable UI components: `AppHeader`, `BottomNav`, `TaskCard`, `StatusBadge`, and `UserAvatar`

## Future integration points

This starter keeps the architecture simple and free-tier friendly while leaving room for:

- **Google Calendar** as the future source of scheduled cleaning tasks
- **Neon Postgres** or another hosted Postgres database for users and completion status
- Real authentication for housemate accounts

No Google Calendar integration, database integration, paid service, or Docker setup is included in this MVP.

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful scripts

```bash
npm run dev       # Start local development
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript checks
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Use the Next.js framework preset.
4. Keep the build command as `npm run build`.
5. Deploy.

No Dockerfile or paid services are required for this initial version.

## Vercel troubleshooting

If Vercel reports `No Output Directory named "public" found`, make sure the project uses the Next.js framework preset and does not override the output directory to `public`. This repository includes `vercel.json` to pin the framework to Next.js and the output directory to `.next`.
