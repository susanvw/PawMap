# PawMap

Help reunite lost pets with their owners as quickly as possible.

## Milestone 1

Prove the core workflow: report a found pet (photo + GPS + optional comment) and see it on a map.

## Projects

- `app/` — React Native (Expo) mobile app
- `api/` — ASP.NET 10 Minimal API, Postgres via EF Core
- `docker-compose.yml` — local Postgres
- `render.yaml` — Render Blueprint for deploying the API

## Branches

- `development` — active work; feature branches PR into here
- `uat` — promoted from `development` via PR
- `main` — promoted from `uat` via PR

## Running locally

Start Postgres:

```bash
docker compose up -d
```

Run the API (from `api/`):

```bash
dotnet run
```

In Development the API connects to the docker-compose database (see `appsettings.Development.json`). To use a Neon branch instead, set the connection string in user secrets; either Npgsql format or Neon's `postgresql://` URL works:

```bash
dotnet user-secrets set ConnectionStrings:Default "postgresql://user:pass@ep-xxx.neon.tech/pawmap?sslmode=require"
```

If you still have the old SQL Server connection string in user secrets, remove it with `dotnet user-secrets remove ConnectionStrings:Default`, since user secrets override `appsettings.Development.json`.

Check it's up:

```bash
curl http://localhost:5288/health
```

The API applies EF Core migrations automatically on startup, so `dotnet run` is enough — no manual migration step. Photos are saved to `api/wwwroot/photos` unless `CLOUDINARY_URL` is set.

## Deploying the API (Render + Neon + Cloudinary)

1. Create a Neon project and copy its connection string.
2. Create a Cloudinary account and copy the `CLOUDINARY_URL` from its dashboard. Render's disk is wiped on every deploy, so photos must live in Cloudinary.
3. In Render, choose **New > Blueprint** and point it at this repo. It reads `render.yaml`, builds `api/Dockerfile`, and asks for `DATABASE_URL` (the Neon string) and `CLOUDINARY_URL`.
4. The service URL should be `https://pawmap-api.onrender.com`. If Render gives it a different name, update `EXPO_PUBLIC_API_URL` in `app/eas.json`.

The app reads its API address from `EXPO_PUBLIC_API_URL`, which `app/eas.json` sets for the preview and production builds. In local development it falls back to the LAN IP in `app/config.ts`.

## API

- `GET /health` — health check
- `POST /found-pets` — multipart form: `species` (Dog/Cat/Other), `latitude`, `longitude`, `photo` (JPEG/PNG/WebP/HEIC, max 10 MB), `comment` (optional, max 500 chars). Invalid input returns a 400 validation problem.
- `GET /found-pets` — list all found pets
- `GET /found-pets/{id}` — a single found pet

Run the app (from `app/`):

```bash
npm install
npx expo start
```
