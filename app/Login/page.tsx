"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";
import toast from "react-hot-toast";

type ApiUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  address?: string | null;
  contact?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 15;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

const Login: React.FC = () => {
  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Admin OTP flow states
  const [adminNeedsOtp, setAdminNeedsOtp] = useState(false);
  const [identifier, setIdentifier] = useState(""); // email shown in OTP card
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Cooldown: precise single-interval approach
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const cooldownEndRef = useRef<number | null>(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      cooldownEndRef.current = null;
    };
  }, []);

  const startCooldown = (seconds: number) => {
    // clear existing
    if (cooldownTimerRef.current) {
      window.clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    const end = Date.now() + seconds * 1000;
    cooldownEndRef.current = end;
    // set initial visible value
    setCooldown(Math.ceil((end - Date.now()) / 1000));

    // update frequent enough to avoid rounding issues
    cooldownTimerRef.current = window.setInterval(() => {
      if (!cooldownEndRef.current) {
        setCooldown(0);
        if (cooldownTimerRef.current) {
          window.clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
        return;
      }
      const remaining = Math.max(0, Math.ceil((cooldownEndRef.current - Date.now()) / 1000));
      setCooldown(remaining);
      if (remaining <= 0) {
        if (cooldownTimerRef.current) {
          window.clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
        cooldownEndRef.current = null;
      }
    }, 300);
  };

  // Focus first OTP input when OTP UI shown
  useEffect(() => {
    if (adminNeedsOtp) {
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [adminNeedsOtp]);

  // Login submit
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

      const data: { token?: string; user?: ApiUser } = await res.json();

      // If admin, show OTP UI (do NOT store token yet)
      if (data.user?.role === "Admin") {
        setAdminNeedsOtp(true);
        setIdentifier(data.user.email);
        setDigits(Array(OTP_LENGTH).fill(""));
        setOtpMessage("OTP sent to admin email. Enter it above.");
        startCooldown(RESEND_COOLDOWN); // start resend cooldown (server already issued in your controller on login)
        return;
      }

      // Non-admin: store token & proceed
      if (data.token) localStorage.setItem("access_token", data.token);
      window.location.assign("/");
      toast.success("Signed in successfully.");
    } catch (err: unknown) {
      setMsg(getErrorMessage(err) || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  // OTP handlers
  const onChangeDigit = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const v = value.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const key = e.key;
    if (key === "Backspace") {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    } else if (key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("Text").trim();
    if (!/^[0-9]+$/.test(paste)) return;
    const slice = paste.slice(0, OTP_LENGTH).split("");
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < slice.length; i++) next[i] = slice[i];
    setDigits(next);
    const lastFilled = Math.min(slice.length, OTP_LENGTH) - 1;
    const focusIndex = Math.min(OTP_LENGTH - 1, lastFilled + 1);
    setTimeout(() => inputsRef.current[focusIndex]?.focus(), 10);
  };

  const verifyOtp = async () => {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpMessage("Please enter the full OTP.");
      return;
    }
    try {
      setOtpBusy(true);
      setOtpMessage(null);
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, otp: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "OTP verification failed.");

      // success: server should return token + user
      if (json.token) localStorage.setItem("access_token", json.token);
      toast.success("OTP verified - Signed in successfully.");
      // redirect to admin-dashboard
      window.location.assign("/Dashboard");
    } catch (err: unknown) {
      setOtpMessage(getErrorMessage(err) || "Verification failed.");
    } finally {
      setOtpBusy(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      startCooldown(RESEND_COOLDOWN);
      setOtpMessage(null);
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Could not resend OTP.");
      }
      setOtpMessage("OTP resent. Check your email.");
      startCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err: unknown) {
      setOtpMessage(getErrorMessage(err) || "Could not resend OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  // Render: if adminNeedsOtp is true show OTP card, else show login form.
  return (
    <div>
      <NavBar />

      <div
        className="min-h-screen bg-gradient-to-br from-[#F3C86A]/20 via-[#AD7718]/10 to-[#2f432a]/10
                   flex items-center justify-center p-4"
      >
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-black/5 shadow-xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur">
          {/* Left: either login form or OTP card (ternary) */}
          <div className="p-8 lg:p-10">
            {!adminNeedsOtp ? (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#2f432a] text-center">
                  VDU INTIMATES
                </h1>
                <p className="text-center text-sm text-neutral-600 mt-2">Sign in to your account</p>

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
                        onClick={async () => {
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
                        }}
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
                      className="rounded-xl border border-neutral-300 bg-white py-2 font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                      title="Google not configured (JWT auth in use)"
                    >
                      <span className="inline-block h-5 w-5 rounded-full">
                        <Image src="/assets/images/google-icon.png" alt="Google Icon" width={24} height={24}/>
                      </span>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-neutral-300 bg-white py-2 font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                      title="Facebook not configured"
                    >
                      <span className="inline-block h-5 w-5 rounded-full bg-neutral-300" >
                        <Image src="/assets/images/facebook-icon.png" alt="Google Icon" width={24} height={24}/>
                      </span>
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
              </>
            ) : (
              // OTP Verification card
              <div>
                <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
                  <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Image src="/assets/images/OTP.png" alt="OTP Image" width={130} height={130} />

                      <h2 className="text-xl font-semibold">Verify OTP</h2>
                      <p className="text-sm text-gray-500 text-center">Enter the 6-digit code sent to {identifier}</p>

                      <div className="mt-3 flex gap-3">
                        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              // callback returns void (no implicit return) to satisfy TS
                              inputsRef.current[i] = el;
                            }}
                            value={digits[i]}
                            onChange={(e) => onChangeDigit(i, e.target.value)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            onPaste={onPaste}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            className={`w-12 h-12 text-center rounded-lg border-2 text-lg font-medium focus:outline-beige focus:ring-0 ${
                              digits[i] ? "border-green-400" : "border-dark-green"
                            }`}
                            aria-label={`OTP digit ${i + 1}`}
                          />
                        ))}
                      </div>

                      <div className="text-sm text-gray-500 mt-2">
                        Didn&apos;t receive code?{" "}
                        <button
                          onClick={onResend}
                          disabled={cooldown > 0 || otpBusy}
                          className={`font-medium text-blue-600 disabled:opacity-50 ${cooldown > 0 ? "pointer-events-none" : " cursor-pointer"}`}
                        >
                          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                        </button>
                      </div>

                      <button
                        onClick={verifyOtp}
                        disabled={otpBusy}
                        className="mt-4 w-full rounded-lg py-3 bg-[#2f432a] text-[#eadfcd] hover:opacity-90 cursor-pointer font-medium disabled:opacity-60"
                      >
                        {otpBusy ? "Verifying..." : "Verify OTP"}
                      </button>

                      {otpMessage && <div className="text-sm text-gray-700 mt-3">{otpMessage}</div>}

                      <div className="mt-4 w-full text-xs text-gray-400 text-center">
                        Note: API endpoints <code>/api/auth/request-otp</code> and <code>/api/auth/verify-otp</code> expected.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: image (unchanged) */}
          <div className="relative lg:border-l border-black/5 min-h-[420px] lg:min-h-[560px]">
            <Image src="/assets/images/model1.jpg" alt="Model wearing intimates" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
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

      <Footer />
    </div>
  );
};

export default Login;
