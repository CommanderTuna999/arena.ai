(()=>{"use strict";module.exports = [
"[project]/src/components/GameClient.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GameClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/game/engine.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$render$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/render.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/math.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const SAVE_KEY = "neon-hive-save-v1";
const PID_KEY = "neon-hive-pid";
function getPid() {
    let id = localStorage.getItem(PID_KEY);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(PID_KEY, id);
    }
    return id;
}
async function loadSave(pid) {
    let local = null;
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) local = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["migrate"])(JSON.parse(raw));
    } catch  {}
    let remote = null;
    try {
        const ctrl = new AbortController();
        const to = setTimeout(()=>ctrl.abort(), 3500);
        const res = await fetch(`/api/save?id=${encodeURIComponent(pid)}`, {
            signal: ctrl.signal
        });
        clearTimeout(to);
        if (res.ok) {
            const j = await res.json();
            if (j.save) remote = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["migrate"])(j.save);
        }
    } catch  {}
    if (local && remote) return local.ts >= remote.ts ? local : remote;
    return local ?? remote ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["newSave"])();
}
function GameClient() {
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const gameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [hud, setHud] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [menu, setMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [help, setHelp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    menuRef.current = menu;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let raf = 0;
        let stopped = false;
        let hudTimer;
        const cleanups = [];
        (async ()=>{
            const pid = getPid();
            const save = await loadSave(pid);
            if (stopped) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const game = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Game"](save, pid);
            gameRef.current = game;
            if (!localStorage.getItem("neon-hive-help")) setHelp(true);
            const resize = ()=>{
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                const w = window.innerWidth, h = window.innerHeight;
                canvas.width = Math.floor(w * dpr);
                canvas.height = Math.floor(h * dpr);
                canvas.style.width = w + "px";
                canvas.style.height = h + "px";
                game.resize(w, h, dpr);
            };
            resize();
            window.addEventListener("resize", resize);
            cleanups.push(()=>window.removeEventListener("resize", resize));
            const isTyping = (t)=>t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
            const kd = (e)=>{
                if (isTyping(e.target)) return;
                if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
                if (e.code === "KeyE") {
                    if (menuRef.current) {
                        setMenu(false);
                        return;
                    }
                    if (game.nearBase()) {
                        game.blur();
                        setMenu(true);
                    }
                    return;
                }
                if (e.code === "Escape") {
                    setMenu(false);
                    return;
                }
                if (menuRef.current) return;
                if (!e.repeat) game.keyDown(e.code);
                else game.input.keys.add(e.code);
            };
            const ku = (e)=>game.keyUp(e.code);
            window.addEventListener("keydown", kd);
            window.addEventListener("keyup", ku);
            window.addEventListener("blur", ()=>game.blur());
            cleanups.push(()=>{
                window.removeEventListener("keydown", kd);
                window.removeEventListener("keyup", ku);
            });
            const mm = (e)=>{
                const r = canvas.getBoundingClientRect();
                game.input.mx = e.clientX - r.left;
                game.input.my = e.clientY - r.top;
            };
            const md = (e)=>{
                mm(e);
                e.preventDefault();
                game.mouseDown(e.button);
            };
            const mu = (e)=>game.mouseUp(e.button);
            const cm = (e)=>e.preventDefault();
            const wh = (e)=>{
                e.preventDefault();
                game.wheel(e.deltaY);
            };
            canvas.addEventListener("mousemove", mm);
            canvas.addEventListener("mousedown", md);
            window.addEventListener("mouseup", mu);
            canvas.addEventListener("contextmenu", cm);
            canvas.addEventListener("wheel", wh, {
                passive: false
            });
            cleanups.push(()=>{
                canvas.removeEventListener("mousemove", mm);
                canvas.removeEventListener("mousedown", md);
                window.removeEventListener("mouseup", mu);
                canvas.removeEventListener("contextmenu", cm);
                canvas.removeEventListener("wheel", wh);
            });
            const vis = ()=>{
                if (document.visibilityState === "hidden") game.beaconSave();
            };
            const unload = ()=>game.beaconSave();
            document.addEventListener("visibilitychange", vis);
            window.addEventListener("pagehide", unload);
            cleanups.push(()=>{
                document.removeEventListener("visibilitychange", vis);
                window.removeEventListener("pagehide", unload);
                game.beaconSave();
            });
            let last = performance.now();
            const loop = (now)=>{
                const dt = (now - last) / 1000;
                last = now;
                game.update(dt);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$render$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["render"])(game, ctx);
                raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
            setHud(game.hud());
            hudTimer = setInterval(()=>setHud(game.hud()), 100);
            void game.pushServer();
        })();
        return ()=>{
            stopped = true;
            cancelAnimationFrame(raf);
            if (hudTimer) clearInterval(hudTimer);
            cleanups.forEach((c)=>c());
        };
    }, []);
    const closeHelp = ()=>{
        localStorage.setItem("neon-hive-help", "1");
        setHelp(false);
    };
    const game = gameRef.current;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 select-none overflow-hidden bg-[#04050c] font-mono text-cyan-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                className: "block cursor-crosshair"
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none fixed inset-0",
                style: {
                    background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,10,0.65) 100%)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            !hud && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 grid place-items-center text-xl tracking-[0.4em] text-cyan-300",
                children: "LOADING SAVE…"
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 151,
                columnNumber: 16
            }, this),
            hud && game && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Hud_, {
                hud: hud,
                onOpen: ()=>{
                    game.blur();
                    setMenu(true);
                },
                onHelp: ()=>setHelp(true)
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 152,
                columnNumber: 23
            }, this),
            hud && game && menu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Hangar, {
                game: game,
                hud: hud,
                onClose: ()=>setMenu(false)
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 153,
                columnNumber: 31
            }, this),
            help && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Help, {
                onClose: closeHelp
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 154,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 148,
        columnNumber: 5
    }, this);
}
/* ---------------------------------------------------------------- HUD */ function Bar({ v, max, color, label, h = 10 }) {
    const f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(max > 0 ? v / max : 0, 0, 1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-56 overflow-hidden rounded-sm border border-white/20 bg-black/50",
        style: {
            height: h + 6
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-y-0 left-0 transition-[width] duration-100",
                style: {
                    width: `${f * 100}%`,
                    background: color,
                    boxShadow: `0 0 12px ${color}`
                }
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this),
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 flex items-center justify-between px-1.5 text-[10px] font-bold text-white/90 mix-blend-difference",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 165,
                        columnNumber: 149
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(v),
                            " / ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(max)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 165,
                        columnNumber: 169
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 165,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 163,
        columnNumber: 5
    }, this);
}
function Hud_({ hud, onOpen, onHelp }) {
    const hpCol = hud.hp / hud.maxHp > 0.5 ? "#2dffa0" : hud.hp / hud.maxHp > 0.25 ? "#ffd24d" : "#ff4d6d";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Bar, {
                        v: hud.hp,
                        max: hud.maxHp,
                        color: hpCol,
                        label: "HULL",
                        h: 12
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    hud.maxShield > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Bar, {
                        v: hud.shield,
                        max: hud.maxShield,
                        color: "#4dd2ff",
                        label: "SHIELD",
                        h: 8
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 176,
                        columnNumber: 31
                    }, this),
                    hud.hasBoost && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Bar, {
                        v: hud.boost,
                        max: 100,
                        color: "#ff9d4d",
                        label: "BOOST",
                        h: 6
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 177,
                        columnNumber: 26
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 flex items-center gap-2 text-sm font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(255,225,77,0.7)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-block h-3 w-3 rotate-45 border border-yellow-300 bg-yellow-300/30"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            " ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(hud.credits),
                            " CR"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1.5",
                        children: hud.harp.map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative h-7 w-12 overflow-hidden rounded-sm border border-cyan-300/40 bg-black/50 text-[9px]",
                                title: "Harpoon (right click)",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 flex items-center justify-center font-bold",
                                        style: {
                                            color: h.state === 0 ? "#4dffd2" : h.state === 2 ? "#ffd24d" : "#7df9ff"
                                        },
                                        children: h.state === 0 ? "READY" : h.state === 1 ? "FLY" : h.state === 2 ? "HOOKED" : "REEL"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 184,
                                        columnNumber: 15
                                    }, this),
                                    h.state === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-0 left-0 h-[3px]",
                                        style: {
                                            width: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(h.load, 0, 1) * 100}%`,
                                            background: h.load > 0.9 ? "#ff4d6d" : "#ffd24d"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 187,
                                        columnNumber: 33
                                    }, this),
                                    h.state !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute left-0 top-0 h-[2px] bg-red-400",
                                        style: {
                                            width: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(h.hp, 0, 1) * 100}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 188,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this),
                    hud.tp.has && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] text-fuchsia-300",
                        children: [
                            "[T] RECALL ",
                            hud.tp.ch > 0 ? `CHANNELING ${Math.round(hud.tp.ch * 100)}%` : hud.tp.cd > 0 ? `COOLDOWN ${Math.ceil(hud.tp.cd)}s` : "READY"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 174,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[11px] text-cyan-300/70",
                children: [
                    "● ",
                    hud.online,
                    " pilot",
                    hud.online === 1 ? "" : "s",
                    " online · ",
                    hud.fps,
                    " fps",
                    hud.zoomOn ? " · wheel = zoom" : ""
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 199,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1",
                children: hud.toasts.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-sm border border-white/10 bg-black/60 px-2 py-1 text-xs",
                        style: {
                            color: t.color,
                            textShadow: `0 0 8px ${t.color}`
                        },
                        children: t.msg
                    }, t.id, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 205,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-3 right-3 flex items-center gap-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onHelp,
                    className: "rounded-sm border border-cyan-300/40 bg-black/60 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-400/20",
                    children: "? CONTROLS"
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 210,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 209,
                columnNumber: 7
            }, this),
            hud.nearBase && !hud.dead && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onOpen,
                className: "absolute bottom-16 left-1/2 -translate-x-1/2 animate-pulse rounded-sm border-2 border-cyan-300 bg-cyan-400/15 px-6 py-2 text-sm font-bold tracking-widest text-cyan-100 shadow-[0_0_24px_rgba(77,255,210,0.5)] hover:bg-cyan-400/30",
                children: "OPEN HANGAR [E]"
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 214,
                columnNumber: 9
            }, this),
            hud.dead && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-0 grid place-items-center bg-red-950/40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-4xl font-black tracking-[0.3em] text-red-400 drop-shadow-[0_0_20px_#ff2d55]",
                            children: "SHIP DESTROYED"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 221,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-2 text-red-200",
                            children: [
                                "Rebuilding at hangar in ",
                                Math.ceil(hud.respawn),
                                "…"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 222,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 220,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 219,
                columnNumber: 9
            }, this),
            hud.hold > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 text-xs text-red-300",
                children: [
                    "RELEASING HARPOON… ",
                    Math.round(hud.hold * 100),
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 226,
                columnNumber: 24
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 173,
        columnNumber: 5
    }, this);
}
function Help({ onClose }) {
    const rows = [
        [
            "WASD / Arrows",
            "Fly"
        ],
        [
            "Mouse",
            "Aim"
        ],
        [
            "Left click / SPACE",
            "Fire cannon (+ crafted weapons)"
        ],
        [
            "Right click",
            "Fire harpoon at a glowing component"
        ],
        [
            "Hold R over hooked part",
            "Release harpoon"
        ],
        [
            "SHIFT",
            "Afterburner (upgrade)"
        ],
        [
            "T",
            "Recall beacon (craftable)"
        ],
        [
            "E",
            "Open hangar at your base"
        ],
        [
            "Mouse wheel",
            "Zoom out (craftable optics)"
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 z-50 grid place-items-center bg-black/70 p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-h-full w-full max-w-xl overflow-auto rounded-md border border-cyan-300/60 bg-[#060a18]/95 p-6 shadow-[0_0_40px_rgba(77,255,210,0.25)]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-center text-3xl font-black tracking-[0.25em] text-cyan-200 drop-shadow-[0_0_14px_#4dffd2]",
                    children: "NEON HIVE"
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 246,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-center text-xs text-cyan-100/70",
                    children: "Hunt geometric insects and constructs. Shoot their armour off, cripple their legs, then destroy the core."
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 247,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm",
                    children: rows.map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-yellow-300",
                                    children: k
                                }, k, false, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 249,
                                    columnNumber: 36
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: v
                                }, v, false, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 249,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 249,
                            columnNumber: 34
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 248,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "mt-4 list-disc space-y-1 pl-5 text-xs text-cyan-100/80",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                "Destroyed pieces drop components. Harpoon them and tow them into the ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    className: "text-yellow-300",
                                    children: "yellow hex"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 252,
                                    columnNumber: 84
                                }, this),
                                " at your hangar."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 252,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: "Too heavy? Stronger cables, more harpoons on one part, or a better winch help. Overloaded cables snap."
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 253,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: "Sell components for credits or store them to craft weapons, shields, armour, optics and a teleporter."
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 254,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: "Danger rises toward the centre of the map: bigger, deadlier, more layered enemies. Your progress autosaves."
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 255,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 251,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClose,
                    className: "mt-5 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/20 py-2 font-bold tracking-widest text-cyan-100 hover:bg-cyan-400/40",
                    children: "LAUNCH"
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 257,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/GameClient.tsx",
            lineNumber: 245,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 244,
        columnNumber: 5
    }, this);
}
function CompIcon({ c, size = 44 }) {
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for(let i = 0; i < c.poly.length; i += 2){
        minx = Math.min(minx, c.poly[i]);
        maxx = Math.max(maxx, c.poly[i]);
        miny = Math.min(miny, c.poly[i + 1]);
        maxy = Math.max(maxy, c.poly[i + 1]);
    }
    const w = maxx - minx || 1, h = maxy - miny || 1, s = Math.max(w, h);
    const pts = [];
    for(let i = 0; i < c.poly.length; i += 2)pts.push(`${(c.poly[i] - minx) / s * 40 + 4 + (40 - w / s * 40) / 2},${(c.poly[i + 1] - miny) / s * 40 + 4 + (40 - h / s * 40) / 2}`);
    const col = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.tier].color;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 48 48",
        style: {
            filter: `drop-shadow(0 0 4px ${col})`
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
            points: pts.join(" "),
            fill: col + "30",
            stroke: col,
            strokeWidth: 1.8,
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/src/components/GameClient.tsx",
            lineNumber: 275,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 274,
        columnNumber: 5
    }, this);
}
function Hangar({ game, hud, onClose }) {
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("upgrades");
    const tabs = [
        [
            "upgrades",
            "UPGRADES"
        ],
        [
            "craft",
            "CRAFTING"
        ],
        [
            "storage",
            `STORAGE ${hud.inv}/${hud.cargo}`
        ],
        [
            "loadout",
            "LOADOUT"
        ],
        [
            "settings",
            "SYSTEM"
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 z-40 grid place-items-center bg-black/60 p-2 sm:p-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-full max-h-[760px] w-full max-w-5xl flex-col rounded-md border border-cyan-300/60 bg-[#060a18]/97 shadow-[0_0_50px_rgba(77,255,210,0.2)]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 border-b border-cyan-300/30 p-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-2 text-sm font-black tracking-[0.3em] text-cyan-200",
                            children: "HANGAR"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 287,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-1 flex-wrap gap-1",
                            children: tabs.map(([id, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setTab(id),
                                    className: `rounded-sm border px-3 py-1 text-xs font-bold tracking-wider ${tab === id ? "border-cyan-300 bg-cyan-400/25 text-white" : "border-white/15 text-cyan-200/70 hover:bg-white/10"}`,
                                    children: label
                                }, id, false, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 290,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 288,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-2 text-sm font-bold text-yellow-300",
                            children: [
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(game.save.credits),
                                " CR"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "rounded-sm border border-red-400/60 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20",
                            children: "CLOSE [E]"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 294,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 286,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-h-0 flex-1 overflow-auto p-3",
                    children: [
                        tab === "upgrades" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Upgrades, {
                            game: game
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 297,
                            columnNumber: 34
                        }, this),
                        tab === "craft" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Craft, {
                            game: game
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 298,
                            columnNumber: 31
                        }, this),
                        tab === "storage" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Storage, {
                            game: game
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 299,
                            columnNumber: 33
                        }, this),
                        tab === "loadout" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Loadout, {
                            game: game
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 300,
                            columnNumber: 33
                        }, this),
                        tab === "settings" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Settings, {
                            game: game
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 301,
                            columnNumber: 34
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 296,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/GameClient.tsx",
            lineNumber: 285,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 284,
        columnNumber: 5
    }, this);
}
function Upgrades({ game }) {
    const [cat, setCat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("weapons");
    const save = game.save;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex flex-wrap gap-1",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UP_CATS"].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCat(c.id),
                        className: "rounded-sm border px-3 py-1 text-xs font-bold tracking-wider",
                        style: {
                            borderColor: cat === c.id ? c.color : "rgba(255,255,255,0.15)",
                            color: c.color,
                            background: cat === c.id ? c.color + "22" : "transparent"
                        },
                        children: c.name.toUpperCase()
                    }, c.id, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 315,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 313,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-2 md:grid-cols-2",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPGRADES"].filter((u)=>u.cat === cat).map((u)=>{
                    const l = save.upgrades[u.id] ?? 0;
                    const maxed = l >= u.max;
                    const cost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upgradeCost"])(u, l);
                    const can = !maxed && save.credits >= cost;
                    const color = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UP_CATS"].find((c)=>c.id === u.cat).color;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-sm border border-white/15 bg-white/[0.03] p-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-bold",
                                        style: {
                                            color
                                        },
                                        children: u.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 328,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] text-white/60",
                                        children: [
                                            "LV ",
                                            l,
                                            "/",
                                            u.max
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 329,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 327,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[11px] text-white/60",
                                children: u.desc
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 331,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1.5 flex gap-px",
                                children: Array.from({
                                    length: u.max
                                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-1.5 flex-1",
                                        style: {
                                            background: i < l ? color : "rgba(255,255,255,0.1)"
                                        }
                                    }, i, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 333,
                                        columnNumber: 62
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 332,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 flex items-center justify-between gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-cyan-100",
                                        children: [
                                            u.fmt(l),
                                            !maxed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-emerald-300",
                                                children: [
                                                    " → ",
                                                    u.fmt(l + 1)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/GameClient.tsx",
                                                lineNumber: 336,
                                                columnNumber: 77
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 336,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        disabled: !can,
                                        onClick: ()=>game.buy(u.id),
                                        className: `rounded-sm border px-3 py-1 text-xs font-bold ${can ? "border-yellow-300 bg-yellow-300/15 text-yellow-200 hover:bg-yellow-300/30" : "border-white/10 text-white/30"}`,
                                        children: maxed ? "MAX" : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(cost)} CR`
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 337,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 335,
                                columnNumber: 15
                            }, this)
                        ]
                    }, u.id, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 326,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 318,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 312,
        columnNumber: 5
    }, this);
}
function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
}
function effectText(game, r, eff) {
    const st = game.stats;
    const e = eff;
    switch(r.id){
        case "pulse":
            return `Auto turret: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.dmg * 0.6 * e)} dmg every 0.45s`;
        case "scatter":
            return `6 pellets x ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.dmg * 0.55 * e)} dmg`;
        case "missile":
            return `2 homing missiles x ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.dmg * 2.2 * e)} dmg + splash`;
        case "lance":
            return `Beam ~${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.dmg * 0.45 * e * 8.3)} dps, pierces ${2 + Math.floor(e)} pieces`;
        case "deflector":
            return `+${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.hull * 0.45 * e)} shield`;
        case "absorber":
            return `+${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.hull * 0.22 * e)} shield, fast recharge`;
        case "reflector":
            return `+${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.hull * 0.32 * e)} shield, reflects bolts`;
        case "plating":
            return `+${Math.round(35 * e)}% max hull`;
        case "reactive":
            return `-${Math.round((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(12 * e, 0, 60))}% damage taken`;
        case "thorn":
            return `Hit shockwave ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(st.dmg * 3 * e)} dmg, +${Math.round(10 * e)}% hull`;
        case "lens":
            return `Zoom out to ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(1 / (1 + 0.4 * e), 0.28, 1).toFixed(2)}x`;
        case "recall":
            return `Channel ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(6 / (0.6 + 0.5 * e), 2, 6).toFixed(1)}s, cooldown ${Math.round((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(100 / (0.5 + 0.5 * e), 20, 100))}s`;
        default:
            return "";
    }
}
function Craft({ game }) {
    const [rid, setRid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPES"][0].id);
    const [sel, setSel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [msg, setMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const r = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPE_BY_ID"][rid];
    const inv = game.save.inventory;
    const chosen = sel.map((id)=>inv.find((c)=>c.id === id)).filter((c)=>!!c);
    const eff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["craftEfficiency"])(r, chosen);
    const problem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["recipeProblem"])(r, chosen);
    const toggle = (id)=>setSel((s)=>s.includes(id) ? s.filter((x)=>x !== id) : s.length >= r.n ? s : [
                ...s,
                id
            ]);
    const autoFill = ()=>{
        const sorted = [
            ...inv
        ].sort((a, b)=>b.tier - a.tier || b.mass - a.mass);
        const pick = [];
        if (r.need) {
            for (const c of sorted)if (pick.length < r.need.count && r.need.cats.includes(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KIND_CAT"][c.kind])) pick.push(c);
        }
        for (const c of sorted)if (pick.length < r.n && !pick.includes(c)) pick.push(c);
        setSel(pick.map((c)=>c.id));
    };
    const doCraft = ()=>{
        const res = game.craft(rid, sel);
        if (res) setMsg(res);
        else {
            setMsg(`Crafted ${r.name}!`);
            setSel([]);
        }
    };
    const slots = [
        "weapon",
        "shield",
        "armor",
        "optics",
        "utility"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-3 md:grid-cols-[260px_1fr]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: slots.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-1 text-[10px] font-bold tracking-widest text-white/50",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_NAME"][s].toUpperCase()
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 401,
                                columnNumber: 13
                            }, this),
                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPES"].filter((x)=>x.slot === s).map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setRid(x.id);
                                        setSel([]);
                                        setMsg("");
                                    },
                                    className: `mb-1 block w-full rounded-sm border px-2 py-1.5 text-left text-xs ${rid === x.id ? "border-yellow-300 bg-yellow-300/15" : "border-white/15 hover:bg-white/10"}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-bold text-cyan-100",
                                                    children: x.name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/GameClient.tsx",
                                                    lineNumber: 404,
                                                    columnNumber: 55
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-yellow-300",
                                                    children: stars(x.difficulty)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/GameClient.tsx",
                                                    lineNumber: 404,
                                                    columnNumber: 112
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/GameClient.tsx",
                                            lineNumber: 404,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[10px] text-white/50",
                                            children: [
                                                x.n,
                                                " components"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/GameClient.tsx",
                                            lineNumber: 405,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, x.id, true, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 403,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, s, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 400,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 398,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-sm border border-yellow-300/40 bg-yellow-300/5 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-lg font-black text-yellow-200",
                                        children: r.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 414,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-yellow-300",
                                        children: [
                                            "Difficulty ",
                                            stars(r.difficulty)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 415,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 413,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-white/70",
                                children: r.desc
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 417,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs text-cyan-200",
                                children: [
                                    "Needs ",
                                    r.n,
                                    " components",
                                    r.need ? ` (at least ${r.need.count}x ${r.need.cats.map((c)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_NAME"][c]).join(" or ")})` : "",
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 418,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 text-sm",
                                children: [
                                    "Efficiency: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        className: eff >= 1.2 ? "text-emerald-300" : "text-yellow-200",
                                        children: chosen.length ? `${Math.round(eff * 100)}%` : "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 422,
                                        columnNumber: 25
                                    }, this),
                                    chosen.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-2 text-xs text-emerald-200",
                                        children: effectText(game, r, eff)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 423,
                                        columnNumber: 35
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 421,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[10px] text-white/40",
                                children: "Efficiency = 60% + 30% per average component rarity tier (cores count +½), minus 5% per difficulty step. Better recipes need more parts."
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 425,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: autoFill,
                                        className: "rounded-sm border border-cyan-300/60 px-3 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20",
                                        children: "AUTO-FILL BEST"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 427,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setSel([]),
                                        className: "rounded-sm border border-white/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10",
                                        children: "CLEAR"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 428,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        disabled: !!problem,
                                        onClick: doCraft,
                                        className: `ml-auto rounded-sm border-2 px-5 py-1.5 text-sm font-black tracking-widest ${problem ? "border-white/10 text-white/30" : "border-yellow-300 bg-yellow-300/20 text-yellow-100 hover:bg-yellow-300/40"}`,
                                        children: "CRAFT"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 429,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 426,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs text-red-300",
                                children: [
                                    problem && chosen.length > 0 ? problem : "",
                                    msg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-emerald-300",
                                        children: [
                                            " ",
                                            msg
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 431,
                                        columnNumber: 107
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 431,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 412,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-1 mt-3 text-[10px] font-bold tracking-widest text-white/50",
                        children: [
                            "SELECT COMPONENTS (",
                            sel.length,
                            "/",
                            r.n,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 433,
                        columnNumber: 9
                    }, this),
                    inv.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-white/50",
                        children: "No components stored. Harpoon drops back to base first!"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 434,
                        columnNumber: 30
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4",
                        children: inv.map((c)=>{
                            const on = sel.includes(c.id);
                            const col = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.tier].color;
                            const need = r.need?.cats.includes(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KIND_CAT"][c.kind]);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>toggle(c.id),
                                className: "flex items-center gap-2 rounded-sm border p-1.5 text-left",
                                style: {
                                    borderColor: on ? "#ffe14d" : col + "66",
                                    background: on ? "rgba(255,225,77,0.15)" : "rgba(255,255,255,0.03)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CompIcon, {
                                        c: c,
                                        size: 36
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 442,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "min-w-0 text-[10px] leading-tight",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "truncate font-bold",
                                                style: {
                                                    color: col
                                                },
                                                children: c.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GameClient.tsx",
                                                lineNumber: 444,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-white/50",
                                                children: [
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.tier].name,
                                                    " · ",
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_NAME"][__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KIND_CAT"][c.kind]],
                                                    need ? " ✓" : ""
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/GameClient.tsx",
                                                lineNumber: 445,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 443,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, c.id, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 441,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 435,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 411,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 397,
        columnNumber: 5
    }, this);
}
function Storage({ game }) {
    const [below, setBelow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const inv = game.save.inventory;
    const mul = game.stats.sellMul;
    const total = inv.filter((c)=>c.tier <= below).reduce((s, c)=>s + Math.round(c.value * mul), 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex flex-wrap items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "Storage ",
                            inv.length,
                            "/",
                            game.stats.cargo
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 464,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white/40",
                        children: "|"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 465,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Sell everything up to"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 466,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: below,
                        onChange: (e)=>setBelow(Number(e.target.value)),
                        className: "rounded-sm border border-white/20 bg-black px-1 py-0.5",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"].map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: i,
                                children: r.name
                            }, r.id, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 468,
                                columnNumber: 35
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 467,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>game.sellBelow(below),
                        className: "rounded-sm border border-yellow-300 bg-yellow-300/15 px-3 py-1 font-bold text-yellow-200 hover:bg-yellow-300/30",
                        children: [
                            "SELL ALL (+",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(total),
                            " CR)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 470,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "ml-auto flex cursor-pointer items-center gap-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: game.save.autoSell,
                                onChange: (e)=>game.setAutoSell(e.target.checked)
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 471,
                                columnNumber: 77
                            }, this),
                            " Auto-sell docked components"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 471,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            inv.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "py-10 text-center text-white/50",
                children: "Nothing stored. Shoot enemy pieces, harpoon the glowing components and drag them into the yellow hex."
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 473,
                columnNumber: 28
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3",
                children: [
                    ...inv
                ].sort((a, b)=>b.tier - a.tier || b.value - a.value).map((c)=>{
                    const col = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.tier].color;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 rounded-sm border p-2",
                        style: {
                            borderColor: col + "77",
                            background: col + "0d"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CompIcon, {
                                c: c,
                                size: 52
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 479,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0 flex-1 text-[11px] leading-tight",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "truncate font-bold",
                                        style: {
                                            color: col
                                        },
                                        children: c.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 481,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-white/60",
                                        children: [
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.tier].name,
                                            " · ",
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_NAME"][__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KIND_CAT"][c.kind]]
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 482,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-white/40",
                                        children: [
                                            "Weight ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(c.mass)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 483,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 480,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>game.sellComp(c.id),
                                className: "rounded-sm border border-yellow-300/70 px-2 py-1 text-[11px] font-bold text-yellow-200 hover:bg-yellow-300/25",
                                children: [
                                    "SELL",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/src/components/GameClient.tsx",
                                        lineNumber: 485,
                                        columnNumber: 185
                                    }, this),
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(Math.round(c.value * mul))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 485,
                                columnNumber: 15
                            }, this)
                        ]
                    }, c.id, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 478,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 474,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 462,
        columnNumber: 5
    }, this);
}
function Loadout({ game }) {
    const save = game.save;
    const items = save.crafted;
    const opts = (slot)=>items.filter((i)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPE_BY_ID"][i.rid]?.slot === slot);
    const label = (id)=>{
        const it = items.find((i)=>i.id === id);
        return `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPE_BY_ID"][it.rid].name} (${Math.round(it.eff * 100)}%)`;
    };
    const SlotSel = ({ slot, idx, value, title })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-24 font-bold text-cyan-200",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 501,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: value ?? "",
                    onChange: (e)=>game.equip(slot, idx, e.target.value || null),
                    className: "min-w-0 flex-1 rounded-sm border border-white/20 bg-black px-1 py-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "",
                            children: "— empty —"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 503,
                            columnNumber: 9
                        }, this),
                        opts(slot).map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: i.id,
                                children: label(i.id)
                            }, i.id, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 504,
                                columnNumber: 32
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 502,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/GameClient.tsx",
            lineNumber: 500,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-3 md:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[10px] font-bold tracking-widest text-white/50",
                        children: "EQUIPPED"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 511,
                        columnNumber: 9
                    }, this),
                    [
                        0,
                        1,
                        2
                    ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotSel, {
                            slot: "weapon",
                            idx: i,
                            value: save.equip.weapon[i],
                            title: `Weapon ${i + 1}`
                        }, i, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 512,
                            columnNumber: 31
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotSel, {
                        slot: "shield",
                        idx: 0,
                        value: save.equip.shield,
                        title: "Shield"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 513,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotSel, {
                        slot: "armor",
                        idx: 0,
                        value: save.equip.armor,
                        title: "Armour"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 514,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotSel, {
                        slot: "optics",
                        idx: 0,
                        value: save.equip.optics,
                        title: "Optics"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 515,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SlotSel, {
                        slot: "utility",
                        idx: 0,
                        value: save.equip.utility,
                        title: "Utility"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 516,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2 rounded-sm border border-white/10 p-2 text-[11px] text-white/60",
                        children: [
                            "Hull ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(game.stats.hull),
                            " · Shield ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(game.stats.shieldMax),
                            " · Damage taken -",
                            Math.round((1 - (1 - game.stats.armor) * (1 - game.stats.reactive)) * 100),
                            "% · Zoom ",
                            game.stats.zoomMin.toFixed(2),
                            "x"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 517,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 510,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[10px] font-bold tracking-widest text-white/50",
                        children: [
                            "CRAFTED ITEMS (",
                            items.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 522,
                        columnNumber: 9
                    }, this),
                    items.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-white/50",
                        children: "Nothing crafted yet. Store components, then visit the Crafting tab."
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 523,
                        columnNumber: 32
                    }, this),
                    items.map((i)=>{
                        const r = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPE_BY_ID"][i.rid];
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] p-2 text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "min-w-0 flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "font-bold text-yellow-200",
                                            children: [
                                                r.name,
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-white/50",
                                                    children: [
                                                        "· ",
                                                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SLOT_NAME"][r.slot]
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/GameClient.tsx",
                                                    lineNumber: 529,
                                                    columnNumber: 69
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/GameClient.tsx",
                                            lineNumber: 529,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-white/60",
                                            children: [
                                                Math.round(i.eff * 100),
                                                "% efficiency · ",
                                                effectText(game, r, i.eff)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/GameClient.tsx",
                                            lineNumber: 530,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 528,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>game.scrap(i.id),
                                    className: "rounded-sm border border-red-400/50 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20",
                                    children: "SCRAP"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/GameClient.tsx",
                                    lineNumber: 532,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, i.id, true, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 527,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 521,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 509,
        columnNumber: 5
    }, this);
}
function Settings({ game }) {
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(game.save.name);
    const [confirm, setConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        game.hardReset((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["newSave"])());
        game.persist(true);
        void game.pushServer();
        setConfirm(false);
    }, [
        game
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-1 text-[10px] font-bold tracking-widest text-white/50",
                        children: "PILOT NAME (shown to other pilots)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 553,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                value: name,
                                maxLength: 16,
                                onChange: (e)=>setName(e.target.value),
                                className: "flex-1 rounded-sm border border-white/20 bg-black px-2 py-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 555,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>game.setName(name),
                                className: "rounded-sm border border-cyan-300/60 px-3 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20",
                                children: "SAVE"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GameClient.tsx",
                                lineNumber: 556,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 554,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 552,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-sm border border-white/10 p-2 text-xs text-white/60",
                children: [
                    "Enemies destroyed: ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(game.save.kills),
                    " · Credits earned: ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(game.save.earned),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                        fileName: "[project]/src/components/GameClient.tsx",
                        lineNumber: 560,
                        columnNumber: 98
                    }, this),
                    "Progress autosaves every few seconds to this browser and to the server. Pilots in range show up as pink ships; the world itself is a shared map."
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 559,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: !confirm ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setConfirm(true),
                    className: "rounded-sm border border-red-400/60 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20",
                    children: "RESET ALL PROGRESS"
                }, void 0, false, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 565,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-xs text-red-300",
                    children: [
                        "Really wipe everything? ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: reset,
                            className: "rounded-sm border border-red-400 bg-red-500/30 px-3 py-1 font-bold",
                            children: "YES, WIPE"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 567,
                            columnNumber: 97
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setConfirm(false),
                            className: "rounded-sm border border-white/30 px-3 py-1",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/GameClient.tsx",
                            lineNumber: 567,
                            columnNumber: 218
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GameClient.tsx",
                    lineNumber: 567,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GameClient.tsx",
                lineNumber: 563,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GameClient.tsx",
        lineNumber: 551,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/game/data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BASE",
    ()=>BASE,
    "CAT_NAME",
    ()=>CAT_NAME,
    "DMG_MUL",
    ()=>DMG_MUL,
    "HP_MUL",
    ()=>HP_MUL,
    "KIND_CAT",
    ()=>KIND_CAT,
    "RARITIES",
    ()=>RARITIES,
    "RECIPES",
    ()=>RECIPES,
    "RECIPE_BY_ID",
    ()=>RECIPE_BY_ID,
    "SHIP_R",
    ()=>SHIP_R,
    "SIZE_GROWTH",
    ()=>SIZE_GROWTH,
    "SLOT_NAME",
    ()=>SLOT_NAME,
    "UPGRADES",
    ()=>UPGRADES,
    "UP_CATS",
    ()=>UP_CATS,
    "WORLD_R",
    ()=>WORLD_R,
    "ZONE_EDGES",
    ()=>ZONE_EDGES,
    "compMass",
    ()=>compMass,
    "compValue",
    ()=>compValue,
    "computeStats",
    ()=>computeStats,
    "craftEfficiency",
    ()=>craftEfficiency,
    "migrate",
    ()=>migrate,
    "newSave",
    ()=>newSave,
    "recipeProblem",
    ()=>recipeProblem,
    "upgradeCost",
    ()=>upgradeCost,
    "zoneTier",
    ()=>zoneTier
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/math.ts [app-ssr] (ecmascript)");
;
const WORLD_R = 16000;
const BASE = {
    x: 0,
    y: 15000,
    r: 260,
    dock: 175,
    safe: 950
};
const SHIP_R = 15;
const ZONE_EDGES = [
    2200,
    4800,
    7800,
    10600,
    13200
]; // mythical, legendary, epic, rare, uncommon, else common
function zoneTier(distFromCentre) {
    for(let i = 0; i < ZONE_EDGES.length; i++)if (distFromCentre < ZONE_EDGES[i]) return 5 - i;
    return 0;
}
const RARITIES = [
    {
        id: "common",
        name: "Common",
        color: "#9db4c9"
    },
    {
        id: "uncommon",
        name: "Uncommon",
        color: "#45ff8a"
    },
    {
        id: "rare",
        name: "Rare",
        color: "#3fa9ff"
    },
    {
        id: "epic",
        name: "Epic",
        color: "#c45cff"
    },
    {
        id: "legendary",
        name: "Legendary",
        color: "#ffb21f"
    },
    {
        id: "mythical",
        name: "Mythical",
        color: "#ff3d73"
    }
];
const SIZE_GROWTH = 1.65;
const HP_MUL = [
    1,
    4,
    18,
    80,
    360,
    1600
];
const DMG_MUL = [
    1,
    3,
    9,
    27,
    81,
    243
];
const KIND_CAT = {
    core: "core",
    segment: "body",
    armor: "plate",
    leg: "limb",
    arm: "limb",
    wing: "wing",
    weapon: "weapon",
    shield: "shield",
    spike: "plate"
};
const CAT_NAME = {
    core: "Core",
    plate: "Plate",
    body: "Body",
    limb: "Limb",
    wing: "Wing",
    weapon: "Weapon",
    shield: "Shield"
};
function compValue(area, tier, kind) {
    const base = (10 + 1.1 * Math.sqrt(area)) * Math.pow(3.6, tier) * 1.6;
    return Math.round(base * (kind === "core" ? 3 : 1));
}
const compMass = (area)=>Math.max(0.2, area / 900);
const UPGRADES = [
    {
        id: "dmg",
        name: "Cannon Damage",
        cat: "weapons",
        desc: "Raw damage per shot.",
        max: 30,
        base: 20,
        growth: 1.45,
        fmt: (l)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(10 * Math.pow(1.2, l))} dmg`
    },
    {
        id: "rate",
        name: "Fire Rate",
        cat: "weapons",
        desc: "Shots per second.",
        max: 12,
        base: 40,
        growth: 1.5,
        fmt: (l)=>`${(4 + 0.7 * l).toFixed(1)}/s`
    },
    {
        id: "barrels",
        name: "Extra Barrels",
        cat: "weapons",
        desc: "Fire a fan of additional shots.",
        max: 4,
        base: 150,
        growth: 2.6,
        fmt: (l)=>`${1 + l} barrel${l ? "s" : ""}`
    },
    {
        id: "pierce",
        name: "Piercing Rounds",
        cat: "weapons",
        desc: "Shots punch through extra pieces (-20% damage each).",
        max: 5,
        base: 120,
        growth: 2.2,
        fmt: (l)=>`+${l} pierce`
    },
    {
        id: "crit",
        name: "Targeting Matrix",
        cat: "weapons",
        desc: "Chance for 2.5x critical hits.",
        max: 10,
        base: 60,
        growth: 1.55,
        fmt: (l)=>`${5 + 4 * l}% crit`
    },
    {
        id: "breaker",
        name: "Plate Breaker",
        cat: "weapons",
        desc: "Bonus damage to armour plates & shield generators.",
        max: 10,
        base: 80,
        growth: 1.6,
        fmt: (l)=>`+${15 * l}% vs plates`
    },
    {
        id: "coreseek",
        name: "Core Seeker",
        cat: "weapons",
        desc: "Bonus damage to enemy cores.",
        max: 8,
        base: 90,
        growth: 1.7,
        fmt: (l)=>`+${20 * l}% vs cores`
    },
    {
        id: "frag",
        name: "Fragmentation Rounds",
        cat: "weapons",
        desc: "Hits splash into neighbouring pieces.",
        max: 6,
        base: 200,
        growth: 1.9,
        fmt: (l)=>l ? `${18 + 9 * l}px splash` : "none"
    },
    {
        id: "velocity",
        name: "Rail Coils",
        cat: "weapons",
        desc: "Faster, longer-ranged shots.",
        max: 8,
        base: 50,
        growth: 1.5,
        fmt: (l)=>`+${l * 10}% speed`
    },
    {
        id: "hull",
        name: "Hull Plating",
        cat: "hull",
        desc: "Maximum hull integrity.",
        max: 30,
        base: 25,
        growth: 1.5,
        fmt: (l)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(100 * Math.pow(1.22, l))} HP`
    },
    {
        id: "regen",
        name: "Nano Repair",
        cat: "hull",
        desc: "Hull regenerates every second.",
        max: 10,
        base: 70,
        growth: 1.6,
        fmt: (l)=>`${(0.5 * l).toFixed(1)}%/s`
    },
    {
        id: "armor",
        name: "Reactive Armour",
        cat: "hull",
        desc: "Flat percentage damage reduction.",
        max: 14,
        base: 90,
        growth: 1.7,
        fmt: (l)=>`-${(3.5 * l).toFixed(1)}% dmg`
    },
    {
        id: "shield",
        name: "Energy Shield Core",
        cat: "hull",
        desc: "A recharging shield layer. Level 1 unlocks it.",
        max: 25,
        base: 120,
        growth: 1.55,
        fmt: (l)=>l ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(60 * Math.pow(1.28, l - 1))} shield` : "locked"
    },
    {
        id: "dampers",
        name: "Inertial Dampers",
        cat: "hull",
        desc: "Resist slows, snares and pulls from enemies.",
        max: 6,
        base: 100,
        growth: 1.8,
        fmt: (l)=>`${12 * l}% resist`
    },
    {
        id: "thrust",
        name: "Thrusters",
        cat: "mobility",
        desc: "Top speed.",
        max: 12,
        base: 40,
        growth: 1.5,
        fmt: (l)=>`${450 + 40 * l} u/s`
    },
    {
        id: "handling",
        name: "Handling Jets",
        cat: "mobility",
        desc: "Acceleration and agility.",
        max: 10,
        base: 45,
        growth: 1.45,
        fmt: (l)=>`${1500 + 200 * l} accel`
    },
    {
        id: "boost",
        name: "Afterburner",
        cat: "mobility",
        desc: "Hold SHIFT for a speed burst. Level 1 unlocks it.",
        max: 8,
        base: 150,
        growth: 1.8,
        fmt: (l)=>l ? `x${(1.7 + 0.1 * (l - 1)).toFixed(1)} burst` : "locked"
    },
    {
        id: "hcount",
        name: "Launcher Bays",
        cat: "harpoon",
        desc: "Number of harpoons you can have out at once.",
        max: 3,
        base: 100,
        growth: 3,
        fmt: (l)=>`${1 + l} harpoon${l ? "s" : ""}`
    },
    {
        id: "hstr",
        name: "Cable Tensile Strength",
        cat: "harpoon",
        desc: "Weight each harpoon can tow before it snaps.",
        max: 16,
        base: 30,
        growth: 1.55,
        fmt: (l)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(5 * Math.pow(1.42, l))} load`
    },
    {
        id: "hrange",
        name: "Launcher Range",
        cat: "harpoon",
        desc: "How far the harpoon flies.",
        max: 10,
        base: 40,
        growth: 1.45,
        fmt: (l)=>`${380 + 60 * l} u`
    },
    {
        id: "hhp",
        name: "Cable Armouring",
        cat: "harpoon",
        desc: "Durability of the cable against enemy attacks.",
        max: 12,
        base: 50,
        growth: 1.5,
        fmt: (l)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtNum"])(40 * Math.pow(1.35, l))} HP`
    },
    {
        id: "hspeed",
        name: "Winch Motor",
        cat: "harpoon",
        desc: "Launch speed, reel speed and less towing drag.",
        max: 8,
        base: 60,
        growth: 1.5,
        fmt: (l)=>`${1000 + 140 * l} u/s`
    },
    {
        id: "value",
        name: "Salvage Contracts",
        cat: "salvage",
        desc: "Credits received when selling components.",
        max: 20,
        base: 50,
        growth: 1.5,
        fmt: (l)=>`x${(1 + 0.25 * l).toFixed(2)}`
    },
    {
        id: "drops",
        name: "Scavenger Drones",
        cat: "salvage",
        desc: "Chance for pieces to drop components.",
        max: 10,
        base: 60,
        growth: 1.55,
        fmt: (l)=>`${30 + 4 * l}% drop`
    },
    {
        id: "luck",
        name: "Rarity Scanner",
        cat: "salvage",
        desc: "Better rarity rolls on dropped components.",
        max: 8,
        base: 100,
        growth: 1.7,
        fmt: (l)=>`+${l * 5}% luck`
    },
    {
        id: "cargo",
        name: "Cargo Bay",
        cat: "salvage",
        desc: "Storage capacity for components.",
        max: 8,
        base: 80,
        growth: 1.7,
        fmt: (l)=>`${24 + 12 * l} slots`
    }
];
const UP_CATS = [
    {
        id: "weapons",
        name: "Weapons",
        color: "#ff4d6d"
    },
    {
        id: "hull",
        name: "Hull",
        color: "#4dffb4"
    },
    {
        id: "mobility",
        name: "Mobility",
        color: "#ffe14d"
    },
    {
        id: "harpoon",
        name: "Harpoon",
        color: "#4dd2ff"
    },
    {
        id: "salvage",
        name: "Salvage",
        color: "#c77dff"
    }
];
const upgradeCost = (u, level)=>Math.round(u.base * Math.pow(u.growth, level));
const RECIPES = [
    {
        id: "pulse",
        name: "Pulse Turret",
        slot: "weapon",
        difficulty: 1,
        n: 3,
        desc: "Auto-targeting turret. Fires at the nearest enemy piece on its own."
    },
    {
        id: "scatter",
        name: "Scatter Driver",
        slot: "weapon",
        difficulty: 2,
        n: 4,
        need: {
            cats: [
                "limb",
                "plate"
            ],
            count: 1
        },
        desc: "Short-range shotgun burst on your fire button."
    },
    {
        id: "missile",
        name: "Seeker Pod",
        slot: "weapon",
        difficulty: 3,
        n: 5,
        need: {
            cats: [
                "weapon",
                "shield"
            ],
            count: 1
        },
        desc: "Launches homing missiles with splash damage."
    },
    {
        id: "lance",
        name: "Arc Lance",
        slot: "weapon",
        difficulty: 4,
        n: 6,
        need: {
            cats: [
                "core"
            ],
            count: 1
        },
        desc: "Piercing beam that melts through armour layers."
    },
    {
        id: "deflector",
        name: "Deflector Array",
        slot: "shield",
        difficulty: 1,
        n: 3,
        desc: "Large shield pool that recharges after a short delay."
    },
    {
        id: "absorber",
        name: "Absorber Core",
        slot: "shield",
        difficulty: 2,
        n: 4,
        need: {
            cats: [
                "plate"
            ],
            count: 1
        },
        desc: "Smaller shield that recharges extremely fast."
    },
    {
        id: "reflector",
        name: "Mirror Barrier",
        slot: "shield",
        difficulty: 3,
        n: 5,
        need: {
            cats: [
                "shield",
                "core",
                "wing"
            ],
            count: 1
        },
        desc: "Shield that reflects enemy bolts back at them."
    },
    {
        id: "plating",
        name: "Hull Plating Kit",
        slot: "armor",
        difficulty: 1,
        n: 3,
        need: {
            cats: [
                "plate",
                "body"
            ],
            count: 1
        },
        desc: "Adds a large chunk of extra hull."
    },
    {
        id: "reactive",
        name: "Reactive Lattice",
        slot: "armor",
        difficulty: 3,
        n: 5,
        need: {
            cats: [
                "plate"
            ],
            count: 2
        },
        desc: "Cuts all incoming damage."
    },
    {
        id: "thorn",
        name: "Thorn Mesh",
        slot: "armor",
        difficulty: 2,
        n: 4,
        need: {
            cats: [
                "limb"
            ],
            count: 1
        },
        desc: "When hit, emits a shockwave that damages nearby enemy pieces."
    },
    {
        id: "lens",
        name: "Wide-Field Optics",
        slot: "optics",
        difficulty: 2,
        n: 4,
        need: {
            cats: [
                "wing",
                "core"
            ],
            count: 1
        },
        desc: "Unlocks mouse-wheel zoom out. Better efficiency zooms further."
    },
    {
        id: "recall",
        name: "Recall Beacon",
        slot: "utility",
        difficulty: 4,
        n: 6,
        need: {
            cats: [
                "core"
            ],
            count: 1
        },
        desc: "Press T to channel a teleport back to base."
    }
];
const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r)=>[
        r.id,
        r
    ]));
