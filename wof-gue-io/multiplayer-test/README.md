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

Spawn at the base and press **E** to open the main game's cannon tree. All
12 cannons and their upgrade tracks are available for free in this isolated
test. The server validates loadout and upgrades at the base; they reset on
disconnect. This is not purchasing, crafting, inventory or saved progression.
The guest starts with the level-one shield. Weapon effects and special states
are replicated, but visual fidelity and real-network performance still need
browser and deployed testing. `/health` identifies `guest-casing-relay-v1`.

Shot casings are emitted by the authoritative simulation and relayed to nearby
guests with their weapon and kinetic/energy profile. They are cosmetic, bounded
and ephemeral; dropped snapshots can still cause missed effects.
