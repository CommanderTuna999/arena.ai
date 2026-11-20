import Link from "next/link";
import SaveCodeGate from "@/components/SaveCodeGate";

const FEATURES = [
  {
    tag: "BESTIARY",
    title: "32 species, one hive",
    body: "Ants, beetles, wasps, moths, mantises and centipedes — each with a procedurally assembled body, its own attacks and a tier-based pecking order.",
    accent: "#4dffb4",
  },
  {
    tag: "PLATING",
    title: "Armour that laughs at lasers",
    body: "Epic and above insects wear thin grey shells. One layer at epic, two at legendary, three at mythical. Lasers and shockwaves cannot cut them; missiles can.",
    accent: "#c3ccd6",
  },
  {
    tag: "ARSENAL",
    title: "19 weapons, 8 abilities",
    body: "Homing missiles, rail snipers, gravity wells, EMPs, drones, mines and more. Crafted weapons run themselves; you concentrate on where to point them.",
    accent: "#ffb04d",
  },
  {
    tag: "THE DEEP",
    title: "Something very long",
    body: "At the centre of the map, a 65-segment snake coils through the dark. It does not turn like the others, and it does not stop coming.",
    accent: "#c45cff",
  },
];

const CONTROLS: [string, string][] = [
  ["WASD / Arrows", "Move"],
  ["Mouse", "Aim"],
  ["Left click / Space", "Base cannon"],
  ["Right click", "Mark a target with missiles, otherwise fire the tether"],
  ["B", "Toggle automatic crafted weapons"],
  ["Z X C V F", "Active abilities"],
  ["Shift", "Afterburner"],
  ["E", "Open the nest at your base"],
  ["T", "Recall beacon"],
  ["`", "Sandbox panel"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04050c] text-slate-100 selection:bg-cyan-400/30">
      {/* background veil */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(77,255,210,0.18),transparent_55%),radial-gradient(circle_at_90%_40%,rgba(196,92,255,0.12),transparent_45%),radial-gradient(circle_at_5%_70%,rgba(255,61,115,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,249,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(125,249,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
            <path d="M12 8.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" />
          </svg>
          <span className="text-sm font-black tracking-[0.35em] text-cyan-200">NEON HIVE</span>
        </div>
        <nav className="flex items-center gap-4 text-xs">
          <a href="#how" className="hidden text-cyan-100/60 transition hover:text-cyan-200 sm:block">How to play</a>
          <a href="#save" className="hidden text-cyan-100/60 transition hover:text-cyan-200 sm:block">Save code</a>
          <Link href="/play" className="rounded-sm border border-cyan-300 bg-cyan-400/15 px-4 py-1.5 font-bold tracking-widest text-cyan-100 shadow-[0_0_20px_rgba(77,255,210,0.35)] transition hover:bg-cyan-400/30">
            PLAY
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 pb-16 pt-10 md:pt-16">
        <p className="rounded-full border border-cyan-300/30 bg-cyan-400/5 px-3 py-1 text-[10px] tracking-[0.3em] text-cyan-200/80">OPEN WORLD · GEOMETRIC SURVIVAL</p>
        <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
          Strip the <span className="text-transparent [-webkit-text-stroke:1px_#7df9ff]">hive</span> for parts.
          <br />
          <span className="text-cyan-300 drop-shadow-[0_0_30px_rgba(77,255,210,0.45)]">Become the apex.</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300/80 sm:text-base">
          A neon hunting ground made of insects. Blow pieces off them, tether the wreckage home,
          and rebuild yourself out of the spoils. The deeper you push toward the centre, the
          thicker their shells — and the longer the thing that lives there.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/play" className="group relative rounded-sm border-2 border-cyan-300 bg-cyan-400/20 px-8 py-3 text-sm font-black tracking-[0.25em] text-white shadow-[0_0_35px_rgba(77,255,210,0.4)] transition hover:bg-cyan-400/35">
            ENTER THE HIVE
            <span className="ml-3 inline-block transition group-hover:translate-x-1">→</span>
          </Link>
          <a href="#save" className="rounded-sm border border-white/20 px-5 py-3 text-xs tracking-widest text-cyan-100/70 transition hover:border-cyan-300/50 hover:text-cyan-100">
            I HAVE A SAVE CODE
          </a>
        </div>
        <dl className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/5 sm:grid-cols-4">
          {[["32", "species"], ["19", "weapons"], ["8", "abilities"], ["5", "zones"]].map(([n, l]) => (
            <div key={l} className="bg-[#060a18]/80 px-4 py-3">
              <dt className="text-2xl font-black text-cyan-200">{n}</dt>
              <dd className="text-[10px] tracking-[0.25em] text-white/40">{l.toUpperCase()}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.05]">
              <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />
              <div className="text-[10px] font-bold tracking-[0.3em]" style={{ color: f.accent }}>{f.tag}</div>
              <h2 className="mt-2 text-xl font-black text-white">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/70">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-5 pb-16">
        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">How it works</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300/75">
              <li><span className="mr-2 font-black text-cyan-300">01</span> Shots knock loose components. Red plates and glowing cores are worth the most.</li>
              <li><span className="mr-2 font-black text-cyan-300">02</span> Tether them with the right mouse button and drag them into the yellow hex at the nest.</li>
              <li><span className="mr-2 font-black text-cyan-300">03</span> Sell for credits or spend them in the crafting bench: weapons, shields, armour, optics, utilities, abilities.</li>
              <li><span className="mr-2 font-black text-cyan-300">04</span> Crafted weapons are automatic. Right-click an enemy piece to mark it; missiles thread through everything else to hit exactly there.</li>
            </ol>
          </div>
          <div className="rounded-md border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-[10px] font-bold tracking-[0.3em] text-cyan-200/70">CONTROLS</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12px]">
              {CONTROLS.map(([k, v]) => (
                <div key={k} className="contents">
                  <div className="whitespace-nowrap font-bold text-yellow-300/90">{k}</div>
                  <div className="text-slate-300/70">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="save" className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="grid gap-6 rounded-md border border-cyan-300/20 bg-gradient-to-b from-cyan-400/[0.07] to-transparent p-6 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-black text-white">Your nest, portable</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300/70">
              Progress is kept in your browser. Export a save code from the nest&apos;s SYSTEM tab to carry it between devices,
              or paste one here to jump straight back in. Codes are checksummed; a mangled copy simply will not load.
            </p>
            <div className="mt-4 text-[11px] text-cyan-100/50">
              No account required. Server-side profiles are used when a database is configured; otherwise the browser is the vault.
            </div>
          </div>
          <SaveCodeGate />
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 text-[11px] text-white/35 sm:flex-row">
          <span>NEON HIVE — a geometric hunting ground.</span>
          <Link href="/play" className="text-cyan-300/70 transition hover:text-cyan-200">Play →</Link>
        </div>
      </footer>
    </main>
  );
}
