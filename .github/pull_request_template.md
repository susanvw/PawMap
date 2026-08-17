## Summary

<!-- What does this PR do, and why? -->

## Target branch

- [ ] This PR targets `development` (feature work), `uat` (development → uat promotion), or `main` (uat → main promotion) — confirm the base branch is correct before merging.

## Changes

<!-- Bullet list of notable changes -->

-

## Testing

- [ ] `app/`: ran `npx expo start` and exercised the affected screen(s) on a device/simulator
- [ ] `api/`: ran `dotnet run` and hit the affected endpoint(s) (`curl` / Swagger / client)
- [ ] EF Core migration added and applies cleanly on a fresh `docker compose up -d` database (if schema changed)
- [ ] No new TypeScript / build errors (`npx tsc --noEmit` in `app/`)

## Checklist

- [ ] No secrets, API keys, or machine-specific config (e.g. `API_URL` LAN IP in `app/config.ts`) committed
- [ ] `app/package.json` / `api/PawMap.Api.csproj` dependency changes are intentional and lockfiles updated
- [ ] Docs updated if setup/run steps or the API surface changed (`README.md`)

## Screenshots / recordings

<!-- For UI changes, before/after screenshots or a screen recording -->
