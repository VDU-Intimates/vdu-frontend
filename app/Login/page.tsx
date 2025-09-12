"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Email/password login via your JWT backend
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setMsg(null);

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Login failed");
      }

      const data: { token?: string; user?: unknown } = await res.json();

      // // Store JWT (optional: prefer httpOnly cookie on the server for production)
      if (data.token) localStorage.setItem("access_token", data.token);

      setMsg("Signed in successfully.");
      // router.push("/") // optional redirect
    } catch (err: unknown) {
      setMsg(getErrorMessage(err) || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  // Password reset (JWT backend endpoint)
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Could not send reset email.");
      }
      alert("Password reset instructions sent (check your email).");
    } catch (err: unknown) {
      alert(getErrorMessage(err) || "Could not send reset email.");
    }
  };

  return (
    <div>
      <NavBar />

      <div className="min-h-screen bg-gradient-to-br from-[#F3C86A]/20 via-[#AD7718]/10 to-[#2f432a]/10 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-black/5 shadow-xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur">
          {/* Left: form */}
          <div className="p-8 lg:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#2f432a] text-center">
              VDU INTIMATES
            </h1>
            <p className="text-center text-sm text-neutral-600 mt-2">
              Sign in to your account
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Email address
                </label>
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
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#AD7718] font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className={`w-full rounded-xl py-2.5 font-semibold transition ${
                  busy ? "bg-neutral-200 text-neutral-500 cursor-not-allowed" : "bg-[#2f432a] text-[#eadfcd] hover:opacity-90"
                }`}
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>

              {/* Social login removed (no Firebase). Keep the UI block if you want, but disabled: */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 px-3 text-neutral-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                  title="Google not configured (JWT auth in use)"
                >
                  {/* icon placeholder to keep layout identical */}
                  <span className="inline-block h-5 w-5 rounded-full bg-neutral-300" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="rounded-xl border border-neutral-300 bg-white py-2 font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                  title="Facebook not configured"
                >
                  <span className="inline-block h-5 w-5 rounded-full bg-neutral-300" />
                  <span>Facebook</span>
                </button>
              </div>

              {msg && <p className="text-center text-sm mt-2 text-neutral-700">{msg}</p>}

              <p className="text-sm text-center text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link href="/Register" className="text-[#AD7718] font-semibold hover:underline">
                  Register
                </Link>
              </p>
            </form>
          </div>

          {/* Right: image */}
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
              <p className="mt-1 text-sm text-white/85">
                Comfort-first lingerie &amp; loungewear for everyday confidence.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#F3C86A]" aria-hidden />
                New arrivals just dropped
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
