
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  PackagePlus,
  PencilLine,
  Trash2,
} from "lucide-react";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";

/* =========================
   Config & Helpers
========================= */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

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

/* =========================
   Types (UI vs API)
========================= */
// UI type (now includes colors/sizes for creation)
type UIProduct = {
  _id?: string;
  productId?: string; // productId from backend
  name: string; // productName
  description: string;
  category: "T-Shirt" | "Intimate"; // UI categories
  price: number;
  stock: number; // UI-only
  image: string; // photoUrl (can be base64 or URL)
  colors?: string[];
  sizes?: string[];
};

// Backend product (subset, matches your model)
type ApiProduct = {
  _id?: string;
  productId?: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string;
  colors: string[];
  sizes: string[];
  category: "T-Shirt" | "Intimate";
};

/* =========================
   Adapters
========================= */
// backend -> UI
function apiToUI(p: ApiProduct): UIProduct {
  return {
    _id: p._id,
    productId: p.productId,
    name: p.productName,
    description: p.description,
    category: p.category === "Intimate" ? "Intimate" : "T-Shirt",
    price: p.price,
    stock: 0,
    image: p.photoUrl,
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
  };
}

// UI -> backend
function uiToApi(p: UIProduct): Partial<ApiProduct> {
  const colors = (p.colors ?? []).filter(Boolean);
  const sizes = (p.sizes ?? []).filter(Boolean);
  return {
    productId: p.productId, // optional
    productName: p.name,
    description: p.description,
    price: Number(p.price),
    photoUrl: p.image, // can be base64 data URL or hosted URL
    colors: colors.length ? colors : ["default"], // keep backend validator happy
    sizes: sizes.length ? sizes : ["M"],
    category: p.category === "T-Shirt" ? "T-Shirt" : "Intimate",
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

  // LOAD
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
      {/* Sidebar (fixed) */}
      <AdminNavBar />

      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Inventory</h1>

        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-7 ">
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

        {/* Center panel */}
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
                } catch (e: unknown) {
                  alert(getErrorMessage(e) || "Failed to create");
                }
              }}
            />
          ) : view === "update" ? (
            <UpdateProduct
              items={products}
              onUpdated={async (ui) => {
                try {
                  if (!ui._id && !ui.productId) {
                    alert("Missing product id");
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
                  setProducts((prev) =>
                    prev.map((p) => (p._id === mapped._id ? mapped : p))
                  );
                } catch (e: unknown) {
                  alert(getErrorMessage(e) || "Failed to update");
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
                } catch (e: unknown) {
                  alert(getErrorMessage(e) || "Failed to delete");
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
        "p-7 shadow-sm border font-bold rounded-xl transition",
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
   Add New Product (with upload + multiselect)
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
    image:
      "/assets/images/team.png",
    colors: [],
    sizes: [],
  });

  // ----- image upload (preview with base64 data URL) -----
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setForm((f) => ({ ...f, image: dataUrl }));
    };
    reader.readAsDataURL(file); // base64 preview
  }
  function removeImage() {
    setForm((f) => ({
      ...f,
      image:
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=640&auto=format&fit=crop",
    }));
  }

  // ----- checkbox handlers -----
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
    !!form.image;

  const handleCreate = async () => {
    await onCreated(form);
    setForm({
      name: "",
      description: "",
      category: "T-Shirt",
      price: 0,
      stock: 0,
      image:
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=640&auto=format&fit=crop",
      colors: [],
      sizes: [],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
      {/* Left: Form */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Product</h2>
          <button className="text-gray-500 hover:text-black">✕</button>
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
          {(["T-Shirt","Intimate"] as const).map((c) => (
            <button
              key={c}
              className={[
                "px-3 py-1 rounded-full border",
                form.category === c ? "bg-green-700 text-white border-green-700" : "bg-white",
              ].join(" ")}
              onClick={() => setForm((f) => ({ ...f, category: c }))}
            >
              {c === "Intimate" ? "Intimate" : "T-Shirt"}
            </button>
          ))}
        </div>

        {/* Image upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Product Image</label>
          <div className="flex items-center gap-3">
            <label className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2 cursor-pointer">
              <PencilLine className="w-4 h-4" />
              <span>ADD IMAGE</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
            </label>
            <button
              type="button"
              onClick={removeImage}
              className="px-3 py-2 rounded-lg border border-red-300 text-red-600 bg-white"
            >
              REMOVE
            </button>
          </div>
        </div>

        {/* Colors multi-select */}
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

        {/* Sizes multi-select */}
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

        <label className="block text-sm font-medium">Stock</label>
        <input
          type="number"
          className="mt-1 mb-6 w-full rounded border p-2"
          value={form.stock || ""}
          onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value || 0) }))}
          placeholder="Stock"
        />

        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          className="mt-1 mb-6 w-full rounded border p-2"
          value={form.price || ""}
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value || 0) }))}
          placeholder="Min Price"
        />

        <div className="flex gap-3">
          <button
            disabled={!canCreate}
            onClick={handleCreate}
            className={[
              "px-4 py-2 rounded-xl",
              canCreate ? "bg-[#5f6f46] text-white" : "bg-gray-300 text-gray-600",
            ].join(" ")}
          >
            ADD NEW PRODUCT
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-red-500/90 text-white"
            onClick={() =>
              setForm({
                name: "",
                description: "",
                category: "T-Shirt",
                price: 0,
                stock: 0,
                image:
                  "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=640&auto=format&fit=crop",
                colors: [],
                sizes: [],
              })
            }
          >
            RESET
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="bg-[#e1e6cc] rounded-2xl p-6">
        <h3 className="text-lg font-semibold underline mb-3">Product Card Preview</h3>
        <div className="w-full aspect-[4/3] relative mb-4 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.image} alt={form.name || "preview"} className="w-full h-full object-cover" />
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
            <dd>{form.category === "T-Shirt" ? "T-Shirt" : `${form.category}`}</dd>
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
            <dd> {form.stock || 0}</dd>
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
   Update Product (unchanged logic)
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
        <div className="text-sm text-gray-600 flex items-center gap-6">
          <button className="hover:underline">Sort by ↓</button>
          <button className="hover:underline">View all</button>
        </div>
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
              return (
                <tr
                  key={p._id ?? p.productId}
                  className={["border-t", active ? "bg-[#e3ead9]" : ""].join(" ")}
                  onClick={() => setSelected(p)}
                >
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} className="w-12 h-12 rounded object-cover" alt={p.name} />
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

  const editor = selected && (
    <div className="bg-[#e1e6cc] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Update Product</h3>
        <button
          className="text-red-600"
          onClick={() => onDelete(selected)}
          title="Delete product"
        >
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
        <span className="min-w-[32px] text-center">{selected.stock}</span>
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
            {c === "Intimate" ? "Intimate" : "T-Shirt"}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <button className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2">
          <PencilLine className="w-4 h-4" />
          ADD IMAGE
        </button>
        <button className="px-3 py-2 rounded-lg border border-red-300 text-red-600 bg-white">
          REMOVE
        </button>
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
        <button
          className="px-4 py-2 rounded-xl bg-red-500/90 text-white"
          onClick={() => setSelected(items[0] ?? null)}
        >
          RESET
        </button>
        <button
          className="px-4 py-2 rounded-xl bg-[#5f6f46] text-white"
          onClick={() => selected && onUpdated(selected)}
        >
          UPDATE PRODUCT
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-8">
      {table}
      {editor}
    </div>
  );
}

/* =========================
   All Products (list)
========================= */
function AllProducts({ items }: { items: UIProduct[] }) {
  const rows = useMemo(
    () =>
      items.map((p) => (
        <tr key={p._id ?? p.productId} className="border-t">
          <td className="p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="w-14 h-14 rounded object-cover" />
          </td>
          <td className="p-3">{p.productId ?? "—"}</td>
          <td className="p-3">{p.name}</td>
          <td className="p-3">{p.description}</td>
          <td className="p-3">{p.stock}</td>
          <td className="p-3">Rs. {p.price}</td>
        </tr>
      )),
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
