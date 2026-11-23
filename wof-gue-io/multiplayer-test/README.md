# Disposable multiplayer visual test

Isolated, guest-only snapshot of the prototype. It does not use website accounts, saves, inventory or progression. It is incomplete combat and resets when restarted; it is not production multiplayer. Source is intentionally isolated from the live game so deploying or rolling back the test cannot alter single-player saves.

Render web service settings (repository `CommanderTuna999/arena.ai`):
- Branch: `arena/aad8e5ab-arena-ai`
- Root directory: `wof-gue-io`
- Build command: `npm ci && node multiplayer-test/build.cjs`
- Start command: `node multiplayer-test/start.cjs`
- Node runtime; use one instance. Render provides PORT. No secrets or environment variables required.

The test is accessed at the service's own HTTPS URL. It has bounded guest sessions and checks WebSocket Origin against its own host. It is a short-lived test, not a public hardened service. Free instances may sleep or restart; all test state is discarded. Do not point the existing chat service at it or attach real player saves.

The browser retries disconnected sessions with backoff; reconnecting creates a new temporary guest. Under congestion, the server skips obsolete snapshots and closes clients only after a sustained backlog. These measures do not guarantee a smooth connection on a loaded or sleeping instance.

The test omits unchanged enemy part geometry and visual metadata after first delivery on each ordered connection; invisible enemies are evicted and sent in full if they return. The world pauses simulation while it has no guests. This is an experimental demo protocol, not production replication.

The overlay shows approximate browser FPS and time between observed world updates; the latter is not network ping. Playback is monotonic and retains the last scene while reconnecting.

The test uses the main game’s default no-optics zoom (1 / 1.3). It does not use saved equipment or optics. Viewport requests use CSS pixels, are rate limited and capped at 8192 by 8192; larger windows display a warning because the test cannot guarantee complete interest coverage.

## Guest cannon test

In this demo only, press **1** for Stinger, **2** for Peashooter MK1 or **3**
for Workhorse MK1, **4** for Skewer MK1 or **5** for Fencer MK1. Each temporary guest gets free test access to these five
existing game weapons; choosing one updates that guest on the server and the
client displays the server-selected cannon. Other players' shots and damage are shared, and their selected cannon and
shield are now rendered from server snapshots.
All choices reset on disconnect. This is not crafting, purchasing, inventory,
account progression, or a complete port of later weapons such as Chairman.

Every temporary guest starts with the main game's level-one shield upgrade.
Enemy damage drains it before hull and, after the normal delay, it recharges.
The demo HUD shows text-free hull and shield bars; this is not an account
upgrade, saved equipment, or the newer Chairman shield system.

Skewer and Fencer use the engine's hitscan damage, and Fencer charges every
fifth shot. Short-lived beam visuals are relayed to nearby guests separately
from damage; missed snapshots or severe network stalls can still lose effects.
This is the frozen guest-demo weapon implementation, not a claim that the
entire current live-game weapon tree has been ported.
