"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  sendPasswordResetEmail,
  AuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../lib/firebaseClient";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password?: string;
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

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const list = loadUsers();
    setUsers(list);
    getRedirectResult(auth).then((cred) => {
      if (cred?.user) {
        const f = cred.user;
        const merged: User = {
          id: f.uid,
          firstName: f.displayName?.split(" ")[0] || f.email?.split("@")[0] || "User",
          lastName: f.displayName?.split(" ").slice(1).join(" ") || "",
          email: f.email || "",
          password: "",
        };
        const exists = list.find((u) => u.id === merged.id || u.email === merged.email);
        const next = exists
          ? list.map((u) => (u.id === (exists.id) ? { ...u, ...merged } : u))
          : [...list, merged];
        saveUsers(next);
        setUsers(next);
        setCurrentUser(merged);
        saveCurrentId(merged.id);
      }
    }).catch(() => {});
  }, []);

  // CREATE: create a new user in localStorage on first social login or form sign-up elsewhere, then persist current id
  const createIfMissing = (u: User) => {
    const exists = users.some((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase());
    const next = exists ? users.map((x) => (x.id === u.id ? u : x)) : [...users, u];
    saveUsers(next);
    setUsers(next);
    setCurrentUser(u);
    saveCurrentId(u.id);
  };

  // READ: authenticate against localStorage for email/password and set current id
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (found) {
      setCurrentUser(found);
      saveCurrentId(found.id);
    } else {
      alert("Invalid credentials.");
    }
  };

  // UPDATE: update current user's first/last name via prompt and persist to localStorage
  const handleUpdateAccount = () => {
    if (!currentUser) return;
    const full = prompt("Enter new name (First Last)", `${currentUser.firstName || ""} ${currentUser.lastName || ""}`)?.trim();
    if (!full) return;
    const [fn, ...rest] = full.split(" ");
    const ln = rest.join(" ");
    const updated: User = { ...currentUser, firstName: fn || currentUser.firstName, lastName: ln || currentUser.lastName };
    const next = users.map((u) => (u.id === updated.id ? updated : u));
    saveUsers(next);
    setUsers(next);
    setCurrentUser(updated);
  };

  // DELETE: remove current user's account from localStorage and clear current id
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    const next = users.filter((u) => u.id !== currentUser.id);
    saveUsers(next);
    setUsers(next);
    setCurrentUser(null);
    saveCurrentId(null);
    setEmail("");
    setPassword("");
  };

  const handleForgotPasswordEmail = async () => {
    const emailToReset = prompt("Enter your email for reset via email");
    if (!emailToReset) return;
    try {
      await sendPasswordResetEmail(auth, emailToReset.trim());
      alert("Password reset email sent.");
    } catch (err: any) {
      alert(err?.message || "Could not send reset email.");
    }
  };

  const handleForgotPasswordLocal = () => {
    const emailToReset = prompt("Enter your email to reset locally");
    if (!emailToReset) return;
    const i = users.findIndex((u) => u.email.toLowerCase() === emailToReset.toLowerCase());
    if (i === -1) {
      alert("No account with that email.");
      return;
    }
    const nextPass = prompt("Enter a new password (8–12 chars)") || "";
    if (nextPass.length < 8 || nextPass.length > 12) {
      alert("Password length must be 8–12.");
      return;
    }
    const next = users.slice();
    next[i] = { ...next[i], password: nextPass };
    saveUsers(next);
    setUsers(next);
    alert("Password updated. Please sign in.");
  };

  const persistOAuthUser = (cred: any) => {
    const f = cred.user;
    const merged: User = {
      id: f.uid,
      firstName: f.displayName?.split(" ")[0] || f.email?.split("@")[0] || "User",
      lastName: f.displayName?.split(" ").slice(1).join(" ") || "",
      email: f.email || "",
      password: "",
    };
    createIfMissing(merged);
  };

  const handleProvider = async (provider: AuthProvider) => {
    await setPersistence(auth, browserLocalPersistence);
    try {
      const cred = await signInWithPopup(auth, provider);
      persistOAuthUser(cred);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else if (err?.code === "auth/unauthorized-domain") {
        alert("Unauthorized domain. Add localhost in Firebase Auth → Settings → Authorized domains.");
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
          <p className="text-center text-sm text-neutral-600 mt-2">
            {currentUser ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() : "Sign in to your account"}
          </p>

          {!currentUser ? (
            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
                <div className="mt-2 flex justify-end gap-4">
                  <button type="button" onClick={handleForgotPasswordLocal} className="text-sm text-[#AD7718] font-semibold hover:underline">
                    Reset (local)
                  </button>
                  <button type="button" onClick={handleForgotPasswordEmail} className="text-sm text-[#AD7718] font-semibold hover:underline">
                    Reset via email
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-[#2f432a] text-[#eadfcd] py-2.5 font-semibold hover:opacity-90 transition">
                Sign in
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 px-3 text-neutral-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-label="Continue with Google"
                  onClick={() => handleProvider(googleProvider)}
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium hover:bg-neutral-50 flex items-center justify-center gap-2"
                >
                  <FcGoogle size={20} /><span>Google</span>
                </button>
                <button
                  type="button"
                  aria-label="Continue with Facebook"
                  onClick={() => handleProvider(facebookProvider)}
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium hover:bg-neutral-50 flex items-center justify-center gap-2"
                >
                  <FaFacebook size={20} className="text-[#1877F2]" /><span>Facebook</span>
                </button>
              </div>

              <p className="text-sm text-center text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link href="/Register" className="text-[#AD7718] font-semibold hover:underline">Register</Link>
              </p>
            </form>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="text-sm text-neutral-700">
                  Signed in as <span className="font-semibold">{currentUser.email}</span>
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  Display name: <span className="font-medium">{`${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()}</span>
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
              <button
                onClick={() => { setCurrentUser(null); saveCurrentId(null); }}
                className="w-full rounded-xl bg-[#2f432a] text-[#eadfcd] py-2.5 font-semibold hover:opacity-90 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="relative lg:border-l border-black/5 min-h-[420px] lg:min-h-[560px]">
          <Image
            src="/assets/images/model1.jpg"
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

export default Login;