const SLOT_NAME = {
    weapon: "Weapon",
    shield: "Shield",
    armor: "Armour",
    optics: "Optics",
    utility: "Utility"
};
function craftEfficiency(r, comps) {
    if (!comps.length) return 0;
    const avg = comps.reduce((s, c)=>s + c.tier + (c.kind === "core" ? 0.5 : 0), 0) / comps.length;
    const raw = (0.6 + 0.3 * avg) * (1 - 0.05 * (r.difficulty - 1));
    return Math.max(0.3, raw);
}
function recipeProblem(r, comps) {
    if (comps.length !== r.n) return `Needs exactly ${r.n} components`;
    if (r.need) {
        const have = comps.filter((c)=>r.need.cats.includes(KIND_CAT[c.kind])).length;
        if (have < r.need.count) return `Needs ${r.need.count}x ${r.need.cats.map((c)=>CAT_NAME[c]).join("/")}`;
    }
    return null;
}
function newSave() {
    return {
        v: 1,
        ts: Date.now(),
        name: "Pilot-" + Math.floor(1000 + Math.random() * 9000),
        credits: 60,
        earned: 0,
        kills: 0,
        seq: 1,
        upgrades: {},
        inventory: [],
        crafted: [],
        equip: {
            weapon: [
                null,
                null,
                null
            ],
            shield: null,
            armor: null,
            optics: null,
            utility: null
        },
        autoSell: false
    };
}
function migrate(raw) {
    const d = newSave();
    if (!raw || typeof raw !== "object") return d;
    const r = raw;
    return {
        ...d,
        ...r,
        upgrades: {
            ...r.upgrades ?? {}
        },
        inventory: Array.isArray(r.inventory) ? r.inventory : [],
        crafted: Array.isArray(r.crafted) ? r.crafted : [],
        equip: {
            ...d.equip,
            ...r.equip ?? {},
            weapon: [
                0,
                1,
                2
            ].map((i)=>r.equip?.weapon?.[i] ?? null)
        }
    };
}
function computeStats(s) {
    const L = (id)=>s.upgrades[id] ?? 0;
    const find = (id)=>id ? s.crafted.find((c)=>c.id === id) : undefined;
    let hull = 100 * Math.pow(1.22, L("hull"));
    const baseDmg = 10 * Math.pow(1.2, L("dmg"));
    let shieldMax = L("shield") ? 60 * Math.pow(1.28, L("shield") - 1) : 0;
    let shieldRegen = 0.18;
    let shieldDelay = 4;
    let reflect = false;
    let reactive = 0;
    let thorn = 0;
    const weapons = [];
    for (const wid of s.equip.weapon){
        const it = find(wid);
        if (it) weapons.push({
            rid: it.rid,
            eff: it.eff
        });
    }
    const sh = find(s.equip.shield);
    if (sh) {
        if (sh.rid === "deflector") {
            shieldMax += hull * 0.45 * sh.eff;
        }
        if (sh.rid === "absorber") {
            shieldMax += hull * 0.22 * sh.eff;
            shieldRegen = 0.5;
            shieldDelay = 1.6;
        }
        if (sh.rid === "reflector") {
            shieldMax += hull * 0.32 * sh.eff;
            reflect = true;
        }
    }
    const ar = find(s.equip.armor);
    if (ar) {
        if (ar.rid === "plating") hull *= 1 + 0.35 * ar.eff;
        if (ar.rid === "reactive") reactive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(0.12 * ar.eff, 0, 0.6);
        if (ar.rid === "thorn") {
            thorn = ar.eff;
            hull *= 1 + 0.1 * ar.eff;
        }
    }
    const op = find(s.equip.optics);
    const zoomMin = op ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(1 / (1 + 0.4 * op.eff), 0.28, 1) : 1;
    const ut = find(s.equip.utility);
    const tpTime = ut && ut.rid === "recall" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(6 / (0.6 + 0.5 * ut.eff), 2, 6) : 0;
    const tpCd = ut && ut.rid === "recall" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(100 / (0.5 + 0.5 * ut.eff), 20, 100) : 0;
    return {
        dmg: baseDmg,
        rate: 4 + 0.7 * L("rate"),
        barrels: 1 + L("barrels"),
        pierce: L("pierce"),
        crit: 0.05 + 0.04 * L("crit"),
        breaker: 1 + 0.15 * L("breaker"),
        coreMul: 1 + 0.2 * L("coreseek"),
        frag: L("frag") ? 18 + 9 * L("frag") : 0,
        bulletSpeed: 900 * (1 + 0.1 * L("velocity")),
        bulletRange: 760 * (1 + 0.08 * L("velocity")),
        hull,
        regen: 0.005 * L("regen"),
        armor: 0.035 * L("armor"),
        reactive,
        thorn,
        shieldMax,
        shieldRegen,
        shieldDelay,
        reflect,
        dampers: 0.12 * L("dampers"),
        thrust: 450 + 40 * L("thrust"),
        accel: 1500 + 200 * L("handling"),
        boostMul: 1.7 + 0.1 * Math.max(0, L("boost") - 1),
        boostRegen: 14 + 3 * L("boost"),
        hasBoost: L("boost") > 0,
        hCount: 1 + L("hcount"),
        hStr: 5 * Math.pow(1.42, L("hstr")),
        hRange: 380 + 60 * L("hrange"),
        hHp: 40 * Math.pow(1.35, L("hhp")),
        hSpeed: 1000 + 140 * L("hspeed"),
        towRelief: 0.06 * L("hspeed"),
        sellMul: 1 + 0.25 * L("value"),
        dropChance: 0.3 + 0.04 * L("drops"),
        luck: 0.05 * L("luck"),
        cargo: 24 + 12 * L("cargo"),
        zoomMin,
        tpTime,
        tpCd,
        weapons
    };
}
}),
"[project]/src/game/enemies.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BASE_SIZE",
    ()=>BASE_SIZE,
    "Builder",
    ()=>Builder,
    "SPECIES_COUNT",
    ()=>SPECIES_COUNT,
    "SPECIES_LIST",
    ()=>SPECIES_LIST,
    "buildEnemy",
    ()=>buildEnemy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/math.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/data.ts [app-ssr] (ecmascript)");
