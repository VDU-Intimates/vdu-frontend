"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";
import toast from "react-hot-toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

const Register = () => {
  const [fName, setFirstName] = useState("");
  const [lName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmValid = confirm === password && confirm.length > 0;
  const passwordValid = password.length >= 10;
  const canSubmit =
    !!fName && !!lName && !!email && passwordValid && confirmValid;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setBusy(true);
      setMsg(null);

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fName,
          lName,
          email,
          password,
          address,
          contact,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Registration failed");
      }

      const data: { token?: string; user?: unknown } = await res.json();

      if (data.token) {
        localStorage.setItem("access_token", data.token);
      }

      toast.success("Account created successfully.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <NavBar />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-black/5 shadow-xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur">
          {/* Left: form */}
          <div className="p-8 lg:p-10 bg-gradient-to-br from-[#F3C86A]/20 via-[#AD7718]/10 to-[#2f432a]/10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#2f432a] text-center">
              VDU INTIMATES
            </h1>
            <p className="text-center text-sm text-neutral-600 mt-2">
              Create your account
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">First Name</label>
                  <input
                    placeholder="Jane"
                    value={fName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Last Name</label>
                  <input
                    placeholder="Doe"
                    value={lName}
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
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Telephone Number</label>
                <input
                  type="text"
                  placeholder="0777123456"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Address</label>
                <input
                  type="text"
                  placeholder="No. 42, Lake View Lane, Nugegoda, Colombo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-sm text-[#AD7718]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {!passwordValid && password.length > 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    Password must be at least 10 characters.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-type your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`mt-1 w-full rounded-xl border bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent ${
                      confirm && !confirmValid ? "border-red-300" : "border-neutral-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-sm text-[#AD7718]"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
                {!confirmValid && confirm.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit || busy}
                className={`w-full rounded-xl py-2.5 font-semibold transition ${
                  canSubmit && !busy
                    ? "bg-[#2f432a] text-[#eadfcd] hover:opacity-90"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {busy ? "Creating..." : "Create account"}
              </button>

              {msg && <p className="text-center text-sm mt-2 text-neutral-700">{msg}</p>}

              <p className="text-sm text-center text-neutral-600">
                Already have an account?{" "}
                <Link href="/Login" className="text-[#AD7718] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          {/* Right: image */}
          <div className="relative lg:border-l border-black/5 min-h-[420px] lg:min-h-[560px]">
            <Image
              src="/assets/images/model2.jpg"
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

export default Register;
