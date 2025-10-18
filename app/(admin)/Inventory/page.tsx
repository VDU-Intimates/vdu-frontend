"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  // Download,
  PackagePlus,
  PencilLine,
  Trash2,
  ArrowUp,
  X,
  Plus as PlusIcon,
  Check,
} from "lucide-react";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import Buttons from "@/app/components/common-components/button";
import toast from "react-hot-toast";
import ReportDownloader from "@/app/components/reports/report-downloader";

/* =========================
   Config & helpers
========================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

function getToken(): string | null {
  try {
    const t = localStorage.getItem("access_token");
    return t && t !== "undefined" && t !== "null" ? t : null;
  } catch {
    return null;
  }
}

async function readFilesAsDataUrls(files: File[], cap = 5): Promise<string[]> {
  const picked = files.slice(0, cap);
  const urls: string[] = [];
  for (const f of picked) {
    if (!f.type.startsWith("image/")) continue;
    const url = await new Promise<string>((resolve) => {
      const rd = new FileReader();
      rd.onload = () => resolve(String(rd.result || ""));
      rd.readAsDataURL(f);
    });
    urls.push(url);
  }
  return urls;
}

/* =========================
   Types
========================= */
type UIProduct = {
  _id?: string;
  productId?: string;
  name: string;
  description: string;
  category: "T-Shirt" | "Intimate";
  price: number;
  images: string[]; // main = index 0
  colors?: string[];
  sizes?: string[];
  stock: number;
};

type ApiProduct = {
  _id?: string;
  productId?: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string[]; // backend array
  colors: string[];
  sizes: string[];
  category: "T-Shirt" | "Intimate";
  stock: number;
};

function apiToUI(p: ApiProduct): UIProduct {
  return {
    _id: p._id,
    productId: p.productId,
    name: p.productName,
    description: p.description,
    category: p.category === "Intimate" ? "Intimate" : "T-Shirt",
    price: p.price,
    images: Array.isArray(p.photoUrl) ? p.photoUrl : [],
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    stock: p.stock,
  };
}

function uiToApi(p: UIProduct): Partial<ApiProduct> {
  return {
    productId: p.productId,
    productName: p.name,
    description: p.description,
    price: Number(p.price),
    photoUrl: (p.images ?? []).slice(0, 5),
    colors: (p.colors ?? []).filter(Boolean).length ? (p.colors ?? []).filter(Boolean) : ["default"],
    sizes: (p.sizes ?? []).filter(Boolean).length ? (p.sizes ?? []).filter(Boolean) : ["M"],
    category: p.category,
    stock: Math.max(0, Number(p.stock) || 0),
  };
}

/* =========================
   Views
========================= */
type View = "add" | "update" | "all";

