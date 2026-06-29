# HouseFlow

A mobile-first shared house cleaning task tracker built with the Next.js App Router, TypeScript, and Tailwind CSS.

## What is included

- Landing page optimized for mobile screens
- App routes for `/login`, `/today`, `/week`, `/history`, and `/admin/users`
- Mock cleaning task and housemate data
- Tailwind-powered responsive UI
- Vercel-friendly project structure
- No Docker and no paid service requirements

## Future integration points

This starter keeps the architecture simple and free-tier friendly while leaving room for:

- **Google Calendar** as the source of scheduled cleaning tasks
- **Neon Postgres** or another hosted Postgres database for users and completion status
- Authentication for real housemate accounts

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
npm run typecheck # Run TypeScript checks
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Keep the default Next.js settings.
4. Deploy.

No Dockerfile or paid services are required for this initial version.

## Vercel troubleshooting

If Vercel reports `No Output Directory named "public" found`, make sure the project uses the Next.js framework preset and does not override the output directory to `public`. This repository includes `vercel.json` to pin the framework to Next.js and the output directory to `.next`.
