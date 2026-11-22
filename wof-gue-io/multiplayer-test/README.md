# Disposable multiplayer visual test

Isolated, guest-only snapshot of the prototype. It does not use website accounts, saves, inventory or progression. It is incomplete combat and resets when restarted; it is not production multiplayer. Source is intentionally isolated from the live game so deploying or rolling back the test cannot alter single-player saves.

Render web service settings (repository `CommanderTuna999/arena.ai`):
- Branch: `arena/aad8e5ab-arena-ai`
- Root directory: `wof-gue-io`
- Build command: `npm ci && node multiplayer-test/build.cjs`
- Start command: `node multiplayer-test/start.cjs`
- Node runtime; use one instance. Render provides PORT. No secrets or environment variables required.

The test is accessed at the service's own HTTPS URL. It has bounded guest sessions and checks WebSocket Origin against its own host. It is a short-lived test, not a public hardened service. Free instances may sleep or restart; all test state is discarded. Do not point the existing chat service at it or attach real player saves.
