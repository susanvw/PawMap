# PawMap

Help reunite lost pets with their owners as quickly as possible.

## Milestone 1

Prove the core workflow: report a found pet (photo + GPS + optional comment) and see it on a map.

## Projects

- `app/` — React Native (Expo) mobile app
- `api/` — ASP.NET 10 Minimal API
- `docker-compose.yml` — local SQL Server

## Branches

- `development` — active work; feature branches PR into here
- `uat` — promoted from `development` via PR
- `main` — promoted from `uat` via PR

## Running locally

Start SQL Server:

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

The API applies EF Core migrations automatically on startup, so `dotnet run` is enough — no manual migration step.

## API

- `GET /health` — health check
- `POST /found-pets` — multipart form: `species` (Dog/Cat/Other), `latitude`, `longitude`, `photo` (file), `comment` (optional)
- `GET /found-pets` — list all found pets
- `GET /found-pets/{id}` — a single found pet

Run the app (from `app/`):

```bash
npm install
npx expo start
```
