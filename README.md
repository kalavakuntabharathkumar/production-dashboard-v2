# Production Operations Dashboard

An internal operations dashboard starter with a React UI, Express REST API, PostgreSQL schema, Docker Compose, tests, and CI.

## Features
- Inventory, orders, and supplier summary cards
- REST endpoints for dashboard summary, inventory, and orders
- PostgreSQL schema and sample seed data
- API input validation and basic error handling

## Run with Docker
Requires Docker Desktop / Docker Engine:
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- API health: http://localhost:3001/api/health
- API summary: http://localhost:3001/api/dashboard/summary

The API seeds demo data on startup when the tables are empty.

## Run locally
1. Start PostgreSQL and create a database.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`.
3. In `server/`: `npm install && npm run dev`
4. In `client/`: `npm install && npm run dev`

## Tests
```bash
cd server
npm install
npm test
```

## Project scope
The included schema has 9 tables to demonstrate the described operations domain. This is a runnable portfolio starter, not a verified production deployment. The team size, line count, release-time, bug-reduction, and test-coverage metrics from the supplied description are not independently verified.