/* =========================
   Page
========================= */
export default function InventoryPage() {
  const [view, setView] = useState<View>("all");
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Download CSV report
  // async function downloadCsv() {
  //   try {
  //     const res = await fetch(`${API_BASE}/api/admin/products/report`);
  //     if (!res.ok) throw new Error(`Download failed (${res.status})`);
  //     const blob = await res.blob();
  //     const urlObj = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = urlObj;

  //     const d = new Date();
  //     const day = String(d.getDate()).padStart(2, "0");
  //     const month = String(d.getMonth() + 1).padStart(2, "0");
  //     const year = d.getFullYear();
  //     const hours = String(d.getHours()).padStart(2, "0");
  //     const minutes = String(d.getMinutes()).padStart(2, "0");
  //     a.download = `inventory-report-${day}-${month}-${year}-${hours}-${minutes}.csv`;

  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     URL.revokeObjectURL(urlObj);
  //   } catch (e) {
  //     alert(`Failed to download report: ${getErrorMessage(e)}`);
  //   }
  // }

  // Load products
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/api/admin/products`);
        if (!res.ok) throw new Error(`List failed (${res.status})`);
        const json = await res.json();
        const list: ApiProduct[] = Array.isArray(json) ? json : json.data ?? [];
        setProducts(list.map(apiToUI));
      } catch (e: unknown) {
        setErr(getErrorMessage(e) || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen font-poppins bg-[#f4efe4]">
      <AdminNavBar />
      <main className="lg:ml-64 flex-1 p-8">
        <div className="mt-15 mb-5">
          <ReportDownloader 
              title="Download Monthly Inventory Report"
              apiEndpoint="/admin/products/report"
              fileNamePrefix="Inventory-Report"
            />
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-7">
            <ToolbarButton
              active={view === "all"}
              label="All product"
              icon={<Box className="w-4 h-4" />}
              onClick={() => setView("all")}
            />
            <ToolbarButton
              active={view === "add"}
              label="Add new product"
              icon={<PackagePlus className="w-4 h-4" />}
              onClick={() => setView("add")}
            />
            <ToolbarButton
              active={view === "update"}
              label="Update Product"
              icon={<PencilLine className="w-4 h-4" />}
              onClick={() => setView("update")}
            />
          </div>
        </div>

        <section className="transition-all">
          {loading ? (
            <div className="bg-white rounded-xl p-6 shadow">Loading…</div>
          ) : err ? (
            <div className="bg-red-100 text-red-700 rounded-xl p-4 shadow">{err}</div>
          ) : view === "add" ? (
            <AddNewProduct
              onCreated={async (ui) => {
                try {
                  const token = getToken();
                  const res = await fetch(`${API_BASE}/api/admin/products`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(uiToApi(ui)),
                  });
                  if (!res.ok) throw new Error(`Create failed (${res.status})`);
                  const created: ApiProduct = await res.json();
                  setProducts((prev) => [apiToUI(created), ...prev]);
                  setView("all");
                  toast.success("New Product Added");
                } catch (e: unknown) {
                  toast.error(getErrorMessage(e) ||"Failed to create");
                }
              }}
            />
          ) : view === "update" ? (
            <UpdateProduct
              items={products}
              onUpdated={async (ui) => {
                try {
                  if (!ui._id && !ui.productId) {
                    toast.error("Missing product id");
                    return;
                  }
                  const token = getToken();
                  const id = ui._id ?? ui.productId!;
                  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(uiToApi(ui)),
                  });
                  if (!res.ok) throw new Error(`Update failed (${res.status})`);
                  const saved: ApiProduct = await res.json();
                  const mapped = apiToUI(saved);
                  setProducts((prev) => prev.map((p) => (p._id === mapped._id ? mapped : p)));
                  toast.success("Product updated");
                } catch (e: unknown) {
                  toast.error(getErrorMessage(e) || "Failed to update");
                }
              }}
              onDelete={async (ui) => {
                try {
                  const token = getToken();
                  const id = ui._id;
                  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
                    method: "DELETE",
                    headers: {
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                  });
                  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                  setProducts((prev) => prev.filter((p) => p._id !== ui._id));
                  toast.success("Product deleted");
                } catch (e: unknown) {
                  toast.error(getErrorMessage(e) || "Failed to delete");
                }
              }}
            />
          ) : (
            <AllProducts items={products} />
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================
   Toolbar Button
========================= */
function ToolbarButton({
  label,
  onClick,
  active,
  danger,
  icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "p-7 shadow-sm border font-bold cursor-pointer rounded-xl transition",
        active ? "bg-[#e8f0db] text-[#5f6f46] border-[#a7b78a]" : "bg-white border-gray-200",
        danger ? "text-red-600 border-red-200" : "",
        "hover:shadow",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

/* =========================
   Add New Product (multi-image)
========================= */
const AVAILABLE_COLORS = ["white", "black", "red", "blue", "green"];
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function AddNewProduct({ onCreated }: { onCreated: (p: UIProduct) => Promise<void> }) {
  const [form, setForm] = useState<UIProduct>({
    name: "",
    description: "",
    category: "T-Shirt",
    price: 0,
    stock: 0,
    images: [],
    colors: [],
    sizes: [],
  });

  // file input key trick to clear the input (instead of touching input.value)
  const [fileKey, setFileKey] = useState<number>(Date.now());

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    if (!files.length) return;
    const urls = await readFilesAsDataUrls(files, 5);

    setForm((f) => {
      const next = (f.images || []).concat(urls).slice(0, 5);
      return { ...f, images: next };
    });

    // reset input by changing key
    setFileKey(Date.now());
  }

  function removeImageAt(idx: number) {
    setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));
  }

  function promoteToMain(idx: number) {
    setForm((f) => {
      const arr = [...(f.images || [])];
      const [sp] = arr.splice(idx, 1);
      arr.unshift(sp);
      return { ...f, images: arr };
    });
  }

  function toggleColor(color: string) {
    setForm((f) => {
      const has = (f.colors ?? []).includes(color);
      const next = has ? (f.colors ?? []).filter((c) => c !== color) : [...(f.colors ?? []), color];
      return { ...f, colors: next };
    });
  }

  function toggleSize(size: string) {
    setForm((f) => {
      const has = (f.sizes ?? []).includes(size);
      const next = has ? (f.sizes ?? []).filter((s) => s !== size) : [...(f.sizes ?? []), size];
      return { ...f, sizes: next };
    });
  }

  const canCreate =
    form.name.trim() &&
    form.price > 0 &&
    (form.colors?.length ?? 0) > 0 &&
    (form.sizes?.length ?? 0) > 0 &&
    (form.images?.length ?? 0) > 0;

  const handleCreate = async () => {
    await onCreated(form);
    setForm({
      name: "",
      description: "",
      category: "T-Shirt",
      price: 0,
      stock: 0,
      images: [],
      colors: [],
      sizes: [],
    });
    setFileKey(Date.now());
  };

  const mainImage = form.images[0] || "/assets/images/team.png";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
      {/* Left: Form */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Product</h2>
        </div>

        <label className="block text-sm font-medium">Product Name</label>
        <input
          className="mt-1 mb-4 w-full rounded border p-2"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Product Name"
        />

        <label className="block text-sm font-medium">Product Description</label>
        <textarea
          className="mt-1 mb-4 w-full rounded border p-2"
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Product Description"
        />

        <label className="block text-sm font-medium mb-2">Category</label>
        <div className="flex gap-3 mb-6">
          {(["T-Shirt", "Intimate"] as const).map((c) => (
            <button
              key={c}
              className={[
                "px-3 py-1 rounded-full border",
                form.category === c ? "bg-green-700 text-white border-green-700" : "bg-white",
              ].join(" ")}
              onClick={() => setForm((f) => ({ ...f, category: c }))}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Multiple image upload (max 5) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Product Images (max 5)</label>
        <div className="flex items-center gap-3">
          <label className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2 cursor-pointer">
            <PencilLine className="w-4 h-4" />
            <span>ADD IMAGES</span>
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickImages}
            />
          </label>
        </div>

  {form.images.length > 0 && (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {form.images.map((src, i) => {
        const isMain = i === 0;
        return (
          <div
            key={i}
            className={[
              "relative rounded-md overflow-hidden border transition-all",
              isMain
                ? "border-emerald-600 ring-2 ring-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                : "border-gray-300 hover:border-gray-400"
            ].join(" ")}
          >
            {/* MAIN badge */}
            {isMain && (
              <span className="absolute left-1 top-1 z-10 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                Main
              </span>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`img-${i}`}
              className={`w-full h-24 object-cover ${isMain ? "opacity-100" : "opacity-95 hover:opacity-100"}`}
            />

            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-white/90">
              {!isMain ? (
                <button
                  title="Set as main"
                  className="px-2 py-1 text-[11px] border rounded  cursor-pointer hover:bg-white inline-flex items-center gap-1"
                  onClick={() => promoteToMain(i)}
                >
                  <ArrowUp className="w-3 h-3" /> Main
                </button>
              ) : (
                <span className="px-2 py-1 text-[11px] border border-emerald-500 bg-emerald-50 text-emerald-700 rounded">
                  Selected
                </span>
              )}

              <button
                title="Remove"
                className="px-2 py-1 text-[11px] border cursor-pointer  border-red-300 hover:bg-red-200 text-red-600 rounded inline-flex items-center gap-1"
                onClick={() => removeImageAt(i)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>


        {/* Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Colors</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_COLORS.map((c) => {
              const checked = (form.colors ?? []).includes(c);
              return (
                <label
                  key={c}
                  className={[
                    "px-3 py-1 rounded-full border cursor-pointer select-none",
                    checked ? "bg-black text-white border-black" : "bg-white",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="mr-2 accent-black"
                    checked={checked}
                    onChange={() => toggleColor(c)}
                  />
                  {c}
                </label>
              );
            })}
          </div>
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Sizes</label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_SIZES.map((s) => {
              const checked = (form.sizes ?? []).includes(s);
              return (
                <label
                  key={s}
                  className={[
                    "px-3 py-1 rounded-full border cursor-pointer select-none",
                    checked ? "bg-green-700 text-white border-green-700" : "bg-white",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="mr-2 accent-green-700"
                    checked={checked}
                    onChange={() => toggleSize(s)}
                  />
                  {s}
                </label>
              );
            })}
          </div>
        </div>

        {/* Stock & Price */}
        <label className="block text-sm font-medium">Stock</label>
        <input
          type="number"
          className="mt-1 mb-6 w-full rounded border p-2"
          value={form.stock || 0}
          onChange={(e) =>
            setForm((f) => ({ ...f, stock: Math.max(0, Number(e.target.value) || 0) }))
          }
        />

        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          className="mt-1 mb-6 w-full rounded border p-2"
          value={form.price || 0}
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
        />

        <div className="flex gap-3">
          <Buttons context="ADD NEW PRODUCT" disabled={!canCreate} onClick={handleCreate} />
          <Buttons
            context="RESET"
            combo="redTransparent"
            className="px-10"
            onClick={() => {
              setForm({
                name: "",
                description: "",
                category: "T-Shirt",
                price: 0,
                stock: 0,
                images: [],
                colors: [],
                sizes: [],
              });
              setFileKey(Date.now());
            }}
          />
        </div>
      </div>

      {/* Right: Preview (main image only) */}
      <div className="bg-[#e1e6cc] rounded-2xl p-6">
        <h3 className="text-lg font-semibold underline mb-3">Product Card Preview</h3>
        <div className="w-full aspect-[4/3] relative mb-4 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainImage} alt={form.name || "preview"} className="w-full h-full object-cover" />
        </div>
        <dl className="grid gap-2 text-md">
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Product Name</dt>
            <dd>{form.name || "—"}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Product Description</dt>
            <dd>{form.description || "—"}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Category</dt>
            <dd>{form.category}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Colors</dt>
            <dd>{(form.colors?.length ?? 0) ? form.colors?.join(", ") : "—"}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Sizes</dt>
            <dd>{(form.sizes?.length ?? 0) ? form.sizes?.join(", ") : "—"}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Stock</dt>
            <dd>{form.stock || 0}</dd>
          </div>
          <div className="grid grid-cols-[200px_1fr]">
            <dt className="font-semibold">Price</dt>
            <dd>Rs. {form.price || 0}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* =========================
   Update Product 
========================= */
function UpdateProduct({
  items,
  onUpdated,
  onDelete,
}: {
  items: UIProduct[];
  onUpdated: (p: UIProduct) => Promise<void>;
  onDelete: (p: UIProduct) => Promise<void>;
}) {
  const [selected, setSelected] = useState<UIProduct | null>(items[0] ?? null);
  useEffect(() => {
    if (!selected && items.length) setSelected(items[0]);
  }, [items, selected]);

  const table = (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold">Inventory List</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#ece8de] text-left">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Product ID</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Product Description</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const active = selected?._id === p._id;
              const main = p.images?.[0] || "/assets/images/team.png";
              return (
                <tr
                  key={p._id ?? p.productId}
                  className={["border-t", active ? "bg-[#e3ead9]" : ""].join(" ")}
                  onClick={() => setSelected(p)}
                >
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={main} className="w-12 h-12 rounded object-cover" alt={p.name} />
                  </td>
                  <td className="p-3">{p.productId ?? "—"}</td>
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.description}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">Rs. {p.price}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const [fileKey, setFileKey] = useState<number>(Date.now());

  async function addImages(files: File[]) {
    if (!selected) return;
    const remain = Math.max(0, 5 - (selected.images?.length ?? 0));
    if (remain <= 0) return;
    const urls = await readFilesAsDataUrls(files, remain);
    setSelected((s) => (s ? { ...s, images: [...(s.images || []), ...urls] } : s));
    setFileKey(Date.now());
  }

  function removeImageAt(idx: number) {
    setSelected((s) =>
      s ? { ...s, images: (s.images || []).filter((_, i) => i !== idx) } : s
    );
  }

  function promoteToMain(idx: number) {
    setSelected((s) => {
      if (!s) return s;
      const arr = [...(s.images || [])];
      const [sp] = arr.splice(idx, 1);
      arr.unshift(sp);
      return { ...s, images: arr };
    });
  }

  const editor = selected && (
    <div className="bg-[#e1e6cc] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Update Product</h3>
        <button className="text-red-600 cursor-pointer" onClick={() => onDelete(selected)} title="Delete product">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <label className="block text-sm font-medium">Product Name</label>
      <input
        className="mt-1 mb-4 w-full rounded border p-2"
        value={selected.name}
        onChange={(e) => setSelected({ ...selected, name: e.target.value })}
      />

      <label className="block text-sm font-medium">Stock</label>
      <div className="flex items-center gap-3 mb-4">
        <button
          className="px-2 py-1 rounded border"
          onClick={() =>
            setSelected((s) => (s ? { ...s, stock: Math.max(0, s.stock - 1) } : s))
          }
        >
          –
        </button>
        <input
          type="number"
          min={0}
          value={selected.stock}
          onChange={(e) =>
            setSelected((s) =>
              s ? { ...s, stock: Math.max(0, Number(e.target.value) || 0) } : s
            )
          }
          className="w-20 text-center rounded border p-1 focus:ring-1 focus:ring-[#5f6f46] outline-none"
        />
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setSelected((s) => (s ? { ...s, stock: s.stock + 1 } : s))}
        >
          +
        </button>
      </div>

      <label className="block text-sm font-medium">Product Description</label>
      <textarea
        className="mt-1 mb-4 w-full rounded border p-2"
        rows={4}
        value={selected.description}
        onChange={(e) => setSelected({ ...selected, description: e.target.value })}
      />

      <label className="block text-sm font-medium mb-2">Category</label>
      <div className="flex gap-3 mb-4">
        {(["T-Shirt", "Intimate"] as const).map((c) => (
          <button
            key={c}
            className={[
              "px-3 py-1 rounded-full border",
              selected.category === c ? "bg-green-700 text-white border-green-700" : "bg-white",
            ].join(" ")}
            onClick={() => setSelected({ ...selected, category: c })}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Image manager (add, set main, remove, capped at 5) */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Images (main shown first)</p>

        <div className="mb-3">
          <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 cursor-pointer">
            <PlusIcon className="w-4 h-4" />
            <span>Add Images</span>
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => addImages(Array.from(e.currentTarget.files ?? []))}
              disabled={(selected.images?.length ?? 0) >= 5}
            />
          </label>
          <span className="ml-3 text-xs text-gray-600">
            {(selected.images?.length ?? 0)}/5 added
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {selected.images.map((src, i) => {
            const isMain = i === 0;
            return (
              <div
                key={i}
                className={[
                  "relative rounded-md overflow-hidden",
                  "border transition-all",
                  isMain
                    ? "border-emerald-600 ring-2 ring-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                    : "border-gray-300 hover:border-gray-400"
                ].join(" ")}
              >
                {/* MAIN badge */}
                {isMain && (
                  <span className="absolute left-1 top-1 z-10 rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                    Main
                  </span>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`img-${i}`}
                  className={[
                    "w-20 h-20 object-cover",
                    isMain ? "opacity-100" : "opacity-95 hover:opacity-100"
                  ].join(" ")}
                />

                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-white/90">
                  {!isMain ? (
                    <button
                      title="Set as main"
                      className="px-2 py-1 text-[11px] border rounded hover:bg-white cursor-pointer inline-flex items-center gap-1"
                      onClick={() => promoteToMain(i)}
                    >
                      <ArrowUp className="w-3 h-3" /> 
                    </button>
                  ) : (
                    <span className="px-1 py-1 text-[11px] border border-emerald-500 bg-emerald-50 text-emerald-700 rounded">
                      <Check />
                    </span>
                  )}

                  <button
                    title="Remove"
                    className="px-2 py-1 text-[11px] border hover:bg-red-200 cursor-pointer border-red-300 text-red-600 rounded inline-flex items-center gap-1"
                    onClick={() => removeImageAt(i)}
                  >
                    <X className="w-3 h-3" /> 
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <label className="block text-sm font-medium">Price</label>
      <input
        type="number"
        className="mt-1 mb-6 w-full rounded border p-2"
        value={selected.price}
        onChange={(e) => setSelected({ ...selected, price: Number(e.target.value || 0) })}
        placeholder="Rs. 500"
      />

      <div className="flex gap-3">
        <Buttons
          context="RESET"
          combo="redTransparent"
          className="px-8"
          onClick={() => setSelected(items[0] ?? null)}
        />
        <Buttons context="UPDATE PRODUCT" onClick={() => selected && onUpdated(selected)} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_480px] gap-8">
      {table}
      {editor}
    </div>
  );
}

/* =========================
   All Products (main image only)
========================= */
function AllProducts({ items }: { items: UIProduct[] }) {
  const rows = useMemo(
    () =>
      items.map((p) => {
        const main = p.images?.[0] || "/assets/images/team.png";
        return (
          <tr key={p._id ?? p.productId} className="border-t">
            <td className="p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main} alt={p.name} className="w-14 h-14 rounded object-cover" />
            </td>
            <td className="p-3">{p.productId ?? "—"}</td>
            <td className="p-3">{p.name}</td>
            <td className="p-3">{p.description}</td>
            <td className="p-3">{p.stock}</td>
            <td className="p-3">Rs. {p.price}</td>
          </tr>
        );
      }),
    [items]
  );

  return (
    <div className="bg-white rounded-2xl shadow">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Inventory List</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#efe8d9] text-left">
            <tr>
              <th className="p-3">Product Image</th>
              <th className="p-3">Product ID</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Product Description</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Price</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}
