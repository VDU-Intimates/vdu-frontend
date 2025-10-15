"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  Images,
  Layers3,
  Loader2,
  Package,
  ShoppingCart,
  Type as TypeIcon,
} from "lucide-react";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";
import Buttons from "../components/common-components/button";

/* =========================
   Config + helpers
========================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

function getToken(): string {
  try {
    const raw = localStorage.getItem("access_token") || "";
    return raw && raw !== "null" && raw !== "undefined" ? raw : "";
  } catch {
    return "";
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

/* =========================
   Types
========================= */
type Design = {
  _id: string;
  designUrl: string;
  imageUrls: string[];
  texts: Array<{
    content: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    left?: number;
    top?: number;
    angle?: number;
  }>;
  productName?: string;
  createdAt: string;
};

type BulkOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // unit price
};

type BulkOrder = {
  _id: string;
  userId: string;
  items: BulkOrderItem[];
  totalAmount: number; // final charged
  status: "pending" | "processing" | "fulfilled" | "cancelled";
  createdAt: string;
};

/* =========================
   Page
========================= */
export default function UserReportsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // raw data
  const [designs, setDesigns] = useState<Design[]>([]);
  const [orders, setOrders] = useState<BulkOrder[]>([]);

  // date filters for CSV
  const [dFrom, setDFrom] = useState(""); // designs
  const [dTo, setDTo] = useState("");
  const [oFrom, setOFrom] = useState(""); // orders
  const [oTo, setOTo] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = getToken();
        // designs (uses your /api/designs from design-controller)
        const dRes = await fetch(`${API_BASE}/api/designs?page=1&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!dRes.ok) throw new Error(`Designs load failed (${dRes.status})`);
        const dJson = await dRes.json();
        const dList: Design[] = Array.isArray(dJson?.data) ? dJson.data : [];
        setDesigns(dList);

        // bulk orders (new endpoint you’ll add below)
        const oRes = await fetch(`${API_BASE}/api/selections?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!oRes.ok) throw new Error(`Orders load failed (${oRes.status})`);
        const oJson = await oRes.json();
        const oList: BulkOrder[] = Array.isArray(oJson?.data) ? oJson.data : [];
        setOrders(oList);
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* =========================
     Metrics (computed client-side)
  ========================= */
  const designMetrics = useMemo(() => {
    const count = designs.length;
    const images = designs.reduce((acc, d) => acc + (d.imageUrls?.length ?? 0), 0);
    const texts = designs.reduce((acc, d) => acc + (d.texts?.length ?? 0), 0);
    const avgImages = count ? (images / count) : 0;
    const avgTexts = count ? (texts / count) : 0;
    const products = new Set(designs.map(d => (d.productName || "").trim()).filter(Boolean)).size;
    const lastCreated = designs.length
      ? new Date(Math.max(...designs.map(d => +new Date(d.createdAt)))).toISOString()
      : null;

    return { count, images, texts, avgImages, avgTexts, products, lastCreated };
  }, [designs]);

  const orderMetrics = useMemo(() => {
    const count = orders.length;
    const totalSpent = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const avgValue = count ? totalSpent / count : 0;
    const totalItems = orders.reduce((acc, o) => acc + (o.items?.length ?? 0), 0);
    const totalQty = orders.reduce(
      (acc, o) => acc + (o.items || []).reduce((a, it) => a + (it.quantity || 0), 0),
      0
    );
    const lastOrdered = orders.length
      ? new Date(Math.max(...orders.map(o => +new Date(o.createdAt)))).toISOString()
      : null;

    // top product (by quantity)
    const counter = new Map<string, number>();
    for (const o of orders) {
      for (const it of o.items || []) {
        const key = it.productName || it.productId;
        counter.set(key, (counter.get(key) || 0) + (it.quantity || 0));
      }
    }
    let topProduct: { name: string; qty: number } | null = null;
    for (const [name, qty] of counter.entries()) {
      if (!topProduct || qty > topProduct.qty) topProduct = { name, qty };
    }

    return { count, totalSpent, avgValue, totalItems, totalQty, lastOrdered, topProduct };
  }, [orders]);

  /* =========================
     CSV downloads
  ========================= */
  async function downloadDesignsPdf() {
    try {
      const params = new URLSearchParams();
      if (dFrom) params.set("from", dFrom);
      if (dTo) params.set("to", dTo);
  
      const res = await fetch(`${API_BASE}/api/designs/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob(); // PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-designs-${new Date().toISOString().slice(0,16).replace(/[:T]/g,"-")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(getErrorMessage(e));
    }
  }

  async function downloadBulkOrdersCsv() {
    try {
      const params = new URLSearchParams();
      if (oFrom) params.set("from", oFrom);
      if (oTo) params.set("to", oTo);

      const res = await fetch(`${API_BASE}/api/selections/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-bulk-orders-${new Date().toISOString().slice(0,16).replace(/[:T]/g,"-")}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(getErrorMessage(e));
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <NavBar />
      <main className="min-h-screen bg-[#f7f5f0]">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
          <h1 className="text-3xl font-bold mb-6">My Activity Reports</h1>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your data…
            </div>
          ) : err ? (
            <div className="text-red-600">Error: {err}</div>
          ) : (
            <>
              {/* ======== DESIGN STATS ======== */}
              <section className="mb-10">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Images className="w-5 h-5" /> Design Details
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={<FileText className="w-4 h-4" />} label="Designs Created" value={designMetrics.count} />
                  <StatCard icon={<Images className="w-4 h-4" />} label="Images Used" value={designMetrics.images} sub={`avg ${designMetrics.avgImages.toFixed(1)}/design`} />
                  <StatCard icon={<TypeIcon className="w-4 h-4" />} label="Texts Added" value={designMetrics.texts} sub={`avg ${designMetrics.avgTexts.toFixed(1)}/design`} />
                  <StatCard icon={<Layers3 className="w-4 h-4" />} label="Products Customized" value={designMetrics.products} />
                </div>

                <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last design: {designMetrics.lastCreated ? new Date(designMetrics.lastCreated).toLocaleString() : "—"}
                </div>

                {/* Designs table */}
                <div className="mt-6 rounded-xl bg-white shadow border">
                  <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Recent Designs
                    </h3>
                    <div className="flex items-center gap-2">
                      <DateInput label="From" value={dFrom} onChange={setDFrom} />
                      <DateInput label="To" value={dTo} onChange={setDTo} />
                      <Buttons context="Download Report" icon={Download} onClick={downloadDesignsPdf} />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#efe8d9] text-left">
                        <tr>
                          <th className="p-3">Preview</th>
                          <th className="p-3">Product</th>
                          <th className="p-3">Images</th>
                          <th className="p-3">Texts</th>
                          <th className="p-3">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {designs.slice(0, 12).map((d) => (
                          <tr key={d._id} className="border-t">
                            <td className="p-3">
                              <div className="relative w-16 h-16 rounded overflow-hidden border bg-white">
                                <Image src={d.designUrl} alt="design" fill className="object-cover" />
                              </div>
                            </td>
                            <td className="p-3">{d.productName || "—"}</td>
                            <td className="p-3">{d.imageUrls?.length ?? 0}</td>
                            <td className="p-3">{d.texts?.length ?? 0}</td>
                            <td className="p-3">{new Date(d.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ======== BULK ORDER STATS ======== */}
              <section className="mb-10">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Bulk Order Details
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={<Package className="w-4 h-4" />} label="Orders Placed" value={orderMetrics.count} />
                  <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Total Spent (Rs.)" value={orderMetrics.totalSpent.toFixed(2)} sub={`avg Rs.${orderMetrics.avgValue.toFixed(2)}/order`} />
                  <StatCard icon={<Layers3 className="w-4 h-4" />} label="Total Line Items" value={orderMetrics.totalItems} />
                  <StatCard icon={<Images className="w-4 h-4" />} label="Total Quantity" value={orderMetrics.totalQty} />
                </div>

                <div className="mt-3 text-sm text-gray-600 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last order: {orderMetrics.lastOrdered ? new Date(orderMetrics.lastOrdered).toLocaleString() : "—"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    Top product:{" "}
                    <b>{orderMetrics.topProduct ? `${orderMetrics.topProduct.name} (${orderMetrics.topProduct.qty})` : "—"}</b>
                  </span>
                </div>

                {/* Orders table */}
                <div className="mt-6 rounded-xl bg-white shadow border">
                  <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Recent Bulk Orders
                    </h3>
                    <div className="flex items-center gap-2">
                      <DateInput label="From" value={oFrom} onChange={setOFrom} />
                      <DateInput label="To" value={oTo} onChange={setOTo} />
                      <Buttons context="Download CSV" icon={Download} onClick={downloadBulkOrdersCsv} />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#efe8d9] text-left">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Created</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Qty</th>
                          <th className="p-3">Total (Rs.)</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 12).map((o) => {
                          const items = o.items?.length ?? 0;
                          const qty = (o.items || []).reduce((a, it) => a + (it.quantity || 0), 0);
                          return (
                            <tr key={o._id} className="border-t">
                              <td className="p-3">{o._id}</td>
                              <td className="p-3">{new Date(o.createdAt).toLocaleString()}</td>
                              <td className="p-3">{items}</td>
                              <td className="p-3">{qty}</td>
                              <td className="p-3">Rs.{(o.totalAmount || 0).toFixed(2)}</td>
                              <td className="p-3 capitalize">{o.status}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* =========================
   Small presentational bits
========================= */
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="text-sm grid">
      <span className="text-gray-700">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-2 py-1"
      />
    </label>
  );
}
