"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, googleProvider, facebookProvider } from "../../lib/firebaseClient";
import type { AuthProvider, UserCredential } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const USERS_KEY = "vdu_users";
const CURRENT_KEY = "vdu_current_user";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function saveCurrentId(id: string | null) {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

const strongPassword = (pwd: string) => {
  if (!pwd) return false;
  if (pwd.length < 8 || pwd.length > 12) return false;
  if (!/^[A-Z]/.test(pwd)) return false;
  if (!/[0-9]/.test(pwd)) return false;
  if (!/[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/.test(pwd)) return false;
  return true;
};

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => { setUsers(loadUsers()); }, []);

  const passwordValid = strongPassword(password);
  const confirmValid = confirm === password && confirm.length > 0;
  const canSubmit = firstName && lastName && email && passwordValid && confirmValid;

  // CREATE: persist a new user into localStorage and set current id
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return;
    const newUser: User = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      firstName,
      lastName,
      email,
      password,
    };
    const next = [...users, newUser];
    saveUsers(next);
    setUsers(next);
    setCurrentUser(newUser);
    saveCurrentId(newUser.id);
  };

  // READ: refresh local state from localStorage
  const handleReadState = () => {
    setUsers(loadUsers());
  };

  // UPDATE: update current user's names and/or password, then persist
  const handleUpdateAccount = () => {
    if (!currentUser) return;
    const full = prompt("Enter new name (First Last)", `${currentUser.firstName} ${currentUser.lastName}`)?.trim();
    if (!full) return;
    const [fn, ...rest] = full.split(" ");
    const ln = rest.join(" ");
    const updated: User = { ...currentUser, firstName: fn || currentUser.firstName, lastName: ln || currentUser.lastName };
    const next = users.map((u) => (u.id === updated.id ? updated : u));
    saveUsers(next);
    setUsers(next);
    setCurrentUser(updated);
  };

  // DELETE: remove current user's account and clear current id
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const next = users.filter((u) => u.id !== currentUser.id);
    saveUsers(next);
    setUsers(next);
    setCurrentUser(null);
    saveCurrentId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const persistOAuthUser = (cred: UserCredential) => {
    const f = cred.user;
    const display = f.displayName?.trim() ?? "";
    const [fn, ln] = display ? display.split(" ", 2) : [f.email?.split("@")[0] || "User", ""];
    const merged: User = {
      id: f.uid,
      firstName: fn,
      lastName: ln,
      email: f.email || "",
      password: "",
    };
    const exists = users.find((u) => u.id === merged.id || u.email === merged.email);
    const next = exists ? users.map((u) => (u.id === (exists.id) ? { ...u, ...merged } : u)) : [...users, merged];
    saveUsers(next);
    setUsers(next);
    setCurrentUser(merged);
    saveCurrentId(merged.id);
  };

  const handleProvider = async (provider: AuthProvider) => {
    const { setPersistence, browserLocalPersistence, signInWithPopup, signInWithRedirect, getRedirectResult } =
      await import("firebase/auth");
    await setPersistence(auth, browserLocalPersistence);
    try {
      const cred = await signInWithPopup(auth, provider);
      persistOAuthUser(cred);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
        const result = await getRedirectResult(auth).catch(() => null);
        if (result) persistOAuthUser(result);
      } else {
        alert(err?.message || "OAuth error.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3C86A]/20 via-[#AD7718]/10 to-[#2f432a]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-black/5 shadow-xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur">
        <div className="p-8 lg:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2f432a] text-center">VDU INTIMATES</h1>
          <p className="text-center text-sm text-neutral-600 mt-2">Create your account</p>

          {!currentUser ? (
            <form className="mt-8 space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">First Name</label>
                  <input
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Last Name</label>
                  <input
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Email address</label>
                <input
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent ${
                    email && users.some((u) => u.email.toLowerCase() === email.toLowerCase())
                      ? "border-red-300"
                      : "border-neutral-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  placeholder="8–12, Capital start, number & special"
                  minLength={8}
                  maxLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent ${
                    password && !passwordValid ? "border-red-300" : "border-neutral-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Confirm password</label>
                <input
                  type="password"
                  placeholder="Re-type your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent ${
                    confirm && !confirmValid ? "border-red-300" : "border-neutral-300"
                  }`}
                />
              </div>

              <div className="relative group">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full rounded-xl py-2.5 font-semibold transition ${
                    canSubmit ? "bg-[#2f432a] text-[#eadfcd] hover:opacity-90" : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Create account
                </button>
                {!canSubmit && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                    {(!passwordValid && "Password: 8–12, Capital start, number & special") ||
                      (!confirmValid && "Passwords do not match") ||
                      "Fill all fields correctly"}
                  </div>
                )}
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 px-3 text-neutral-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProvider(googleProvider)}
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium hover:bg-neutral-50 flex items-center justify-center gap-2"
                >
                  <FcGoogle size={20} /><span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProvider(facebookProvider)}
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium hover:bg-neutral-50 flex items-center justify-center gap-2"
                >
                  <FaFacebook size={20} className="text-[#1877F2]" /><span>Facebook</span>
                </button>
              </div>

              <p className="text-sm text-center text-neutral-600">
                Already have an account?{" "}
                <Link href="/Login" className="text-[#AD7718] font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="text-sm text-neutral-700">
                  Account created for <span className="font-semibold">{currentUser.firstName} {currentUser.lastName}</span> (<span className="font-semibold">{currentUser.email}</span>)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleUpdateAccount} className="rounded-xl bg-white border border-neutral-300 py-2 font-medium hover:bg-neutral-50">
                  Update account
                </button>
                <button onClick={handleDeleteAccount} className="rounded-xl bg-white border border-red-300 text-red-600 py-2 font-semibold hover:bg-red-50">
                  Delete account
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleReadState} className="rounded-xl bg-white border border-neutral-300 py-2 font-medium hover:bg-neutral-50">
                  Refresh users
                </button>
                <Link href="/Login" className="text-center rounded-xl bg-[#2f432a] text-[#eadfcd] py-2.5 font-semibold hover:opacity-90 transition">
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative lg:border-l border-black/5 min-h-[420px] lg:min-h-[560px]">
          <Image
            src="/assets/model2.jpg"
            alt="Model wearing intimates"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-2xl font-bold">Welcome to VDU Intimates</h2>
            <p className="mt-1 text-sm text-white/85">Comfort-first lingerie &amp; loungewear for everyday confidence.</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#F3C86A]" aria-hidden />
              New arrivals just dropped
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;