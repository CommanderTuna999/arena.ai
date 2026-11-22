/*
 * Version history shown by the CHANGELOG button on the title screen.
 *
 * Versioning rules (keep these when shipping):
 *   X.Y        — feature releases. Bump Y for a batch of new content or systems.
 *   X.Y.Z      — fixes, balance tweaks and small quality-of-life changes.
 *   Every shipped change must bump VERSION, add a dated entry at the TOP of
 *   CHANGELOG and mirror the details in docs/CHANGELOG.md.
 */

export const VERSION = "2.29.17";

export interface ChangeEntry {
  version: string;
  /** human-readable release date */
  date: string;
  title: string;
  points: string[];
}

export const CHANGELOG: ChangeEntry[] = [
  { version: "2.29.17", date: "22 Nov 2026", title: "Component magnet", points: ["The component magnet collects eligible items immediately; the pull animation is cosmetic."] },
  { version: "2.29.16", date: "22 Nov 2026", title: "Multiplayer test", points: ["Improved multiplayer test reconnection and reduced rendering and network overhead."] },
  { version: "2.29.15", date: "22 Nov 2026", title: "Username wording", points: ["Account and settings labels now use username."] },
  { version: "2.29.14", date: "22 Nov 2026", title: "Multiplayer test performance", points: ["Reduced multiplayer test bandwidth and processing overhead."] },
  { version: "2.29.13", date: "22 Nov 2026", title: "Multiplayer test", points: ["Multiplayer test."] },
  { version: "2.29.12", date: "22 Nov 2026", title: "Chat focus and guest notice", points: ["Pressing Enter on an empty chat field stops typing without closing chat.", "The title screen clarifies that guests must log in to save progress."] },
  { version: "2.29.11", date: "22 Nov 2026", title: "Chat Enter fix", points: ["Sending a chat message with Enter keeps chat open; pressing Enter with an empty field closes it."] },
  { version: "2.29.10", date: "22 Nov 2026", title: "Red barriers", points: ["Solid map walls now appear as glowing red barriers; collision is unchanged."] },
  { version: "2.29.9", date: "22 Nov 2026", title: "Chat, map and contact", points: ["Chat highlights your messages in white and Enter sends and closes chat.", "The minimap starts focused; fixed shallow enemy contact damage."] },
  { version: "2.29.8", date: "22 Nov 2026", title: "Chat focus and colours", points: ["Your chat messages use their own colours; clicking outside the typing field returns control to the game."] },
  { version: "2.29.7", date: "22 Nov 2026", title: "Component storage", points: ["Removed the component storage slot limit and refunded Cargo Bay upgrades.", "A brief warning on entry flags large inventories that may slow the game or exceed browser storage."] },
  { version: "2.29.6", date: "22 Nov 2026", title: "Chat and Lunar Moth", points: ["Chat can queue messages while offline and fades after five seconds of inactivity; new messages reveal it again.", "Fixed chat message sanitization and renamed Lunar Moth while preserving existing components and recipes."] },
  { version: "2.29.5", date: "22 Nov 2026", title: "Chat connection diagnostics", points: ["Chat displays a stable retry status and the chat service accepts the project’s known website aliases."] },
  { version: "2.29.4", date: "22 Nov 2026", title: "Mediator charge and reload", points: ["Mediator requires at least two seconds of continuous charge before it fires and reloads after its beam ends."] },
  { version: "2.29.3", date: "22 Nov 2026", title: "Changelog dates", points: ["Corrected release dates from version 2.12 onward."] },
  { version: "2.29.2", date: "22 Nov 2026", title: "Core contact", points: ["Enemy cores no longer deal contact or body-attack damage; other enemy parts and attacks still can."] },
  { version: "2.29.1", date: "22 Nov 2026", title: "Map and admin fixes", points: ["Removed the camera rectangle from the map. Infinite Damage now deals infinite damage to hit parts and armour instead of 100 times damage."] },
  { version: "2.29.0", date: "22 Nov 2026", title: "Map controls", points: ["Press M to glide to a large map, then a focused local minimap, then the default map. Removed enemy markers and changed the player marker to a green dot."] },
  { version: "2.28.1", date: "22 Nov 2026", title: "Chat controls", points: ["Removed floating damage numbers. Chat opens on a new message or with slash or Enter; collapse it to a button with an unread count."] },
  {
    version: "2.28.0", date: "22 Nov 2026", title: "Chat groundwork and tree layering",
    points: ["Fixed cannon tree popup layering and added a chat panel with local Ultra announcements.", "Added a separate deployable chat service; shared multiplayer combat is not yet implemented, and online chat requires server configuration."],
  },
  {
    version: "2.27.1", date: "22 Nov 2026", title: "Sharper salvage",
    points: ["Large dropped components now render sharply at their actual screen resolution; oversized pieces use vector drawing instead of stretched low-resolution images."],
  },
  {
    version: "2.27.0", date: "22 Nov 2026", title: "Combat feedback",
    points: ["Added colour-coded floating damage numbers, including critical hit indicators, with rapid damage grouped to keep fights readable.", "Removed rarity colours from the map and made cannon-tree popups fully opaque."],
  },
  {
    version: "2.26.0", date: "22 Nov 2026", title: "Performance and scale",
    points: ["Cached salvage artwork and spatially indexed enemy separation; enemy parts remain visible at every zoom.", "Ultra bodies destroy lower rarities without rewards. Bestiary art shares a world scale, armour is thinner, and wall collision respects the player hull and smaller enemy hitboxes."],
  },
  {
    version: "2.25.2", date: "22 Nov 2026", title: "Ultra scaling",
    points: ["Ultra normal-piece health and damage are each 135× their mythical values. Armour remains 16× average Ultra normal-piece health."],
  },
  {
    version: "2.25.1", date: "22 Nov 2026", title: "Ultra visual and notice fixes",
    points: [
      "Ultra enemies keep their normal species colours. Ultra rarity components are black with a subtle white gradient, without an enchantment glint.",
      "Ultra spawn and defeat announcements now appear clearly above the interface in the bottom-left for ten seconds.",
    ],
  },
  {
    version: "2.25.0", date: "22 Nov 2026", title: "Ultra rarity",
    points: [
      "Ultra enemies have 13.5× mythical piece health, 16× normal-piece armour health and 3× mythical size. They replace 0.5% of mythical spawns.",
      "Ultra pieces have a black enchantment glint. They guarantee mythical salvage, with a 2% Ultra piece chance and 10% Ultra core chance.",
      "Ultra encounters have spawn and defeat announcements, a large health and armour display, and bestiary and admin entries.",
      "The live preview now uses a separate development output to prevent production rebuilds breaking it.",
    ],
  },
  {
    version: "2.24.0", date: "22 Nov 2026", title: "New map and Ultra zone",
    points: [
      "The supplied map replaces the old maze, with the base in the top-left and rarity increasing toward the bottom-right.",
      "The bottom-right Ultra zone currently spawns mostly mythical enemies, with some legendary enemies; Ultra enemy and component tiers are not yet available.",
      "Admins can select a destination on the world map and teleport there; wall selections snap to nearby open ground.",
    ],
  },
  {
    version: "2.23.2", date: "22 Nov 2026", title: "Mediator sparks",
    points: ["The Mediator sheds violet energy shards and pale sparks from its muzzle while firing."],
  },
  {
    version: "2.23.1", date: "22 Nov 2026", title: "Mediator handling",
    points: [
      "Removed the Mediator charge bar while keeping its charging animation and 70-to-10-second charge progression.",
      "The Mediator's sustained beam turns much more slowly and its initial and continuous recoil are tripled.",
    ],
  },
  {
    version: "2.23.0", date: "22 Nov 2026", title: "Thicker walls and Mediator charge",
    points: [
      "Maze walls are roughly five times thicker, with rounded corners and connected routes. Mythical terrain remains approximately three times the other rarity areas combined.",
      "Mediator displays its charge percentage while held. Full charge now takes 70 seconds without upgrades, falling to 10 seconds at maximum charge-rate level; longer charging increases beam damage.",
    ],
  },
  {
    version: "2.22.0", date: "22 Nov 2026", title: "Connected walls and balanced rarity zones",
    points: [
      "The original maze now has thick connected walls, branching passages and a fully connected walkable area.",
      "The mythical zone now covers approximately three times the walkable area of all other rarity zones combined, with room for future rarities.",
    ],
  },
  {
    version: "2.21.0", date: "22 Nov 2026", title: "Original labyrinth and Mediator polish",
    points: [
      "Replaced the traced map with an original, larger connected labyrinth. The mythical region occupies most of the map, leaving space for future rarities.",
      "The cannon tree is smaller and its prerequisite connections are drawn continuously without horizontal scrolling.",
      "Mediator now has a segmented charging animation and a crisp layered energy beam. Continuous recoil pushes the ship backwards and restricts movement while firing.",
    ],
  },
  {
    version: "2.20.0", date: "22 Nov 2026", title: "Expanded world and rarity zones",
    points: [
      "The reference-inspired world is larger and contains dozens of additional walls, while all walkable regions remain connected to the base.",
      "Rarity increases with distance from the base, from common through mythical. The minimap now colours the actual zones, with space for future rarity tiers.",
    ],
  },
  {
    version: "2.19.0", date: "22 Nov 2026", title: "Combat and session fixes",
    points: [
      "Lunar moth rotating lasers deal seven times their previous damage.",
      "Fencer MK1 now visibly charges before firing its fifth attack as an energy shot with strong recoil.",
      "Every disconnected component has its normal independent drop chance when severed by the player.",
      "The cannon tree connects each chassis to its actual prerequisite, including all Skewer MK1 tier-2 branches.",
      "Leaving resets the run's world; reopening or reloading the game returns to the home screen. Your pilot upgrades remain saved.",
      "Update checks no longer pause the game just because a newer commit exists; they wait until a new version is actually live.",
    ],
  },
  {
    version: "2.18.0",
    date: "22 Nov 2026",
    title: "New map and tier-2 cannon upgrades",
    points: [
      "The arena is now a much larger connected map with corridors and open regions, based on the supplied layout. The base sits in the lower open region.",
      "Skewer MK2 gains armour damage and energy shot chance upgrades; Fencer keeps critical chance, critical damage, penetration and damage; Mediator gains charge rate and beam width upgrades.",
      "Mediator now fires a sustained three-second energy beam, with critical hits and upgradeable width and charge speed.",
      "The large spider web projectile is half as large; its deployed web covers three times its former radius.",
      "Cannon component requirements accept the specified rarity or any higher rarity, without reusing a component across requirements.",
      "Drop rates: non-core components have about a 5% chance at the enemy's rarity; cores have a 90% chance, or 55% on common enemies. For non-core parts from common enemies, an uncommon roll is tried first at 30%; only if that fails is the 5% common roll attempted. Salvage bonuses modify these rates.",
    ],
  },
  {
    version: "2.17.0",
    date: "22 Nov 2026",
    title: "Tier-2 cannons, faster enemy rounds, the moth's domain and its shield",
    points: [
      "The tier-2 cannon tree is complete per the design sheet, all branching off Skewer MK1: Skewer MK2 (a 1200-damage hitscan lance with a 25% chance each shot to throw an energy shot that bypasses enemy shielding), Fencer MK1 (a rapid 200-damage jab on a 0.3s interval; every fifth landed shot unleashes a charged 2.5k energy shot), and Mediator MK1 (hold the trigger to charge a devastating 4k energy beam, then release it for massive recoil).",
      "The tier-1 crafting recipes now match the sheet: the antenna, head and core requirements are uncommon, so Skewer MK1, Peashooter MK1 and Workhorse MK1 each need their uncommon components to build.",
      "Enemy projectiles are much faster across the board - the basic gun round, minigun, scatter, heavy rail and laser all now track the ship with far less lead time.",
      "The Inertial Dampers upgrade is gone; knockback and slows now land at full strength.",
      "The spider's pull is now an unresistable direct reel - the ship is walked toward the spider at a fixed speed, so thrust and inertia cannot fight it.",
      "The moth's missiles are now smaller, much faster purple darts summoned in a ring around the moth (instead of overlapping at one point), each leaving a streaming trail.",
      "The moon and its domain are rebuilt in the JJK style: a black void with a glowing rim and a large watchful moon whose eyes open wider with the phase. A JJK-style cutscene plays on domain expansion, flashing violet and streaking the words DOMAIN EXPANSION across the screen.",
      "The domain's per-frame effects are throttled, fixing the lag it caused.",
      "The moth's purple Shield ability now works: it summons a shield bubble holding 5% of its max health, absorbs incoming damage into the bubble, and regenerates the moth's hull while the bubble is up.",
    ],
  },
  {
    version: "2.16.0",
    date: "22 Nov 2026",
    title: "Contact attacks break their own shields, full-aggro guns and tier-2 cannons",
    points: [
      "A dragonfly (and any future body whose attack reaches the ship by contact) now retracts its frontal shields for the whole of a grab, sting, charge or swing, so the pincer cannot be blocked by the dragonfly's own shield wall. The retract is a body-level timer that the contact ability keeps topped up.",
      "Every enemy weapon now reaches the body's full aggro range, and an aggroed body keeps firing at the ship even when the ship is past that range - the range is the reach, not a firing gate. Unaggroed enemies snap to attention the instant they take their first damage.",
      "Drop rates are now tier-driven: every non-core component drops at about 5% at the enemy's own rarity, the core drops at 90% (55% on a common body), and a common body additionally rolls an uncommon-tier component at 30% - farming commons is the way up the rarity ladder.",
      "The overheat screen edge-glow now only appears on a chassis that can actually overheat, so guns that never jam no longer flash the warning.",
      "The tier-2 cannon tree is built out per the design sheet (see 2.17.0 for the full trio).",
      "The cannon tree's stray helper paragraphs are gone; the nodes speak for themselves.",
    ],
  },
  {
    version: "2.15.1",
    date: "22 Nov 2026",
    title: "Ability behaviour: webs, pincers, stings and lasers",
    points: [
      "The spider's Web Volley fires three small webs each tethered to the spider by a visible silken string; a hit reels the ship back to the spider instead of the spider lunging. The large Web now lands on the floor and expands into a real spider-web zone the size of the spider that slows and poisons the ship.",
      "The scorpion's Pincer Grab now clamps the ship with drawn pincer claws, and Tail Sting is a real sting: the tail uncoils and extends a venom stinger toward the ship, the scorpion lunges in to sting (knockback and venom) and recoils.",
      "The moth's Rotating Lasers are now long, thick real lasers, and its Missiles spawn as missile projectiles so the homing volley actually appears. All enemy projectiles now render about five times larger so every shot is clearly visible.",
    ],
  },
  {
    version: "2.15.0",
    date: "21 Nov 2026",
    title: "Enemy abilities, bestiary drops and cannon quality of life",
    points: [
      "Four enemies gained their full ability kits: the dragonfly now dashes, sprays, chomps and unleashes a shockwave; the scorpion pincer-grabs and tail-stings; the spider webs, volleys, bites and pulls; and the moth fires shot bursts, rotating lasers, homing missiles and opens a three-minute moon Domain that scales its damage and health from 3x to 10x by phase.",
      "The moth's Domain heals it to full, grinds the ship for 5% of max hull per second and feeds the moth 1% of max health per second, both scaling with the moon phase, and it cannot be reused until it closes.",
      "The bestiary now shows each ability as a single word and each component drop with its kind, rarity and drop percentage.",
      "Drop rates are now driven by a single kind table (core 90%, segment 35%, armor 30%, leg 25%, arm 35%, wing 25%, weapon 50%, shield 50%, spike 12%) scaled by the salvage stat, which is now a multiplier rather than a percentage.",
      "Cannon quality of life: the greyed weapon-stats hover card no longer shows when the cannon is disabled, descriptions are quoted, and the hover helper text is gone.",
      "Enemy ability intervals now follow a rarity ladder (17, 12, 8, 3, 1.75, 1 seconds) instead of a flat cooldown.",
    ],
  },
  {
    version: "2.14.1",
    date: "21 Nov 2026",
    title: "Enemy attachment damage and cannon overheat",
    points: [
      "Enemy weapon attachments now match the sheet's per-projectile damage: basic cannon 0.5x, scatter 1.2x, rotary 0.2x, laser 1.0x, heavy rail 17x.",
      "The heavy rail's reach is now the body's own aggro range instead of a fixed number, and the laser holds a tracking beam whose damage climbs to its full 1.0x over three seconds.",
      "The cannon's overheat now reads on screen: the barrel runs a real red-to-white-hot ramp, heat shimmer rises off it, and a warm glow bleeds in from the edges of the screen as it cooks.",
    ],
  },
  {
    version: "2.14.0",
    date: "21 Nov 2026",
    title: "Balance changes",
    points: [
      "Balanced some stuff ig",
    ],
  },
  {
    version: "2.13.1",
    date: "21 Nov 2026",
    title: "Plating that fits the body, and a proper twin",
    points: [
      "Armour is priced off the body it is bolted to now: every plate is a multiple of the average piece on that insect, climbing with rarity - 4x at rare, 5.5x epic, 7x legendary, 9x mythical, with common and uncommon continuing the ramp at 2.5x and 3.25x.",
      "The Workhorse properly alternates barrels: each barrel has its own recoil spring, so one kicks back per trigger and the other stays put. The muzzle flash was lighting the wrong barrel - it now flashes the one that actually fired.",
      "One gun per tier. Once you buy a tier 1 chassis the other two lock with 'One gun per tier', exactly as the sheet says. Admin mode can still buy the whole row.",
    ],
  },
  {
    version: "2.13.0",
    date: "21 Nov 2026",
    title: "Guns you can see, and barrels you can feel",
    points: [
      "Every chassis has a picture in the CANNON tree now, drawn from the same data the hull uses: fat bolt thrower, long lance, three spigots, or a genuine twin.",
      "The fitted gun is drawn on your ship, and it changes when you change guns. The Skewer's barrel is almost twice the length of the Peashooter's.",
      "Recoil is real: the gun slides back into its mount on every trigger, the ship is shoved along the shot (hard for the Skewer, barely at all for the Peashooter) and the barrel that fired flashes.",
      "Barrels carry heat. It builds with every trigger, glows in the bore and cools when you stop. The overheat lockout is not wired yet - the gauge and the glow are in place for it.",
      "The Workhorse is a twin: rounds alternate between its two barrels, one per trigger, and the barrel upgrade fires both at once.",
      "Descriptions are the sheet's lines and nothing else: 'Everyone's gotta start somewhere.', 'Pretty accurate.', 'Spray and pray, huh?', 'Boring...'.",
      "The sheet's latest numbers are in: the Peashooter hits for 35 a seed now and carries Crit Chance and Crit Damage of its own.", 
    ],
  },
  {
    version: "2.12.1",
    date: "21 Nov 2026",
    title: "Bills made of bits you actually find",
    points: [
      "Chassis bills are legs, common cores, heads and antennae now, with legs making up most of every bill. Skewer: 2 legs, an antenna, a head and an uncommon core. Peashooter: 2 legs, a common core and an uncommon core. Workhorse: 2 legs, a head, a common core and an uncommon core.",
      "A head only counts if the part is actually called a Head and an antenna only counts if it is called an Antenna - a plain body segment or a tail spike will not do.",
      "Admin mode's infinite components now works on the cannon tree: build any chassis with an empty hold, while the 300 credits are still charged.",
    ],
  },
  {
    version: "2.12.0",
    date: "21 Nov 2026",
    title: "Three guns, and shields that push back",
    points: [
      "The cannon tree reads bottom-up from the free Stinger, and the tier 1 row is no longer a placeholder: the Skewer, the Peashooter and the Workhorse are in service.",
      "Skewer: 200 damage on a 1.5s cycle, fired as a hitscan line you can see. Peashooter: 15 damage every 0.1s with a wide, hopeless spray. Workhorse: 45 damage every 0.55s, dead ordinary.",
      "A chassis is paid for twice: 300 credits plus a bill of named common parts and one uncommon core. The tree lists the bill and eats the cheapest matching parts in storage when you build.",
      "Upgrades stay with the gun. Skewer: Damage, Crit Chance, Crit Damage, Physical Penetration. Peashooter: Damage, Accuracy, Projectile Speed. Workhorse: Damage, Fire Rate, Physical Penetration, Barrels.",
      "Barrels stop at two - one extra round per trigger - and the single level costs 9,600 credits on the Workhorse. Boring guns are not cheap guns.",
      "Energy shields are solid walls now: the hull is lifted back onto the outside face every frame, so a panel cannot be flown through while the shock is cooling down. Contact still discharges into the hull and throws you off.",
    ],
  },
  {
    version: "2.11.0",
    date: "21 Nov 2026",
    title: "Aiming, and a leaner gun",
    points: [
      "Crafted weapons fire as long as any piece of a body is inside their range, not just its centre - a big insect with a leg in reach is a target.",
      "They shoot the core first. With the core gone they go for shield generators and guns, and with nothing but plating left they take the closest piece.",
      "The weapon upgrades are gone: no more Extra Barrels and no more Targeting Matrix. One bolt per trigger, no critical hits.",
      "The starter cannon is simply the Stinger now, and its only upgrade is Damage - the 0.7s fire interval is fixed by the gun.",
    ],
  },
  {
    version: "2.10.0",
    date: "21 Nov 2026",
    title: "Cannons are their own thing now",
    points: [
      "There is a CANNON tab in the base. It is a tree: the starter gun sits at the bottom of it and the row above is a locked tier 1 slot waiting for the next chassis.",
      "The starter cannon has a name: the Stinger Mk I. One fat round bolt at a time, slow enough to watch, with a small charge that pops where it lands.",
      "Cannon damage and fire rate moved off the global shop and onto the gun itself: each chassis carries its own Bore Calibration and Autoloader tracks. Levels you already bought carried over.",
      "The bolt is a glowing round slug with a tapering tail instead of a tracer line.",
      "Energy shield panels are solid now: they shock, shake the screen and throw the ship back off the wall instead of letting it slide through.",
    ],
  },
  {
    version: "2.9.0",
    date: "21 Nov 2026",
    title: "Balance sheet: enemy stats, cannon, hull",
    points: [
      "Aggro for rare and up is back out where it was: rare x3, epic x4, legendary x5, mythical x5 their old ranges (rare opens at ~1,000u, a mythical at ~3,900u). Commons and uncommons stay neutral and stay tight.",
      "Enemy piece health now comes off the sheet: 19 for a dragonfly body up to 80 for the world serpent, with armour plates worth nine times a normal piece and the rarity ladder running 1 / 3.75x / 15x / 70.5x / 423x / 3,426x.",
      "Enemy base damage is per species too (20 to 100 at common), and the attachments use the sheet's multipliers: basic 0.5x, scatter 1.2x, minigun 0.2x (10s burst, then it has to cool), laser 1.0x, heavy rail 17x, energy shield 25x.",
      "The starting cannon is the sheet's tier 0: 20 damage on a 0.7s interval, free at the start. Cannon damage still climbs 1.2x a level.",
      "Player hull is a flatter, cheaper curve: still 100 at the start, but 1.19x a level instead of 1.22x, with the shield core and the rest of the hull tree priced down to match.",
      "Everything that used to be called the nest is called the base now.",
    ],
  },
  {
    version: "2.8.0",
    date: "21 Nov 2026",
    title: "Neutral bugs, front shields, quieter credits",
    points: [
      "Commons and uncommons are neutral now: they will sit there while you work, and only fight once something hits them. Everything from a rare up still opens on you, but every aggro range came down hard - a rare wants you inside 350u, a mythical inside 850u, where these used to be a screen and a half of standing threat.",
      "Shield panels are packed across the front of most rare and up bodies instead of being sprinkled around the ring, so head-on fire is a waste of ammo. The tail is the way in.",
      "Touching an energy panel now discharges into the hull and throws the ship off it - no more parking against a wall to line up a shot.",
      "Esc opens settings on its own now (it still closes whatever is on screen first).",
      "Credits: a broken part throws one coin, not a shower, and the coins that do fly are capped at 24. Everything that lands inside half a second reads as one collection - a single +1.2k off the counter - and the counter's coin swells with it, up to three and a half times normal for a fat break.",
      "Effect diet: plate hits spark instead of painting a shockwave ring per bullet, a destroyed body throws at most two blast cascades instead of one per gun it carried, and decorative rings are capped at 22 in flight.",
      "The site icon is scaled to 70% so the mantis is no longer cropped.",
    ],
  },
  {
    version: "2.7.0",
    date: "21 Nov 2026",
    title: "Aggro ranges, standby screen, clean icon",
    points: [
      "Every bug now has an aggro range that follows its rarity: about 360u for a common, rising to 1060u for a mythical, plus a little extra for a big body. Bigger rarities notice you further out.",
      "Step out of that range and the chase ends - the bug drops the swing or lunge it was winding up and wanders back to its home ground. The only exception is the boss, which hunts across most of the middle of the map.",
      "Pushing an update now puts the live site on standby: within a few seconds of a new commit the screen reads PAUSING GAMEPLAY FOR UPDATE, the simulation is paused and saves are flushed, then the tab reloads itself into the new build.",
      "The site icon is the mantis on a transparent background now, with no tile behind it.",
    ],
  },
  {
    version: "2.6.0",
    date: "21 Nov 2026",
    title: "Guest runs, the mantis icon and a stricter magnet",
    points: [
      "The site icon is now the mantis itself: the exact plating and scythe geometry the game builds for a mythic mantis, neon green on a dark tile.",
      "The browser tab reads wofgue on every page.",
      "Guests play as Guest with a random three-digit tag. There is no name field to fill in until you sign in, and a guest run is never written down: nothing goes to this browser and nothing goes to the server, so a reload starts over.",
      "Accounts autosave every few seconds, when you leave the run, and when the tab closes. With a database attached, that save follows the account to any device.",
      "Only light parts (mass 7 or less) can be dragged in by the component magnet or scooped up by touching them. Anything heavier has to be harpooned and towed.",
    ],
  },
  {
    version: "2.5.0",
    date: "21 Nov 2026",
    title: "Accounts, a neon ladybug and a proper name",
    points: [
      "Log in with a username and a password. The title screen carries a small ACCOUNT chip: create an account once, then sign in from then on.",
      "Every account gets its own save slot, so two pilots can share one browser without overwriting each other. Progress already made as a guest is carried into a new account on its first login instead of being thrown away.",
      "Passwords are never stored as text. On a host with a database the server keeps a salted scrypt hash and a signed, http-only cookie holds the session; on a host without one the same login runs in the browser with PBKDF2, so the form works everywhere.",
      "The browser tab now reads wofgue.io on every page, and the site icon is a neon ladybug instead of the framework default.",
    ],
  },
  {
    version: "2.4.0",
    date: "21 Nov 2026",
    title: "Neon credit chip, and a bestiary by rarity",
    points: [
      "The credit counter icon is now a neon geometric chip: a hexagonal coin with a glowing cyan rim, a gold face and a square hole cut clean through it. The coins that fly into the counter use the same silhouette.",
      "The bestiary catalogs every species once per rarity: 32 species x 6 rarities = 192 entries. Each chip carries its own silhouette, rarity colour and short label (COM/UNC/RAR/EPI/LEG/MYT).",
      "Undiscovered rarities stay dark until you beat that species at that rarity, and the detail card now shows the exact tier's hull, radius, plating layers, shield panels, mounts, pack size and drop rarity.",
    ],
  },
  {
    version: "2.3.0",
    date: "21 Nov 2026",
    title: "Salvage on contact, cash on the counter",
    points: [
      "Light salvage is picked up by touch: any loose part of mass 14 or less drops straight into storage the moment your ship touches it. Heavier pieces still need the tether and a tow back to the base dock.",
      "Credits no longer need collecting at all. Every broken part throws coins that arc across the screen into the credit counter, and the money is banked as each coin lands, with the counter popping on every arrival.",
      "The counter now carries a struck gold cash coin - a rimmed disc with a square hole through the middle, an inner ring and a highlight - instead of a flat diamond.",
      "The HUD was decluttered: the toast stack in the bottom-left is gone, along with the online/fps/zoom readout, the CANNON ONLINE label and the hostiles banner. The discovery message is now a single short line.",
    ],
  },
  {
    version: "2.2.1",
    date: "21 Nov 2026",
    title: "Shield panels ride outside the armour",
    points: [
      "Panels were sized off body scale alone, so on legendary and mythical bodies the plating reached past them and the wall ended up buried inside the armour.",
      "Each panel now measures how far the torso plates reach along its own direction and sits just past them, so the shield is always the outer layer: a shot has to clear the plating before it meets energy.",
      "Because the radius follows the hull, panels hug a long or lopsided body instead of forming one distant circle - a mythical dragonfly's four panels now sit at different distances depending on which way they face.",
      "Legs and wings are ignored on purpose (they stick far past the hull), so a plated limb can poke through the shield line as an exposed weak point.",
    ],
  },
  {
    version: "2.2.0",
    date: "21 Nov 2026",
    title: "Shield projectors throw walls, not bubbles",
    points: [
      "Shield Generators no longer wrap an enemy in a hexagon: each generator projects one energy panel at the hull line, so the gaps between panels are real weak points.",
      "Flyers and serpents project curved arcs, walkers project straight bars, and some species sweep their panels back and forth (0.4-0.7 rad/s).",
      "Rarity now buys more generators: 2 at epic, 3 at legendary, 4 at mythical, so the coverage grows from about a third of the ring to about two thirds without ever closing it.",
      "The rules are unchanged - panels stop every damage type except energy, shock and thermal, take no damage themselves, and only fall when their generator part is destroyed.",
      "Enemy hit-testing now reaches out to the panels, so a round that would pass the body is still caught by the shield wall in front of it.",
    ],
  },
  {
    version: "2.1.3",
    date: "21 Nov 2026",
    title: "Energy cuts plating, hulls swat you off",
    points: [
      "Energy damage now only loses 20% to armour plating (it used to lose 78%): beams put 80% of their damage into the slabs instead of 22%. High-rarity hulls are no longer invulnerable to energy builds. Kinetic (30%), missiles (32%), blasts (40%) and shockwaves (15%) are unchanged.",
      "Fly inside an enemy body to shoot past its plating and it now reacts instantly, before you can do anything: 2.2x its contact damage and a 1,500 + 90 x tier u/s shove away from the hull (about 1,770 u/s at legendary), plus a hard screen shake.",
      "The swat has a 1.4s cooldown per enemy, only triggers when the ship is genuinely over the hull (half the body radius, clamped to 45-260u), and stunned bodies cannot swat.",
    ],
  },
  {
    version: "2.1.2",
    date: "21 Nov 2026",
    title: "Crippled legs and plated limbs",
    points: [
      "Legs now cripple before they snap: a limb that falls below 35% of its health stops carrying weight or steering, and its walk cycle freezes. It is still attached and still shootable, it just does nothing. At 50% it behaves normally.",
      "Walking speed and turn rate both scale with the share of healthy limbs, so a body shot up to its knees limps and turns slowly, and a body with no working limbs cannot move or turn at all.",
      "Legendary enemies now carry 1 plating layer on their legs and mythical enemies 2. The slabs are drawn around the legs, and shots that land on a plated limb are swallowed by the hull plating instead of the leg.",
    ],
  },
  {
    version: "2.1.1",
    date: "21 Nov 2026",
    title: "Heavy cannons and broken legs",
    points: [
      "The Heavy Cannon is now hitscan: a 1,200u instant line instead of a travelling slug, so there is nothing to outrun. It still kicks the shooter backwards and still hits for 1.8x contact damage.",
      "Heavy Cannon impacts on the ship kick the camera hard on top of the usual hit shake, and get a bigger blast ring and spark burst.",
      "Destroyed legs drag the turn rate down again: turn speed is multiplied by the share of legs still attached, so half the legs means half the turn rate, and a legless body cannot turn at all. Rarity still only bends turning for legendary (0.9x) and mythical (0.8x).",
    ],
  },
  {
    version: "2.1.0",
    date: "21 Nov 2026",
    title: "Enemy weapon overhaul",
    points: [
      "Retired five cannon upgrades: Piercing Rounds, Plate Breaker, Core Seeker, Fragmentation Rounds and Rail Coils. Old saves drop those levels; the main cannon now has damage, rate, barrels and crit only and is due a rework.",
      "Every enemy can now turn up armed. Bodies that never carry a gun or a shield generator by design roll for one from epic upward: gun chance 12% + 6%/tier, shield chance 10% + 5%/tier (30%/25% at epic, 42%/35% at mythical).",
      "Four new turrets: Scatter Cannon (7 large, slow kinetic pellets), Heavy Cannon (5s reload, 1.8x contact damage, 950u/s homing slug, kicks the hull backwards), Laser Emitter (1,500u/s energy lance that ignores kinetic shields) and Rotary Gun (fast, weak kinetic spray with a short engagement range).",
      "Signature guns: Hornets, Soldier Ants, Yellowjackets and Locusts carry rotary guns; Scorpions, Scarabs and Bombardiers mount scatter cannons; Rhinos, Dung Beetles and Weevils get heavy cannons; Dragonflies, Fireflies, Jewel Beetles and the Serpent use lasers.",
    ],
  },
  {
    version: "2.0.9",
    date: "21 Nov 2026",
    title: "Legs no longer drag the turn rate",
    points: [
      "Turning is a pure species stat again: the leg-damage penalty from 2.0.8 is gone. Losing half the legs, or all of them, leaves the turn rate untouched.",
      "Legs still drive walking speed (mobility), so a shredded body still slows to a crawl, it just keeps its full steering.",
    ],
  },
  {
    version: "2.0.8",
    date: "21 Nov 2026",
    title: "Enemies that can actually turn",
    points: [
      "Rarity no longer divides turn rate: common through epic all turn at the species rate (the old formula divided it by up to 4.2x), legendary turns at 0.9x and mythical at 0.8x. A mythical now swings around in about two seconds instead of ten.",
      "Legs are now the steering: each destroyed leg part scales the turn rate down in proportion to the legs still attached. Half the legs gone means half the turn rate, and a legless body cannot turn at all (it also cannot walk). Serpentine bodies have no legs and keep steering normally.",
      "The admin spawner remembers the species and rarity you last picked (browser storage), so reopening the panel lands on the same test subject.",
    ],
  },
  {
    version: "2.0.7",
    date: "21 Nov 2026",
    title: "Plating you can actually see (and hit)",
    points: [
      "Armour slabs stand ~4x thicker again: 20u base + 10u per extra layer + 26% of the plate's own radius, capped at 1.9x the part. They are now gunmetal plates with a bevelled lip, a bright outer rim and one ridge per layer, instead of a pale outline.",
      "Shots now stop on the plating itself. The old collision was a single circle around the whole silhouette, so on winged or leggy species rounds vanished in empty air well before the armour; bullets and beams test the actual slab shapes (with a capped shell radius for the broad phase), so they visibly strike steel.",
      "Plate hits throw a spark burst and a flash ring, and fast rounds get intermediate-position samples so they cannot tunnel straight through a thin slab between frames.",
      "Fixed a separate ring bug: a fast shockwave could jump past the ship between frames (the old +-26u band test), so shell-break blasts now always register on the way out.",
    ],
  },
  {
    version: "2.0.6",
    date: "21 Nov 2026",
    title: "Real armour plating, proximity cannon",
    points: [
      "Enemy plating is now a genuine second health bar instead of a token outline. Every layer holds 60% of the enemy's total hull, and tier 2/3/4/5 carry 1/2/3/4 layers, so a mythical body brings 3.8M points of armour to the fight.",
      "Every damage type now wears the plates down: bullets 30% of their damage, missiles and flak 40%, beams 22%, area blasts 40% and shockwaves 15% (EMP, chain lightning and sonic still skip shelled enemies). Plate Breaker multiplies that by up to 2.5x, and a shattered layer's shockwave now scales with the enemy's own bite instead of its plate HP, so it cannot nuke a screen.",
      "Plating is drawn as solid steel slabs: a dark underlay for thickness, a filled top face tinted to the species, a bright rim, and one ridge per remaining layer. It sits under the whole body, darkens as it is chewed up, and no longer reads as a thin outline.",
      "The base's siege cannon is now proximity-fused: any enemy inside the base's 1,760u alert band powers it, and it stays online for 120s after the band clears. Taking damage no longer powers it; the retaliation blast still erases whatever hit the hull.",
    ],
  },
  {
    version: "2.0.5",
    date: "21 Nov 2026",
    title: "Admin test range",
    points: [
      "The admin panel gains a TEST RANGE section. TELEPORT TO EMPTY MAP drops the ship on a blank stretch of the outer ring, directly opposite the base, and switches off every ambient spawn: world seeding, chunk top-up, the visibility floor and the boss pass all stay silent until you leave.",
      "Enemies, hostile projectiles and mines are wiped on entry; LEAVING EMPTY MAP puts the ship back where it stood (or at the base if the run never seeded) and normal spawning resumes.",
      "A spawner picks any enemy species and any rarity from Common to Mythical, spawning one or five copies toward the cursor at 520–1,100u. Hand-spawned enemies are hostile immediately, and the world serpent can be summoned by hand even though its ambient boss pass stays disabled.",
      "CLEAR wipes the test range in one press. The test-range flag is session-only: a reload always returns to the live hive, and spawning is ignored unless admin mode is on.",
    ],
  },
  {
    version: "2.0.4",
    date: "21 Nov 2026",
    title: "Energy shields are hard walls",
    points: [
      "Enemy energy shields no longer have charge to strip. A blocked hit deals no damage and the bubble never depletes, collapses, re-arms or regenerates: it stays up until its Shield Generator part is destroyed.",
      "Only energy, shock and thermal damage passes through a bubble. Kinetic, physical, explosive and corrosive rounds and beams now stop dead at the hex edge with a cyan flash instead of chipping the shield or slipping through.",
      "The Rail Sniper no longer ignores energy shields. Only the Shield-Bypass Laser bypasses bubbles, and the rail is still stopped by hull shells.",
      "Damage-type tooltips and the stat compendium now describe the new rule; the old 8% strip constant is gone.",
    ],
  },
  {
    version: "2.0.3",
    date: "21 Nov 2026",
    title: "Particle budget pass",
    points: [
      "Particles are now pooled and recycled, and expired sparks are removed with a swap-pop instead of shifting the whole array. A busy fight no longer allocates and discards thousands of throwaway records.",
      "Sparks spawned outside the camera view are rejected immediately, the live budget drops from 1,500 to 900 at far zoom, and bursts emit 45% fewer sparks there. Close-up effects keep their full count.",
      "Small particles are drawn as one-pixel point sprites rather than three-, four- and six-sided paths. Particles under 2.5 screen pixels, or any particle at far zoom, take the cheap path; large close-up pieces keep their full shapes.",
      "Particle stroke/fill styles are cached between adjacent sparks, so a same-coloured burst no longer changes canvas state for every particle.",
    ],
  },
  {
    version: "2.0.2",
    date: "21 Nov 2026",
    title: "Kinetic shields, a much quieter inner map, and a full stat compendium",
    points: [
      "The base cannon now carries kinetic damage explicitly. Enemy energy-shield bubbles stop kinetic rounds instead of letting them pass through: each hit strips 8% of the generator's shield, the bubble collapses for 4s at zero, then re-arms at 40% capacity. Explosive and corrosive rounds still slip through, and bypass beams still ignore bubbles.",
      "Epic and higher zones spawn far less. Spawn weight is now 2.6 / 2.2 / 1.8 / 0.32 / 0.16 / 0.075 per chunk (was 2.6 / 2.2 / 1.8 / 0.56 / 0.44 / 0.36), local caps are 56 / 48 / 40 / 14 / 8 / 4 (was 56 / 48 / 40 / 18 / 10 / 5), and the seed-probability floor dropped from 38% to 3%.",
      "The visibility floor in legendary and mythical zones now spawns rare-tier enemies at most, so it cannot refill the core with legendaries. Each higher inner ring holds fewer residents than the one outside it.",
      "The complete enemy, weapon, shield, armour, optics, utility, ability and upgrade stat compendium now lives in docs/STATS.md.",
    ],
  },
  {
    version: "2.0.1",
    date: "21 Nov 2026",
    title: "Max-zoom performance pass and a cleaner mythical centre",
    points: [
      "Enemy detail now scales with both screen size and camera zoom. Close insects keep their full bodies; mid zoom drops plating and fine limbs; fully zoomed out turns every insect into a cheap species-coloured marker.",
      "Shield plating is drawn as a single species-tinted rim under the body instead of stacked grey fills. Dense mythical packs no longer merge into a white blob, and small plates can no longer float over wings as grey hexes.",
      "Large enemies separate using their real body sizes, melee insects stop at the edge of their own body, and the legendary/mythical population caps are lower. The centre of the map no longer piles a dozen titans on top of each other.",
      "Canvas shadows are limited to small on-screen pieces. Enemy projectiles, particles, loose components and credit motes all switch to cheap markers at far zoom.",
    ],
  },
  {
    version: "2.0",
    date: "21 Nov 2026",
    title: "Bulk upgrades, persistent admin, exploding components and global vision",
    points: [
      "Admin mode now stays enabled when you press HOME and return to the title screen. Its flags live in this tab's session storage and are never written into your pilot save.",
      "Upgrade cards have 1x / 5x / 10x / MAX buy buttons. MAX purchases as many levels as your credits allow, and every button shows the full price before you commit.",
      "Broken enemy weapons and shield parts now detonate in a visible shockwave. The expanding blast damages the breaking enemy's own hull, other enemies and the player as it sweeps past.",
      "Enemy plating layers also burst into a shockwave when their shield breaks, instead of vanishing silently.",
      "The 1.3x vision increase is now the global baseline instead of only applying inside the base's alert ring. Optics still zoom out from there.",
      "Enemy damage is doubled at every rarity. The existing 3x step between rarity tiers is unchanged.",
    ],
  },
  {
    version: "1.9",
    date: "21 Nov 2026",
    title: "Circular player construct, whole-map spawns, credit drops and a retaliating base",
    points: [
      "The player is no longer a ship. It is a circular construct with three pumping gimbal arms, counter-rotating armour rings, eight orbiting ring segments, three sensor motes and a forward iris — all visibly animated.",
      "Its three weapons sit on radial hardpoints at 120 degrees, rest pointing outward and rotate to track their firing direction.",
      "Every walkable chunk is populated at run start, so enemies exist across the whole map immediately and stay where they spawned. Rarity bands keep their density curve.",
      "Breaking an enemy part shakes loose 1-4 credit motes worth ~4% of the part's component value; they home in and are collected automatically.",
      "Any enemy that damages the base is instantly destroyed. Base damage powers the siege cannon for 120 seconds; it goes dormant again after two quiet minutes.",
      "Inside the base's 1,760u alert ring the camera pulls back for 1.3x player vision, and the HUD shows cannon status.",
    ],
  },
  {
    version: "1.8",
    date: "21 Nov 2026",
    title: "Turret-system rework, a far more detailed ship and rotating weapon mounts",
    points: [
      "Enemies no longer target the base: they will not charge it, aim at it or gnaw on its hull. They now chase the ship straight through the 1,760u defence ring, so the cannon and hex turrets engage them inside turret range.",
      "The base is still solid — stray rounds that cross its hull damage the structure, and the HUD now reads HOSTILES IN BASE RANGE instead of BASE UNDER ATTACK.",
      "The player ship is rebuilt from layered hull plates, swept wings with inset armour, a glass canopy, a fixed nose cannon, a reactor spine, engine block, tail fins, running lights, vents, rivets and panel seams.",
      "Every fitted weapon now sits on a rotating hex hardpoint and tracks the direction it fires, swinging smoothly back to the nose when it has no target.",
    ],
  },
  {
    version: "1.7.1",
    date: "20 Nov 2026",
    title: "Hex turrets hit four times harder and stop granting bestiary credit",
    points: [
      "Point-defence tracers now deal 4x damage: 18 -> 72 per shot, with the same 0.24s cadence and 850u range.",
      "Kills finished by the base cannon or its hex turrets no longer unlock bestiary entries or show discovery banners; only player-credited kills count.",
    ],
  },
  {
    version: "1.7",
    date: "20 Nov 2026",
    title: "Hex turrets, legendary siege shells and a 120s repair lockout",
    points: [
      "Enemies now switch to the base at 1,760u — just 10% past the cannon's 1,600u reach.",
      "Six small turrets ride the base's hex pylons, spinning to Track and firing weak, fast tracers at anything within 850u.",
      "The siege cannon stays offline until a rare or better enters range. Its shell now one-shots legendaries; mythicals survive at 45% hull.",
      "Enemies finished mostly by the base or its turrets drop no components at all.",
      "The base only repairs after 120 seconds without taking damage.",
      "One hex turret is destroyed for every sixth of the base's integrity lost; the HUD shows the remaining turrets.",
    ],
  },
  {
    version: "1.6.1",
    date: "20 Nov 2026",
    title: "Stable preview, solid bestiary cards, compact cores",
    points: [
      "The live preview is now served from a fresh production build with versioned chunk names, no-store headers and a self-healing version watchdog, so it can no longer fall back to an old 1.1 page.",
      "Bestiary entry cards and the hover detail card are fully opaque: the arena behind them no longer shows through.",
      "Enemy cores are compact again and tucked underneath the body, so segments and plating cover them instead of the core swallowing the silhouette.",
    ],
  },
  {
    version: "1.6",
    date: "20 Nov 2026",
    title: "Base siege cannon and a destructible base",
    points: [
      "The base mounts a slow siege cannon: one shell incinerates any enemy up to epic tier.",
      "Every shot kicks the barrel back hard, with a muzzle blast, plasma vent and camera shake.",
      "Insects inside 1.4x the cannon's reach charge the base and ignore your ship.",
      "The base has hull integrity; legendaries and mythicals tear through it in seconds.",
      "If the base dies, every stored component and half your credits are lost, the blast kills every insect and the run ends at the title screen.",
      "The base now appears in a different spot in the outer ring on every run.",
    ],
  },
  {
    version: "1.5",
    date: "20 Nov 2026",
    title: "Moth lag, roomier bestiary, visible loadout",
    points: [
      "Fixed the massive lag around the big white moth (huge shield/part blurs).",
      "Bestiary is larger and scrolls; hover cards pop up over the entry.",
      "Weapons, shields, armour, optics and utilities now show on the player hull.",
      "Added glow, charge and shield-arc effects to fitted hardware.",
    ],
  },
  {
    version: "1.4",
    date: "20 Nov 2026",
    title: "Bestiary, damage types and grey plating",
    points: [
      "Returning home now saves the run before leaving.",
      "Summoning insects can no longer clone themselves forever.",
      "Armour is a solid grey layer around parts; higher rarities get more layers.",
      "Energy shields block energy completely, but physical rounds pass through.",
      "Weapons show their damage type; attacks look different by type.",
      "New bestiary (bee button) with families, stats, drops and silhouettes.",
      "Rail reload 30% slower, deep-zone spawns 60% lower, zoom 30% shorter.",
    ],
  },
  {
    version: "1.3",
    date: "20 Nov 2026",
    title: "Crowded rings, huge cores, clearer guns",
    points: [
      "Settings and changelog on the title screen are now icon buttons.",
      "Outer zones spawn far more enemies, with a separate cap for every zone.",
      "At least a few enemies are kept inside the view at all times.",
      "Cores are 10x larger; armour plating now hugs every part outline in grey.",
      "Wide-Field Optics zoom out seven times further.",
      "Auto-fire never shoots off-screen; every weapon has its own range.",
      "New setting: coloured weapon range circles. Crafting menu has item art.",
    ],
  },
  {
    version: "1.2",
    date: "20 Nov 2026",
    title: "Bigger title, denser world",
    points: [
      "Title screen rebuilt: a huge WOFGUE.IO wordmark over the game's neon grid.",
      "Small geometric insects drift across the title background.",
      "Removed the username label and the tagline — just the name field and Play.",
      "Every zone now spawns at the same rate; the population cap is 36.",
      "Deeper zones feel emptier only because their enemies are far larger.",
    ],
  },
  {
    version: "1.1",
    date: "20 Nov 2026",
    title: "Title screen, settings and hover info",
    points: [
      "New title screen: Wofgue.io, username entry, Play, settings and changelog.",
      "Real settings panel (title screen and in-game) with every option in one place.",
      "Hover a loose component to see its name, rarity, value and mass — toggleable.",
      "The snake boss is disabled for now.",
      "Responsive layout for phones, tablets and desktop browsers.",
      "Save codes can be exported and restored from settings.",
    ],
  },
  {
    version: "1.0.1",
    date: "20 Nov 2026",
    title: "Combat and world pass",
    points: [
      "Missiles mark exact pieces on right-click and ignore everything en route.",
      "Crafted weapons fire automatically; B toggles the rack.",
      "Epic+ enemies wear grey plating: kinetic damage only, immune to lasers and shock.",
      "Lower, capped enemy population; centipede and snake bodies curve and are much longer.",
      "Removed bar text, CRIPPLED/IMMOBILISED and the HANGAR lettering.",
    ],
  },
  {
    version: "1.0",
    date: "19 Nov 2026",
    title: "First content expansion",
    points: [
      "22 new insect species plus a segmented boss, for 32 in total.",
      "51 recipes: 19 weapons, 10 shields, 11 armours, optics, utilities and 8 abilities.",
      "Ability hotbar on Z/X/C/V/F, admin sandbox, new crafting and loadout screens.",
    ],
  },
];
