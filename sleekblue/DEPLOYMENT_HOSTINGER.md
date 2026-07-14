# Hostinger deployment guide

## Recommended setup
- App root: `sleekblue`
- Build command: `npm run build`
- Start command: `npm start`
- Node version: 20+

## Required environment variables
- JWT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD

## Notes
- The server reads env vars from Hostinger's environment settings.
- The app serves the built frontend from the `dist` folder and uses the Express server for API routes.
- A health check is available at `/health`.
