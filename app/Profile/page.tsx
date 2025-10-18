"use client";

import React, { useEffect, useState } from "react";
import Footer from "../components/footer/footer";
import NavBar from "../components/nav-bar/nav-bar";
import Buttons from "../components/common-components/button";
import {DeleteIcon, Download, Save } from "lucide-react";

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err && "message" in err) {
      return String((err as { message?: unknown }).message);
    }
    return "Something went wrong.";
  }

type Profile = {
  fName: string;
  lName: string;
  email: string;
  contact?: string | null;
  address?: string | null;
  role?: string;
  createdAt?: string;
};

type AccountStatsResponse = {
  profile: Profile;
  counts: {
    orders: number;
    customizations: number;
    bulkOrders: number;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function getToken(): string {
  try {
    return localStorage.getItem("access_token") || "";
  } catch {
    return "";
  }
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState(0);
  const [customizations, setCustomizations] = useState(0);
  const [bulkOrders, setBulkOrders] = useState(0);

  // editable fields
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  async function fetchAccountData() {
    setLoading(true);
    setError(null);
    try {
      // 1) profile via /me
      const meRes = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!meRes.ok) throw new Error("Failed to load profile");
      const me = await meRes.json();
      const p: Profile = me.user;

      setProfile(p);
      setFName(p.fName || "");
      setLName(p.lName || "");
      setContact(p.contact || "");
      setAddress(p.address || "");

      // 2) stats via /api/reports/account-stats
      const stRes = await fetch(`${API_BASE}/api/auth/account-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!stRes.ok) throw new Error("Failed to load stats");
      const stats: AccountStatsResponse = await stRes.json();
      setOrders(stats.counts.orders);
      setCustomizations(stats.counts.customizations);
      setBulkOrders(stats.counts.bulkOrders);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccountData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ fName, lName, contact, address }),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      await fetchAccountData(); // refresh
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      "This will permanently delete your account and data associated with it. Continue?"
    );
    if (!ok) return;

    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.message || "Failed to delete account.";
        alert(msg);
        return;
      }

      // Clear client auth + any cached user state
      localStorage.removeItem("access_token");
      // If you store user info separately, clear it as well
      // localStorage.removeItem("current_user");

      alert("Your account has been deleted.");
      window.location.assign("/Login"); // or router.replace("/login")
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  async function downloadPdf() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/account-summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = profile ? `${profile.fName || "User"}_${profile.lName || ""}`.trim() : "Account";
      a.download = `VDU_Account_Summary_${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Could not download report.");
    }
  }

  return (
    <div>
      <NavBar />
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold text-[#2f432a]">My Account</h1>
          <p className="text-sm text-neutral-600">Manage your profile and download your account summary.</p>

          {loading && <div className="mt-6 text-sm text-neutral-600">Loading…</div>}
          {error && <div className="mt-6 text-sm text-red-600">Error: {error}</div>}

          {!loading && profile && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Edit form */}
              <form
                onSubmit={handleSave}
                className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-neutral-200"
              >
                <div className="flex justify-between">
                <h3 className="text-lg font-semibold text-[#2f432a] mb-4">Account Management</h3>
                <Buttons context="Delete Account" combo="redTransparent" onClick={handleDelete}/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">First name</label>
                    <input
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Last name</label>
                    <input
                      value={lName}
                      onChange={(e) => setLName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Contact</label>
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Address</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#F3C86A] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                 
                  <Buttons context="Reset" combo="redTransparent" className="w-full" icon={DeleteIcon} onClick={() => {
                      setFName(profile.fName || "");
                      setLName(profile.lName || "");
                      setContact(profile.contact || "");
                      setAddress(profile.address || "");
                    }}/>
                  <Buttons disabled={saving} context={saving ? "Saving..." : "Save changes"} icon={Save} className="w-full lg:text-lg"/>
                </div>
              </form>

              {/* Right: Stats + Download */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold text-[#2f432a] mb-4">Your Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Name</span><b>{profile.fName} {profile.lName}</b></div>
                  <div className="flex justify-between"><span>Email</span><b>{profile.email}</b></div>
                  <div className="flex justify-between"><span>Joined</span><b>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</b></div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border p-3">
                    <div className="text-2xl font-bold">{orders}</div>
                    <div className="text-xs text-neutral-600">Orders</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-2xl font-bold">{customizations}</div>
                    <div className="text-xs text-neutral-600">Customizations</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-2xl font-bold">{bulkOrders}</div>
                    <div className="text-xs text-neutral-600">Bulk Orders</div>
                  </div>
                </div>


                <Buttons context="Download Account Summary (PDF)" onClick={downloadPdf} icon={Download} className="mt-6 w-full"/>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
