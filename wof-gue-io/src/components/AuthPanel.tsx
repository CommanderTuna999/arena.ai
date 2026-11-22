"use client";

import { useEffect, useRef, useState } from "react";
import {
  adoptGuestSave, authMessage, cloudAccounts, register, signIn,
  type AuthResult, type Session,
} from "@/game/accounts";

/** Username + password. One form, two verbs, no ceremony. */
export default function AuthPanel({ onDone }: { onDone: (session: Session) => void }) {
  const [mode, setMode] = useState<"login" | "create">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cloud, setCloud] = useState<boolean | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void cloudAccounts().then((c) => { if (alive) setCloud(c); });
    nameRef.current?.focus();
    return () => { alive = false; };
  }, []);

  const submit = async () => {
    if (busy) return;
    setErr("");
    setBusy(true);
    const res: AuthResult = mode === "create" ? await register(name, password) : await signIn(name, password);
    setBusy(false);
    if (!res.ok) { setErr(authMessage(res.error)); return; }
    adoptGuestSave(res.session);
    onDone(res.session);
  };

  const field = "h-11 w-full rounded-sm border border-white/20 bg-black/50 px-3 text-[15px] tracking-[0.12em] text-cyan-50 outline-none transition placeholder:tracking-[0.16em] placeholder:text-white/25 focus:border-cyan-300";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["login", "create"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setErr(""); }}
            className={`flex-1 rounded-sm border px-3 py-2 text-[11px] font-black tracking-[0.22em] transition ${
              mode === m
                ? "border-cyan-300 bg-cyan-400/15 text-white shadow-[0_0_18px_rgba(77,255,210,0.25)]"
                : "border-white/15 bg-black/40 text-white/45 hover:border-cyan-300/50 hover:text-cyan-200"
            }`}
          >
            {m === "login" ? "LOG IN" : "CREATE ACCOUNT"}
          </button>
        ))}
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.28em] text-cyan-200/70">USERNAME</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setErr(""); }}
            maxLength={16}
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="pilot"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.28em] text-cyan-200/70">PASSWORD</span>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErr(""); }}
            maxLength={128}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            placeholder="••••••"
            className={field}
          />
        </label>

        {err && <div className="text-[11px] text-red-300">{err}</div>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-12 w-full rounded-sm border-2 border-cyan-300 bg-cyan-400/15 text-sm font-black tracking-[0.4em] text-white shadow-[0_0_26px_rgba(77,255,210,0.28)] transition hover:bg-cyan-400/30 active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "…" : mode === "login" ? "LOG IN" : "CREATE"}
        </button>
      </form>

      <p className="text-center text-[10px] leading-relaxed tracking-[0.14em] text-white/35">
        {cloud === null
          ? "CHECKING…"
          : cloud
            ? "ACCOUNT STORED ON THE SERVER · PLAYS ANYWHERE"
            : "ACCOUNT STORED IN THIS BROWSER · PASSWORDS HASHED"}
      </p>
    </div>
  );
}
