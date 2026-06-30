# 540A Cleaning

540A Cleaning is a mobile-first MVP for tracking shared house cleaning tasks. It is built with the Next.js App Router, TypeScript, and Tailwind CSS, and is designed for a simple Vercel deployment.

## Current MVP

- Polished mobile-first landing page and app screens
- Local PIN login with exact PIN validation and localStorage-only session state
- Built-in Admin account, PIN `1234`; member users are derived from assigned Google Calendar tasks
- Routes for `/`, `/login`, `/today`, `/week`, `/history`, and `/admin/users`
- Login-required app routes and admin-only UI protection for `/admin/users`
- Today task checklist with `Mark done` and `Skip` actions
- Task status persistence in localStorage under `540aCleaning.taskStatuses`
- Weekly overview grouped by day
- History view for completed and skipped tasks
- Reusable UI components: `AppHeader`, `BottomNav`, `TaskCard`, `StatusBadge`, and `UserAvatar`
- Read-only Google Calendar loading from one or more calendars when server environment variables are configured

## Future integration points

This starter keeps the architecture simple and free-tier friendly while leaving room for:

- **Neon Postgres** or another hosted Postgres database for users and completion status
- Real authentication for housemate accounts

No database integration, paid service, or Docker setup is included in this MVP. Login state is stored under `540aCleaning.currentUser` and never stores the submitted PIN. Task completion status remains local to the browser.

## Google Calendar

Google Calendar is read-only. The app never creates, edits, or deletes calendar events. If the Google Calendar environment variables are missing, `/today` and `/week` show no tasks and display a configuration warning.

Create a Google service account, then share each Google Calendar with the service account email using read access. The same service account can be shared with every calendar.

Set these server-side environment variables locally and in Vercel:

```bash
GOOGLE_CLIENT_EMAIL=service-account-name@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDARS=main:abc123@group.calendar.google.com,bathrooms:def456@group.calendar.google.com
```

`GOOGLE_CALENDARS` is a comma-separated list of `name:calendar_id` entries. The `name` is shown subtly in the UI so housemates can see which calendar produced each task.

Do not prefix these values with `NEXT_PUBLIC_`. They are read only on the server.

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
