// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import NavBar from "../components/nav-bar/nav-bar";
// import Footer from "../components/footer/footer";
// import toast from "react-hot-toast";

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

// function getErrorMessage(err: unknown): string {
//   if (err instanceof Error) return err.message;
//   if (typeof err === "object" && err && "message" in err) {
//     return String((err as { message?: unknown }).message);
//   }
//   return "Something went wrong.";
// }

// const Register = () => {
//   const [fName, setFirstName] = useState("");
//   const [lName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [contact, setContact] = useState("");
//   const [address, setAddress] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [msg, setMsg] = useState<string | null>(null);

//   // show/hide password
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   // === REMEDIATION: Password policy helpers (client-side) ===
//   const PW_MIN_LEN = 12;

//   const hasUpper = (s: string) => /[A-Z]/.test(s);
//   const hasLower = (s: string) => /[a-z]/.test(s);
//   const hasDigit = (s: string) => /\d/.test(s);
//   const hasSymbol = (s: string) => /[^A-Za-z0-9\s]/.test(s);

//   function getUnmetRules(
//     pw: string,
//     ctx: { email: string; fName: string; lName: string }
//   ): string[] {
//     const issues: string[] = [];
//     const emailLocal = (ctx.email || "").split("@")[0]?.toLowerCase();
//     const fullNameBits = [ctx.fName || "", ctx.lName || ""]
//       .filter(Boolean)
//       .map((x) => x.toLowerCase());

//     // Length rule (prefer longer passphrases)
//     if (pw.length < PW_MIN_LEN) {
//       issues.push(`Minimum length is ${PW_MIN_LEN} characters`);
//     }

//     // Composition rule: at least 3 of 4 classes OR passphrase (>=16 chars incl. spaces)
//     const classes = [hasUpper(pw), hasLower(pw), hasDigit(pw), hasSymbol(pw)].filter(Boolean)
//       .length;
//     const passphraseOK = pw.length >= 16 && /\s/.test(pw);
//     if (!(classes >= 3 || passphraseOK)) {
//       issues.push("Use 3 of 4: uppercase, lowercase, number, symbol (or a 16+ char passphrase)");
//     }

//     // Don’t allow username/name fragments
//     const lowerPw = pw.toLowerCase();
//     if (emailLocal && emailLocal.length >= 3 && lowerPw.includes(emailLocal)) {
//       issues.push("Password must not contain your email/username");
//     }
//     for (const bit of fullNameBits) {
//       if (bit && bit.length >= 3 && lowerPw.includes(bit)) {
//         issues.push("Password must not contain your name");
//         break;
//       }
//     }
//     return issues;
//   }

//   async function cryptoSHA1Hex(input: string): Promise<string> {
//     // Web Crypto for SHA-1 (acceptable here for HIBP prefix-ranged lookups)
//     const enc = new TextEncoder().encode(input);
//     const buf = await crypto.subtle.digest("SHA-1", enc);
//     const bytes = Array.from(new Uint8Array(buf));
//     return bytes.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
//   }

//   async function isBreachedPassword(pw: string): Promise<boolean> {
//     try {
//       const sha1 = await cryptoSHA1Hex(pw);
//       const prefix = sha1.slice(0, 5);
//       const suffix = sha1.slice(5).toUpperCase();
//       const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
//       const text = await resp.text();
//       // Each line: HASH_SUFFIX:COUNT
//       return text.split("\n").some((line) => line.split(":")[0] === suffix);
//     } catch {
//       // fail-open on network issues for UX; server must enforce in real remediation
//       return false;
//     }
//   }

//   const [pwUnmet, setPwUnmet] = useState<string[]>([]);
//   const [pwBreached, setPwBreached] = useState<boolean>(false);

//   // Live feedback (debounced by keystrokes)
//   useEffect(() => {
//     let active = true;
//     (async () => {
//       const unmet = getUnmetRules(password, { email, fName, lName });
//       let breached = false;
//       if (password && unmet.length === 0) {
//         breached = await isBreachedPassword(password);
//       }
//       if (active) {
//         setPwUnmet(unmet);
//         setPwBreached(breached);
//       }
//     })();
//     return () => {
//       active = false;
//     };
//   }, [password, email, fName, lName]);
//   // === REMEDIATION: end helpers ===

//   const confirmValid = confirm === password && confirm.length > 0;

//   // For button enablement, use a synchronous approximation (server/submit guard is authoritative)
//   const localUnmet = useMemo(
//     () => getUnmetRules(password, { email, fName, lName }),
//     [password, email, fName, lName]
//   );
//   const strongEnoughLocally = localUnmet.length === 0;
//   const canSubmit = !!fName && !!lName && !!email && confirmValid && strongEnoughLocally;

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // === REMEDIATION: enforce stronger password policy before submitting ===
//     {
//       const unmet = getUnmetRules(password, { email, fName, lName });
//       if (unmet.length > 0) {
//         toast.error(`Weak password: ${unmet[0]}`);
//         return;
//       }
//       const breached = await isBreachedPassword(password);
//       if (breached) {
//         toast.error("This password appears in known breach lists. Please choose a different one.");
//         return;
//       }
//     }
//     // === REMEDIATION: end guard ===

//     try {
//       setBusy(true);
//       setMsg(null);

//       const res = await fetch(`${API_BASE}/api/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           fName,
//           lName,
//           email,
//           password,
//           address,
//           contact,
//         }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         throw new Error(data?.message || "Registration failed");
//       }

