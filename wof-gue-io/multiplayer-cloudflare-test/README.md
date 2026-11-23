# Isolated Cloudflare guest multiplayer experiment

A Workers + Durable Object port of the **frozen disposable guest demo** in
`../multiplayer-test/source`. It is separate from the live website, chat,
accounts, save files and inventories. It does not provide full game combat or
production multiplayer. Guests and the world reset when the object restarts;
SQLite is not used to persist game state despite being enabled for the binding.
The in-memory ticket key also changes on restart, so reconnecting fetches a new
session. It is not a migration of the live game or a replacement for Render.

## Run locally

Requires Node 22.12 or later. From this directory:

```
npm ci
npm run dev
```

Wrangler runs **local workerd**, not Cloudflare's network. Open its preview or
`http://localhost:8787` on the same machine. The application uses same-origin
HTTP/WebSocket URLs. In another terminal run:

```
node integration.test.cjs
```

The integration test expects the main repository's `ws` dependency to be
installed. It checks origin rejection, two independent guests in one room,
single-use tickets, snapshots, accepted movement and cleanup. The test and
local preview do not establish deployed latency, platform reliability or costs.

## Deploy only as an explicitly approved, separate test

A real test requires the user's own Cloudflare account and an authenticated
Wrangler on a machine allowed to reach Cloudflare. This environment does not
have a Cloudflare connector. Deploying can incur charges and expose the demo to
the internet. Choose a **unique unused Worker name** and check the account
and existing Workers before deployment; never reuse a production name, route,
or zone. The included `wrangler.jsonc` has no route, account ID, secrets, or
production bindings. After review, use a unique name, for example:

```
npm ci
npm run build
npx wrangler deploy --dry-run
npx wrangler deploy --name <unique-unused-test-name>
```

This is a minimal guest prototype, **not a hardened public service**: use a
restricted test deployment and appropriate Cloudflare access/abuse controls.
Never enter tokens into chat or attach live saves. Stop the separate Worker
when the experiment is finished; leave the existing website and chat untouched.

## Important limitations

- One named Durable Object hosts the whole guest world. Edge request routing
  does not mean the world runs simultaneously near every player. Compare real
  player round-trip latency, tick duration, update gaps, jitter, loss, CPU,
  capacity and cost against the existing demo before choosing infrastructure.
- The room uses regular WebSockets and a 30 Hz timer while peers are connected,
  not the hibernation API. Platform lifecycle, disconnect/restart and sustained
  load behavior require deployed testing. No crash recovery or durable state.
- Workers WebSockets do not necessarily expose `bufferedAmount`; the adapter
  falls back to zero, so the existing congestion check cannot be relied upon.
  Backpressure, queue limits and slow-client handling need a platform-specific
  design and test before deployment beyond a restricted experiment.
- The in-memory session rate limits and tickets are demo safeguards only;
  there is no secure account identity, shared durable replay store, production
  authorization, reward transaction or browser/network security audit.
- No browser visual test, geographically distributed benchmark or direct
  Cloudflare deployment has been performed in this environment.

After changing the test Worker's production branch, start a new build from
that branch; an older failed build still refers to its original commit.

At the base, press **E** to open the real cannon tree. All 12 cannons and
their upgrades are free temporary test access, not purchases or saved account
progression. The server validates changes at the base. `/health` identifies
this iteration as `cloudflare-casing-relay-v1`. A local DOM integration test
exercises the menu; real-browser visuals and deployed networking remain unverified.
