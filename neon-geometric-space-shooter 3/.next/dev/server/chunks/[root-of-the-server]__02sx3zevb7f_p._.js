module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/app/api/presence/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
const dynamic = "force-dynamic";
const g = globalThis;
const pilots = g.__neonPilots ??= new Map();
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const TTL = 6000;
const VIEW = 4200;
async function POST(req) {
    try {
        const b = await req.json();
        if (!b.id || !ID_RE.test(b.id)) return Response.json({
            players: [],
            online: 1
        }, {
            status: 400
        });
        const now = Date.now();
        const x = Number(b.x) || 0;
        const y = Number(b.y) || 0;
        if (b.dead) pilots.delete(b.id);
        else pilots.set(b.id, {
            id: b.id,
            name: String(b.name ?? "Pilot").slice(0, 16),
            x,
            y,
            a: Number(b.a) || 0,
            seen: now
        });
        for (const [k, p] of pilots)if (now - p.seen > TTL) pilots.delete(k);
        const players = [
            ...pilots.values()
        ].filter((p)=>p.id !== b.id && Math.hypot(p.x - x, p.y - y) < VIEW).slice(0, 30).map(({ id, name, x: px, y: py, a })=>({
                id,
                name,
                x: px,
                y: py,
                a
            }));
        return Response.json({
            players,
            online: pilots.size + (b.dead ? 1 : 0)
        });
    } catch  {
        return Response.json({
            players: [],
            online: 1
        }, {
            status: 400
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02sx3zevb7f_p._.js.map