//       const data: { token?: string; user?: unknown } = await res.json();

//       if (data.token) {
//         localStorage.setItem("access_token", data.token);
//       }

//       toast.success("Account created successfully.");
//       window.location.assign("/");
//     } catch (err: unknown) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div>
//       <NavBar />

//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-black/5 shadow-xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur">
//           {/* Left: form */}
//           <div className="p-8 lg:p-10 bg-gradient-to-br from-[#F3C86A]/20 via-[#AD7718]/10 to-[#2f432a]/10">
//             <h1 className="text-3xl font-extrabold tracking-tight text-[#2f432a] text-center">
//               VDU INTIMATES
//             </h1>
//             <p className="text-center text-sm text-neutral-600 mt-2">Create your account</p>

//             <form className="mt-8 space-y-4" onSubmit={handleRegister}>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-neutral-700">First Name</label>
//                   <input
//                     placeholder="Jane"
//                     value={fName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-neutral-700">Last Name</label>
//                   <input
//                     placeholder="Doe"
//                     value={lName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-neutral-700">Email address</label>
//                 <input
//                   type="email"
//                   placeholder="jane@company.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-neutral-700">Telephone Number</label>
//                 <input
//                   type="text"
//                   placeholder="0777123456"
//                   value={contact}
//                   onChange={(e) => setContact(e.target.value)}
//                   className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-neutral-700">Address</label>
//                 <input
//                   type="text"
//                   placeholder="No. 42, Lake View Lane, Nugegoda, Colombo"
//                   value={address}
//                   onChange={(e) => setAddress(e.target.value)}
//                   className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-neutral-700">Password</label>

//                 <div className="relative">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-3 text-sm text-[#AD7718]"
//                   >
//                     {showPassword ? "Hide" : "Show"}
//                   </button>
//                 </div>

//                 {/* === REMEDIATION: live password policy feedback === */}
//                 {password.length > 0 && (
//                   <div className="mt-2 space-y-1">
//                     {/* simple strength bar */}
//                     <div className="h-1 w-full bg-neutral-200 rounded">
//                       <div
//                         className={`h-1 rounded transition-all duration-300 ${
//                           pwUnmet.length === 0
//                             ? "w-full bg-green-600"
//                             : pwUnmet.length === 1
//                               ? "w-3/4 bg-yellow-500"
//                               : "w-1/3 bg-red-500"
//                         }`}
//                       />
//                     </div>

//                     <ul className="text-xs text-neutral-700 list-disc pl-5">
//                       {pwUnmet.map((msg) => (
//                         <li key={msg}>{msg}</li>
//                       ))}
//                       {pwBreached && (
//                         <li className="text-red-600">This password is known from data breaches.</li>
//                       )}
//                       {!pwBreached && pwUnmet.length === 0 && (
//                         <li className="text-green-700">Looks strong. Great choice!</li>
//                       )}
//                       <li className="text-neutral-500">
//                         Tip: Long passphrases (e.g., “two mangoes dance daily”) are easy to remember and strong.
//                       </li>
//                     </ul>
//                   </div>
//                 )}
//                 {/* === REMEDIATION: end feedback === */}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-neutral-700">Confirm password</label>

//                 <div className="relative">
//                   <input
//                     type={showConfirm ? "text" : "password"}
//                     placeholder="Re-type your password"
//                     value={confirm}
//                     onChange={(e) => setConfirm(e.target.value)}
//                     className={`mt-1 w-full rounded-xl border bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent ${
//                       confirm && !confirmValid ? "border-red-300" : "border-neutral-300"
//                     }`}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirm(!showConfirm)}
//                     className="absolute right-3 top-3 text-sm text-[#AD7718]"
//                   >
//                     {showConfirm ? "Hide" : "Show"}
//                   </button>
//                 </div>

//                 {!confirmValid && confirm.length > 0 && (
//                   <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 disabled={!canSubmit || busy}
//                 className={`w-full rounded-xl py-2.5 font-semibold transition ${
//                   canSubmit && !busy
//                     ? "bg-[#2f432a] text-[#eadfcd] hover:opacity-90"
//                     : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
//                 }`}
//               >
//                 {busy ? "Creating..." : "Create account"}
//               </button>

//               {msg && <p className="text-center text-sm mt-2 text-neutral-700">{msg}</p>}

//               <p className="text-sm text-center text-neutral-600">
//                 Already have an account?{" "}
//                 <Link href="/Login" className="text-[#AD7718] font-semibold hover:underline">
//                   Sign in
//                 </Link>
//               </p>
//             </form>
//           </div>

//           {/* Right: image */}
//           <div className="relative lg:border-l border-black/5 min-h-[420px] lg:min-h-[560px]">
//             <Image
//               src="/assets/images/model2.jpg"
//               alt="Model wearing intimates"
//               fill
//               priority
//               className="object-cover"
//               sizes="(max-width: 1024px) 100vw, 50vw"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
//             <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
//               <h2 className="text-2xl font-bold">Welcome to VDU Intimates</h2>
//               <p className="mt-1 text-sm text-white/85">
//                 Comfort-first lingerie &amp; loungewear for everyday confidence.
//               </p>
//               <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
//                 <span className="h-2 w-2 rounded-full bg-[#F3C86A]" aria-hidden />
//                 New arrivals just dropped
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default Register;



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
      window.location.assign("/"); 
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
                  <p className="text-center font-semibold text-sm">Or Sign up with</p>
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