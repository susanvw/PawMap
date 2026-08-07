# PawMap

Help reunite lost pets with their owners as quickly as possible.

## Milestone 1

Prove the core workflow: report a found pet (photo + GPS + optional comment) and see it on a map.

## Projects

- `app/` — React Native (Expo) mobile app
- `api/` — ASP.NET 10 Minimal API
- `docker-compose.yml` — local PostgreSQL

## Running locally

Start Postgres:

```bash
docker compose up -d
```

Run the API (from `api/`):

```bash
dotnet run
```

Check it's up:

```bash
curl http://localhost:5288/health
```

Run the app (from `app/`):

```bash
npm install
npx expo start
```
