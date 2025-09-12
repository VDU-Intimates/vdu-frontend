"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, SlidersHorizontal, Check } from "lucide-react";
import ProductCard from "../components/product-card/product-card";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}


type ApiProduct = {
  _id: string;
  productId: string;
  productName: string;  
  description: string;
  price: number;
  photoUrl: string;
  color: string;
  size: string;
  category: string;
};

type CardProduct = {
  id: string;
  title: string;
  price: number | string;
  image: string;
  category: string;
  rating?: number;
};

const API_BASE ="http://localhost:5000";

/* ---------- Dropdown infra ---------- */

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return ref;
}

type DropdownProps = {
  label: string;
  children: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
};
const Dropdown: React.FC<DropdownProps> = ({ label, children, open, setOpen }) => {
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg p-1"
        >
          {children}
        </div>
      )}
    </div>
  );
};

function MenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-gray-50 ${
        active ? "text-[#2f432a] font-medium" : "text-gray-700"
      }`}
    >
      <span>{children}</span>
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}

/* ---------- Products Page ---------- */

const ProductsPage: React.FC = () => {
  // filters
  const [q, setQ] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sort, setSort] = useState<string>("-createdAt");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // dropdown open states
  const [openCategory, setOpenCategory] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openSize, setOpenSize] = useState(false);
  const [openColor, setOpenColor] = useState(false);

  // list state
  const [items, setItems] = useState<CardProduct[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // option sets (adjust to your catalog)
  const categoryOptions = [
    "Intimate Type",
    "Night Wear",
    "Casual Wear",
    "Kids",
    "Men",
    "Women",
  ];
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const colorOptions = ["Black", "White", "Red", "Blue", "Navy", "Teal", "Pink"];

  // common helpers
  const applyCategory = (value: string) => {
    setCategory(value);
    setPage(1);
    setOpenCategory(false);
  };

  const applySize = (value: string) => {
    setSize(value);
    setPage(1);
    setOpenSize(false);
  };

  const applyColor = (value: string) => {
    setColor(value);
    setPage(1);
    setOpenColor(false);
  };

  const clearFilter = (kind: "category" | "size" | "color" | "price") => {
    if (kind === "category") setCategory("");
    if (kind === "size") setSize("");
    if (kind === "color") setColor("");
    if (kind === "price") {
      setMinPrice(undefined);
      setMaxPrice(undefined);
    }
    setPage(1);
  };

  const setPriceRange = (min?: number, max?: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPage(1);
    setOpenPrice(false);
  };

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (color) p.set("color", color);
    if (size) p.set("size", size);
    if (minPrice != null) p.set("minPrice", String(minPrice));
    if (maxPrice != null) p.set("maxPrice", String(maxPrice));
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [q, category, color, size, minPrice, maxPrice, sort, page, limit]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/api/products?${queryString}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { data: ApiProduct[]; total: number } = await res.json();
        const mapped: CardProduct[] = json.data.map((p) => ({
          id: p.productId || p._id,
          title: p.productName,
          price: p.price,
          image: p.photoUrl,
          category: p.category,
        }));
        if (!cancelled) {
          setItems(mapped);
          setTotal(json.total);
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(getErrorMessage(e) || "Failed to fetch products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <div>
      <NavBar />
   

    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col gap-4">
            <span className="text-xs font-semibold tracking-wide text-[#2f432a]">
              VDU INTIMATES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Grab Up to 50% Off On
              <br />
              Selected intimates &amp; T-shirts
            </h2>
            <div>
              <button className="mt-2 inline-flex items-center rounded-full bg-[#2f432a] px-4 py-2 text-sm font-semibold text-[#eadfcd] hover:opacity-90">
                Buy Now
              </button>
            </div>
          </div>
          <div className="relative min-h-[220px] lg:min-h-[280px]">
            <Image
              src="/assets/banners/hero-intimates.jpg"
              alt="Intimates banner"
              fill
              className="object-cover"
              sizes="(min-width:1024px) 50vw, 100vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Category */}
        <Dropdown label={category ? `Category: ${category}` : "Category"} open={openCategory} setOpen={setOpenCategory}>
          <div className="max-h-72 overflow-auto">
            {categoryOptions.map((c) => (
              <MenuItem key={c} active={category === c} onClick={() => applyCategory(c)}>
                {c}
              </MenuItem>
            ))}
            {category && (
              <>
                <div className="my-1 h-px bg-gray-200" />
                <MenuItem onClick={() => clearFilter("category")}>Clear category</MenuItem>
              </>
            )}
          </div>
        </Dropdown>

        {/* Price */}
        <Dropdown
          label={
            minPrice != null || maxPrice != null
              ? `Price: ${minPrice ?? 0} - ${maxPrice ?? "∞"}`
              : "Price"
          }
          open={openPrice}
          setOpen={setOpenPrice}
        >
          <div className="max-h-72 overflow-auto">
            <MenuItem active={minPrice === undefined && maxPrice === undefined} onClick={() => setPriceRange(undefined, undefined)}>
              Any price
            </MenuItem>
            <MenuItem active={minPrice === 0 && maxPrice === 1999} onClick={() => setPriceRange(0, 1999)}>
              Rs.0 – Rs.1,999
            </MenuItem>
            <MenuItem active={minPrice === 2000 && maxPrice === 2999} onClick={() => setPriceRange(2000, 2999)}>
              Rs.2,000 – Rs.2,999
            </MenuItem>
            <MenuItem active={minPrice === 3000 && maxPrice === 4999} onClick={() => setPriceRange(3000, 4999)}>
              Rs.3,000 – Rs.4,999
            </MenuItem>
            <MenuItem active={minPrice === 5000 && maxPrice === undefined} onClick={() => setPriceRange(5000, undefined)}>
              Rs.5,000+
            </MenuItem>
            {(minPrice != null || maxPrice != null) && (
              <>
                <div className="my-1 h-px bg-gray-200" />
                <MenuItem onClick={() => clearFilter("price")}>Clear price</MenuItem>
              </>
            )}
          </div>
        </Dropdown>

        {/* Size */}
        <Dropdown label={size ? `Size: ${size}` : "Size"} open={openSize} setOpen={setOpenSize}>
          <div className="grid grid-cols-3 gap-1 p-1">
            {sizeOptions.map((s) => (
              <MenuItem key={s} active={size === s} onClick={() => applySize(s)}>
                {s}
              </MenuItem>
            ))}
          </div>
          {size && (
            <>
              <div className="my-1 h-px bg-gray-200" />
              <MenuItem onClick={() => clearFilter("size")}>Clear size</MenuItem>
            </>
          )}
        </Dropdown>

        {/* Color */}
        <Dropdown label={color ? `Color: ${color}` : "Color"} open={openColor} setOpen={setOpenColor}>
          <div className="max-h-72 overflow-auto">
            {colorOptions.map((c) => (
              <MenuItem key={c} active={color === c} onClick={() => applyColor(c)}>
                {c}
              </MenuItem>
            ))}
            {color && (
              <>
                <div className="my-1 h-px bg-gray-200" />
                <MenuItem onClick={() => clearFilter("color")}>Clear color</MenuItem>
              </>
            )}
          </div>
        </Dropdown>

        {/* Spacer + Filters button (non-functional placeholder) */}
        <div className="ml-auto" />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="More filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </section>

      {/* Status */}
      {loading && <p className="mt-6 text-sm text-gray-600">Loading products…</p>}
      {err && <p className="mt-6 text-sm text-red-600">Error: {err}</p>}
      {!loading && !err && items.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">No products found.</p>
      )}

      {/* Grid */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map((p) => (
    <ProductCard
      key={p.id}
      p={{
        id: p.id,
        title: p.title,
        price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
        image: p.image,
        category: p.category,
        rating: p.rating,
      }}
    />
  ))}
</section>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} • {total} results</span>
          <button
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