;
;
const BASE_SIZE = 28;
/* ---------------- geometry helpers (unit space, +x forward) ---------------- */ const ell = (cx, cy, rx, ry, n = 8, rot = 0)=>{
    const out = [];
    const c = Math.cos(rot), s = Math.sin(rot);
    for(let i = 0; i < n; i++){
        const a = i / n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        out.push(cx + x * c - y * s, cy + x * s + y * c);
    }
    return out;
};
const secPoly = (s)=>ell(s.cx, s.cy, s.rx, s.ry, s.n);
const secSector = (s, f0, f1, k0, k1)=>{
    const out = [];
    for(let k = k0; k <= k1; k++){
        const a = k / s.n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
        out.push(s.cx + Math.cos(a) * s.rx * f1, s.cy + Math.sin(a) * s.ry * f1);
    }
    for(let k = k1; k >= k0; k--){
        const a = k / s.n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
        out.push(s.cx + Math.cos(a) * s.rx * f0, s.cy + Math.sin(a) * s.ry * f0);
    }
    return out;
};
const taper = (ax, ay, bx, by, wa, wb)=>{
    const dx = bx - ax, dy = by - ay;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    return [
        ax + nx * wa,
        ay + ny * wa,
        bx + nx * wb,
        by + ny * wb,
        bx - nx * wb,
        by - ny * wb,
        ax - nx * wa,
        ay - ny * wa
    ];
};
const mirror = (p)=>{
    const o = [];
    for(let i = 0; i < p.length; i += 2)o.push(p[i], -p[i + 1]);
    return o;
};
const saw = (ax, ay, bx, by, wa, wb, teeth, tl, side)=>{
    const dx = bx - ax, dy = by - ay;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l * side, ny = dx / l * side;
    const w = (t)=>wa + (wb - wa) * t;
    const P = (t, off)=>[
            ax + dx * t + nx * off,
            ay + dy * t + ny * off
        ];
    const pts = [
        ax - nx * wa,
        ay - ny * wa,
        bx - nx * wb,
        by - ny * wb,
        bx + nx * wb,
        by + ny * wb
    ];
    for(let k = teeth; k >= 1; k--){
        const tip = (k - 0.2) / teeth;
        const notch = (k - 1) / teeth;
        pts.push(...P(Math.min(1, tip), w(tip) + tl), ...P(notch, w(notch) * 0.9));
    }
    return pts;
};
const turretPoly = (cx, cy, r, len, bw)=>{
    const h = 0.866 * r;
    const pts = [
        0.5 * r,
        -h,
        0.5 * r,
        -bw,
        len,
        -bw,
        len,
        bw,
        0.5 * r,
        bw,
        0.5 * r,
        h,
        -0.5 * r,
        h,
        -r,
        0,
        -0.5 * r,
        -h
    ];
    const o = [];
    for(let i = 0; i < pts.length; i += 2)o.push(cx + pts[i], cy + pts[i + 1]);
    return o;
};
/* ---------------- colours ---------------- */ function colorsFor(kind, hue, style) {
    const dl = style === 1 ? -10 : style >= 2 ? 10 : 0;
    const h = (x)=>Math.round(((hue + x) % 360 + 360) % 360);
    switch(kind){
        case "core":
            return {
                stroke: "#ffffff",
                fill: `hsla(${h(180)},100%,60%,0.95)`,
                glow: true
            };
        case "segment":
            return {
                stroke: `hsl(${h(0)},95%,${58 + dl}%)`,
                fill: `hsla(${h(0)},80%,${22 + dl / 2}%,0.9)`,
                glow: style >= 3
            };
        case "armor":
            return {
                stroke: `hsl(${h(25)},100%,${68 + dl}%)`,
                fill: `hsla(${h(25)},85%,${30 + dl}%,0.82)`,
                glow: false
            };
        case "leg":
            return {
                stroke: `hsl(${h(0)},70%,${46 + dl}%)`,
                fill: `hsla(${h(0)},60%,14%,0.92)`,
                glow: false
            };
        case "arm":
            return {
                stroke: `hsl(${h(40)},100%,${65 + dl}%)`,
                fill: `hsla(${h(40)},80%,${26 + dl}%,0.88)`,
                glow: false
            };
        case "wing":
            return {
                stroke: `hsla(${h(60)},90%,72%,0.85)`,
                fill: `hsla(${h(60)},90%,55%,0.14)`,
                glow: false
            };
        case "weapon":
            return {
                stroke: "hsl(8,100%,64%)",
                fill: "hsla(8,85%,28%,0.95)",
                glow: true
            };
        case "shield":
            return {
                stroke: "hsl(190,100%,68%)",
                fill: "hsla(190,90%,38%,0.7)",
                glow: true
            };
        default:
            return {
                stroke: `hsl(${h(25)},100%,76%)`,
                fill: `hsla(${h(25)},100%,46%,0.85)`,
                glow: false
            };
    }
}
const HP_BASE = {
    core: 30,
    segment: 12,
    armor: 16,
    leg: 6,
    arm: 16,
    wing: 6,
    weapon: 22,
    shield: 26,
    spike: 5
};
class Builder {
    tier;
    hue;
    rng;
    parts;
    groups;
    coreId;
    S;
    constructor(tier, hue, rng){
        this.tier = tier;
        this.hue = hue;
        this.rng = rng;
        this.parts = [];
        this.groups = [];
        this.coreId = 0;
        this.S = BASE_SIZE * Math.pow(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_GROWTH"], tier);
    }
    add(kind, name, poly, o = {}) {
        const S = this.S;
        const p = poly.map((v)=>v * S);
        const [cx, cy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polyCentroid"])(p);
        let r = 0;
        for(let i = 0; i < p.length; i += 2)r = Math.max(r, Math.hypot(p[i] - cx, p[i + 1] - cy));
        const style = o.style ?? 0;
        const col = colorsFor(kind, this.hue, style);
        const hp = HP_BASE[kind] * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HP_MUL"][this.tier] * (o.hpM ?? 1);
        const id = this.parts.length;
        this.parts.push({
            id,
            kind,
            name,
            poly: p,
            cx,
            cy,
            r,
            area: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["polyArea"])(p),
            hp,
            maxHp: hp,
            layer: o.layer ?? 1,
            links: [],
            g: o.g ?? -1,
            alive: true,
            hurt: 0,
            barT: 0,
            style,
            stroke: col.stroke,
            fill: col.fill,
            glow: col.glow || kind === "segment" && style >= 3,
            wpn: "",
            muzzle: 0,
            shieldR: 0,
            shieldHp: 0,
            shieldMax: 0,
            shieldDown: 0,
            shieldHit: 0,
            cd: 1 + this.rng() * 2
        });
        if (o.links) for (const l of o.links)this.link(id, l);
        return id;
    }
    link(a, b) {
        if (a === b) return;
        if (!this.parts[a].links.includes(b)) this.parts[a].links.push(b);
        if (!this.parts[b].links.includes(a)) this.parts[b].links.push(a);
    }
    group(px, py, role, sign = 1, amp = 0.4, phase = 0) {
        this.groups.push({
            px: px * this.S,
            py: py * this.S,
            ang: 0,
            role,
            sign,
            phase,
            amp
        });
        return this.groups.length - 1;
    }
    sec(name, s, o = {}) {
        return this.add("segment", name, secPoly(s), {
            layer: o.layer ?? 1,
            hpM: o.hpM,
            style: o.style
        });
    }
    core(s, host, nbrs) {
        const r = Math.max(0.24, Math.min(s.rx, s.ry) * 0.36);
        const id = this.add("core", "Core", ell(s.cx, s.cy, r, r, 6, Math.PI / 6), {
            layer: 3,
            links: [
                host,
                ...nbrs
            ]
        });
        if (this.tier >= 2) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.55, r * 1.55, 6), {
            layer: 6,
            links: [
                host
            ],
            hpM: 1.6,
            style: 1
        });
        if (this.tier >= 4) this.add("armor", "Core Guard", ell(s.cx, s.cy, r * 1.12, r * 1.12, 6, Math.PI / 6), {
            layer: 7,
            links: [
                host
            ],
            hpM: 2.2,
            style: 2
        });
        this.coreId = id;
        return id;
    }
    armor(s, host, o) {
        const ids = [];
        for(let L = 0; L < o.layers; L++){
            const f1 = 1.05 - 0.3 * L;
            const f0 = Math.max(0.12, f1 - 0.45);
            for(let k0 = 0; k0 < s.n; k0 += o.edges){
                const k1 = Math.min(s.n, k0 + o.edges);
                ids.push(this.add("armor", o.name, secSector(s, f0, f1, k0, k1), {
                    layer: 4 + L,
                    hpM: (o.hpM ?? 1) * (1 + 0.2 * L),
                    links: [
                        host
                    ],
                    style: o.style ?? L % 2
                }));
            }
        }
        return ids;
    }
    spikes(s, host, o) {
        for(let k = 0; k < s.n; k += o.every){
            const a0 = k / s.n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], a1 = (k + 1) / s.n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], am = (a0 + a1) / 2;
            const poly = [
                s.cx + Math.cos(a0) * s.rx * 0.98,
                s.cy + Math.sin(a0) * s.ry * 0.98,
                s.cx + Math.cos(am) * s.rx * (1 + o.len),
                s.cy + Math.sin(am) * s.ry * (1 + o.len),
                s.cx + Math.cos(a1) * s.rx * 0.98,
                s.cy + Math.sin(a1) * s.ry * 0.98
            ];
            this.add("spike", o.name ?? "Spine", poly, {
                layer: 5,
                links: [
                    host
                ],
                hpM: 0.8
            });
        }
    }
}
/* ---------------- shared limb builders ---------------- */ function leg(b, host, sx, sy, side, angs, lens, w, name, o = {}) {
    const gi = b.group(sx, sy * side, o.role ?? "leg", side, o.amp ?? 0.32, o.phase ?? 0);
    let x = sx, y = sy;
    let prev = host;
    const sp = o.split ?? 1;
    for(let i = 0; i < lens.length; i++){
        for(let k = 0; k < sp; k++){
            const L = lens[i] / sp;
            const nx = x + Math.cos(angs[i]) * L, ny = y + Math.sin(angs[i]) * L;
            const prog = (i + k / sp) / lens.length;
            const wa = w * (1 - 0.35 * prog), wb = w * (1 - 0.35 * (prog + 1 / (lens.length * sp)));
            const bx = x - Math.cos(angs[i]) * wa * 0.9, by = y - Math.sin(angs[i]) * wa * 0.9;
            const poly = taper(bx, by, nx, ny, wa, wb);
            const id = b.add(o.kind ?? "leg", name, side > 0 ? poly : mirror(poly), {
                layer: o.layer ?? 0,
                g: gi,
                links: [
                    prev
                ]
            });
            prev = id;
            x = nx;
            y = ny;
        }
    }
    return gi;
}
function legPair(b, host, sx, sy, angs, lens, w, name, o = {}) {
    leg(b, host, sx, sy, 1, angs, lens, w, name, {
        ...o,
        phase: o.phase ?? 0
    });
    leg(b, host, sx, sy, -1, angs, lens, w, name, {
        ...o,
        phase: (o.phase ?? 0) + Math.PI
    });
}
function antennae(b, host, ax, ay, angs, lens, w = 0.05) {
    for (const side of [
        1,
        -1
    ])leg(b, host, ax, ay, side, angs, lens, w, "Antenna", {
        kind: "spike",
        layer: 2,
        role: "sway",
        amp: 0.14,
        phase: side * 1.3
    });
}
function mandibles(b, host, pivotX, pivotY, poly, name, hpM = 1) {
    for (const side of [
        1,
        -1
    ]){
        const gi = b.group(pivotX, pivotY * side, "mandible", side, 0.1, 0);
        b.add("arm", name, side > 0 ? poly : mirror(poly), {
            layer: 2,
            g: gi,
            links: [
                host
            ],
            hpM
        });
    }
}
function wingPart(b, host, ax, ay, side, poly, name, amp = 0.22, phase = 0, hpM = 1) {
    const gi = b.group(ax, ay * side, "wing", side, amp, phase);
    return b.add("wing", name, side > 0 ? poly : mirror(poly), {
        layer: 0.5,
        g: gi,
        links: [
            host
        ],
        hpM
    });
}
function wingSub(b, wingId, host, ax, ay, side, cx, cy, rx, ry, rot, name, style = 0) {
    // armour plate that rides on a wing (shares the wing's animation group)
    const w = b.parts[wingId];
    const poly = ell(cx, cy, rx, ry, 6, rot);
    b.add("armor", name, side > 0 ? poly : mirror(poly), {
        layer: 1.5,
        g: w.g,
        links: [
            wingId
        ],
        style,
        hpM: 1.1
    });
    void host;
    void ax;
    void ay;
}
/* ---------------- loadout: guns / missiles / shield generators ---------------- */ function loadout(b, mounts, armed) {
    const t = b.tier;
    const nGun = armed.gun && t >= 3 ? t - 2 : 0;
    const nMis = armed.missile && t >= 4 ? t - 3 : 0;
    const nSh = armed.shield && t >= 3 ? t - 2 : 0;
    if (!nGun && !nMis && !nSh) return;
    const pairs = [];
    const centers = [];
    for (const m of mounts){
        const mn = Math.min(m.sec.rx, m.sec.ry);
        if (mn < 0.3) continue;
        const offs = m.sec.rx >= 0.8 ? [
            -0.4,
            0.4
        ] : [
            0
        ];
        for (const o of offs)pairs.push({
            x: m.sec.cx + o * m.sec.rx,
            y: m.sec.ry * 0.55,
            host: m.host,
            r: mn * 0.3
        });
        if (!m.core) centers.push({
            x: m.sec.cx - m.sec.rx * 0.4,
            y: 0,
            host: m.host,
            r: mn * 0.3
        });
    }
    pairs.sort((a, b2)=>b2.r - a.r);
    let pi = 0;
    const turret = (c, side, missile)=>{
        const r = c.r * (missile ? 1.15 : 1);
        const len = missile ? r * 1.5 : r * 2.0;
        const bw = missile ? r * 0.5 : r * 0.18;
        const gi = b.group(c.x, c.y * side, "turret", side, 0, 0);
        const poly = turretPoly(c.x, c.y, r, len, bw);
        const id = b.add("weapon", missile ? "Missile Pod" : "Gun Turret", side > 0 ? poly : mirror(poly), {
            layer: 8,
            g: gi,
            links: [
                c.host
            ]
        });
        const p = b.parts[id];
        p.wpn = missile ? "missile" : "gun";
        p.muzzle = len * b.S;
    };
    for(let i = 0; i < nGun && pi < pairs.length; i++, pi++){
        turret(pairs[pi], 1, false);
        turret(pairs[pi], -1, false);
    }
    for(let i = 0; i < nMis && pi < pairs.length; i++, pi++){
        turret(pairs[pi], 1, true);
        turret(pairs[pi], -1, true);
    }
    for(let i = 0; i < nSh; i++){
        const c = centers[i] ?? pairs[pi++];
        if (!c) break;
        const id = b.add("shield", "Shield Generator", ell(c.x, c.y, c.r * 1.1, c.r * 1.1, 6), {
            layer: 8,
            links: [
                c.host
            ],
            style: 2
        });
        const p = b.parts[id];
        p.shieldR = 1.9 * b.S * (1 + 0.1 * i);
        p.shieldMax = p.shieldHp = p.maxHp * 3;
    }
}
const P = Math.PI;
/* ---------------- species ---------------- */ const SPECIES = [
    /* 0 ─ DRAGONFLY */ {
        id: "dragonfly",
        name: "Dragonfly",
        hue: 188,
        flying: true,
        speed: 210,
        turn: 3.4,
        ranged: true,
        keep: 330,
        muzzle: 2.2,
        armed: {
            gun: true,
            missile: false,
            shield: true
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "shoot",
                name: "Ion Bolt",
                minTier: 0,
                cd: 1.8,
                wind: 0.3,
                dmg: 0.7,
                n: 1,
                ns: 0.3,
                spread: 0.15,
                speed: 700,
                life: 1.4,
                size: 6,
                slow: 0.75,
                slowT: 1.2,
                kind: "bolt",
                maxP: 950
            },
            {
                type: "charge",
                name: "Strafe Run",
                minTier: 1,
                cd: 7,
                wind: 0.5,
                dmg: 1.5,
                speed: 880,
                dur: 0.5,
                minP: 220,
                maxP: 750
            },
            {
                type: "shoot",
                name: "Fan Burst",
                minTier: 2,
                cd: 6,
                wind: 0.5,
                dmg: 0.6,
                n: 5,
                ns: 0.6,
                spread: 0.9,
                speed: 600,
                life: 1.2,
                size: 6,
                kind: "bolt",
                maxP: 800
            },
            {
                type: "nova",
                name: "Wing Shear",
                minTier: 3,
                cd: 10,
                wind: 0.8,
                dmg: 0.7,
                n: 10,
                ns: 1.5,
                speed: 420,
                life: 1.6,
                size: 7,
                kind: "wave",
                maxP: 600
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0);
            const hd = {
                cx: 1.9,
                cy: 0,
                rx: 0.45,
                ry: 0.5,
                n: 8
            };
            const tho = {
                cx: 0.85,
                cy: 0,
                rx: 0.65,
                ry: 0.52,
                n: 8
            };
            const M = Math.min(8, 3 + t);
            const abdLen = 3.4;
            const sp = abdLen / M;
            const mounts = [];
            const iT = b.sec("Thorax", tho, {
                hpM: 1.3
            });
            const iH = b.sec("Head", hd);
            b.link(iT, iH);
            let prev = iT;
            const abds = [];
            for(let i = 0; i < M; i++){
                const cx = 0.3 - sp * (i + 0.5) + sp * 0.15;
                const tf = i / Math.max(1, M - 1);
                const s = {
                    cx,
                    cy: 0,
                    rx: sp * 0.82,
                    ry: 0.27 - 0.1 * tf,
                    n: 6
                };
                const id = b.sec("Tail Segment", s, {
                    style: i % 2
                });
                b.link(prev, id);
                prev = id;
                abds.push(id);
                if (i === 0) mounts.push({
                    sec: {
                        ...s,
                        rx: 0.5,
                        ry: 0.4
                    },
                    host: id
                });
            }
            // eyes
            for (const side of [
                1,
                -1
            ]){
                const poly = ell(1.98, 0.36, 0.32, 0.27, 6);
                b.add("armor", "Compound Eye", side > 0 ? poly : mirror(poly), {
                    layer: 3,
                    links: [
                        iH
                    ],
                    style: 2,
                    hpM: 0.9
                });
            }
            // wings (4)
            for (const side of [
                1,
                -1
            ]){
                for(let k = 0; k < 2; k++){
                    const ax = 1.0 - k * 0.45, ay = 0.3;
                    const ang = 1.45 + k * 0.25;
                    const len = 1.6 - k * 0.15;
                    const poly = ell(ax + Math.cos(ang) * len * 0.92, ay + Math.sin(ang) * len * 0.92, len, 0.33, 8, ang);
                    const w = wingPart(b, iT, ax, ay, side, poly, "Wing", 0.2, k * 1.7 + (side > 0 ? 0 : P));
                    if (t >= 2) {
                        for (const f of [
                            0.45,
                            0.8
                        ]){
                            wingSub(b, w, iT, ax, ay, side, ax + Math.cos(ang) * len * 0.92 * (f * 1.4), ay + Math.sin(ang) * len * 0.92 * (f * 1.4), 0.34, 0.2, ang, "Wing Vein Plate", 1);
                        }
                    }
                }
            }
            legPair(b, iT, 1.0, 0.3, [
                1.1,
                0.7
            ], [
                0.55,
                0.6
            ], 0.07, "Leg", {
                split: lg
            });
            legPair(b, iT, 0.7, 0.35, [
                1.5,
                1.3
            ], [
                0.55,
                0.6
            ], 0.07, "Leg", {
                split: lg,
                phase: P
            });
            b.core(tho, iT, [
                iH,
                abds[0]
            ]);
            b.armor(tho, iT, {
                name: "Thorax Plate",
                layers: 1,
                edges: t >= 3 ? 1 : 2
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 4
            });
            if (t >= 1) for(let i = 0; i < M; i += t >= 3 ? 1 : 2)b.add("armor", "Tail Plate", ell(0.3 - sp * (i + 0.5) + sp * 0.15, 0, sp * 0.5, 0.16, 6), {
                layer: 4,
                links: [
                    abds[i]
                ],
                style: 2,
                hpM: 0.9
            });
            antennae(b, iH, 2.15, 0.2, [
                0.9,
                0.4
            ], [
                0.5,
                0.5
            ]);
            mounts.push({
                sec: tho,
                host: iT,
                core: true
            }, {
                sec: hd,
                host: iH
            });
            return mounts;
        }
    },
    /* 1 ─ SCORPION */ {
        id: "scorpion",
        name: "Scorpion",
        hue: 2,
        flying: false,
        speed: 115,
        turn: 2.4,
        ranged: false,
        keep: 0,
        muzzle: 2.6,
        armed: {
            gun: true,
            missile: false,
            shield: false
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Pincer Clamp",
                minTier: 0,
                cd: 2.6,
                wind: 0.5,
                dmg: 2,
                maxS: 3.5,
                role: "arm",
                needs: "Pincer"
            },
            {
                type: "swing",
                name: "Tail Lash",
                minTier: 0,
                cd: 4.2,
                wind: 0.6,
                dmg: 2.6,
                maxS: 3.9,
                role: "tail",
                needs: "Stinger",
                poison: 0.3
            },
            {
                type: "shoot",
                name: "Venom Bolt",
                minTier: 1,
                cd: 4.5,
                wind: 0.4,
                dmg: 0.9,
                n: 1,
                ns: 0.5,
                spread: 0.3,
                speed: 560,
                life: 1.5,
                size: 7,
                poison: 0.25,
                kind: "bolt",
                minP: 200,
                maxP: 800
            },
            {
                type: "pull",
                name: "Claw Grapple",
                minTier: 2,
                cd: 11,
                wind: 0.5,
                dmg: 0.5,
                speed: 760,
                minP: 260,
                maxP: 800
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const abd = {
                cx: -0.5,
                cy: 0,
                rx: 1.3,
                ry: 0.82,
                n: 10
            };
            const car = {
                cx: 0.95,
                cy: 0,
                rx: 0.8,
                ry: 0.74,
                n: 8
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.4
            });
            const iC = b.sec("Carapace", car, {
                hpM: 1.3
            });
            b.link(iA, iC);
            for(let k = 0; k < 4; k++){
                const ang = [
                    1.2,
                    1.55,
                    1.9,
                    2.3
                ][k];
                legPair(b, k < 2 ? iC : iA, [
                    1.2,
                    0.8,
                    0.1,
                    -0.5
                ][k], 0.55, [
                    ang,
                    ang + 0.3
                ], [
                    0.6,
                    0.7
                ], 0.11, "Leg", {
                    split: lg,
                    phase: k % 2 ? P : 0
                });
            }
            b.core(car, iC, [
                iA
            ]);
            b.armor(abd, iA, {
                name: "Tergite Plate",
                layers: pl,
                edges: ed
            });
            b.armor(car, iC, {
                name: "Carapace Plate",
                layers: 1,
                edges: ed
            });
            // claws
            for (const side of [
                1,
                -1
            ]){
                const gi = b.group(1.4, 0.5 * side, "arm", side, 0.05, 0);
                const arm = taper(1.4, 0.5, 2.15, 1.0, 0.22, 0.2);
                const a = b.add("arm", "Claw Arm", side > 0 ? arm : mirror(arm), {
                    layer: 2,
                    g: gi,
                    links: [
                        iC
                    ]
                });
                const palm = ell(2.55, 0.92, 0.48, 0.38, 6);
                const pm = b.add("arm", "Claw Palm", side > 0 ? palm : mirror(palm), {
                    layer: 2.2,
                    g: gi,
                    links: [
                        a
                    ],
                    hpM: 1.2
                });
                const f1 = taper(2.85, 1.05, 3.75, 0.82, 0.15, 0.04);
                const f2 = taper(2.85, 0.78, 3.7, 0.45, 0.15, 0.04);
                b.add("arm", "Pincer", side > 0 ? f1 : mirror(f1), {
                    layer: 2.1,
                    g: gi,
                    links: [
                        pm
                    ]
                });
                b.add("arm", "Pincer", side > 0 ? f2 : mirror(f2), {
                    layer: 2.1,
                    g: gi,
                    links: [
                        pm
                    ]
                });
                if (t >= 2) {
                    const guard = ell(2.45, 0.92, 0.3, 0.24, 6);
                    b.add("armor", "Claw Guard", side > 0 ? guard : mirror(guard), {
                        layer: 2.5,
                        g: gi,
                        links: [
                            pm
                        ],
                        style: 1
                    });
                }
            }
            // tail curled over the back
            const N = 4 + Math.min(4, t);
            const tg = b.group(-1.55, 0, "tail", 1, 0.05, 0);
            let prev = iA;
            let px = -1.55, py = 0;
            for(let i = 1; i <= N; i++){
                const f = i / N;
                const x = -1.55 + f * 3.4;
                const y = 0.3 * Math.sin(f * P);
                const poly = taper(px - 0.08, py, x, y, 0.3 - 0.1 * (i - 1) / N, 0.3 - 0.1 * i / N);
                prev = b.add("segment", "Tail Segment", poly, {
                    layer: 5,
                    g: tg,
                    links: [
                        prev
                    ],
                    style: i % 2 ? 2 : 0,
                    hpM: 0.9
                });
                px = x;
                py = y;
            }
            b.add("spike", "Stinger", [
                px - 0.05,
                -0.2,
                px + 0.9,
                0,
                px - 0.05,
                0.2
            ], {
                layer: 5.2,
                g: tg,
                links: [
                    prev
                ],
                hpM: 1.2
            });
            if (t >= 2) b.spikes(abd, iA, {
                every: 2,
                len: 0.22
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: car,
                    host: iC,
                    core: true
                }
            ];
        }
    },
    /* 2 ─ SPIDER */ {
        id: "spider",
        name: "Widow Spider",
        hue: 272,
        flying: false,
        speed: 140,
        turn: 2.8,
        ranged: true,
        keep: 300,
        muzzle: 2.2,
        armed: {
            gun: false,
            missile: true,
            shield: false
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "shoot",
                name: "Web Shot",
                minTier: 0,
                cd: 6,
                wind: 0.5,
                dmg: 0.4,
                n: 1,
                speed: 460,
                life: 1.8,
                size: 12,
                slow: 0.5,
                slowT: 2.5,
                kind: "web",
                minP: 120,
                maxP: 800
            },
            {
                type: "swing",
                name: "Fang Strike",
                minTier: 0,
                cd: 2,
                wind: 0.4,
                dmg: 1.7,
                maxS: 2.3,
                role: "mandible",
                needs: "Fang"
            },
            {
                type: "spit",
                name: "Acid Glob",
                minTier: 1,
                cd: 7,
                wind: 0.5,
                dmg: 0.6,
                speed: 480,
                size: 1.5,
                maxP: 800
            },
            {
                type: "pull",
                name: "Silk Line",
                minTier: 2,
                cd: 12,
                wind: 0.5,
                dmg: 0.5,
                speed: 760,
                minP: 250,
                maxP: 850
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const cef = {
                cx: 0.65,
                cy: 0,
                rx: 0.8,
                ry: 0.74,
                n: 8
            };
            const abd = {
                cx: -0.95,
                cy: 0,
                rx: 1.0,
                ry: 0.94,
                n: 10
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.5
            });
            const iC = b.sec("Cephalothorax", cef, {
                hpM: 1.3
            });
            b.link(iA, iC);
            const L = [
                {
                    sx: 1.0,
                    sy: 0.3,
                    a: [
                        0.8,
                        0.55,
                        0.95
                    ],
                    ph: 0
                },
                {
                    sx: 0.7,
                    sy: 0.5,
                    a: [
                        1.25,
                        1.1,
                        1.5
                    ],
                    ph: P
                },
                {
                    sx: 0.3,
                    sy: 0.6,
                    a: [
                        1.7,
                        1.8,
                        2.1
                    ],
                    ph: 0
                },
                {
                    sx: -0.1,
                    sy: 0.55,
                    a: [
                        2.1,
                        2.4,
                        2.7
                    ],
                    ph: P
                }
            ];
            for (const l of L)legPair(b, iC, l.sx, l.sy, l.a, [
                0.8,
                1.2,
                1.0
            ], 0.12, "Leg", {
                split: lg,
                phase: l.ph
            });
            b.core(cef, iC, [
                iA
            ]);
            b.armor(abd, iA, {
                name: "Abdomen Plate",
                layers: pl,
                edges: ed
            });
            b.armor(cef, iC, {
                name: "Carapace Plate",
                layers: 1,
                edges: ed
            });
            mandibles(b, iC, 1.35, 0.15, [
                1.4,
                0.05,
                1.85,
                0.34,
                2.4,
                0.3,
                2.15,
                0.12,
                1.9,
                0.04
            ], "Fang", 1.1);
            for (const side of [
                1,
                -1
            ]){
                const e = ell(1.15, 0.22, 0.14, 0.14, 6);
                b.add("armor", "Eye Cluster", side > 0 ? e : mirror(e), {
                    layer: 3.5,
                    links: [
                        iC
                    ],
                    style: 2,
                    hpM: 0.6
                });
            }
            if (t >= 1) b.add("spike", "Spinneret", [
                -1.85,
                -0.2,
                -2.6,
                0,
                -1.85,
                0.2
            ], {
                layer: 2,
                links: [
                    iA
                ]
            });
            if (t >= 2) b.spikes(abd, iA, {
                every: 2,
                len: 0.2
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: cef,
                    host: iC,
                    core: true
                }
            ];
        }
    },
    /* 3 ─ LUNA MOTH */ {
        id: "moth",
        name: "Luna Moth",
        hue: 236,
        flying: true,
        speed: 130,
        turn: 2.6,
        ranged: true,
        keep: 380,
        muzzle: 1.4,
        armed: {
            gun: false,
            missile: false,
            shield: true
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "cloud",
                name: "Scale Dust",
                minTier: 0,
                cd: 8,
                wind: 0.6,
                dmg: 0.4,
                size: 2.8,
                slow: 0.55,
                atPlayer: true,
                maxP: 700
            },
            {
                type: "shoot",
                name: "Spore Orbs",
                minTier: 1,
                cd: 5,
                wind: 0.5,
                dmg: 0.8,
                n: 2,
                ns: 0.5,
                spread: 0.7,
                speed: 260,
                life: 4,
                size: 9,
                homing: 1.6,
                slow: 0.8,
                slowT: 1,
                kind: "orb",
                maxP: 800
            },
            {
                type: "pull",
                name: "Lunar Lure",
                minTier: 2,
                cd: 12,
                wind: 0.6,
                dmg: 0.5,
                speed: 700,
                minP: 250,
                maxP: 800
            },
            {
                type: "ring",
                name: "Gust Pulse",
                minTier: 3,
                cd: 9,
                wind: 0.9,
                dmg: 1.2,
                size: 6,
                speed: 460,
                maxS: 4
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const tho = {
                cx: 0.35,
                cy: 0,
                rx: 0.65,
                ry: 0.6,
                n: 8
            };
            const abd = {
                cx: -0.85,
                cy: 0,
                rx: 0.85,
                ry: 0.5,
                n: 8
            };
            const hd = {
                cx: 1.2,
                cy: 0,
                rx: 0.38,
                ry: 0.42,
                n: 6
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.2
            });
            const iT = b.sec("Thorax", tho, {
                hpM: 1.3
            });
            const iH = b.sec("Head", hd);
            b.link(iA, iT);
            b.link(iT, iH);
            for (const side of [
                1,
                -1
            ]){
                const fore = [
                    0.3,
                    0.3,
                    1.0,
                    0.5,
                    0.85,
                    2.0,
                    -0.3,
                    2.5,
                    -1.3,
                    1.6,
                    -0.9,
                    0.4
                ];
                const hind = [
                    -0.3,
                    0.3,
                    -0.2,
                    1.2,
                    -1.2,
                    1.9,
                    -2.1,
                    1.3,
                    -1.6,
                    0.3
                ];
                wingPart(b, iT, 0.1, 0.3, side, hind, "Hindwing", 0.14, 1);
                const fw = wingPart(b, iT, 0.2, 0.3, side, fore, "Forewing", 0.18, 0, 1.2);
                if (t >= 1) wingSub(b, fw, iT, 0, 0, side, -0.15, 1.4, 0.3, 0.3, 0, "Eyespot", 2);
                for(let k = 0; k < Math.min(t, 4); k++)wingSub(b, fw, iT, 0, 0, side, 0.55 - 0.45 * k, 0.95 + 0.4 * k, 0.28, 0.2, 0.6, "Wing Scale Plate", 1);
            }
            legPair(b, iT, 0.8, 0.3, [
                1.2,
                0.8
            ], [
                0.45,
                0.5
            ], 0.06, "Leg");
            legPair(b, iT, 0.4, 0.35, [
                1.6,
                1.4
            ], [
                0.45,
                0.5
            ], 0.06, "Leg", {
                phase: P
            });
            legPair(b, iT, 0.0, 0.35, [
                2.0,
                2.2
            ], [
                0.45,
                0.5
            ], 0.06, "Leg");
            b.core(tho, iT, [
                iA,
                iH
            ]);
            b.armor(abd, iA, {
                name: "Abdomen Plate",
                layers: pl,
                edges: ed
            });
            b.armor(tho, iT, {
                name: "Thorax Plate",
                layers: 1,
                edges: ed
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 3
            });
            antennae(b, iH, 1.45, 0.2, [
                0.8,
                0.5
            ], [
                0.55,
                0.55
            ], 0.06);
            if (t >= 2) b.spikes(abd, iA, {
                every: 2,
                len: 0.2
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: tho,
                    host: iT,
                    core: true
                }
            ];
        }
    },
    /* 4 ─ MANTIS */ {
        id: "mantis",
        name: "Mantis",
        hue: 92,
        flying: false,
        speed: 120,
        turn: 3.0,
        ranged: false,
        keep: 0,
        muzzle: 2.0,
        armed: {
            gun: false,
            missile: false,
            shield: true
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Scythe Strike",
                minTier: 0,
                cd: 2.2,
                wind: 0.5,
                dmg: 2.4,
                maxS: 3.2,
                role: "arm",
                needs: "Raptor Blade"
            },
            {
                type: "charge",
                name: "Lunge",
                minTier: 1,
                cd: 6,
                wind: 0.5,
                dmg: 2,
                speed: 820,
                dur: 0.35,
                minP: 150,
                maxP: 600
            },
            {
                type: "shoot",
                name: "Blade Wave",
                minTier: 2,
                cd: 5,
                wind: 0.5,
                dmg: 1.5,
                n: 1,
                ns: 0.4,
                spread: 0.3,
                speed: 520,
                life: 1.5,
                size: 14,
                pierce: true,
                kind: "wave",
                minP: 150,
                maxP: 800
            },
            {
                type: "nova",
                name: "Whirling Blades",
                minTier: 4,
                cd: 10,
                wind: 0.8,
                dmg: 1,
                n: 10,
                ns: 1,
                speed: 380,
                life: 1.6,
                size: 9,
                kind: "wave",
                maxP: 600
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0) + (t >= 5 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const abd = {
                cx: -1.4,
                cy: 0,
                rx: 1.2,
                ry: 0.5,
                n: 8
            };
            const tho = {
                cx: 0.35,
                cy: 0,
                rx: 1.15,
                ry: 0.44,
                n: 8
            };
            const hd = {
                cx: 1.8,
                cy: 0,
                rx: 0.4,
                ry: 0.52,
                n: 6
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.2
            });
            const iT = b.sec("Thorax", tho, {
                hpM: 1.4
            });
            const iH = b.sec("Head", hd);
            b.link(iA, iT);
            b.link(iT, iH);
            legPair(b, iT, 0.1, 0.3, [
                1.65,
                1.95
            ], [
                0.85,
                1.0
            ], 0.1, "Leg", {
                split: lg
            });
            legPair(b, iT, -0.5, 0.3, [
                1.8,
                2.3
            ], [
                0.85,
                1.0
            ], 0.1, "Leg", {
                split: lg,
                phase: P
            });
            legPair(b, iA, -1.3, 0.3, [
                2.0,
                2.6
            ], [
                0.85,
                1.0
            ], 0.1, "Leg", {
                split: lg
            });
            b.core(tho, iT, [
                iA,
                iH
            ]);
            b.armor(abd, iA, {
                name: "Abdomen Plate",
                layers: pl,
                edges: ed
            });
            b.armor(tho, iT, {
                name: "Thorax Plate",
                layers: 1,
                edges: ed
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 3
            });
            for (const side of [
                1,
                -1
            ]){
                const wc = ell(-1.5, 0.21, 1.35, 0.3, 8);
                b.add("armor", "Wing Case", side > 0 ? wc : mirror(wc), {
                    layer: 3,
                    links: [
                        iA
                    ],
                    style: 1
                });
                // raptorial arms
                const gi = b.group(1.0, 0.35 * side, "arm", side, 0.05, 0);
                const up = taper(1.0, 0.3, 1.95, 0.88, 0.22, 0.17);
                const upId = b.add("arm", "Raptor Arm", side > 0 ? up : mirror(up), {
                    layer: 2,
                    g: gi,
                    links: [
                        iT
                    ]
                });
                const blade = saw(1.95, 0.88, 3.15, 0.5, 0.18, 0.1, 3 + Math.floor(t / 2), 0.17, -1);
                b.add("arm", "Raptor Blade", side > 0 ? blade : mirror(blade), {
                    layer: 2.1,
                    g: gi,
                    links: [
                        upId
                    ],
                    hpM: 1.2
                });
                if (t >= 2) {
                    const guard = taper(1.2, 0.42, 1.8, 0.8, 0.12, 0.1);
                    b.add("armor", "Arm Guard", side > 0 ? guard : mirror(guard), {
                        layer: 2.5,
                        g: gi,
                        links: [
                            upId
                        ],
                        style: 1
                    });
                }
                if (t >= 4) {
                    const guard2 = taper(2.1, 0.86, 2.8, 0.62, 0.08, 0.06);
                    b.add("armor", "Blade Guard", side > 0 ? guard2 : mirror(guard2), {
                        layer: 2.6,
                        g: gi,
                        links: [
                            upId
                        ],
                        style: 2
                    });
                }
            }
            antennae(b, iH, 2.0, 0.22, [
                0.8,
                0.3
            ], [
                0.7,
                0.7
            ], 0.04);
            if (t >= 2) b.spikes(abd, iA, {
                every: 2,
                len: 0.2
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: tho,
                    host: iT,
                    core: true
                }
            ];
        }
    },
    /* 5 ─ CENTIPEDE */ {
        id: "centipede",
        name: "Centipede",
        hue: 335,
        flying: false,
        speed: 170,
        turn: 2.2,
        ranged: false,
        keep: 0,
        muzzle: 3.0,
        armed: {
            gun: false,
            missile: false,
            shield: false
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Forcipule Bite",
                minTier: 0,
                cd: 2,
                wind: 0.4,
                dmg: 1.8,
                maxS: 3.6,
                role: "mandible",
                needs: "Forcipule"
            },
            {
                type: "charge",
                name: "Rush",
                minTier: 0,
                cd: 5,
                wind: 0.4,
                dmg: 1.5,
                speed: 540,
                dur: 0.9,
                minP: 220,
                maxP: 900
            },
            {
                type: "shoot",
                name: "Venom Spray",
                minTier: 1,
                cd: 5,
                wind: 0.4,
                dmg: 0.5,
                n: 5,
                ns: 0.8,
                spread: 0.9,
                speed: 500,
                life: 0.9,
                size: 6,
                poison: 0.15,
                kind: "bolt",
                maxP: 520
            },
            {
                type: "nova",
                name: "Venom Ring",
                minTier: 3,
                cd: 10,
                wind: 0.8,
                dmg: 0.6,
                n: 14,
                ns: 2,
                speed: 380,
                life: 1.5,
                size: 7,
                poison: 0.15,
                kind: "bolt",
                maxP: 600
            }
        ],
        build (b, t) {
            const N = 5 + 2 * t;
            const L = 5.2;
            const sp = L / N;
            const c = Math.floor(N / 2);
            const ids = [];
            const secs = [];
            for(let i = 0; i < N; i++){
                const last = i === N - 1;
                const cx = -L / 2 + sp * (i + 0.5);
                const ry = 0.42 + 0.12 * (i / (N - 1));
                const s = last ? {
                    cx: cx + sp * 0.15,
                    cy: 0,
                    rx: Math.max(0.42, sp * 0.8),
                    ry: 0.58,
                    n: 8
                } : {
                    cx,
                    cy: 0,
                    rx: sp * 0.82,
                    ry,
                    n: 6
                };
                secs.push(s);
                ids.push(b.sec(last ? "Head" : "Body Segment", s, {
                    style: i % 2,
                    hpM: last ? 1.2 : 1
                }));
                if (i > 0) b.link(ids[i - 1], ids[i]);
            }
            for(let i = 0; i < N - 1; i++){
                const dl = Math.min(2, 1 + (t >= 3 ? 1 : 0));
                legPair(b, ids[i], secs[i].cx, 0.25, [
                    1.25,
                    1.75
                ], [
                    0.5,
                    0.55
                ], 0.06, "Leg", {
                    split: dl,
                    phase: i * 0.7,
                    amp: 0.4
                });
            }
            b.core(secs[c], ids[c], [
                ids[c - 1],
                ids[c + 1]
            ]);
            for(let i = 0; i < N; i++){
                if (i === c) {
                    b.armor(secs[i], ids[i], {
                        name: "Tergite",
                        layers: 1,
                        edges: 3
                    });
                    continue;
                }
                b.armor(secs[i], ids[i], {
                    name: i === N - 1 ? "Cranial Plate" : "Tergite",
                    layers: t >= 3 ? 2 : 1,
                    edges: 3,
                    style: i % 2
                });
            }
            const hs = secs[N - 1];
            mandibles(b, ids[N - 1], hs.cx + hs.rx * 0.8, 0.2, [
                hs.cx + hs.rx * 0.7,
                0.05,
                hs.cx + hs.rx * 1.1,
                0.34,
                hs.cx + hs.rx * 1.6,
                0.28,
                hs.cx + hs.rx * 1.35,
                0.1,
                hs.cx + hs.rx * 1.0,
                0.03
            ], "Forcipule", 1.2);
            antennae(b, ids[N - 1], hs.cx + hs.rx * 0.6, 0.3, [
                0.8,
                0.4
            ], [
                0.6,
                0.6
            ], 0.04);
            return [];
        }
    },
    /* 6 ─ HORNET */ {
        id: "wasp",
        name: "Hornet",
        hue: 52,
        flying: true,
        speed: 190,
        turn: 3.6,
        ranged: false,
        keep: 0,
        muzzle: 1.8,
        armed: {
            gun: true,
            missile: true,
            shield: false
        },
        pack: [
            2,
            2,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Mandible Snap",
                minTier: 0,
                cd: 2,
                wind: 0.35,
                dmg: 1.2,
                maxS: 2.2,
                role: "mandible",
                needs: "Mandible"
            },
            {
                type: "charge",
                name: "Hornet Dive",
                minTier: 0,
                cd: 5,
                wind: 0.5,
                dmg: 1.6,
                speed: 900,
                dur: 0.45,
                poison: 0.25,
                minP: 150,
                maxP: 800
            },
            {
                type: "shoot",
                name: "Stinger Volley",
                minTier: 1,
                cd: 4,
                wind: 0.35,
                dmg: 0.7,
                n: 3,
                ns: 0.5,
                spread: 0.35,
                speed: 620,
                life: 1.3,
                size: 5,
                poison: 0.2,
                kind: "bolt",
                minP: 150,
                maxP: 750
            },
            {
                type: "nova",
                name: "Stinger Burst",
                minTier: 3,
                cd: 10,
                wind: 0.8,
                dmg: 0.6,
                n: 12,
                ns: 1.5,
                speed: 440,
                life: 1.4,
                size: 5,
                kind: "bolt",
                maxP: 600
            }
        ],
        build (b, t) {
            const lg = 1 + (t >= 3 ? 1 : 0);
            const abd = {
                cx: -1.45,
                cy: 0,
                rx: 1.25,
                ry: 0.66,
                n: 8
            };
            const tho = {
                cx: 0.2,
                cy: 0,
                rx: 0.65,
                ry: 0.6,
                n: 8
            };
            const hd = {
                cx: 1.1,
                cy: 0,
                rx: 0.45,
                ry: 0.52,
                n: 8
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.4
            });
            const iT = b.sec("Thorax", tho, {
                hpM: 1.3
            });
            const iH = b.sec("Head", hd);
            b.link(iA, iT);
            b.link(iT, iH);
            legPair(b, iT, 0.55, 0.3, [
                1.1,
                0.7
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg
            });
            legPair(b, iT, 0.2, 0.4, [
                1.6,
                1.5
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg,
                phase: P
            });
            legPair(b, iT, -0.2, 0.4, [
                2.0,
                2.3
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg
            });
            b.core(tho, iT, [
                iA,
                iH
            ]);
            b.armor(tho, iT, {
                name: "Thorax Plate",
                layers: 1,
                edges: t >= 3 ? 1 : 2
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 4
            });
            // abdomen stripes
            const stripes = Math.min(8, 3 + t);
            const x0 = -2.7, x1 = -0.2;
            for(let i = 0; i < stripes; i++){
                const xa = x0 + (x1 - x0) * i / stripes, xb = x0 + (x1 - x0) * (i + 1) / stripes;
                const top = [], bot = [];
                for(let k = 0; k <= 3; k++){
                    const x = xa + (xb - xa) * k / 3;
                    const u = (x - abd.cx) / abd.rx;
                    const hy = abd.ry * 0.98 * Math.sqrt(Math.max(0.02, 1 - u * u));
                    top.push(x, hy);
                    bot.unshift(x, -hy);
                }
                b.add("armor", "Abdomen Band", [
                    ...top,
                    ...bot
                ], {
                    layer: 4,
                    links: [
                        iA
                    ],
                    style: i % 2 ? 1 : 2,
                    hpM: 1.1
                });
            }
            b.add("spike", "Stinger", [
                -2.55,
                -0.2,
                -3.55,
                0,
                -2.55,
                0.2
            ], {
                layer: 2,
                links: [
                    iA
                ],
                hpM: 1.2
            });
            for (const side of [
                1,
                -1
            ]){
                const eye = ell(1.2, 0.34, 0.2, 0.2, 6);
                b.add("armor", "Compound Eye", side > 0 ? eye : mirror(eye), {
                    layer: 3,
                    links: [
                        iH
                    ],
                    style: 2,
                    hpM: 0.8
                });
                const fw = wingPart(b, iT, 0.25, 0.4, side, ell(0.25 + Math.cos(1.9) * 1.3, 0.4 + Math.sin(1.9) * 1.3, 1.5, 0.5, 8, 1.9), "Forewing", 0.25, side > 0 ? 0 : P);
                wingPart(b, iT, -0.05, 0.4, side, ell(-0.05 + Math.cos(2.4) * 0.9, 0.4 + Math.sin(2.4) * 0.9, 1.0, 0.35, 8, 2.4), "Hindwing", 0.25, side > 0 ? 1 : 1 + P);
                if (t >= 2) wingSub(b, fw, iT, 0, 0, side, 0.25 + Math.cos(1.9) * 1.6, 0.4 + Math.sin(1.9) * 1.6, 0.55, 0.28, 1.9, "Wing Plate", 1);
            }
            mandibles(b, iH, 1.4, 0.15, [
                1.35,
                0.06,
                1.65,
                0.3,
                2.05,
                0.28,
                1.85,
                0.1,
                1.6,
                0.03
            ], "Mandible");
            antennae(b, iH, 1.4, 0.25, [
                0.9,
                0.4
            ], [
                0.5,
                0.5
            ], 0.04);
            if (t >= 3) b.spikes(abd, iA, {
                every: 2,
                len: 0.15
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: tho,
                    host: iT,
                    core: true
                }
            ];
        }
    },
    /* 7 ─ SCARAB BEETLE */ {
        id: "beetle",
        name: "Scarab",
        hue: 140,
        flying: false,
        speed: 110,
        turn: 2.8,
        ranged: false,
        keep: 0,
        muzzle: 2.8,
        armed: {
            gun: true,
            missile: true,
            shield: true
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Mandible Crush",
                minTier: 0,
                cd: 2.4,
                wind: 0.45,
                dmg: 1.8,
                maxS: 2.7,
                role: "mandible",
                needs: "Mandible"
            },
            {
                type: "charge",
                name: "Ram",
                minTier: 0,
                cd: 7,
                wind: 0.8,
                dmg: 2.6,
                speed: 560,
                dur: 0.6,
                minP: 200,
                maxP: 750
            },
            {
                type: "ring",
                name: "Quake Stomp",
                minTier: 2,
                cd: 9,
                wind: 0.9,
                dmg: 1.6,
                size: 6,
                speed: 420,
                maxS: 3.8
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0) + (t >= 5 ? 1 : 0), lg = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const abd = {
                cx: -0.8,
                cy: 0,
                rx: 1.35,
                ry: 1.1,
                n: 10
            };
            const tho = {
                cx: 0.7,
                cy: 0,
                rx: 0.8,
                ry: 0.82,
                n: 8
            };
            const hd = {
                cx: 1.6,
                cy: 0,
                rx: 0.55,
                ry: 0.6,
                n: 6
            };
            const iA = b.sec("Abdomen", abd, {
                hpM: 1.5
            });
            const iT = b.sec("Thorax", tho, {
                hpM: 1.3
            });
            const iH = b.sec("Head", hd);
            b.link(iA, iT);
            b.link(iT, iH);
            legPair(b, iT, 1.0, 0.45, [
                1.1,
                0.6
            ], [
                0.9,
                1.0
            ], 0.17, "Leg", {
                split: lg
            });
            legPair(b, iT, 0.35, 0.6, [
                1.5,
                1.45
            ], [
                0.95,
                1.05
            ], 0.17, "Leg", {
                split: lg,
                phase: P
            });
            legPair(b, iA, -0.55, 0.75, [
                1.95,
                2.3
            ], [
                1.0,
                1.1
            ], 0.17, "Leg", {
                split: lg
            });
            b.core(tho, iT, [
                iA,
                iH
            ]);
            b.armor(abd, iA, {
                name: "Elytron Plate",
                layers: pl,
                edges: ed
            });
            b.armor(tho, iT, {
                name: "Pronotum Plate",
                layers: 1,
                edges: ed
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 3
            });
            mandibles(b, iH, 1.85, 0.22, [
                1.78,
                0.1,
                2.05,
                0.42,
                2.5,
                0.58,
                2.95,
                0.4,
                2.62,
                0.3,
                2.28,
                0.28,
                2.05,
                0.1
            ], "Mandible", 1.2);
            if (t >= 2) b.add("spike", "Horn", [
                1.9,
                -0.14,
                2.8,
                0,
                1.9,
                0.14
            ], {
                layer: 3,
                links: [
                    iH
                ],
                hpM: 1.5
            });
            if (t >= 2) b.spikes(abd, iA, {
                every: 2,
                len: 0.2
            });
            if (t >= 4) b.spikes(tho, iT, {
                every: 2,
                len: 0.2
            });
            return [
                {
                    sec: abd,
                    host: iA
                },
                {
                    sec: tho,
                    host: iT,
                    core: true
                },
                {
                    sec: hd,
                    host: iH
                }
            ];
        }
    },
    /* 8 ─ SOLDIER ANT */ {
        id: "ant",
        name: "Soldier Ant",
        hue: 28,
        flying: false,
        speed: 150,
        turn: 3.4,
        ranged: false,
        keep: 0,
        muzzle: 3.0,
        armed: {
            gun: true,
            missile: false,
            shield: false
        },
        pack: [
            4,
            3,
            2,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "swing",
                name: "Mandible Crush",
                minTier: 0,
                cd: 2,
                wind: 0.4,
                dmg: 1.6,
                maxS: 3.1,
                role: "mandible",
                needs: "Mandible"
            },
            {
                type: "spit",
                name: "Formic Acid",
                minTier: 0,
                cd: 5,
                wind: 0.45,
                dmg: 0.7,
                speed: 500,
                size: 1.3,
                minP: 150,
                maxP: 750
            },
            {
                type: "cloud",
                name: "Formic Haze",
                minTier: 2,
                cd: 9,
                wind: 0.6,
                dmg: 0.5,
                size: 3.2,
                slow: 0.6,
                maxS: 3.2
            },
            {
                type: "nova",
                name: "Acid Burst",
                minTier: 4,
                cd: 10,
                wind: 0.8,
                dmg: 0.7,
                n: 12,
                ns: 1.5,
                speed: 380,
                life: 1.5,
                size: 8,
                kind: "bolt",
                maxP: 600
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 2 ? 1 : 0) + (t >= 4 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const gas = {
                cx: -1.15,
                cy: 0,
                rx: 1.0,
                ry: 0.82,
                n: 10
            };
            const pet = {
                cx: -0.2,
                cy: 0,
                rx: 0.3,
                ry: 0.28,
                n: 6
            };
            const tho = {
                cx: 0.55,
                cy: 0,
                rx: 0.65,
                ry: 0.5,
                n: 8
            };
            const hd = {
                cx: 1.55,
                cy: 0,
                rx: 0.58,
                ry: 0.52,
                n: 8
            };
            const iG = b.sec("Gaster", gas, {
                hpM: 1.4
            });
            const iP = b.sec("Petiole", pet, {
                hpM: 0.8,
                layer: 1.1
            });
            const iT = b.sec("Thorax", tho, {
                hpM: 1.3
            });
            const iH = b.sec("Head", hd);
            b.link(iG, iP);
            b.link(iP, iT);
            b.link(iT, iH);
            legPair(b, iT, 0.95, 0.3, [
                1.1,
                0.7
            ], [
                1.0,
                1.2
            ], 0.08, "Leg", {
                split: lg
            });
            legPair(b, iT, 0.55, 0.35, [
                1.6,
                1.5
            ], [
                1.0,
                1.2
            ], 0.08, "Leg", {
                split: lg,
                phase: P
            });
            legPair(b, iT, 0.15, 0.35, [
                2.0,
                2.4
            ], [
                1.0,
                1.2
            ], 0.08, "Leg", {
                split: lg
            });
            b.core(tho, iT, [
                iP,
                iH
            ]);
            b.armor(gas, iG, {
                name: "Gaster Plate",
                layers: pl,
                edges: ed
            });
            b.armor(tho, iT, {
                name: "Thorax Plate",
                layers: 1,
                edges: ed
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 4
            });
            for (const side of [
                1,
                -1
            ]){
                const gi = b.group(2.0, 0.28 * side, "mandible", side, 0.1, 0);
                const m = saw(2.0, 0.3, 3.05, 0.12, 0.14, 0.07, 3, 0.15, -1);
                b.add("arm", "Mandible", side > 0 ? m : mirror(m), {
                    layer: 2,
                    g: gi,
                    links: [
                        iH
                    ],
                    hpM: 1.2
                });
            }
            antennae(b, iH, 1.9, 0.3, [
                1.0,
                0.2
            ], [
                0.8,
                0.8
            ], 0.04);
            if (t >= 2) b.spikes(gas, iG, {
                every: 2,
                len: 0.18
            });
            return [
                {
                    sec: gas,
                    host: iG
                },
                {
                    sec: tho,
                    host: iT,
                    core: true
                }
            ];
        }
    },
    /* 9 ─ FIREFLY */ {
        id: "firefly",
        name: "Firefly",
        hue: 305,
        flying: true,
        speed: 125,
        turn: 2.8,
        ranged: true,
        keep: 340,
        muzzle: 1.7,
        armed: {
            gun: true,
            missile: false,
            shield: true
        },
        pack: [
            1,
            1,
            1,
            1,
            1,
            1
        ],
        abilities: [
            {
                type: "shoot",
                name: "Glow Orb",
                minTier: 0,
                cd: 3,
                wind: 0.4,
                dmg: 0.8,
                n: 1,
                ns: 0.4,
                spread: 0.5,
                speed: 300,
                life: 4.5,
                size: 9,
                homing: 1.2,
                slow: 0.8,
                slowT: 1,
                kind: "orb",
                maxP: 850
            },
            {
                type: "ring",
                name: "Flash Pulse",
                minTier: 1,
                cd: 8,
                wind: 0.8,
                dmg: 1.4,
                size: 5,
                speed: 480,
                maxS: 4
            },
            {
                type: "charge",
                name: "Flash Dive",
                minTier: 2,
                cd: 7,
                wind: 0.6,
                dmg: 1.6,
                speed: 780,
                dur: 0.5,
                minP: 200,
                maxP: 700
            },
            {
                type: "nova",
                name: "Firework",
                minTier: 3,
                cd: 10,
                wind: 0.8,
                dmg: 0.7,
                n: 14,
                ns: 2,
                speed: 360,
                life: 1.8,
                size: 8,
                homing: 0.4,
                kind: "orb",
                maxP: 600
            }
        ],
        build (b, t) {
            const pl = 1 + (t >= 3 ? 1 : 0), lg = 1 + (t >= 3 ? 1 : 0), ed = t >= 3 ? 1 : 2;
            const el = {
                cx: -0.35,
                cy: 0,
                rx: 1.15,
                ry: 0.68,
                n: 8
            };
            const lan = {
                cx: -1.75,
                cy: 0,
                rx: 0.58,
                ry: 0.5,
                n: 6
            };
            const pro = {
                cx: 0.8,
                cy: 0,
                rx: 0.6,
                ry: 0.62,
                n: 8
            };
            const hd = {
                cx: 1.5,
                cy: 0,
                rx: 0.36,
                ry: 0.42,
                n: 6
            };
            const iE = b.sec("Elytra Body", el, {
                hpM: 1.4
            });
            const iL = b.sec("Lantern", lan, {
                style: 3,
                hpM: 1.2,
                layer: 1.2
            });
            const iP = b.sec("Pronotum", pro, {
                hpM: 1.2
            });
            const iH = b.sec("Head", hd);
            b.link(iE, iL);
            b.link(iE, iP);
            b.link(iP, iH);
            for (const side of [
                1,
                -1
            ]){
                wingPart(b, iE, -0.5, 0.5, side, ell(-0.5 + Math.cos(2.3) * 1.2, 0.5 + Math.sin(2.3) * 1.2, 1.35, 0.36, 8, 2.3), "Hindwing", 0.22, side > 0 ? 0 : P);
            }
            legPair(b, iP, 0.9, 0.3, [
                1.1,
                0.7
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg
            });
            legPair(b, iE, 0.2, 0.5, [
                1.6,
                1.5
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg,
                phase: P
            });
            legPair(b, iE, -0.6, 0.55, [
                2.0,
                2.3
            ], [
                0.5,
                0.6
            ], 0.07, "Leg", {
                split: lg
            });
            b.core(el, iE, [
                iL,
                iP
            ]);
            b.armor(el, iE, {
                name: "Elytron Plate",
                layers: 1,
                edges: ed
            });
            b.armor(pro, iP, {
                name: "Pronotum Plate",
                layers: pl,
                edges: ed
            });
            b.armor(hd, iH, {
                name: "Cranial Plate",
                layers: 1,
                edges: 3
            });
            if (t >= 1) b.armor(lan, iL, {
                name: "Lantern Frame",
                layers: 1,
                edges: 3,
                style: 2,
                hpM: 0.9
            });
            antennae(b, iH, 1.7, 0.2, [
                0.9,
                0.4
            ], [
                0.5,
                0.5
            ], 0.04);
            if (t >= 3) b.spikes(pro, iP, {
                every: 2,
                len: 0.2
            });
            return [
                {
                    sec: el,
                    host: iE,
                    core: true
                },
                {
                    sec: pro,
                    host: iP
                },
                {
                    sec: lan,
                    host: iL
                }
            ];
        }
    }
];
const SPECIES_LIST = SPECIES;
const SPECIES_COUNT = SPECIES.length;
function buildEnemy(speciesIdx, tier, seed) {
    const sp = SPECIES[speciesIdx];
    const rng = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mulberry32"])(seed);
    const b = new Builder(tier, sp.hue, rng);
    const mounts = sp.build(b, tier);
    loadout(b, mounts, sp.armed);
    const order = b.parts.map((_, i)=>i).sort((a, c)=>b.parts[a].layer - b.parts[c].layer || a - c);
    let radius = 0;
    let legCount = 0, wingCount = 0;
    for (const p of b.parts){
        for(let i = 0; i < p.poly.length; i += 2)radius = Math.max(radius, Math.hypot(p.poly[i], p.poly[i + 1]));
        if (p.kind === "leg") legCount++;
        if (p.kind === "wing") wingCount++;
    }
    return {
        parts: b.parts,
        groups: b.groups,
        order,
        coreId: b.coreId,
        radius,
        size: b.S,
        legCount,
        wingCount
    };
}
}),
"[project]/src/game/engine.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CH",
    ()=>CH,
    "Game",
    ()=>Game,
    "N_ROPE",
    ()=>N_ROPE,
    "biomeWeights",
    ()=>biomeWeights
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/math.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/enemies.ts [app-ssr] (ecmascript)");
;
;
;
const CH = 1500;
const N_ROPE = 22;
const DENS = [
    1.8,
    1.5,
    1.2,
    0.9,
    0.7,
    0.5
];
const KIND_DROP = {
    core: 1,
    segment: 1,
    armor: 0.8,
    leg: 0.6,
    arm: 1,
    wing: 0.6,
    weapon: 1.4,
    shield: 1.4,
    spike: 0.35
};
function biomeWeights(x, y) {
    const d = Math.hypot(x, y);
    const th = Math.atan2(y, x);
    let u = th / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"] + 0.5 + 0.1 * Math.sin(d / 1700);
    u -= Math.floor(u);
    const n = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SPECIES_LIST"].length;
    const w = [];
    for(let i = 0; i < n; i++){
        const h = (i + 0.5) / n;
        const dd = Math.abs(u - h);
        const cd = Math.min(dd, 1 - dd);
        w.push(Math.pow(Math.max(0.03, 1 - cd * n * 0.85), 1.5));
    }
    return w;
}
function pickSpecies(x, y, rng) {
    const w = biomeWeights(x, y);
    let tot = 0;
    for (const v of w)tot += v;
    let r = rng() * tot;
    for(let i = 0; i < w.length; i++){
        r -= w[i];
        if (r <= 0) return i;
    }
    return w.length - 1;
}
const uid = ()=>Math.random().toString(36).slice(2, 10);
class Game {
    save;
    stats;
    pid;
    w = 800;
    h = 600;
    dpr = 1;
    cam = {
        x: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x,
        y: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y - 120,
        z: 1
    };
    zoom = 1;
    t = 0;
    rev = 0;
    fps = 60;
    input = {
        keys: new Set(),
        mx: 0,
        my: 0,
        lmb: false,
        rHold: 0
    };
    player;
    enemies = [];
    bullets = [];
    eprojs = [];
    particles = [];
    puddles = [];
    rings = [];
    debris = [];
    beams = [];
    comps = [];
    harpoons = [];
    others = [];
    toasts = [];
    chunks = new Set();
    shake = 0;
    tintHue = 190;
    tintTarget = 190;
    holdComp = null;
    online = 1;
    idc = 1;
    chunkT = 0;
    saveT = 0;
    serverT = 0;
    netT = 0;
    netBusy = false;
    expDepth = 0;
    dirty = false;
    toastId = 1;
    _w = [
        0,
        0
    ];
    fpsAcc = 0;
    fpsN = 0;
    lastServerSave = 0;
    constructor(save, pid){
        this.save = save;
        this.pid = pid;
        this.stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeStats"])(save);
        this.player = {
            x: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x,
            y: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y - 200,
            vx: 0,
            vy: 0,
            a: -Math.PI / 2,
            hp: this.stats.hull,
            shield: this.stats.shieldMax,
            boost: 100,
            boosting: false,
            slowF: 1,
            slowT: 0,
            poison: 0,
            poisonT: 0,
            pull: null,
            dead: false,
            respawn: 0,
            fireCd: 0,
            wCd: [
                0,
                0,
                0
            ],
            hitT: 99,
            shieldT: 0,
            flash: 0,
            thornCd: 0,
            tpT: 0,
            tpCd: 0,
            tow: 1,
            thrust: 0
        };
        this.syncHarpoons();
        this.cam.x = this.player.x;
        this.cam.y = this.player.y;
    }
    /* ---------------- misc helpers ---------------- */ resize(w, h, dpr) {
        this.w = w;
        this.h = h;
        this.dpr = dpr;
    }
    toast(msg, color = "#7df9ff") {
        this.toasts.push({
            id: this.toastId++,
            msg,
            color,
            t: 4
        });
        if (this.toasts.length > 5) this.toasts.shift();
    }
    mouseWorld() {
        return [
            this.cam.x + (this.input.mx - this.w / 2) / this.cam.z,
            this.cam.y + (this.input.my - this.h / 2) / this.cam.z
        ];
    }
    nearBase() {
        return Math.hypot(this.player.x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x, this.player.y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].r + 40;
    }
    inSafe() {
        return Math.hypot(this.player.x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x, this.player.y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].r + 90;
    }
    markDirty() {
        this.dirty = true;
        this.rev++;
        this.save.ts = Date.now();
    }
    recompute() {
        const old = this.stats;
        this.stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeStats"])(this.save);
        const p = this.player;
        if (this.stats.hull !== old.hull) p.hp = Math.min(this.stats.hull, p.hp + Math.max(0, this.stats.hull - old.hull));
        p.hp = Math.min(p.hp, this.stats.hull);
        p.shield = Math.min(this.stats.shieldMax, p.shield + Math.max(0, this.stats.shieldMax - old.shieldMax));
        this.zoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.zoom, this.stats.zoomMin, 1);
        this.syncHarpoons();
    }
    syncHarpoons() {
        const n = this.stats.hCount;
        while(this.harpoons.length < n){
            const nodes = [];
            for(let i = 0; i < N_ROPE; i++)nodes.push({
                x: 0,
                y: 0,
                px: 0,
                py: 0
            });
            this.harpoons.push({
                slot: this.harpoons.length,
                state: 0,
                hx: 0,
                hy: 0,
                hvx: 0,
                hvy: 0,
                nodes,
                len: 0,
                hp: 1,
                maxHp: 1,
                comp: null,
                travelled: 0,
                cool: 0,
                taut: 0,
                ang: 0
            });
        }
        while(this.harpoons.length > n){
            const h = this.harpoons.pop();
            if (h.comp) this.unhook(h);
        }
        for (const h of this.harpoons)h.maxHp = this.stats.hHp;
    }
    /* ---------------- UI facing actions ---------------- */ buy(id) {
        const u = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPGRADES"].find((x)=>x.id === id);
        if (!u) return false;
        const l = this.save.upgrades[id] ?? 0;
        if (l >= u.max) return false;
        const c = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upgradeCost"])(u, l);
        if (this.save.credits < c) return false;
        this.save.credits -= c;
        this.save.upgrades[id] = l + 1;
        this.recompute();
        this.markDirty();
        return true;
    }
    sellComp(id) {
        const i = this.save.inventory.findIndex((c)=>c.id === id);
        if (i < 0) return 0;
        const c = this.save.inventory[i];
        const v = Math.round(c.value * this.stats.sellMul);
        this.save.inventory.splice(i, 1);
        this.save.credits += v;
        this.save.earned += v;
        this.markDirty();
        return v;
    }
    sellBelow(maxTier) {
        let total = 0;
        for (const c of [
            ...this.save.inventory
        ])if (c.tier <= maxTier) total += this.sellComp(c.id);
        return total;
    }
    craft(rid, ids) {
        const r = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RECIPE_BY_ID"][rid];
        if (!r) return "Unknown recipe";
        const comps = ids.map((id)=>this.save.inventory.find((c)=>c.id === id)).filter((c)=>!!c);
        if (comps.length !== ids.length) return "Missing components";
        const prob = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["recipeProblem"])(r, comps);
        if (prob) return prob;
        const eff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["craftEfficiency"])(r, comps);
        this.save.inventory = this.save.inventory.filter((c)=>!ids.includes(c.id));
        const item = {
            id: uid(),
            rid,
            eff
        };
        this.save.crafted.push(item);
        const eq = this.save.equip;
        if (r.slot === "weapon") {
            const i = eq.weapon.indexOf(null);
            if (i >= 0) eq.weapon[i] = item.id;
        } else if (!eq[r.slot]) eq[r.slot] = item.id;
        this.recompute();
        this.markDirty();
        this.toast(`Crafted ${r.name} (${Math.round(eff * 100)}% efficiency)`, "#ffd24d");
        return null;
    }
    equip(slot, idx, id) {
        const eq = this.save.equip;
        if (slot === "weapon") {
            if (id) {
                for(let i = 0; i < 3; i++)if (eq.weapon[i] === id) eq.weapon[i] = null;
            }
            eq.weapon[idx] = id;
        } else eq[slot] = id;
        this.recompute();
        this.markDirty();
    }
    scrap(id) {
        const eq = this.save.equip;
        this.save.crafted = this.save.crafted.filter((c)=>c.id !== id);
        for(let i = 0; i < 3; i++)if (eq.weapon[i] === id) eq.weapon[i] = null;
        for (const s of [
            "shield",
            "armor",
            "optics",
            "utility"
        ])if (eq[s] === id) eq[s] = null;
        this.recompute();
        this.markDirty();
    }
    setName(n) {
        this.save.name = n.slice(0, 16) || "Pilot";
        this.markDirty();
    }
    setAutoSell(v) {
        this.save.autoSell = v;
        this.markDirty();
    }
    hardReset(save) {
        this.save = save;
        this.recompute();
        this.player.hp = this.stats.hull;
        this.player.shield = this.stats.shieldMax;
        for (const c of [
            ...this.comps
        ])c.hooks.length = 0;
        this.comps = [];
        for (const h of this.harpoons){
            h.state = 0;
            h.comp = null;
        }
        this.markDirty();
    }
    /* ---------------- saving / net ---------------- */ localSaveKey = "neon-hive-save-v1";
    persist(force = false) {
        if (!this.dirty && !force) return;
        this.dirty = false;
        try {
            localStorage.setItem(this.localSaveKey, JSON.stringify(this.save));
        } catch  {}
    }
    async pushServer() {
        this.lastServerSave = Date.now();
        try {
            await fetch("/api/save", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    id: this.pid,
                    name: this.save.name,
                    save: this.save
                }),
                keepalive: true
            });
        } catch  {}
    }
    beaconSave() {
        this.persist(true);
        try {
            const blob = new Blob([
                JSON.stringify({
                    id: this.pid,
                    name: this.save.name,
                    save: this.save
                })
            ], {
                type: "application/json"
            });
            navigator.sendBeacon("/api/save", blob);
        } catch  {}
    }
    async netTick() {
        if (this.netBusy) return;
        this.netBusy = true;
        try {
            const p = this.player;
            const res = await fetch("/api/presence", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    id: this.pid,
                    name: this.save.name,
                    x: Math.round(p.x),
                    y: Math.round(p.y),
                    a: +p.a.toFixed(2),
                    dead: p.dead
                })
            });
            if (res.ok) {
                const data = await res.json();
                this.online = data.online;
                const seen = new Set();
                for (const o of data.players){
                    seen.add(o.id);
                    const ex = this.others.find((q)=>q.id === o.id);
                    if (ex) {
                        ex.tx = o.x;
                        ex.ty = o.y;
                        ex.ta = o.a;
                        ex.name = o.name;
                        ex.seen = this.t;
                    } else this.others.push({
                        id: o.id,
                        name: o.name,
                        x: o.x,
                        y: o.y,
                        a: o.a,
                        tx: o.x,
                        ty: o.y,
                        ta: o.a,
                        seen: this.t
                    });
                }
                this.others = this.others.filter((o)=>seen.has(o.id));
            }
        } catch  {}
        this.netBusy = false;
    }
    /* ---------------- input ---------------- */ keyDown(code) {
        this.input.keys.add(code);
        if (code === "KeyT") this.toggleRecall();
    }
    keyUp(code) {
        this.input.keys.delete(code);
    }
    mouseDown(btn) {
        if (btn === 0) this.input.lmb = true;
        if (btn === 2) this.fireHarpoon();
    }
    mouseUp(btn) {
        if (btn === 0) this.input.lmb = false;
    }
    wheel(dy) {
        if (this.stats.zoomMin >= 1) return;
        this.zoom = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.zoom * (dy > 0 ? 0.9 : 1.1), this.stats.zoomMin, 1);
    }
    blur() {
        this.input.keys.clear();
        this.input.lmb = false;
    }
    toggleRecall() {
        const p = this.player, st = this.stats;
        if (st.tpTime <= 0) {
            this.toast("Craft a Recall Beacon to teleport home", "#ff8a8a");
            return;
        }
        if (p.tpT > 0) {
            p.tpT = 0;
            this.toast("Recall cancelled", "#ffb36b");
            return;
        }
        if (p.tpCd > 0) {
            this.toast(`Beacon recharging (${Math.ceil(p.tpCd)}s)`, "#ffb36b");
            return;
        }
        if (this.inSafe()) return;
        p.tpT = st.tpTime;
    }
    /* ---------------- harpoons ---------------- */ fireHarpoon() {
        const p = this.player;
        if (p.dead) return;
        const h = this.harpoons.find((q)=>q.state === 0 && q.cool <= 0);
        if (!h) {
            this.toast("No harpoon ready", "#ff8a8a");
            return;
        }
        const [mx, my] = this.mouseWorld();
        const ang = Math.atan2(my - p.y, mx - p.x);
        const sp = this.stats.hSpeed;
        h.state = 1;
        h.ang = ang;
        h.hx = p.x + Math.cos(ang) * 16;
        h.hy = p.y + Math.sin(ang) * 16;
        h.hvx = Math.cos(ang) * sp + p.vx * 0.4;
        h.hvy = Math.sin(ang) * sp + p.vy * 0.4;
        h.travelled = 0;
        h.comp = null;
        h.hp = this.stats.hHp;
        h.maxHp = this.stats.hHp;
        h.len = 30;
        h.taut = 0;
        const px = -Math.sin(ang), py = Math.cos(ang);
        for(let i = 0; i < N_ROPE; i++){
            const n = h.nodes[i];
            n.x = p.x;
            n.y = p.y;
            const amp = Math.sin(i * 0.85) * 9 * (i / N_ROPE + 0.2);
            n.px = n.x - px * amp - Math.cos(ang) * 4;
            n.py = n.y - py * amp - Math.sin(ang) * 4;
        }
        for(let i = 0; i < 6; i++)this.addParticle(p.x, p.y, Math.cos(ang) * 200 + (Math.random() - 0.5) * 120, Math.sin(ang) * 200 + (Math.random() - 0.5) * 120, "#7df9ff", 4, 0.3, 3);
    }
    unhook(h) {
        if (h.comp) {
            h.comp.hooks = h.comp.hooks.filter((s)=>s !== h.slot);
            h.comp = null;
        }
    }
    retract(h) {
        this.unhook(h);
        h.state = 3;
    }
    snapHarpoon(h, why) {
        for(let i = 0; i < N_ROPE; i += 2)this.addParticle(h.nodes[i].x, h.nodes[i].y, (Math.random() - 0.5) * 240, (Math.random() - 0.5) * 240, i % 4 === 0 ? "#ff5d73" : "#7df9ff", 5, 0.7, 4);
        this.unhook(h);
        h.state = 0;
        h.cool = 2;
        this.shake = Math.max(this.shake, 5);
        this.toast(why, "#ff8a8a");
    }
    stepRope(h, seg) {
        const n = h.nodes;
        const p = this.player;
        n[0].x = p.x;
        n[0].y = p.y;
        n[0].px = p.x;
        n[0].py = p.y;
        const last = n[N_ROPE - 1];
        last.x = h.hx;
        last.y = h.hy;
        last.px = h.hx;
        last.py = h.hy;
        for(let i = 1; i < N_ROPE - 1; i++){
            const nd = n[i];
            const vx = (nd.x - nd.px) * 0.982, vy = (nd.y - nd.py) * 0.982;
            nd.px = nd.x;
            nd.py = nd.y;
            nd.x += vx;
            nd.y += vy;
        }
        for(let it = 0; it < 10; it++){
            for(let i = 0; i < N_ROPE - 1; i++){
                const a = n[i], b = n[i + 1];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 1e-6;
                if (d > seg) {
                    const diff = (d - seg) / d;
                    const wa = i === 0 ? 0 : 1, wb = i + 1 === N_ROPE - 1 ? 0 : 1;
                    const ws = wa + wb;
                    if (ws === 0) continue;
                    a.x += dx * diff * wa / ws;
                    a.y += dy * diff * wa / ws;
                    b.x -= dx * diff * wb / ws;
                    b.y -= dy * diff * wb / ws;
                }
            }
        }
        for(let i = 1; i < N_ROPE - 1; i++){
            const mx = (n[i - 1].x + n[i + 1].x) / 2, my = (n[i - 1].y + n[i + 1].y) / 2;
            n[i].x += (mx - n[i].x) * 0.07;
            n[i].y += (my - n[i].y) * 0.07;
        }
    }
    updateHarpoons(dt) {
        const p = this.player, st = this.stats;
        for (const h of this.harpoons){
            if (h.cool > 0) h.cool -= dt;
            if (h.state === 0) continue;
            if (p.dead) {
                this.retract(h);
            }
            if (h.state === 1) {
                h.hx += h.hvx * dt;
                h.hy += h.hvy * dt;
                h.travelled += Math.hypot(h.hvx, h.hvy) * dt;
                let hit = null;
                for (const c of this.comps){
                    const dx = h.hx - c.x, dy = h.hy - c.y;
                    if (dx * dx + dy * dy > (c.r + 14) * (c.r + 14)) continue;
                    const ca = Math.cos(-c.a), sa = Math.sin(-c.a);
                    const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["distToPoly"])(lx, ly, c.c.poly) < 12) {
                        hit = c;
                        break;
                    }
                }
                const d = Math.hypot(h.hx - p.x, h.hy - p.y);
                if (hit) {
                    h.state = 2;
                    h.comp = hit;
                    hit.hooks.push(h.slot);
                    h.len = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d, 60, st.hRange);
                    this.shake = Math.max(this.shake, 3);
                    for(let i = 0; i < 8; i++)this.addParticle(hit.x, hit.y, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, "#7df9ff", 5, 0.5, 4);
                } else if (h.travelled > st.hRange) h.state = 3;
                this.stepRope(h, Math.max(3, (d * 1.12 + 20) / (N_ROPE - 1)));
            } else if (h.state === 2) {
                const c = h.comp;
                if (!c || !this.comps.includes(c)) {
                    h.state = 3;
                    h.comp = null;
                    continue;
                }
                h.hx = c.x;
                h.hy = c.y;
                const minLen = Math.max(70, c.r * 0.9 + 70);
                h.len = Math.max(minLen, h.len - st.hSpeed * 0.35 * dt);
                const d = Math.hypot(h.hx - p.x, h.hy - p.y);
                if (d > st.hRange * 1.7) {
                    this.snapHarpoon(h, "Cable overstretched!");
                    continue;
                }
                if (h.hp <= 0) {
                    this.snapHarpoon(h, "Cable severed!");
                    continue;
                }
                this.stepRope(h, Math.max(2, h.len / (N_ROPE - 1)));
            } else {
                const dx = p.x - h.hx, dy = p.y - h.hy;
                const d = Math.hypot(dx, dy);
                const sp = 1700 * dt;
                if (d < sp + 28) {
                    h.state = 0;
                    h.cool = 0.25;
                    continue;
                }
                h.hx += dx / d * sp;
                h.hy += dy / d * sp;
                this.stepRope(h, Math.max(2, (d * 1.04 + 10) / (N_ROPE - 1)));
            }
        }
    }
    updateComps(dt) {
        const p = this.player, st = this.stats;
        p.tow = 1;
        for(let i = this.comps.length - 1; i >= 0; i--){
            const c = this.comps[i];
            c.ttl -= dt;
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.a += c.va * dt;
            c.va *= Math.exp(-1.5 * dt);
            if (c.hooks.length) {
                const cap = c.hooks.length * st.hStr;
                const ratio = c.c.mass / cap;
                let taut = false;
                for (const slot of c.hooks){
                    const h = this.harpoons[slot];
                    if (!h || h.state !== 2) continue;
                    const dx = p.x - c.x, dy = p.y - c.y;
                    const d = Math.hypot(dx, dy) || 1;
                    const stretch = d - h.len;
                    h.taut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(stretch / 40, 0, 1);
                    if (stretch > 0) {
                        const f = stretch * 38 / (1 + ratio * 2.5);
                        c.vx += dx / d * f * dt;
                        c.vy += dy / d * f * dt;
                        if (stretch > 3) taut = true;
                    }
                }
                const damp = Math.exp(-(1.4 + ratio * 2.2) * dt);
                c.vx *= damp;
                c.vy *= damp;
                if (taut) {
                    p.tow = Math.min(p.tow, 1 / (1 + Math.min(2, ratio) * 0.75 * (1 - Math.min(0.5, st.towRelief))));
                    if (ratio > 1) c.stress += dt * (0.8 + (ratio - 1) * 1.5);
                    else c.stress = Math.max(0, c.stress - dt * 2);
                } else c.stress = Math.max(0, c.stress - dt * 1.5);
                if (c.stress >= 1) {
                    const slot = c.hooks[c.hooks.length - 1];
                    const h = this.harpoons[slot];
                    c.stress = 0.35;
                    if (h) this.snapHarpoon(h, c.hooks.length > 1 ? "A cable snapped under the load!" : "Too heavy! Cable snapped.");
                    else c.hooks.pop();
                }
            } else {
                const damp = Math.exp(-1.3 * dt);
                c.vx *= damp;
                c.vy *= damp;
                c.stress = 0;
            }
            // docking
            if (Math.hypot(c.x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x, c.y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].dock) {
                for (const slot of [
                    ...c.hooks
                ]){
                    const h = this.harpoons[slot];
                    if (h) this.retract(h);
                }
                this.comps.splice(i, 1);
                this.dockComp(c);
                continue;
            }
            if (c.ttl <= 0 && c.hooks.length === 0) {
                this.comps.splice(i, 1);
            }
        }
        // release with R
        const mw = this.mouseWorld();
        let target = null;
        if (this.input.keys.has("KeyR")) {
            for (const c of this.comps){
                if (!c.hooks.length) continue;
                if (Math.hypot(mw[0] - c.x, mw[1] - c.y) < c.r + 30) {
                    target = c;
                    break;
                }
            }
        }
        if (target) {
            if (this.holdComp !== target) {
                this.holdComp = target;
                this.input.rHold = 0;
            }
            this.input.rHold += dt;
            if (this.input.rHold >= 0.6) {
                for (const slot of [
                    ...target.hooks
                ]){
                    const h = this.harpoons[slot];
                    if (h) this.retract(h);
                }
                target.hooks.length = 0;
                this.holdComp = null;
                this.input.rHold = 0;
                this.toast("Harpoon released", "#9db4c9");
            }
        } else {
            this.holdComp = null;
            this.input.rHold = 0;
        }
    }
    dockComp(c) {
        const comp = c.c;
        for(let i = 0; i < 14; i++)this.addParticle(c.x, c.y, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, "#7dffb4", 6, 0.8, Math.floor(Math.random() * 4));
        if (this.save.autoSell || this.save.inventory.length >= this.stats.cargo) {
            const v = Math.round(comp.value * this.stats.sellMul);
            this.save.credits += v;
            this.save.earned += v;
            this.toast(`${this.save.autoSell ? "Sold" : "Cargo full - sold"} ${comp.name} +${v}`, "#ffd24d");
        } else {
            this.save.inventory.push(comp);
            this.toast(`Stored ${comp.name}`, "#7dffb4");
        }
        this.markDirty();
    }
    /* ---------------- particles & fx ---------------- */ addParticle(x, y, vx, vy, color, size, life, shape, fill = true) {
        if (this.particles.length > 1500) return;
        this.particles.push({
            x,
            y,
            vx,
            vy,
            rot: Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"],
            vr: (Math.random() - 0.5) * 10,
            life,
            max: life,
            size,
            shape,
            color,
            fill
        });
    }
    burst(x, y, color, count, size, speed) {
        for(let i = 0; i < count; i++){
            const a = Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], s = speed * (0.3 + Math.random() * 0.9);
            this.addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, size * (0.5 + Math.random()), 0.5 + Math.random() * 0.7, Math.floor(Math.random() * 5), Math.random() < 0.5);
        }
    }
    partWorld(e, p) {
        let x = p.cx, y = p.cy;
        if (p.g >= 0) {
            const g = e.groups[p.g];
            const c = Math.cos(g.ang), s = Math.sin(g.ang);
            const dx = x - g.px, dy = y - g.py;
            x = g.px + dx * c - dy * s;
            y = g.py + dx * s + dy * c;
        }
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        this._w[0] = e.x + x * ca - y * sa;
        this._w[1] = e.y + x * sa + y * ca;
        return this._w;
    }
    ringFx(x, y, max, color, speed = 600) {
        this.rings.push({
            x,
            y,
            r: 4,
            max,
            speed,
            dmg: 0,
            hit: true,
            color,
            hurts: false
        });
    }
    /* ---------------- enemies: creation ---------------- */ makeEnemy(spi, tier, x, y, key, seed) {
        const spd = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SPECIES_LIST"][spi];
        const b = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildEnemy"])(spi, tier, seed);
        const roleGroups = {
            arm: [],
            mandible: [],
            tail: []
        };
        b.groups.forEach((g, i)=>{
            if (roleGroups[g.role]) roleGroups[g.role].push(i);
        });
        const abil = spd.abilities.filter((a)=>a.minTier <= tier);
        const tags = {};
        const weaponParts = [], shieldParts = [];
        for (const p of b.parts){
            tags[p.name] = (tags[p.name] ?? 0) + 1;
            if (p.wpn) weaponParts.push(p.id);
            if (p.shieldR > 0) shieldParts.push(p.id);
        }
        return {
            id: this.idc++,
            sp: spi,
            spd,
            tier,
            x,
            y,
            a: Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"],
            vx: 0,
            vy: 0,
            S: b.size,
            radius: b.radius,
            parts: b.parts,
            groups: b.groups,
            order: b.order,
            coreId: b.coreId,
            chunk: key,
            home: {
                x,
                y
            },
            aggro: false,
            barT: 0,
            speed: spd.speed * (1 + 0.04 * tier),
            turn: spd.turn / (1 + tier * 1.05),
            mobility: 1,
            legCount: b.legCount,
            wingCount: b.wingCount,
            abil,
            abilCd: abil.map(()=>1 + Math.random() * 3),
            gap: 1,
            act: null,
            stun: 0,
            wander: {
                x,
                y,
                t: 0
            },
            roleGroups,
            walk: Math.random() * 6,
            dead: false,
            eDmg: 8 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DMG_MUL"][tier],
            keep: spd.keep + b.radius * 0.9,
            strafe: Math.random() < 0.5 ? 1 : -1,
            strafeT: 2,
            tags,
            shields: [],
            weaponParts,
            shieldParts,
            dist: 9999,
            contactCd: 0,
            hasChange: false
        };
    }
    spawnChunk(cx, cy, key) {
        const rng = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mulberry32"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hash2"])(cx, cy, 77));
        const ccx = (cx + 0.5) * CH, ccy = (cy + 0.5) * CH;
        if (Math.hypot(ccx, ccy) > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"] + 300) return;
        const zt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zoneTier"])(Math.hypot(ccx, ccy));
        let n = Math.floor(DENS[zt]);
        if (rng() < DENS[zt] - n) n++;
        for(let i = 0; i < n; i++){
            const x = cx * CH + rng() * CH, y = cy * CH + rng() * CH;
            const d = Math.hypot(x, y);
            const rolls = [
                rng(),
                rng(),
                rng(),
                rng()
            ];
            if (d > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"] - 250) continue;
            if (Math.hypot(x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x, y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].safe + 350) continue;
            if (Math.hypot(x - this.player.x, y - this.player.y) < 1200) continue;
            const z2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zoneTier"])(d);
            const r = rolls[0];
            const tier = Math.max(0, r < 0.55 ? z2 : r < 0.83 ? z2 - 1 : r < 0.95 ? z2 - 2 : z2 - 3);
            const spi = pickSpecies(x, y, ()=>rolls[1]);
            const pack = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SPECIES_LIST"][spi].pack[tier];
            for(let k = 0; k < pack; k++){
                const ox = k === 0 ? 0 : Math.cos(k * 2.4) * (80 + k * 40), oy = k === 0 ? 0 : Math.sin(k * 2.4) * (80 + k * 40);
                this.enemies.push(this.makeEnemy(spi, tier, x + ox, y + oy, key, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hash2"])(cx + k, cy + i, 5)));
            }
        }
    }
    manageChunks() {
        const p = this.player;
        const pcx = Math.floor(p.x / CH), pcy = Math.floor(p.y / CH);
        for(let dx = -2; dx <= 2; dx++)for(let dy = -2; dy <= 2; dy++){
            const key = `${pcx + dx},${pcy + dy}`;
            if (!this.chunks.has(key)) {
                this.chunks.add(key);
                this.spawnChunk(pcx + dx, pcy + dy, key);
            }
        }
        for (const key of [
            ...this.chunks
        ]){
            const [a, b] = key.split(",").map(Number);
            if (Math.max(Math.abs(a - pcx), Math.abs(b - pcy)) > 3) this.chunks.delete(key);
        }
        this.enemies = this.enemies.filter((e)=>this.chunks.has(e.chunk) || e.aggro && e.dist < 4000);
    }
    /* ---------------- enemies: part damage ---------------- */ partAt(e, lx, ly) {
        for(let k = e.order.length - 1; k >= 0; k--){
            const p = e.parts[e.order[k]];
            if (!p.alive) continue;
            let x = lx, y = ly;
            if (p.g >= 0) {
                const g = e.groups[p.g];
                if (g.ang !== 0) {
                    const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
                    const dx = lx - g.px, dy = ly - g.py;
                    x = g.px + dx * c - dy * s;
                    y = g.py + dx * s + dy * c;
                }
            }
            const ddx = x - p.cx, ddy = y - p.cy;
            if (ddx * ddx + ddy * ddy > p.r * p.r) continue;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pointInPoly"])(x, y, p.poly)) return p;
        }
        return null;
    }
    integrity(e) {
        let cur = 0, max = 0;
        for (const p of e.parts){
            max += p.maxHp;
            if (p.alive) cur += p.hp;
        }
        return max > 0 ? cur / max : 0;
    }
    damagePart(e, p, dmg, wx, wy) {
        p.hp -= dmg;
        p.hurt = 0.1;
        p.barT = 3.5;
        e.barT = 4;
        e.aggro = true;
        if (wx !== 0 || wy !== 0) for(let i = 0; i < 2; i++)this.addParticle(wx, wy, (Math.random() - 0.5) * 220, (Math.random() - 0.5) * 220, p.stroke, 2.5, 0.25, Math.floor(Math.random() * 3));
        if (p.hp <= 0 && p.alive) this.breakPart(e, p, true);
    }
    refreshMobility(e) {
        let legs = 0, wings = 0;
        for (const p of e.parts){
            if (!p.alive) continue;
            if (p.kind === "leg") legs++;
            else if (p.kind === "wing") wings++;
        }
        if (e.spd.flying) {
            const wf = e.wingCount ? wings / e.wingCount : 0;
            const lf = e.legCount ? legs / e.legCount : 0;
            e.mobility = wf > 0 ? Math.max(0.3, wf) : lf > 0 ? 0.18 : 0;
        } else {
            const lf = e.legCount ? legs / e.legCount : 0;
            e.mobility = lf > 0 ? Math.max(0.2, lf) : 0;
        }
    }
    breakPart(e, p, byPlayer) {
        if (!p.alive) return;
        p.alive = false;
        p.hp = 0;
        e.tags[p.name] = (e.tags[p.name] ?? 1) - 1;
        const [wx, wy] = this.partWorld(e, p);
        const px = wx, py = wy;
        const count = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(Math.round(5 + p.r / 5), 6, 34);
        this.burst(px, py, p.stroke, count, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(p.r * 0.2, 3, 26), 120 + p.r * 2.2);
        if (p.r > 30) this.ringFx(px, py, p.r * 1.8, p.stroke, 500);
        this.shake = Math.max(this.shake, Math.min(14, 2 + p.r / 18));
        if (p.kind === "core") {
            this.killEnemy(e, px, py);
            return;
        }
        if (p.kind === "weapon" || p.kind === "shield") this.explode(e, p, px, py, false);
        if (byPlayer) this.maybeDrop(e, p, px, py);
        this.refreshMobility(e);
        this.checkSever(e);
    }
    checkSever(e) {
        const seen = new Uint8Array(e.parts.length);
        const stack = [
            e.coreId
        ];
        seen[e.coreId] = 1;
        while(stack.length){
            const i = stack.pop();
            for (const l of e.parts[i].links)if (!seen[l] && e.parts[l].alive) {
                seen[l] = 1;
                stack.push(l);
            }
        }
        const sev = [];
        for (const p of e.parts)if (p.alive && !seen[p.id]) sev.push(p);
        if (!sev.length) return;
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        const pieces = [];
        let sx = 0, sy = 0;
        const worldPolys = [];
        for (const p of sev){
            const poly = [];
            const g = p.g >= 0 ? e.groups[p.g] : null;
            for(let i = 0; i < p.poly.length; i += 2){
                let x = p.poly[i], y = p.poly[i + 1];
                if (g) {
                    const c = Math.cos(g.ang), s = Math.sin(g.ang);
                    const dx = x - g.px, dy = y - g.py;
                    x = g.px + dx * c - dy * s;
                    y = g.py + dx * s + dy * c;
                }
                poly.push(e.x + x * ca - y * sa, e.y + x * sa + y * ca);
            }
            worldPolys.push(poly);
            for(let i = 0; i < poly.length; i += 2){
                sx += poly[i];
                sy += poly[i + 1];
            }
        }
        let nPts = 0;
        for (const w of worldPolys)nPts += w.length / 2;
        const cx = sx / nPts, cy = sy / nPts;
        sev.forEach((p, i)=>pieces.push({
                poly: worldPolys[i].map((v, k)=>k % 2 === 0 ? v - cx : v - cy),
                stroke: p.stroke,
                fill: p.fill
            }));
        const away = Math.atan2(cy - e.y, cx - e.x);
        this.debris.push({
            x: cx,
            y: cy,
            vx: Math.cos(away) * 90 + e.vx,
            vy: Math.sin(away) * 90 + e.vy,
            rot: 0,
            vr: (Math.random() - 0.5) * 2.2,
            life: 1.3,
            max: 1.3,
            pieces
        });
        // largest severed part may drop
        let big = sev[0];
        for (const p of sev){
            e.tags[p.name] = (e.tags[p.name] ?? 1) - 1;
            if (p.area > big.area) big = p;
        }
        for (const p of sev)p.alive = false;
        this.shake = Math.max(this.shake, 6);
        if (Math.random() < 0.65) {
            const w = this.partWorld(e, big);
            this.maybeDrop(e, big, w[0], w[1], 1.0);
        }
        this.refreshMobility(e);
    }
    killEnemy(e, x, y) {
        if (e.dead) return;
        e.dead = true;
        this.save.kills++;
        this.dirty = true;
        let i = 0;
        for (const q of e.parts){
            if (!q.alive) continue;
            q.alive = false;
            i++;
            const [wx, wy] = this.partWorld(e, q);
            if (e.parts.length < 70 || i % 2 === 0) this.burst(wx, wy, q.stroke, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(Math.round(q.r / 9), 3, 14), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(q.r * 0.16, 3, 22), 160 + q.r * 2);
            if (q.wpn || q.kind === "shield") this.explode(e, q, wx, wy, true);
        }
        this.ringFx(x, y, e.radius * 1.4, "#ffffff", 900);
        this.shake = Math.max(this.shake, 16);
        this.maybeDrop(e, e.parts[e.coreId], x, y);
    }
    rollTier(etier, isCore) {
        const luck = this.stats.luck;
        if (isCore && Math.random() < 0.1 + luck * 0.2) return etier;
        const top = etier - 1;
        if (top < 0) return 0;
        let r = top;
        const q = 0.5 * (1 - luck);
        while(r > 0 && Math.random() < q)r--;
        return r;
    }
    maybeDrop(e, p, x, y, mul = 1) {
        const isCore = p.kind === "core";
        const chance = isCore ? 0.92 : this.stats.dropChance * KIND_DROP[p.kind] * Math.min(1, 40 / e.parts.length) * mul;
        if (Math.random() > chance) return;
        const tier = this.rollTier(e.tier, isCore);
        const poly = p.poly.map((v, i)=>+(v - (i % 2 === 0 ? p.cx : p.cy)).toFixed(1));
        const comp = {
            id: uid(),
            species: e.spd.name,
            name: `${e.spd.name} ${p.name}`,
            kind: p.kind,
            tier,
            poly,
            area: p.area,
            mass: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compMass"])(p.area),
            hue: e.spd.hue,
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compValue"])(p.area, tier, p.kind)
        };
        const a = Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], s = 60 + Math.random() * 120;
        this.comps.push({
            id: this.idc++,
            c: comp,
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            a: e.a,
            va: (Math.random() - 0.5) * 3,
            r: p.r,
            hooks: [],
            stress: 0,
            ttl: 160,
            born: this.t
        });
        if (this.comps.length > 90) {
            const i = this.comps.findIndex((c)=>!c.hooks.length);
            if (i >= 0) this.comps.splice(i, 1);
        }
    }
    explode(e, p, x, y, cascade) {
        const R = p.r * 3 + 40;
        const dmg = e.eDmg * (p.kind === "weapon" ? 1.8 : 1.3) * (cascade ? 0.5 : 1);
        const pl = this.player;
        const d = Math.hypot(pl.x - x, pl.y - y);
        if (d < R + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"]) this.hurtPlayer(dmg * (1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d / (R + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"]), 0, 1) * 0.6), {
            kb: 500,
            kbx: (pl.x - x) / (d || 1),
            kby: (pl.y - y) / (d || 1)
        });
        this.ringFx(x, y, R, "#ff9d4d", 700);
        this.burst(x, y, "#ffb04d", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(Math.round(R / 14), 8, 30), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(R * 0.08, 4, 22), 260 + R);
        this.shake = Math.max(this.shake, Math.min(18, 6 + R / 40));
        if (cascade || this.expDepth > 3) return;
        this.expDepth++;
        this.areaDamage(x, y, R, p.maxHp * 0.5, p);
        this.expDepth--;
    }
    areaDamage(x, y, R, dmg, skip) {
        for (const e of this.enemies){
            if (e.dead) continue;
            const dx = e.x - x, dy = e.y - y;
            if (dx * dx + dy * dy > (R + e.radius) * (R + e.radius)) continue;
            for (const q of e.parts){
                if (!q.alive || q === skip) continue;
                const w = this.partWorld(e, q);
                const d = Math.hypot(w[0] - x, w[1] - y);
                if (d < R + q.r * 0.5) this.damagePart(e, q, dmg * (1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d / (R + 1), 0, 1) * 0.5), 0, 0);
            }
        }
    }
    /* ---------------- player damage ---------------- */ hurtPlayer(dmg, o = {}) {
        const p = this.player, st = this.stats;
        if (p.dead || this.inSafe()) return;
        let d = dmg * (1 - st.armor) * (1 - st.reactive);
        p.hitT = 0;
        p.shieldT = st.shieldDelay;
        if (p.shield > 0) {
            const a = Math.min(p.shield, d);
            p.shield -= a;
            d -= a;
        }
        p.hp -= d;
        if (o.poison) {
            p.poison = Math.max(p.poison, o.poison);
            p.poisonT = 4;
        }
        if (o.kb) {
            const k = o.kb * (1 - st.dampers);
            p.vx += (o.kbx ?? 0) * k;
            p.vy += (o.kby ?? 0) * k;
        }
        if (!o.dot) {
            p.flash = 0.18;
            this.shake = Math.max(this.shake, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d / (st.hull * 0.1) * 4, 2, 14));
            if (p.tpT > 0) {
                p.tpT = 0;
                this.toast("Recall interrupted!", "#ff8a8a");
            }
            if (st.thorn > 0 && p.thornCd <= 0) {
                p.thornCd = 1.5;
                this.ringFx(p.x, p.y, 260, "#ff8a4d", 700);
                this.areaDamage(p.x, p.y, 260, st.dmg * 3 * st.thorn, null);
            }
        }
        if (p.hp <= 0) this.killPlayer();
    }
    killPlayer() {
        const p = this.player;
        p.dead = true;
        p.hp = 0;
        p.respawn = 3;
        p.tpT = 0;
        p.pull = null;
        this.burst(p.x, p.y, "#7df9ff", 40, 10, 500);
        this.ringFx(p.x, p.y, 380, "#7df9ff", 800);
        this.shake = 20;
        for (const h of this.harpoons)if (h.state !== 0) {
            this.retract(h);
        }
        this.toast("Ship destroyed - rebuilding at base...", "#ff6b81");
    }
    respawnPlayer() {
        const p = this.player;
        p.dead = false;
        p.x = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x;
        p.y = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y - 180;
        p.vx = p.vy = 0;
        p.hp = this.stats.hull;
        p.shield = this.stats.shieldMax;
        p.poison = 0;
        p.slowT = 0;
        p.pull = null;
        this.cam.x = p.x;
        this.cam.y = p.y;
    }
    applySlow(f, t) {
        const r = this.stats.dampers;
        const ff = 1 - (1 - f) * (1 - r);
        this.player.slowF = Math.min(this.player.slowF, ff);
        this.player.slowT = Math.max(this.player.slowT, t * (1 - r * 0.5));
    }
    /* ---------------- projectiles ---------------- */ spawnProj(src, x, y, ang, d, o = {}) {
        const speed = o.speed ?? d.speed ?? 500;
        const type = o.type ?? d.kind ?? "bolt";
        const size = (d.size ?? 6) * (1 + 0.14 * src.tier);
        this.eprojs.push({
            x,
            y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: o.life ?? d.life ?? 2,
            dmg: src.eDmg * d.dmg * (o.dmgMul ?? 1),
            r: size,
            hue: src.spd.hue,
            type,
            homing: d.homing ?? 0,
            slow: d.slow ?? 0,
            slowT: d.slowT ?? 1.5,
            poison: d.poison ? src.eDmg * d.poison : 0,
            pierce: !!d.pierce,
            hp: 1,
            speed,
            src,
            puddle: null
        });
    }
    updateEProjs(dt) {
        const p = this.player, st = this.stats;
        for(let i = this.eprojs.length - 1; i >= 0; i--){
            const pr = this.eprojs[i];
            pr.life -= dt;
            if (pr.type === "missile") {
                const want = Math.atan2(p.y - pr.y, p.x - pr.x), cur = Math.atan2(pr.vy, pr.vx);
                const na = cur + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(cur, want), -pr.homing * dt, pr.homing * dt);
                const sp = Math.min(pr.speed, Math.hypot(pr.vx, pr.vy) + 260 * dt);
                pr.vx = Math.cos(na) * sp;
                pr.vy = Math.sin(na) * sp;
                if (Math.random() < 0.6) this.addParticle(pr.x, pr.y, 0, 0, "#ffb04d", 3, 0.3, 3, false);
            } else if (pr.homing > 0) {
                const want = Math.atan2(p.y - pr.y, p.x - pr.x), cur = Math.atan2(pr.vy, pr.vx);
                const na = cur + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(cur, want), -pr.homing * dt, pr.homing * dt);
                const sp = Math.hypot(pr.vx, pr.vy);
                pr.vx = Math.cos(na) * sp;
                pr.vy = Math.sin(na) * sp;
            }
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            let dead = pr.life <= 0;
            if (!dead && pr.type !== "glob" && !p.dead) {
                const dd = Math.hypot(pr.x - p.x, pr.y - p.y);
                if (dd < pr.r + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"]) {
                    if (st.reflect && p.shield > 0 && (pr.type === "bolt" || pr.type === "orb" || pr.type === "wave")) {
                        p.shield = Math.max(0, p.shield - pr.dmg * 0.5);
                        p.shieldT = st.shieldDelay;
                        this.bullets.push({
                            x: pr.x,
                            y: pr.y,
                            vx: -pr.vx * 1.2,
                            vy: -pr.vy * 1.2,
                            life: 1.2,
                            dmg: Math.max(st.dmg * 0.5, pr.dmg * 0.8),
                            pierce: 0,
                            hit: [],
                            kind: 0,
                            target: null,
                            crit: false
                        });
                        this.ringFx(pr.x, pr.y, 40, "#7df9ff", 300);
                        dead = true;
                    } else if (pr.type === "hook") {
                        if (!this.inSafe()) {
                            p.pull = {
                                e: pr.src,
                                t: 1.8
                            };
                            this.toast("Grabbed! Break free or fight!", "#ff8a8a");
                        }
                        this.hurtPlayer(pr.dmg);
                        dead = true;
                    } else {
                        this.hurtPlayer(pr.dmg, {
                            poison: pr.poison,
                            kb: pr.type === "missile" ? 250 : 0,
                            kbx: pr.vx / (pr.speed || 1),
                            kby: pr.vy / (pr.speed || 1)
                        });
                        if (pr.slow > 0) this.applySlow(pr.slow, pr.slowT);
                        if (pr.type === "missile") {
                            this.ringFx(pr.x, pr.y, 90, "#ffb04d", 500);
                            this.burst(pr.x, pr.y, "#ffb04d", 10, 5, 260);
                        } else this.burst(pr.x, pr.y, `hsl(${pr.hue},100%,65%)`, 4, 3, 160);
                        if (!pr.pierce || pr.type === "missile") dead = true;
                    }
                }
            }
            if (!dead) {
                for (const h of this.harpoons){
                    if (h.state === 0) continue;
                    for(let k = 2; k < N_ROPE - 1; k += 2){
                        const nd = h.nodes[k];
                        if (Math.abs(nd.x - pr.x) < pr.r + 6 && Math.abs(nd.y - pr.y) < pr.r + 6) {
                            h.hp -= pr.dmg * 0.45;
                            this.burst(nd.x, nd.y, "#ff5d73", 3, 3, 120);
                            if (!pr.pierce) dead = true;
                            break;
                        }
                    }
                    if (dead) break;
                }
            }
            if (dead) {
                if (pr.type === "glob" && pr.puddle) this.puddles.push({
                    x: pr.x,
                    y: pr.y,
                    r: pr.puddle.r,
                    life: 6,
                    max: 6,
                    arm: 0,
                    dps: pr.puddle.dps,
                    slow: pr.puddle.slow,
                    hue: pr.hue
                });
                if (pr.type === "missile" && pr.life <= 0) this.burst(pr.x, pr.y, "#ffb04d", 6, 4, 180);
                this.eprojs.splice(i, 1);
            }
        }
    }
    /* ---------------- enemy AI ---------------- */ startAct(e, i) {
        const def = e.abil[i];
        e.act = {
            i,
            def,
            t: 0,
            ph: 0,
            hit: false,
            dir: e.a,
            fired: false
        };
        e.abilCd[i] = def.cd * (0.85 + Math.random() * 0.3);
    }
    alive(e, name) {
        return !name || (e.tags[name] ?? 0) > 0;
    }
    chooseAct(e, dist, toP) {
        const n = e.abil.length;
        if (!n) return;
        const start = Math.floor(Math.random() * n);
        const face = Math.abs((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, toP));
        const d = dist - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"];
        for(let k = 0; k < n; k++){
            const i = (start + k) % n;
            const a = e.abil[i];
            if (e.abilCd[i] > 0) continue;
            if (!this.alive(e, a.needs)) continue;
            if (a.type === "swing" && !(e.roleGroups[a.role] ?? []).length) continue;
            const minD = (a.minS ?? 0) * e.S + (a.minP ?? 0);
            let maxD = (a.maxS ?? 0) * e.S + (a.maxP ?? 0);
            if (!a.maxS && !a.maxP) maxD = Infinity;
            if (d < minD || d > maxD) continue;
            if (a.type === "charge" && (e.mobility < 0.3 || face > 0.7)) continue;
            if (a.type === "swing" && face > 0.9) continue;
            if ((a.type === "shoot" || a.type === "pull" || a.type === "spit") && face > 1.1) continue;
            if (a.type === "pull" && this.player.pull) continue;
            this.startAct(e, i);
            return;
        }
    }
    ease(t) {
        return t * t * (3 - 2 * t);
    }
    runAct(e, dt, toP, dist) {
        const a = e.act, d = a.def, p = this.player;
        a.t += dt;
        const S = e.S;
        const turnTo = (rate)=>{
            e.a += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, toP), -e.turn * rate * dt, e.turn * rate * dt);
        };
        const damp = (k)=>{
            const f = Math.exp(-k * dt);
            e.vx *= f;
            e.vy *= f;
        };
        const done = ()=>{
            e.act = null;
            e.gap = 0.4 + Math.random() * 0.6;
        };
        const mx = e.x + Math.cos(e.a) * e.spd.muzzle * S, my = e.y + Math.sin(e.a) * e.spd.muzzle * S;
        const aim = (speed)=>{
            const lt = Math.hypot(p.x - mx, p.y - my) / speed * 0.7;
            return Math.atan2(p.y + p.vy * lt - my, p.x + p.vx * lt - mx);
        };
        const count = ()=>Math.min(24, (d.n ?? 1) + Math.floor((d.ns ?? 0) * e.tier));
        switch(d.type){
            case "swing":
                {
                    const groups = e.roleGroups[d.role] ?? [];
                    const W = d.wind, ST = 0.2, R = 0.5;
                    const sc = d.role === "mandible" ? 0.55 : 1;
                    let ang = 0;
                    if (a.t < W) {
                        ang = 0.9 * this.ease(a.t / W);
                        turnTo(0.7);
                    } else if (a.t < W + ST) {
                        const f = (a.t - W) / ST;
                        ang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(0.9, -1.0, f);
                        if (!a.hit && this.swingHit(e, d)) {
                            a.hit = true;
                            const k = Math.hypot(p.x - e.x, p.y - e.y) || 1;
                            this.hurtPlayer(e.eDmg * d.dmg, {
                                poison: d.poison ? e.eDmg * d.poison : 0,
                                kb: 420,
                                kbx: (p.x - e.x) / k,
                                kby: (p.y - e.y) / k
                            });
                            this.shake = Math.max(this.shake, 8);
                        }
                        this.swingRope(e, d);
                    } else if (a.t < W + ST + R) {
                        ang = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(-1.0, 0, this.ease((a.t - W - ST) / R));
                    } else {
                        for (const gi of groups)e.groups[gi].ang = 0;
                        done();
                        return;
                    }
                    for (const gi of groups){
                        const g = e.groups[gi];
                        g.ang = g.sign * ang * sc * (d.role === "tail" ? 1 : 1);
                    }
                    damp(2);
                    break;
                }
            case "charge":
                {
                    if (a.ph === 0) {
                        turnTo(1.6);
                        damp(5);
                        if (a.t >= d.wind) {
                            a.ph = 1;
                            a.t = 0;
                            a.dir = e.a;
                        }
                    } else if (a.ph === 1) {
                        const sp = (d.speed ?? 600) * (0.5 + 0.5 * e.mobility);
                        e.vx = Math.cos(a.dir) * sp;
                        e.vy = Math.sin(a.dir) * sp;
                        if (!a.hit && this.touching(e, 6)) {
                            a.hit = true;
                            this.hurtPlayer(e.eDmg * d.dmg, {
                                poison: d.poison ? e.eDmg * d.poison : 0,
                                kb: 600,
                                kbx: Math.cos(a.dir),
                                kby: Math.sin(a.dir)
                            });
                            this.shake = Math.max(this.shake, 10);
                        }
                        if (a.t >= (d.dur ?? 0.5)) {
                            a.ph = 2;
                            e.stun = 0.7;
                            done();
                        }
                    }
                    break;
                }
            case "shoot":
                {
                    turnTo(0.5);
                    damp(4);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        const sp = d.speed ?? 500;
                        const base = aim(sp);
                        const n = count();
                        const spread = d.spread ?? 0.3;
                        for(let i = 0; i < n; i++){
                            const off = n === 1 ? 0 : -spread / 2 + spread * i / (n - 1);
                            this.spawnProj(e, mx, my, base + off, d, {
                                life: d.life ?? ((d.maxP ?? 800) + 200) / sp
                            });
                        }
                        this.burst(mx, my, `hsl(${e.spd.hue},100%,70%)`, 5, 3, 160);
                    }
                    if (a.t >= d.wind + 0.3) done();
                    break;
                }
            case "nova":
                {
                    turnTo(0.3);
                    damp(5);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        const n = count();
                        const off = Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
                        for(let i = 0; i < n; i++){
                            const ang = off + i / n * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
                            this.spawnProj(e, e.x + Math.cos(ang) * e.radius * 0.35, e.y + Math.sin(ang) * e.radius * 0.35, ang, d, {
                                life: d.life ?? 1.5
                            });
                        }
                        this.ringFx(e.x, e.y, 120 + S, `hsl(${e.spd.hue},100%,70%)`, 400);
                        this.shake = Math.max(this.shake, 6);
                    }
                    if (a.t >= d.wind + 0.35) done();
                    break;
                }
            case "ring":
                {
                    damp(5);
                    turnTo(0.3);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        this.rings.push({
                            x: e.x,
                            y: e.y,
                            r: e.radius * 0.5,
                            max: Math.max(280, (d.size ?? 5) * S),
                            speed: d.speed ?? 420,
                            dmg: e.eDmg * d.dmg,
                            hit: false,
                            color: `hsl(${e.spd.hue},100%,68%)`,
                            hurts: true
                        });
                        this.shake = Math.max(this.shake, 10);
                    }
                    if (a.t >= d.wind + 0.4) done();
                    break;
                }
            case "pull":
                {
                    turnTo(0.6);
                    damp(4);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        const sp = d.speed ?? 700;
                        this.spawnProj(e, mx, my, Math.atan2(p.y - my, p.x - mx), d, {
                            type: "hook",
                            life: ((d.maxP ?? 800) + 100) / sp
                        });
                    }
                    if (a.t >= d.wind + 0.4) done();
                    break;
                }
            case "spit":
                {
                    turnTo(0.5);
                    damp(4);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        const sp = d.speed ?? 480;
                        const dd = Math.hypot(p.x - mx, p.y - my);
                        const lt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(dd / sp, 0.35, 2);
                        const tx = p.x + p.vx * lt * 0.6, ty = p.y + p.vy * lt * 0.6;
                        const ang = Math.atan2(ty - my, tx - mx);
                        const dist2 = Math.hypot(tx - mx, ty - my);
                        const life = Math.max(0.3, dist2 / sp);
                        this.spawnProj(e, mx, my, ang, d, {
                            type: "glob",
                            life,
                            speed: sp
                        });
                        const pr = this.eprojs[this.eprojs.length - 1];
                        pr.puddle = {
                            r: (d.size ?? 1.3) * S,
                            dps: e.eDmg * d.dmg,
                            slow: 0.6
                        };
                        pr.r = 10 + S * 0.15;
                    }
                    if (a.t >= d.wind + 0.3) done();
                    break;
                }
            case "cloud":
                {
                    turnTo(0.5);
                    damp(4);
                    if (!a.fired && a.t >= d.wind) {
                        a.fired = true;
                        const lt = 0.6;
                        const x = d.atPlayer ? p.x + p.vx * lt : e.x, y = d.atPlayer ? p.y + p.vy * lt : e.y;
                        this.puddles.push({
                            x,
                            y,
                            r: (d.size ?? 3) * S,
                            life: 6.5,
                            max: 6.5,
                            arm: d.atPlayer ? 0.8 : 0.5,
                            dps: e.eDmg * d.dmg,
                            slow: d.slow ?? 0.6,
                            hue: e.spd.hue
                        });
                    }
                    if (a.t >= d.wind + 0.3) done();
                    break;
                }
        }
        void dist;
    }
    swingHit(e, d) {
        const p = this.player;
        const dx = p.x - e.x, dy = p.y - e.y;
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        for (const q of e.parts){
            if (!q.alive || q.g < 0) continue;
            const g = e.groups[q.g];
            if (g.role !== d.role) continue;
            const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
            const ddx = lx - g.px, ddy = ly - g.py;
            const x = g.px + ddx * c - ddy * s, y = g.py + ddx * s + ddy * c;
            if (Math.hypot(x - q.cx, y - q.cy) > q.r + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 4) continue;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["distToPoly"])(x, y, q.poly) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 3) return true;
        }
        return false;
    }
    swingRope(e, d) {
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        for (const h of this.harpoons){
            if (h.state === 0) continue;
            for(let k = 2; k < N_ROPE - 1; k += 2){
                const nd = h.nodes[k];
                const dx = nd.x - e.x, dy = nd.y - e.y;
                if (dx * dx + dy * dy > (e.radius + 20) * (e.radius + 20)) break;
                const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
                for (const q of e.parts){
                    if (!q.alive || q.g < 0) continue;
                    const g = e.groups[q.g];
                    if (g.role !== d.role) continue;
                    const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
                    const ddx = lx - g.px, ddy = ly - g.py;
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pointInPoly"])(g.px + ddx * c - ddy * s, g.py + ddx * s + ddy * c, q.poly)) {
                        h.hp -= e.eDmg * d.dmg * 0.04 + 0.5;
                        this.burst(nd.x, nd.y, "#ff5d73", 2, 3, 100);
                        break;
                    }
                }
            }
        }
    }
    /** is the player's ship touching a solid part of this enemy? */ touching(e, extra = 0) {
        const p = this.player;
        const dx = p.x - e.x, dy = p.y - e.y;
        if (dx * dx + dy * dy > (e.radius + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 20) * (e.radius + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 20)) return false;
        const ca = Math.cos(e.a), sa = Math.sin(e.a);
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        for (const q of e.parts){
            if (!q.alive || q.kind === "wing" || q.kind === "leg") continue;
            let x = lx, y = ly;
            if (q.g >= 0) {
                const g = e.groups[q.g];
                const c = Math.cos(-g.ang), s = Math.sin(-g.ang);
                const ddx = lx - g.px, ddy = ly - g.py;
                x = g.px + ddx * c - ddy * s;
                y = g.py + ddx * s + ddy * c;
            }
            if (Math.hypot(x - q.cx, y - q.cy) > q.r + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + extra) continue;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["distToPoly"])(x, y, q.poly) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + extra) return true;
        }
        return false;
    }
    updateEnemy(e, dt, dx, dy, dist) {
        const p = this.player;
        for (const q of e.parts){
            if (q.hurt > 0) q.hurt -= dt;
            if (q.barT > 0) q.barT -= dt;
        }
        if (e.barT > 0) e.barT -= dt;
        if (e.contactCd > 0) e.contactCd -= dt;
        const safe = this.inSafe() || p.dead;
        const aggroR = 650 + e.radius * 1.2;
        if (!e.aggro) {
            if (!safe && dist < aggroR) e.aggro = true;
        } else if (safe || dist > aggroR * 2.4) e.aggro = false;
        for(let i = 0; i < e.abilCd.length; i++)if (e.abilCd[i] > 0) e.abilCd[i] -= dt;
        if (e.gap > 0) e.gap -= dt;
        const toP = Math.atan2(dy, dx);
        const sp = e.speed * e.mobility;
        const moving = Math.hypot(e.vx, e.vy) / (e.speed + 1);
        e.walk += dt * (3 + moving * 9);
        // group animation
        for (const g of e.groups){
            switch(g.role){
                case "leg":
                    g.ang = Math.sin(e.walk + g.phase) * g.amp * Math.min(1, moving * 1.6 + 0.04);
                    break;
                case "wing":
                    g.ang = Math.sin(this.t * (e.spd.flying ? 24 : 7) + g.phase) * g.amp * g.sign * (e.spd.flying ? Math.max(0.3, e.mobility) : 0.2);
                    break;
                case "sway":
                    g.ang = Math.sin(this.t * 2 + g.phase) * g.amp;
                    break;
                case "arm":
                case "mandible":
                case "tail":
                    if (!(e.act && e.act.def.type === "swing" && e.act.def.role === g.role)) g.ang = Math.sin(this.t * 1.4 + g.phase + g.sign) * (g.role === "tail" ? 0.07 : 0.05) * g.sign;
                    break;
                default:
                    break;
            }
        }
        // shields
        e.shields.length = 0;
        for (const id of e.shieldParts){
            const q = e.parts[id];
            if (!q.alive) continue;
            if (q.shieldDown > 0) {
                q.shieldDown -= dt;
                if (q.shieldDown <= 0) q.shieldHp = q.shieldMax * 0.4;
            } else {
                if (q.shieldHit > 0) q.shieldHit -= dt;
                else if (q.shieldHp < q.shieldMax) q.shieldHp = Math.min(q.shieldMax, q.shieldHp + q.shieldMax * 0.15 * dt);
                const w = this.partWorld(e, q);
                e.shields.push({
                    x: w[0],
                    y: w[1],
                    r: q.shieldR,
                    part: q
                });
            }
        }
        // weapons
        for (const id of e.weaponParts){
            const q = e.parts[id];
            if (!q.alive) continue;
            const g = e.groups[q.g];
            const w = this.partWorld(e, q);
            const wx = w[0], wy = w[1];
            if (e.aggro && !p.dead) {
                const aim = Math.atan2(p.y - wy, p.x - wx);
                const rel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, aim);
                g.ang += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(g.ang, rel), -2.2 * dt, 2.2 * dt);
                q.cd -= dt;
                const dd = Math.hypot(p.x - wx, p.y - wy);
                const range = q.wpn === "gun" ? 900 : 1150;
                if (q.cd <= 0 && dd < range && Math.abs((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(g.ang, rel)) < 0.22 && e.stun <= 0) {
                    const dir = e.a + g.ang;
                    const mx = wx + Math.cos(dir) * q.muzzle, my = wy + Math.sin(dir) * q.muzzle;
                    if (q.wpn === "gun") {
                        q.cd = (1.1 + Math.random() * 0.6) / (1 + 0.04 * e.tier);
                        this.eprojs.push({
                            x: mx,
                            y: my,
                            vx: Math.cos(dir) * 560,
                            vy: Math.sin(dir) * 560,
                            life: 1.9,
                            dmg: e.eDmg * 0.4,
                            r: 5 + e.tier,
                            hue: 8,
                            type: "bolt",
                            homing: 0,
                            slow: 0,
                            slowT: 0,
                            poison: 0,
                            pierce: false,
                            hp: 1,
                            speed: 560,
                            src: e,
                            puddle: null
                        });
                    } else {
                        q.cd = 4.5 + Math.random() * 1.5;
                        this.eprojs.push({
                            x: mx,
                            y: my,
                            vx: Math.cos(dir) * 200,
                            vy: Math.sin(dir) * 200,
                            life: 5,
                            dmg: e.eDmg * 1.1,
                            r: 8 + e.tier * 1.5,
                            hue: 25,
                            type: "missile",
                            homing: 2.0,
                            slow: 0,
                            slowT: 0,
                            poison: 0,
                            pierce: false,
                            hp: 1,
                            speed: 330,
                            src: e,
                            puddle: null
                        });
                    }
                    this.burst(mx, my, "#ff9d4d", 3, 3, 140);
                }
            } else g.ang *= Math.exp(-2 * dt);
        }
        // ---- behaviour / movement ----
        let tvx = 0, tvy = 0;
        let faceTo = e.a;
        let turnMul = 0.3 + 0.7 * e.mobility;
        if (e.stun > 0) {
            e.stun -= dt;
            e.vx *= Math.exp(-4 * dt);
            e.vy *= Math.exp(-4 * dt);
        } else if (e.act) {
            this.runAct(e, dt, toP, dist);
        } else {
            if (e.aggro && !p.dead) {
                faceTo = toP;
                const nx = dx / (dist || 1), ny = dy / (dist || 1);
                if (e.spd.ranged) {
                    e.strafeT -= dt;
                    if (e.strafeT <= 0) {
                        e.strafe = -e.strafe;
                        e.strafeT = 1.5 + Math.random() * 2.5;
                    }
                    let radial = 0;
                    if (dist < e.keep * 0.8) radial = -1;
                    else if (dist > e.keep * 1.15) radial = 1;
                    tvx = (nx * radial - ny * e.strafe * 0.7) * sp;
                    tvy = (ny * radial + nx * e.strafe * 0.7) * sp;
                } else {
                    const stop = e.S * 0.8 + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"];
                    if (dist > stop) {
                        const f = Math.max(0, Math.cos((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, toP)));
                        tvx = Math.cos(e.a) * sp * f;
                        tvy = Math.sin(e.a) * sp * f;
                    }
                }
                if (e.gap <= 0) this.chooseAct(e, dist, toP);
            } else {
                const w = e.wander;
                w.t -= dt;
                const hd = Math.hypot(e.x - e.home.x, e.y - e.home.y);
                if (w.t <= 0 || Math.hypot(e.x - w.x, e.y - w.y) < 40) {
                    const a = Math.random() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], r = Math.random() * 350;
                    w.x = hd > 700 ? e.home.x : e.home.x + Math.cos(a) * r;
                    w.y = hd > 700 ? e.home.y : e.home.y + Math.sin(a) * r;
                    w.t = 3 + Math.random() * 4;
                }
                const ta = Math.atan2(w.y - e.y, w.x - e.x);
                faceTo = ta;
                const f = Math.max(0, Math.cos((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, ta)));
                tvx = Math.cos(e.a) * sp * 0.3 * f;
                tvy = Math.sin(e.a) * sp * 0.3 * f;
            }
            const k = Math.min(1, dt * 3);
            e.vx += (tvx - e.vx) * k;
            e.vy += (tvy - e.vy) * k;
        }
        if (!e.act || e.act.def.type === "charge") {}
        if (!e.act) e.a += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(e.a, faceTo), -e.turn * turnMul * dt, e.turn * turnMul * dt);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        // keep out of base safe zone
        const bd = Math.hypot(e.x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x, e.y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y);
        if (bd < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].safe) {
            e.x += (e.x - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x) / (bd || 1) * 220 * dt;
            e.y += (e.y - __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y) / (bd || 1) * 220 * dt;
        }
        // contact with player
        if (!p.dead && dist < e.radius + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 30 && !this.inSafe()) {
            if (this.touching(e, 0)) {
                const k = dist || 1;
                p.x += dx / k * 140 * dt;
                p.y += dy / k * 140 * dt;
                p.vx += dx / k * 600 * dt;
                p.vy += dy / k * 600 * dt;
                if (e.contactCd <= 0) {
                    e.contactCd = 0.7;
                    this.hurtPlayer(e.eDmg * 0.25, {
                        kb: 200,
                        kbx: dx / k,
                        kby: dy / k
                    });
                }
            }
        }
    }
    updateEnemies(dt) {
        const p = this.player;
        for (const e of this.enemies){
            const dx = p.x - e.x, dy = p.y - e.y;
            e.dist = Math.hypot(dx, dy);
            if (e.dist > 3800 && !e.aggro) continue;
            this.updateEnemy(e, dt, dx, dy, e.dist);
        }
        // separation
        const n = this.enemies.length;
        for(let i = 0; i < n; i++){
            const a = this.enemies[i];
            if (a.dist > 3000) continue;
            for(let j = i + 1; j < n; j++){
                const b = this.enemies[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const min = (a.radius + b.radius) * 0.55;
                const d2 = dx * dx + dy * dy;
                if (d2 < min * min && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const push = (min - d) / min * 90 * dt;
                    const wa = b.radius / (a.radius + b.radius), wb = 1 - wa;
                    a.x -= dx / d * push * wa * 2;
                    a.y -= dy / d * push * wa * 2;
                    b.x += dx / d * push * wb * 2;
                    b.y += dy / d * push * wb * 2;
                }
            }
        }
        if (this.enemies.some((e)=>e.dead)) this.enemies = this.enemies.filter((e)=>!e.dead);
    }
    /* ---------------- player bullets ---------------- */ tryHit(b) {
        const st = this.stats;
        for (const pr of this.eprojs){
            if (pr.type !== "missile") continue;
            if (Math.abs(pr.x - b.x) < pr.r + 4 && Math.abs(pr.y - b.y) < pr.r + 4) {
                pr.hp -= b.dmg;
                pr.life = pr.hp <= 0 ? 0 : pr.life;
                this.burst(pr.x, pr.y, "#ffb04d", 5, 3, 200);
                if (b.kind !== 1) return true;
            }
        }
        for (const e of this.enemies){
            if (e.dead) continue;
            const dx = b.x - e.x, dy = b.y - e.y;
            const rr = e.radius + 12;
            if (dx * dx + dy * dy > rr * rr) continue;
            for (const s of e.shields){
                if (s.part.alive && s.part.shieldHp > 0) {
                    const sx = b.x - s.x, sy = b.y - s.y;
                    if (sx * sx + sy * sy < s.r * s.r) {
                        s.part.shieldHp -= b.dmg * (b.kind === 1 ? 1.5 : 1);
                        s.part.shieldHit = 3;
                        e.aggro = true;
                        e.barT = 3;
                        this.addParticle(b.x, b.y, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, "#7df9ff", 3, 0.3, 2, false);
                        if (s.part.shieldHp <= 0) {
                            s.part.shieldHp = 0;
                            s.part.shieldDown = 7;
                            this.ringFx(s.x, s.y, s.r, "#7df9ff", 800);
                            this.burst(s.x, s.y, "#7df9ff", 14, 6, 300);
                        }
                        return true;
                    }
                }
            }
            const ca = Math.cos(e.a), sa = Math.sin(e.a);
            const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
            const p = this.partAt(e, lx, ly);
            if (!p) continue;
            const key = e.id * 100000 + p.id;
            if (b.hit.includes(key)) continue;
            b.hit.push(key);
            let dmg = b.dmg;
            if (p.kind === "armor" || p.kind === "shield" || p.kind === "spike") dmg *= st.breaker;
            if (p.kind === "core") dmg *= st.coreMul;
            this.damagePart(e, p, dmg, b.x, b.y);
            if (st.frag > 0 && b.kind !== 1) {
                for (const q of e.parts){
                    if (!q.alive || q === p) continue;
                    if (Math.hypot(q.cx - p.cx, q.cy - p.cy) < st.frag + q.r * 0.5) this.damagePart(e, q, dmg * 0.35, 0, 0);
                }
            }
            if (b.kind === 1) {
                this.areaDamage(b.x, b.y, 95, b.dmg * 0.6, null);
                this.ringFx(b.x, b.y, 95, "#ffb04d", 500);
                this.burst(b.x, b.y, "#ffb04d", 8, 4, 220);
                b.life = 0;
                return true;
            }
            if (b.pierce > 0) {
                b.pierce--;
                b.dmg *= 0.8;
                return false;
            }
            return true;
        }
        return false;
    }
    updateBullets(dt) {
        for(let i = this.bullets.length - 1; i >= 0; i--){
            const b = this.bullets[i];
            b.life -= dt;
            if (b.kind === 1) {
                if (!b.target || b.target.dead) b.target = this.nearestEnemy(b.x, b.y, 1100);
                if (b.target) {
                    const want = Math.atan2(b.target.y - b.y, b.target.x - b.x), cur = Math.atan2(b.vy, b.vx);
                    const na = cur + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(cur, want), -4 * dt, 4 * dt);
                    const sp = Math.min(760, Math.hypot(b.vx, b.vy) + 500 * dt);
                    b.vx = Math.cos(na) * sp;
                    b.vy = Math.sin(na) * sp;
                }
            }
            const dist = Math.hypot(b.vx, b.vy) * dt;
            const steps = Math.max(1, Math.ceil(dist / 10));
            let dead = b.life <= 0;
            for(let s = 0; s < steps && !dead; s++){
                b.x += b.vx * dt / steps;
                b.y += b.vy * dt / steps;
                if (this.tryHit(b)) dead = true;
            }
            if (dead) this.bullets.splice(i, 1);
        }
    }
    nearestEnemy(x, y, range) {
        let best = null, bd = range;
        for (const e of this.enemies){
            if (e.dead) continue;
            const d = Math.hypot(e.x - x, e.y - y) - e.radius * 0.6;
            if (d < bd) {
                bd = d;
                best = e;
            }
        }
        return best;
    }
    beam(x, y, ang, len, dmg, pierce) {
        const st = this.stats;
        const hits = new Set();
        const cos = Math.cos(ang), sin = Math.sin(ang);
        let endLen = len;
        let pierced = 0;
        const cands = this.enemies.filter((e)=>!e.dead && Math.hypot(e.x - x, e.y - y) < len + e.radius);
        outer: for(let d = 10; d <= len; d += 8){
            const bx = x + cos * d, by = y + sin * d;
            for (const e of cands){
                const dx = bx - e.x, dy = by - e.y;
                if (dx * dx + dy * dy > (e.radius + 6) * (e.radius + 6)) continue;
                for (const s of e.shields){
                    if (s.part.alive && s.part.shieldHp > 0 && (bx - s.x) ** 2 + (by - s.y) ** 2 < s.r * s.r) {
                        s.part.shieldHp -= dmg;
                        s.part.shieldHit = 3;
                        if (s.part.shieldHp <= 0) {
                            s.part.shieldHp = 0;
                            s.part.shieldDown = 7;
                        }
                        endLen = d;
                        break outer;
                    }
                }
                const ca = Math.cos(e.a), sa = Math.sin(e.a);
                const p = this.partAt(e, dx * ca + dy * sa, -dx * sa + dy * ca);
                if (!p) continue;
                const key = e.id * 100000 + p.id;
                if (hits.has(key)) continue;
                hits.add(key);
                let dm = dmg;
                if (p.kind === "armor" || p.kind === "shield" || p.kind === "spike") dm *= st.breaker;
                if (p.kind === "core") dm *= st.coreMul;
                this.damagePart(e, p, dm, bx, by);
                pierced++;
                if (pierced > pierce) {
                    endLen = d;
                    break outer;
                }
            }
        }
        this.beams.push({
            x1: x,
            y1: y,
            x2: x + cos * endLen,
            y2: y + sin * endLen,
            life: 0.12
        });
    }
    firePlayer(dt) {
        const p = this.player, st = this.stats;
        if (p.dead) return;
        const want = this.input.lmb || this.input.keys.has("Space");
        p.fireCd -= dt;
        const [mx, my] = this.mouseWorld();
        const base = p.a;
        if (want && p.fireCd <= 0 && !this.inSafe()) {
            p.fireCd = 1 / st.rate;
            const n = st.barrels;
            for(let i = 0; i < n; i++){
                const ang = base + (i - (n - 1) / 2) * 0.09;
                const crit = Math.random() < st.crit;
                this.bullets.push({
                    x: p.x + Math.cos(ang) * 18,
                    y: p.y + Math.sin(ang) * 18,
                    vx: Math.cos(ang) * st.bulletSpeed + p.vx * 0.3,
                    vy: Math.sin(ang) * st.bulletSpeed + p.vy * 0.3,
                    life: st.bulletRange / st.bulletSpeed,
                    dmg: st.dmg * (crit ? 2.5 : 1),
                    pierce: st.pierce,
                    hit: [],
                    kind: 0,
                    target: null,
                    crit
                });
            }
            p.vx -= Math.cos(base) * 6;
            p.vy -= Math.sin(base) * 6;
        }
        st.weapons.forEach((w, i)=>{
            p.wCd[i] -= dt;
            if (p.wCd[i] > 0 || this.inSafe()) return;
            const side = i === 1 ? -1 : 1;
            const ox = p.x + Math.cos(base + Math.PI / 2) * 12 * side, oy = p.y + Math.sin(base + Math.PI / 2) * 12 * side;
            if (w.rid === "pulse") {
                const t = this.nearestEnemy(p.x, p.y, 650);
                if (!t) return;
                p.wCd[i] = 0.45;
                const ang = Math.atan2(t.y - oy, t.x - ox);
                this.bullets.push({
                    x: ox,
                    y: oy,
                    vx: Math.cos(ang) * 1100,
                    vy: Math.sin(ang) * 1100,
                    life: 0.8,
                    dmg: st.dmg * 0.6 * w.eff,
                    pierce: 0,
                    hit: [],
                    kind: 0,
                    target: null,
                    crit: false
                });
            } else if (!want) return;
            else if (w.rid === "scatter") {
                p.wCd[i] = 0.75;
                for(let k = 0; k < 6; k++){
                    const ang = base + (Math.random() - 0.5) * 0.55;
                    const sp = 650 + Math.random() * 250;
                    this.bullets.push({
                        x: ox,
                        y: oy,
                        vx: Math.cos(ang) * sp,
                        vy: Math.sin(ang) * sp,
                        life: 0.42,
                        dmg: st.dmg * 0.55 * w.eff,
                        pierce: 0,
                        hit: [],
                        kind: 2,
                        target: null,
                        crit: false
                    });
                }
            } else if (w.rid === "missile") {
                p.wCd[i] = 1.5;
                for(let k = 0; k < 2; k++){
                    const ang = base + (k ? 0.5 : -0.5);
                    this.bullets.push({
                        x: ox,
                        y: oy,
                        vx: Math.cos(ang) * 260,
                        vy: Math.sin(ang) * 260,
                        life: 3.2,
                        dmg: st.dmg * 2.2 * w.eff,
                        pierce: 0,
                        hit: [],
                        kind: 1,
                        target: this.nearestEnemy(mx, my, 1100),
                        crit: false
                    });
                }
            } else if (w.rid === "lance") {
                p.wCd[i] = 0.12;
                this.beam(p.x, p.y, base, 320 + 80 * w.eff, st.dmg * 0.45 * w.eff, 2 + Math.floor(w.eff));
            }
        });
    }
    /* ---------------- main update ---------------- */ update(dtRaw) {
        const dt = Math.min(dtRaw, 0.05);
        this.t += dt;
        this.fpsAcc += dtRaw;
        this.fpsN++;
        if (this.fpsAcc > 0.5) {
            this.fps = Math.round(this.fpsN / this.fpsAcc);
            this.fpsAcc = 0;
            this.fpsN = 0;
        }
        const p = this.player, st = this.stats, k = this.input.keys;
        if (p.dead) {
            p.respawn -= dt;
            if (p.respawn <= 0) this.respawnPlayer();
        } else {
            // movement
            let ax = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
            let ay = (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) - (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0);
            const al = Math.hypot(ax, ay);
            if (al > 0) {
                ax /= al;
                ay /= al;
            }
            const wantBoost = (k.has("ShiftLeft") || k.has("ShiftRight")) && st.hasBoost && p.boost > 5 && al > 0;
            p.boosting = wantBoost;
            if (wantBoost) p.boost = Math.max(0, p.boost - 50 * dt);
            else p.boost = Math.min(100, p.boost + st.boostRegen * dt);
            if (p.slowT > 0) {
                p.slowT -= dt;
                if (p.slowT <= 0) p.slowF = 1;
            }
            let maxSp = st.thrust * p.slowF * p.tow * (wantBoost ? st.boostMul : 1);
            const rate = Math.min(1, st.accel / Math.max(200, maxSp) * dt);
            p.vx += (ax * maxSp - p.vx) * rate;
            p.vy += (ay * maxSp - p.vy) * rate;
            if (p.pull) {
                p.pull.t -= dt;
                const pe = p.pull.e;
                if (pe.dead || p.pull.t <= 0 || this.inSafe()) p.pull = null;
                else {
                    const dx = pe.x - p.x, dy = pe.y - p.y, d = Math.hypot(dx, dy) || 1;
                    if (d < pe.radius * 0.5) p.pull = null;
                    else {
                        const f = 1100 * (1 - st.dampers);
                        p.vx += dx / d * f * dt;
                        p.vy += dy / d * f * dt;
                    }
                }
            }
            maxSp = Math.max(maxSp, 1);
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const rd = Math.hypot(p.x, p.y);
            if (rd > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"] - 30) {
                const nx = p.x / rd, ny = p.y / rd;
                p.x = nx * (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"] - 30);
                p.y = ny * (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"] - 30);
                const vn = p.vx * nx + p.vy * ny;
                if (vn > 0) {
                    p.vx -= nx * vn;
                    p.vy -= ny * vn;
                }
            }
            const [mx, my] = this.mouseWorld();
            const want = Math.atan2(my - p.y, mx - p.x);
            p.a += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(p.a, want), -14 * dt, 14 * dt);
            // status
            p.hitT += dt;
            if (p.flash > 0) p.flash -= dt;
            if (p.thornCd > 0) p.thornCd -= dt;
            if (p.poisonT > 0) {
                p.poisonT -= dt;
                this.hurtPlayer(p.poison * dt, {
                    dot: true
                });
                if (p.poisonT <= 0) p.poison = 0;
            }
            if (this.inSafe()) {
                p.hp = Math.min(st.hull, p.hp + st.hull * 0.5 * dt);
                p.shield = Math.min(st.shieldMax, p.shield + st.shieldMax * 0.6 * dt);
                p.poison = 0;
                p.slowF = 1;
            } else {
                if (st.regen > 0 && p.hp > 0) p.hp = Math.min(st.hull, p.hp + st.hull * st.regen * dt);
            }
            if (st.shieldMax > 0) {
                p.shieldT -= dt;
                if (p.shieldT <= 0) p.shield = Math.min(st.shieldMax, p.shield + st.shieldMax * st.shieldRegen * dt);
            } else p.shield = 0;
            if (p.shield > st.shieldMax) p.shield = st.shieldMax;
            // teleport
            if (p.tpCd > 0) p.tpCd -= dt;
            if (p.tpT > 0) {
                p.tpT -= dt;
                if (Math.random() < 0.5) this.addParticle(p.x + (Math.random() - 0.5) * 40, p.y + (Math.random() - 0.5) * 40, 0, -80, "#c77dff", 4, 0.6, 3);
                if (p.tpT <= 0) {
                    p.tpT = 0;
                    p.tpCd = st.tpCd;
                    this.burst(p.x, p.y, "#c77dff", 30, 8, 400);
                    this.ringFx(p.x, p.y, 300, "#c77dff", 900);
                    for (const h of this.harpoons)if (h.state !== 0) this.retract(h);
                    p.x = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x;
                    p.y = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y - 220;
                    p.vx = p.vy = 0;
                    this.cam.x = p.x;
                    this.cam.y = p.y;
                    this.burst(p.x, p.y, "#c77dff", 30, 8, 400);
                    this.ringFx(p.x, p.y, 300, "#c77dff", 900);
                    this.toast("Recalled to base", "#c77dff");
                }
            }
            this.firePlayer(dt);
        }
        // world
        this.chunkT -= dt;
        if (this.chunkT <= 0) {
            this.chunkT = 0.4;
            this.manageChunks();
        }
        this.updateEnemies(dt);
        this.updateEProjs(dt);
        this.updateBullets(dt);
        this.updateComps(dt);
        this.updateHarpoons(dt);
        // puddles
        for(let i = this.puddles.length - 1; i >= 0; i--){
            const q = this.puddles[i];
            if (q.arm > 0) q.arm -= dt;
            else {
                q.life -= dt;
                if (!p.dead && Math.hypot(p.x - q.x, p.y - q.y) < q.r + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] * 0.5) {
                    this.hurtPlayer(q.dps * dt, {
                        dot: true
                    });
                    this.applySlow(q.slow, 0.4);
                }
            }
            if (q.life <= 0) this.puddles.splice(i, 1);
        }
        // rings
        for(let i = this.rings.length - 1; i >= 0; i--){
            const r = this.rings[i];
            r.r += r.speed * dt;
            if (r.hurts && !r.hit && !p.dead) {
                const d = Math.hypot(p.x - r.x, p.y - r.y);
                if (Math.abs(d - r.r) < 26) {
                    r.hit = true;
                    this.hurtPlayer(r.dmg, {
                        kb: 700,
                        kbx: (p.x - r.x) / (d || 1),
                        kby: (p.y - r.y) / (d || 1)
                    });
                }
            }
            if (r.r >= r.max) this.rings.splice(i, 1);
        }
        for(let i = this.debris.length - 1; i >= 0; i--){
            const d = this.debris[i];
            d.life -= dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.rot += d.vr * dt;
            d.vx *= Math.exp(-0.8 * dt);
            d.vy *= Math.exp(-0.8 * dt);
            if (d.life <= 0) {
                for (const pc of d.pieces){
                    let cx = 0, cy = 0;
                    for(let j = 0; j < pc.poly.length; j += 2){
                        cx += pc.poly[j];
                        cy += pc.poly[j + 1];
                    }
                    cx /= pc.poly.length / 2;
                    cy /= pc.poly.length / 2;
                    this.burst(d.x + cx, d.y + cy, pc.stroke, 3, 8, 160);
                }
                this.debris.splice(i, 1);
            }
        }
        for(let i = this.beams.length - 1; i >= 0; i--){
            this.beams[i].life -= dt;
            if (this.beams[i].life <= 0) this.beams.splice(i, 1);
        }
        for(let i = this.particles.length - 1; i >= 0; i--){
            const q = this.particles[i];
            q.life -= dt;
            if (q.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            q.x += q.vx * dt;
            q.y += q.vy * dt;
            q.rot += q.vr * dt;
            const f = Math.exp(-2.2 * dt);
            q.vx *= f;
            q.vy *= f;
        }
        for (const o of this.others){
            o.x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(o.x, o.tx, Math.min(1, dt * 6));
            o.y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(o.y, o.ty, Math.min(1, dt * 6));
            o.a += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(o.a, o.ta) * Math.min(1, dt * 8);
        }
        for(let i = this.toasts.length - 1; i >= 0; i--){
            this.toasts[i].t -= dt;
            if (this.toasts[i].t <= 0) this.toasts.splice(i, 1);
        }
        // biome tint
        const w = biomeWeights(p.x, p.y);
        let bi = 0;
        for(let i = 1; i < w.length; i++)if (w[i] > w[bi]) bi = i;
        this.tintTarget = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$enemies$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SPECIES_LIST"][bi].hue;
        this.tintHue += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angDiff"])(this.tintHue * (Math.PI / 180), this.tintTarget * (Math.PI / 180)) * (180 / Math.PI) * Math.min(1, dt * 1.5);
        this.tintHue = (this.tintHue % 360 + 360) % 360;
        // camera
        this.cam.z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(this.cam.z, this.zoom, Math.min(1, dt * 8));
        this.cam.x += (p.x + p.vx * 0.12 - this.cam.x) * Math.min(1, dt * 7);
        this.cam.y += (p.y + p.vy * 0.12 - this.cam.y) * Math.min(1, dt * 7);
        this.shake = Math.max(0, this.shake - dt * 30);
        // saving / net
        this.saveT -= dt;
        this.serverT -= dt;
        this.netT -= dt;
        if (this.saveT <= 0) {
            this.saveT = 5;
            this.persist();
        }
        if (this.serverT <= 0) {
            this.serverT = 20;
            void this.pushServer();
        }
        if (this.netT <= 0) {
            this.netT = 0.7;
            void this.netTick();
        }
    }
    hud() {
        const p = this.player, st = this.stats;
        return {
            hp: p.hp,
            maxHp: st.hull,
            shield: p.shield,
            maxShield: st.shieldMax,
            boost: p.boost,
            hasBoost: st.hasBoost,
            credits: this.save.credits,
            harp: this.harpoons.map((h)=>({
                    state: h.state,
                    load: h.comp ? h.comp.c.mass / (h.comp.hooks.length * st.hStr) : 0,
                    hp: h.hp / h.maxHp
                })),
            toasts: [
                ...this.toasts
            ],
            nearBase: this.nearBase(),
            tp: {
                has: st.tpTime > 0,
                ch: p.tpT > 0 ? 1 - p.tpT / st.tpTime : 0,
                cd: p.tpCd,
                max: st.tpCd
            },
            dead: p.dead,
            respawn: p.respawn,
            x: p.x,
            y: p.y,
            online: this.online,
            zoomOn: st.zoomMin < 1,
            inv: this.save.inventory.length,
            cargo: st.cargo,
            hold: this.input.rHold / 0.6,
            rev: this.rev,
            zoom: this.zoom,
            fps: this.fps
        };
    }
}
;
}),
"[project]/src/game/math.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TAU",
    ()=>TAU,
    "angDiff",
    ()=>angDiff,
    "clamp",
    ()=>clamp,
    "distSegSq",
    ()=>distSegSq,
    "distToPoly",
    ()=>distToPoly,
    "fmtNum",
    ()=>fmtNum,
    "hash2",
    ()=>hash2,
    "lerp",
    ()=>lerp,
    "mulberry32",
    ()=>mulberry32,
    "pointInPoly",
    ()=>pointInPoly,
    "polyArea",
    ()=>polyArea,
    "polyCentroid",
    ()=>polyCentroid
]);
const TAU = Math.PI * 2;
const clamp = (v, a, b)=>v < a ? a : v > b ? b : v;
const lerp = (a, b, t)=>a + (b - a) * t;
function angDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    else if (d < -Math.PI) d += TAU;
    return d;
}
function mulberry32(seed) {
    let s = seed | 0;
    return ()=>{
        s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function hash2(x, y, s = 0) {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653) | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return (h ^ h >>> 16) >>> 0;
}
function pointInPoly(x, y, p) {
    let inside = false;
    for(let i = 0, j = p.length - 2; i < p.length; j = i, i += 2){
        const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
        if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function distSegSq(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + dx * t - px, cy = ay + dy * t - py;
    return cx * cx + cy * cy;
}
function distToPoly(x, y, p) {
    if (pointInPoly(x, y, p)) return 0;
    let best = Infinity;
    for(let i = 0, j = p.length - 2; i < p.length; j = i, i += 2){
        const d = distSegSq(x, y, p[j], p[j + 1], p[i], p[i + 1]);
        if (d < best) best = d;
    }
    return Math.sqrt(best);
}
function polyArea(p) {
    let a = 0;
    for(let i = 0, j = p.length - 2; i < p.length; j = i, i += 2)a += p[j] * p[i + 1] - p[i] * p[j + 1];
    return Math.abs(a) / 2;
}
function polyCentroid(p) {
    let a = 0, cx = 0, cy = 0;
    for(let i = 0, j = p.length - 2; i < p.length; j = i, i += 2){
        const f = p[j] * p[i + 1] - p[i] * p[j + 1];
        a += f;
        cx += (p[j] + p[i]) * f;
        cy += (p[j + 1] + p[i + 1]) * f;
    }
    if (Math.abs(a) < 1e-9) {
        let sx = 0, sy = 0;
        const n = p.length / 2;
        for(let i = 0; i < p.length; i += 2){
            sx += p[i];
            sy += p[i + 1];
        }
        return [
            sx / n,
            sy / n
        ];
    }
    return [
        cx / (3 * a),
        cy / (3 * a)
    ];
}
function fmtNum(n) {
    if (!isFinite(n)) return "∞";
    const abs = Math.abs(n);
    if (abs < 1000) return abs < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.round(n).toString();
    const u = [
        "K",
        "M",
        "B",
        "T",
        "Qa",
        "Qi"
    ];
    let i = -1;
    let v = abs;
    while(v >= 1000 && i < u.length - 1){
        v /= 1000;
        i++;
    }
    return (n < 0 ? "-" : "") + (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + u[i];
}
}),
"[project]/src/game/render.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "render",
    ()=>render
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/math.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/game/engine.ts [app-ssr] (ecmascript) <locals>");
;
;
;
function pw(e, p) {
    let x = p.cx, y = p.cy;
    if (p.g >= 0) {
        const g = e.groups[p.g];
        const c = Math.cos(g.ang), s = Math.sin(g.ang);
        const dx = x - g.px, dy = y - g.py;
        x = g.px + dx * c - dy * s;
        y = g.py + dx * s + dy * c;
    }
    const ca = Math.cos(e.a), sa = Math.sin(e.a);
    return [
        e.x + x * ca - y * sa,
        e.y + x * sa + y * ca
    ];
}
function polyPath(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly[0], poly[1]);
    for(let i = 2; i < poly.length; i += 2)ctx.lineTo(poly[i], poly[i + 1]);
    ctx.closePath();
}
function hexPath(ctx, x, y, r, rot = 0) {
    ctx.beginPath();
    for(let i = 0; i < 6; i++){
        const a = rot + i / 6 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}
function render(g, ctx) {
    const { w, h, dpr, cam } = g;
    const z = cam.z;
    const t = g.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#04050c";
    ctx.fillRect(0, 0, w, h);
    const sx = (Math.random() - 0.5) * g.shake, sy = (Math.random() - 0.5) * g.shake;
    const cx = cam.x + sx, cy = cam.y + sy;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (w / 2 - cx * z), dpr * (h / 2 - cy * z));
    const vx0 = cx - w / 2 / z - 120, vx1 = cx + w / 2 / z + 120, vy0 = cy - h / 2 / z - 120, vy1 = cy + h / 2 / z + 120;
    const hue = g.tintHue;
    /* ---- grid ---- */ ctx.lineWidth = 1 / z;
    if (z > 0.22) {
        ctx.strokeStyle = `hsla(${hue},100%,60%,0.08)`;
        ctx.beginPath();
        for(let x = Math.floor(vx0 / 100) * 100; x < vx1; x += 100){
            if (x % 500 === 0) continue;
            ctx.moveTo(x, vy0);
            ctx.lineTo(x, vy1);
        }
        for(let y = Math.floor(vy0 / 100) * 100; y < vy1; y += 100){
            if (y % 500 === 0) continue;
            ctx.moveTo(vx0, y);
            ctx.lineTo(vx1, y);
        }
        ctx.stroke();
    }
    ctx.strokeStyle = `hsla(${hue},100%,62%,0.22)`;
    ctx.lineWidth = 1.6 / z;
    ctx.beginPath();
    for(let x = Math.floor(vx0 / 500) * 500; x < vx1; x += 500){
        ctx.moveTo(x, vy0);
        ctx.lineTo(x, vy1);
    }
    for(let y = Math.floor(vy0 / 500) * 500; y < vy1; y += 500){
        ctx.moveTo(vx0, y);
        ctx.lineTo(vx1, y);
    }
    ctx.stroke();
    /* ---- zone rings & world edge ---- */ ctx.setLineDash([
        40 / z,
        40 / z
    ]);
    ctx.lineWidth = 3 / z;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZONE_EDGES"].forEach((r, i)=>{
        ctx.strokeStyle = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][5 - i].color + "40";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(3,0,8,0.82)";
    ctx.beginPath();
    ctx.rect(vx0 - 2000, vy0 - 2000, vx1 - vx0 + 4000, vy1 - vy0 + 4000);
    ctx.arc(0, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"], 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"], true);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#ff3d73";
    ctx.lineWidth = 6 / z;
    ctx.shadowColor = "#ff3d73";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"], 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawBase(g, ctx, z, t);
    /* ---- puddles ---- */ for (const q of g.puddles){
        if (q.x + q.r < vx0 || q.x - q.r > vx1 || q.y + q.r < vy0 || q.y - q.r > vy1) continue;
        if (q.arm > 0) {
            ctx.strokeStyle = `hsla(${q.hue},100%,60%,${0.4 + 0.3 * Math.sin(t * 20)})`;
            ctx.lineWidth = 2 / z;
            ctx.setLineDash([
                10 / z,
                8 / z
            ]);
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            const a = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(q.life / 1.2, 0, 1);
            const gr = ctx.createRadialGradient(q.x, q.y, q.r * 0.1, q.x, q.y, q.r);
            gr.addColorStop(0, `hsla(${q.hue},100%,60%,${0.1 * a})`);
            gr.addColorStop(1, `hsla(${q.hue},100%,55%,${0.34 * a})`);
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
            ctx.fill();
            ctx.strokeStyle = `hsla(${q.hue},100%,65%,${0.7 * a})`;
            ctx.lineWidth = 2 / z;
            ctx.stroke();
        }
    }
    /* ---- loose components ---- */ for (const c of g.comps){
        if (c.x + c.r < vx0 || c.x - c.r > vx1 || c.y + c.r < vy0 || c.y - c.r > vy1) continue;
        drawComp(g, ctx, c, z, t);
    }
    /* ---- ropes (under ship, over comps) ---- */ for (const hp of g.harpoons)if (hp.state !== 0) drawRope(g, ctx, hp, z);
    /* ---- enemies ---- */ for (const e of g.enemies){
        if (e.x + e.radius < vx0 || e.x - e.radius > vx1 || e.y + e.radius < vy0 || e.y - e.radius > vy1) continue;
        drawEnemy(g, ctx, e, z, t);
    }
    /* ---- debris ---- */ for (const d of g.debris){
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.globalAlpha = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d.life / d.max + 0.1, 0, 1);
        ctx.lineWidth = 1.6 / z;
        ctx.lineJoin = "round";
        for (const pc of d.pieces){
            polyPath(ctx, pc.poly);
            ctx.fillStyle = pc.fill;
            ctx.fill();
            ctx.strokeStyle = pc.stroke;
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    /* ---- pull line ---- */ const pl = g.player;
    if (pl.pull) {
        ctx.strokeStyle = "rgba(255,140,80,0.8)";
        ctx.lineWidth = 3 / z;
        ctx.setLineDash([
            12 / z,
            8 / z
        ]);
        ctx.beginPath();
        ctx.moveTo(pl.x, pl.y);
        ctx.lineTo(pl.pull.e.x, pl.pull.e.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    /* ---- enemy projectiles ---- */ for (const pr of g.eprojs){
        if (pr.x < vx0 || pr.x > vx1 || pr.y < vy0 || pr.y > vy1) continue;
        const col = pr.type === "missile" ? "#ffb04d" : `hsl(${pr.hue},100%,68%)`;
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2 / z;
        const ang = Math.atan2(pr.vy, pr.vx);
        switch(pr.type){
            case "missile":
                {
                    ctx.save();
                    ctx.translate(pr.x, pr.y);
                    ctx.rotate(ang);
                    ctx.beginPath();
                    ctx.moveTo(pr.r * 1.4, 0);
                    ctx.lineTo(-pr.r, -pr.r * 0.7);
                    ctx.lineTo(-pr.r * 0.5, 0);
                    ctx.lineTo(-pr.r, pr.r * 0.7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    break;
                }
            case "orb":
            case "bolt":
                {
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, pr.r, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
                    ctx.globalAlpha = 0.35;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, pr.r * 0.55, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    break;
                }
            case "web":
                {
                    hexPath(ctx, pr.x, pr.y, pr.r, t * 6);
                    ctx.stroke();
                    hexPath(ctx, pr.x, pr.y, pr.r * 0.5, -t * 6);
                    ctx.stroke();
                    break;
                }
            case "wave":
                {
                    ctx.save();
                    ctx.translate(pr.x, pr.y);
                    ctx.rotate(ang);
                    ctx.lineWidth = Math.max(3, pr.r * 0.35) / z * z;
                    ctx.beginPath();
                    ctx.arc(-pr.r * 0.6, 0, pr.r * 1.2, -1.0, 1.0);
                    ctx.stroke();
                    ctx.restore();
                    break;
                }
            case "hook":
                {
                    ctx.save();
                    ctx.translate(pr.x, pr.y);
                    ctx.rotate(ang);
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(0, -7);
                    ctx.lineTo(-8, 0);
                    ctx.lineTo(0, 7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    break;
                }
            case "glob":
                {
                    const s = pr.r * (1 + 0.15 * Math.sin(t * 18));
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, s, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
                    ctx.globalAlpha = 0.7;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    break;
                }
        }
        ctx.shadowBlur = 0;
    }
    /* ---- player bullets & beams ---- */ ctx.lineCap = "round";
    for (const b of g.bullets){
        if (b.kind === 1) {
            ctx.fillStyle = "#ffb04d";
            ctx.shadowColor = "#ffb04d";
            ctx.shadowBlur = 10;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(Math.atan2(b.vy, b.vx));
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-7, -5);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-7, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
            continue;
        }
        ctx.strokeStyle = b.crit ? "#ffe14d" : b.kind === 2 ? "#ff9d6e" : "#9ffcff";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.lineWidth = b.crit ? 4 : 3;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (const bm of g.beams){
        ctx.strokeStyle = `rgba(190,255,255,${bm.life / 0.12})`;
        ctx.lineWidth = 5;
        ctx.shadowColor = "#7df9ff";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(bm.x1, bm.y1);
        ctx.lineTo(bm.x2, bm.y2);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    /* ---- rings ---- */ for (const r of g.rings){
        const a = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(1 - r.r / r.max, 0, 1);
        ctx.globalAlpha = a;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = (r.hurts ? 10 : 4) / z * (r.hurts ? 1 : 1);
        ctx.shadowColor = r.color;
        ctx.shadowBlur = r.hurts ? 18 : 8;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    /* ---- other players ---- */ for (const o of g.others){
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.a);
        drawShipShape(ctx, "#ff7ad9", 0.85, z);
        ctx.restore();
        ctx.fillStyle = "rgba(255,170,230,0.9)";
        ctx.font = `${12 / z}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(o.name, o.x, o.y - 30);
    }
    /* ---- player ---- */ if (!pl.dead) drawPlayer(g, ctx, z, t);
    /* ---- particles ---- */ for (const q of g.particles){
        if (q.x < vx0 || q.x > vx1 || q.y < vy0 || q.y > vy1) continue;
        const a = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(q.life / q.max, 0, 1);
        ctx.globalAlpha = a;
        ctx.strokeStyle = q.color;
        ctx.fillStyle = q.color;
        ctx.lineWidth = 1.5 / z;
        const s = q.size * (0.4 + 0.6 * a);
        ctx.beginPath();
        switch(q.shape){
            case 0:
                for(let i = 0; i < 3; i++){
                    const an = q.rot + i / 3 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
                    const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s;
                    if (i) ctx.lineTo(px, py);
                    else ctx.moveTo(px, py);
                }
                ctx.closePath();
                break;
            case 1:
                for(let i = 0; i < 4; i++){
                    const an = q.rot + i / 4 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"] + Math.PI / 4;
                    const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s;
                    if (i) ctx.lineTo(px, py);
                    else ctx.moveTo(px, py);
                }
                ctx.closePath();
                break;
            case 2:
                for(let i = 0; i < 6; i++){
                    const an = q.rot + i / 6 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
                    const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s;
                    if (i) ctx.lineTo(px, py);
                    else ctx.moveTo(px, py);
                }
                ctx.closePath();
                break;
            case 3:
                ctx.moveTo(q.x - Math.cos(q.rot) * s * 1.6, q.y - Math.sin(q.rot) * s * 1.6);
                ctx.lineTo(q.x + Math.cos(q.rot) * s * 1.6, q.y + Math.sin(q.rot) * s * 1.6);
                break;
            default:
                ctx.arc(q.x, q.y, s * 0.7, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        }
        if (q.shape === 3) ctx.stroke();
        else if (q.fill) {
            ctx.globalAlpha = a * 0.55;
            ctx.fill();
            ctx.globalAlpha = a;
            ctx.stroke();
        } else ctx.stroke();
    }
    ctx.globalAlpha = 1;
    /* ---- enemy bars (drawn last, in world space) ---- */ for (const e of g.enemies){
        if (e.x + e.radius < vx0 || e.x - e.radius > vx1 || e.y + e.radius < vy0 || e.y - e.radius > vy1) continue;
        drawBars(g, ctx, e, z);
    }
    /* ---- screen space HUD in canvas ---- */ ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMinimap(g, ctx);
    drawBaseArrow(g, ctx);
}
function drawBase(g, ctx, z, t) {
    const { x, y, r, dock, safe } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"];
    ctx.setLineDash([
        24 / z,
        24 / z
    ]);
    ctx.strokeStyle = "rgba(90,255,170,0.2)";
    ctx.lineWidth = 3 / z;
    ctx.beginPath();
    ctx.arc(x, y, safe, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
    ctx.stroke();
    ctx.setLineDash([]);
    const gr = ctx.createRadialGradient(x, y, 20, x, y, r);
    gr.addColorStop(0, "rgba(40,255,200,0.22)");
    gr.addColorStop(1, "rgba(40,160,255,0.05)");
    hexPath(ctx, x, y, r, Math.PI / 6);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.shadowColor = "#4dffd2";
    ctx.shadowBlur = 24;
    ctx.strokeStyle = "#4dffd2";
    ctx.lineWidth = 5 / z;
    ctx.stroke();
    ctx.shadowBlur = 0;
    hexPath(ctx, x, y, r * 0.78, Math.PI / 6);
    ctx.strokeStyle = "rgba(125,249,255,0.55)";
    ctx.lineWidth = 2 / z;
    ctx.stroke();
    // dock zone
    ctx.setLineDash([
        18 / z,
        14 / z
    ]);
    ctx.lineDashOffset = -t * 30 / z;
    hexPath(ctx, x, y, dock, t * 0.15);
    ctx.strokeStyle = "rgba(255,225,77,0.85)";
    ctx.lineWidth = 3 / z;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    hexPath(ctx, x, y, dock * 0.55, -t * 0.3);
    ctx.strokeStyle = "rgba(255,225,77,0.4)";
    ctx.lineWidth = 2 / z;
    ctx.stroke();
    // pylons
    for(let i = 0; i < 6; i++){
        const a = Math.PI / 6 + i / 6 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"];
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        hexPath(ctx, px, py, 26, t * 0.4 * (i % 2 ? 1 : -1));
        ctx.fillStyle = "rgba(10,40,50,0.95)";
        ctx.fill();
        ctx.strokeStyle = "#7df9ff";
        ctx.lineWidth = 3 / z;
        ctx.stroke();
        hexPath(ctx, px, py, 10, 0);
        ctx.fillStyle = "#4dffd2";
        ctx.fill();
        // light spokes
        ctx.strokeStyle = "rgba(125,249,255,0.25)";
        ctx.lineWidth = 1.5 / z;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.fillStyle = "rgba(125,249,255,0.7)";
    ctx.font = `bold ${22 / z * Math.min(1, z * 1.3)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    if (z > 0.35) {
        ctx.fillText("HANGAR", x, y - 8);
        ctx.font = `${12}px ui-monospace, monospace`;
        ctx.fillStyle = "rgba(255,225,77,0.8)";
        ctx.fillText("drop components inside the yellow hex", x, y + 18);
    }
    void g;
}
function drawComp(g, ctx, c, z, t) {
    const col = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][c.c.tier].color;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + c.id);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.a);
    ctx.lineJoin = "round";
    polyPath(ctx, c.c.poly);
    ctx.fillStyle = col + "26";
    ctx.fill();
    // hatch
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = col + "55";
    ctx.lineWidth = 1 / z;
    ctx.beginPath();
    for(let d = -c.r * 2; d < c.r * 2; d += Math.max(6, c.r * 0.22)){
        ctx.moveTo(d, -c.r * 2);
        ctx.lineTo(d + c.r * 2, c.r * 2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.shadowColor = col;
    ctx.shadowBlur = 10 + 8 * pulse;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2 / z;
    polyPath(ctx, c.c.poly);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([
        5 / z,
        5 / z
    ]);
    ctx.save();
    ctx.scale(0.8, 0.8);
    polyPath(ctx, c.c.poly);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1 / z;
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.restore();
    // marker ring
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.25 + 0.25 * pulse;
    ctx.lineWidth = 1.5 / z;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 8 + pulse * 4, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (g.holdComp === c && g.input.rHold > 0) {
        ctx.strokeStyle = "#ff5d73";
        ctx.lineWidth = 4 / z;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r + 16, -Math.PI / 2, -Math.PI / 2 + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"] * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(g.input.rHold / 0.6, 0, 1));
        ctx.stroke();
    }
    if (c.stress > 0.05) {
        ctx.strokeStyle = `rgba(255,70,90,${0.4 + 0.5 * Math.sin(t * 30)})`;
        ctx.lineWidth = 3 / z;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r + 4, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"] * c.stress);
        ctx.stroke();
    }
}
function drawRope(g, ctx, h, z) {
    const n = h.nodes;
    let load = 0;
    if (h.comp) load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(h.comp.c.mass / (Math.max(1, h.comp.hooks.length) * g.stats.hStr), 0, 1.5);
    const heat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(Math.max(load > 0.7 ? (load - 0.7) / 0.6 : 0, h.comp ? h.comp.stress : 0) * (0.3 + 0.7 * h.taut), 0, 1);
    const r = Math.round(125 + 130 * heat), gg = Math.round(249 - 170 * heat), b = Math.round(255 - 150 * heat);
    const col = `rgb(${r},${gg},${b})`;
    const frac = h.hp / h.maxHp;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const draw = ()=>{
        ctx.beginPath();
        ctx.moveTo(n[0].x, n[0].y);
        for(let i = 1; i < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1; i++){
            const mx = (n[i].x + n[i + 1].x) / 2, my = (n[i].y + n[i + 1].y) / 2;
            ctx.quadraticCurveTo(n[i].x, n[i].y, mx, my);
        }
        ctx.lineTo(n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].x, n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].y);
    };
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = col;
    ctx.lineWidth = 7 / z + h.taut * 3;
    draw();
    ctx.stroke();
    ctx.globalAlpha = 0.5 + 0.5 * frac;
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.6 / z;
    draw();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1 / z;
    ctx.globalAlpha = 0.6;
    draw();
    ctx.stroke();
    ctx.globalAlpha = 1;
    // hook head
    const a = h.state === 2 && h.comp ? Math.atan2(n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].y - n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 3].y, n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].x - n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 3].x) : Math.atan2(n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].y - n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 2].y, n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 1].x - n[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["N_ROPE"] - 2].x);
    ctx.save();
    ctx.translate(h.hx, h.hy);
    ctx.rotate(h.state === 1 ? h.ang : a);
    ctx.fillStyle = "#e9ffff";
    ctx.strokeStyle = col;
    ctx.lineWidth = 2 / z;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-4, -8);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3, -9);
    ctx.lineTo(-9, -12);
    ctx.moveTo(-3, 9);
    ctx.lineTo(-9, 12);
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
}
function drawShipShape(ctx, color, alpha, z) {
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = "rgba(10,30,45,0.92)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 / Math.max(z, 0.6);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(-12, -13);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-3, -4);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}
function drawPlayer(g, ctx, z, t) {
    const p = g.player, st = g.stats;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 30) {
        const len = 8 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(sp / 40, 0, 20) * (p.boosting ? 2 : 1) + Math.random() * 4;
        ctx.fillStyle = p.boosting ? "rgba(255,170,60,0.9)" : "rgba(125,249,255,0.7)";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.lineTo(-8 - len, 0);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    drawShipShape(ctx, p.flash > 0 ? "#ff6b81" : "#7df9ff", 1, z);
    // turrets
    st.weapons.forEach((w, i)=>{
        const side = i === 1 ? -1 : 1;
        ctx.fillStyle = w.rid === "pulse" ? "#7dffb4" : w.rid === "missile" ? "#ffb04d" : w.rid === "lance" ? "#e5a8ff" : "#ff9d6e";
        ctx.beginPath();
        ctx.arc(2, 12 * side, 3.5, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.fill();
    });
    ctx.restore();
    if (st.shieldMax > 0 && p.shield > 0) {
        const f = p.shield / st.shieldMax;
        ctx.strokeStyle = `rgba(110,230,255,${0.2 + 0.5 * f})`;
        ctx.lineWidth = 2 / z;
        ctx.shadowColor = "#7df9ff";
        ctx.shadowBlur = 10;
        hexPath(ctx, p.x, p.y, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHIP_R"] + 14, t * 0.8);
        ctx.stroke();
        ctx.fillStyle = `rgba(110,230,255,${0.04 + 0.06 * f})`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    if (p.tpT > 0) {
        const f = 1 - p.tpT / Math.max(0.1, st.tpTime);
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 3 / z;
        ctx.shadowColor = "#c77dff";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 34 + 10 * Math.sin(t * 10), -Math.PI / 2, -Math.PI / 2 + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"] * f);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
function drawEnemy(g, ctx, e, z, t) {
    // telegraphs
    if (e.act && e.act.ph === 0 && e.act.t < e.act.def.wind + 0.01) {
        const d = e.act.def;
        const f = e.act.t / d.wind;
        if (d.type === "charge") {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.a);
            const len = Math.max(300, (d.speed ?? 600) * (d.dur ?? 0.5));
            ctx.fillStyle = `rgba(255,60,80,${0.07 + 0.12 * f})`;
            ctx.fillRect(0, -e.radius * 0.35, len, e.radius * 0.7);
            ctx.strokeStyle = `rgba(255,90,100,${0.4 + 0.4 * f})`;
            ctx.lineWidth = 2 / z;
            ctx.setLineDash([
                14 / z,
                10 / z
            ]);
            ctx.strokeRect(0, -e.radius * 0.35, len, e.radius * 0.7);
            ctx.setLineDash([]);
            ctx.restore();
        } else if (d.type === "ring" || d.type === "nova") {
            ctx.strokeStyle = `rgba(255,120,90,${0.25 + 0.5 * f})`;
            ctx.lineWidth = 4 / z;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius * (0.4 + 0.7 * f), 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
            ctx.stroke();
        }
    }
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.a);
    ctx.lineJoin = "round";
    const lw = 1.7 / z;
    const big = e.radius * z > 60;
    for (const idx of e.order){
        const p = e.parts[idx];
        if (!p.alive) continue;
        const gr = p.g >= 0 ? e.groups[p.g] : null;
        if (gr && gr.ang !== 0) {
            ctx.save();
            ctx.translate(gr.px, gr.py);
            ctx.rotate(gr.ang);
            ctx.translate(-gr.px, -gr.py);
        }
        polyPath(ctx, p.poly);
        const hf = p.hp / p.maxHp;
        const hurt = p.hurt > 0;
        ctx.globalAlpha = 0.62 + 0.38 * hf;
        ctx.fillStyle = hurt ? "rgba(255,255,255,0.85)" : p.fill;
        ctx.fill();
        if (p.glow) {
            ctx.shadowColor = p.stroke;
            ctx.shadowBlur = p.kind === "core" ? 22 : 12;
        } else if (big && p.r * z > 14) {
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = p.stroke;
            ctx.lineWidth = lw * 3.2;
            ctx.stroke();
            ctx.restore();
        }
        ctx.strokeStyle = hurt ? "#ffffff" : p.stroke;
        ctx.lineWidth = lw * (p.kind === "core" ? 1.6 : 1);
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (p.kind === "core") {
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.r * 0.35, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
            ctx.fill();
        }
        if (p.kind === "shield" || p.kind === "weapon") {
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = p.kind === "shield" ? "#7df9ff" : "#ff7a5c";
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.r * 0.25, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (gr && gr.ang !== 0) ctx.restore();
    }
    ctx.restore();
    // shields
    for (const s of e.shields){
        const p = s.part;
        const f = p.shieldHp / p.shieldMax;
        const hit = p.shieldHit > 2.8 ? 1 : 0;
        hexPath(ctx, s.x, s.y, s.r, t * 0.3);
        ctx.fillStyle = `rgba(70,210,255,${0.05 + 0.08 * f + hit * 0.12})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(125,240,255,${0.35 + 0.5 * f})`;
        ctx.lineWidth = (2 + hit * 3) / z;
        ctx.shadowColor = "#7df9ff";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
        hexPath(ctx, s.x, s.y, s.r * 0.92, -t * 0.3);
        ctx.strokeStyle = "rgba(125,240,255,0.18)";
        ctx.lineWidth = 1 / z;
        ctx.stroke();
    }
}
function drawBars(g, ctx, e, z) {
    const showMain = e.barT > 0 || e.aggro && e.dist < 1000;
    for (const p of e.parts){
        if (!p.alive || p.barT <= 0 || p.hp >= p.maxHp) continue;
        const [wx, wy] = pw(e, p);
        const bw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(p.r * 1.3, 24 / z, 90 / z), bh = 3.5 / z;
        const x = wx - bw / 2, y = wy - Math.min(p.r * 0.5, 14 / z) - 4 / z;
        const f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(p.hp / p.maxHp, 0, 1);
        ctx.globalAlpha = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(p.barT / 1.2, 0, 1);
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(x - 1 / z, y - 1 / z, bw + 2 / z, bh + 2 / z);
        ctx.fillStyle = p.kind === "core" ? "#ffffff" : p.kind === "armor" ? "#ffd24d" : f > 0.5 ? "#5dff9a" : f > 0.25 ? "#ffd24d" : "#ff5d73";
        ctx.fillRect(x, y, bw * f, bh);
    }
    ctx.globalAlpha = 1;
    if (showMain) {
        const integ = g.integrity(e);
        const bw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(e.radius * 1.5, 110 / z, 800 / z), bh = 8 / z;
        const x = e.x - bw / 2, y = e.y - e.radius - 30 / z;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x - 2 / z, y - 2 / z, bw + 4 / z, bh + 4 / z);
        const grd = ctx.createLinearGradient(x, 0, x + bw, 0);
        grd.addColorStop(0, "#ff3d73");
        grd.addColorStop(0.5, "#ffd24d");
        grd.addColorStop(1, "#4dffb4");
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = grd;
        ctx.fillRect(x, y, bw * integ, bh);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1 / z;
        ctx.strokeRect(x, y, bw, bh);
        if (e.mobility < 0.5) {
            ctx.fillStyle = "#ffb04d";
            ctx.font = `${11 / z}px ui-monospace, monospace`;
            ctx.textAlign = "center";
            ctx.fillText(e.mobility <= 0 ? "IMMOBILISED" : "CRIPPLED", e.x, y - 5 / z);
        }
    }
}
function drawMinimap(g, ctx) {
    const S = Math.min(170, g.w * 0.28);
    const cx = g.w - S / 2 - 14, cy = S / 2 + 14;
    const R = S / 2;
    const k = R / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"];
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
    ctx.clip();
    ctx.fillStyle = "rgba(4,8,20,0.8)";
    ctx.fillRect(cx - R, cy - R, S, S);
    const edges = [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_R"],
        ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZONE_EDGES"]
    ];
    for(let i = 0; i < edges.length; i++){
        ctx.fillStyle = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RARITIES"][i].color + "1c";
        ctx.beginPath();
        ctx.arc(cx, cy, edges[i] * k, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (const r of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ZONE_EDGES"]){
        ctx.beginPath();
        ctx.arc(cx, cy, r * k, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.stroke();
    }
    // enemies
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (const e of g.enemies)ctx.fillRect(cx + e.x * k - 0.8, cy + e.y * k - 0.8, 1.6, 1.6);
    // base
    hexPath(ctx, cx + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x * k, cy + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y * k, 4.5, 0);
    ctx.fillStyle = "#4dffd2";
    ctx.fill();
    // view box
    const vw = g.w / g.cam.z * k, vh = g.h / g.cam.z * k;
    ctx.strokeStyle = "rgba(125,249,255,0.5)";
    ctx.strokeRect(cx + g.cam.x * k - vw / 2, cy + g.cam.y * k - vh / 2, vw, vh);
    for (const o of g.others){
        ctx.fillStyle = "#ff7ad9";
        ctx.beginPath();
        ctx.arc(cx + o.x * k, cy + o.y * k, 2.5, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
        ctx.fill();
    }
    const p = g.player;
    ctx.save();
    ctx.translate(cx + p.x * k, cy + p.y * k);
    ctx.rotate(p.a);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3.5, -3.5);
    ctx.lineTo(-3.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = "rgba(125,249,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$math$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TAU"]);
    ctx.stroke();
}
function drawBaseArrow(g, ctx) {
    const p = g.player;
    const dx = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].x - p.x, dy = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BASE"].y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 1400 || p.dead) return;
    const a = Math.atan2(dy, dx);
    const rr = Math.min(g.w, g.h) / 2 - 46;
    const x = g.w / 2 + Math.cos(a) * rr, y = g.h / 2 + Math.sin(a) * rr;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = "rgba(77,255,210,0.85)";
    ctx.shadowColor = "#4dffd2";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(77,255,210,0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`BASE ${(d / 1000).toFixed(1)}k`, x - Math.cos(a) * 26, y - Math.sin(a) * 26 + 4);
}
}),
];})()

//# sourceMappingURL=src_037tbdgam9czk._.js.map