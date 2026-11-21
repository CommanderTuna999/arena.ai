# Deploying Wofgue.io

The live site is a Vercel project called **wofgue.io** (team `OVERLUX`, root directory `wof-gue-io`).
It serves `https://wof-gue-io.vercel.app`.

## Does a push deploy automatically?

**Not yet.** The Vercel project is not linked to the GitHub repository as a Git integration, and the
project flags `gitProviderOptions.createDeployments = "disabled"` /
`disableRepositoryDispatchEvents = true` are set, so a `git push` does not start a build. Deployments
are currently created deliberately, one per release.

## Making it automatic (one-time, ~1 minute)

In the Vercel dashboard:

1. Open **wofgue.io → Settings → Git**.
2. If it says *No Git Repository connected*, click **Connect Git Repository**, choose **GitHub**, and
   install the Vercel GitHub App on `CommanderTuna999/arena.ai` when prompted.
3. Set **Production Branch** to the branch that should ship (e.g. `main`), and leave **Root Directory**
   as `wof-gue-io` (it is already saved that way).
4. Under the same screen make sure **Automatically create deployments on push** is enabled — that is
   the switch that clears `createDeployments = "disabled"`.

After that, every push to the production branch rebuilds and promotes the site by itself; pushes to
other branches produce preview URLs.

## Manual deploy (works today)

Via the Vercel API with a Git source, or from a checkout:

```bash
cd wof-gue-io
npx vercel --prod
```

## Cross-device play

Saves follow the **account**, not the browser, but only when the project has a database:

1. Vercel → project **wofgue.io** → **Storage** → **Create Database** → pick the Postgres/Neon
   integration (free tier is enough) → connect it to this project.
2. Vercel writes `DATABASE_URL` into the project environment automatically. Nothing else to do:
   `ensureSchema()` creates `users` and `players` on the first auth or save call.
3. Redeploy (or wait for the next deploy) so the running functions pick the variable up.

Without a database the account layer falls back to browser-local accounts (`/api/auth/me` reports
`{"db": false}`) and progress cannot leave the device. The cloud SQL is exercised against an
in-memory Postgres by `npx tsx cloud-path.test.mts`.

## Environment variables

| Name | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | cloud accounts + cloud saves | Any Postgres (Vercel → Storage → Neon/Create). Tables are created on first use. Without it accounts live in the browser instead. |
| `AUTH_SECRET` | signing session cookies | Any long random string. A dev fallback is used when unset, so set it on a public site. |
