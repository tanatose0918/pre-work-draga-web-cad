# Base44 development notes

- Use `docker compose -f docker-compose.base44.yml up -d --build` for the preview. The web service runs the bind-mounted checkout with Vite on port 3000; `npm ci` runs at startup against the committed lockfile and a named dependency volume.
- This checkout is frontend-only. The `backend` npm script references a sibling .NET repository that is not included. Do not invent a replacement backend. On remote HTTPS, the existing API and WebSocket clients skip localhost and use the app's built-in 500ms local telemetry simulator. No external credentials are required for this mode; backend persistence and real telemetry are unavailable until the actual backend is supplied.
- Optional backend connections use the existing `VITE_API_URL` and `VITE_WS_URL` variables. Configure real reachable endpoints when a backend is available.
- Pass the platform's `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` into the web service; never hardcode the rotating preview hostname.
- Verify with `docker compose -f docker-compose.base44.yml ps`, `curl -fsS http://localhost:3000/`, and `curl -fsS http://localhost:3000/src/main.ts`. The HTML should reference `/src/main.ts` and `/@vite/client`, confirming live source rather than a production bundle. Browser verification should show a populated `#app` with no error overlay or failed module requests.
