"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  SlashIcon,
  ShoppingCart,
  Brush,
  Truck,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Footer from "../components/footer/footer";
import NavBar from "../components/nav-bar/nav-bar";
import Buttons from "../components/common-components/button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const API_BASE = "http://localhost:5000";

/* ==========================
   Helper Functions & Types
========================== */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err)
    return String((err as { message?: unknown }).message);
  return "Something went wrong.";
}

function getToken(): string {
  try {
    const raw = localStorage.getItem("access_token");
    if (!raw) return "";
    const t = raw.trim();
    return t && t !== "null" && t !== "undefined" ? t : "";
  } catch {
    return "";
  }
}

type ApiUser = {
  userId: string;
  fName: string;
  lName: string;
  email: string;
  address?: string | null;
  contact?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiProduct = {
  _id: string;
  productId: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string[] | string;
  colors: string[];
  sizes: string[];
  category: "T-Shirt" | "Intimate";
  stock: number;
};

/* ==========================
   Component
========================== */
export default function ProductDetails() {
  const search = useSearchParams();
  const paramId = search.get("id")?.trim() || "";

  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [activeIdx, setActiveIdx] = useState(0);

  /* ==========================
     Auth Load
  =========================== */
  useEffect(() => {
    const run = async () => {
      const token = getToken();
      if (!token) return setCurrentUser(null);
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return setCurrentUser(null);
        const data: { user: ApiUser } = await res.json();
        setCurrentUser(data.user);
      } catch {
        setCurrentUser(null);
      }
    };
    run();
  }, []);

  /* ==========================
     Product Load
  =========================== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!paramId) {
          setErr("Missing product id");
          setProduct(null);
          return;
        }
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(paramId)}`);
        if (!res.ok) {
          setErr(res.status === 404 ? "Product not found" : `Failed to load product (HTTP ${res.status})`);
          setProduct(null);
          return;
        }
        const doc: ApiProduct = await res.json();
        if (!cancelled) {
          setProduct(doc);
          setColor(doc.colors?.[0] || "#EFDCC3");
          setSize(doc.sizes?.[0] || "M");
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(getErrorMessage(e) || "Failed to load product");
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramId]);

  /* ==========================
     Thumbnails Setup
  =========================== */
  const THUMBS = useMemo(() => {
    if (!product) return [];

    // normalize array or string
    let imgs: string[] = [];
    if (Array.isArray(product.photoUrl)) {
      imgs = product.photoUrl.filter((u) => typeof u === "string" && u.trim() !== "");
    } else if (typeof product.photoUrl === "string" && product.photoUrl.trim() !== "") {
      imgs = [product.photoUrl];
    }

    // only up to 5 images
    return imgs.slice(0, 5).map((src, i) => ({
      src,
      alt: `${product.productName || "Product"} image ${i + 1}`,
    }));
  }, [product]);

  const go = (dir: -1 | 1) => {
    if (!THUMBS.length) return;
    setActiveIdx((i) => (i + dir + THUMBS.length) % THUMBS.length);
  };

  /* ==========================
     UI Render
  =========================== */
  return (
    <div>
      <NavBar />

      <main className="min-h-screen bg-gradient-to-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 hidden text-sm text-gray-500 md:block">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/AllProduct">All Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <SlashIcon />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <span>{product?.productName || "Product Details"}</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </nav>

          {/* States */}
          {loading && <p className="text-sm text-gray-600">Loading product…</p>}
          {!loading && err && <p className="text-sm text-red-600">Error: {err}</p>}
          {!loading && !err && !product && (
            <p className="text-sm text-gray-600">Product not found.</p>
          )}

          {/* Product View */}
          {!loading && product && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* LEFT — Gallery */}
              <section className="w-full">
                {THUMBS.length > 0 ? (
                  <>
                    {/* Main Image */}
                    <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm">
                      <div className="relative aspect-[9/8] w-full">
                        <Image
                          src={THUMBS[activeIdx].src}
                          alt={THUMBS[activeIdx].alt}
                          fill
                          className="object-cover transition-all duration-300"
                          priority
                        />
                      </div>

                      {THUMBS.length > 1 && (
                        <>
                          <button
                            aria-label="Previous"
                            className="absolute left-3 top-1/2 hidden cursor-pointer -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                            onClick={() => go(-1)}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            aria-label="Next"
                            className="absolute right-3 top-1/2 hidden cursor-pointer -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                            onClick={() => go(1)}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {THUMBS.length > 1 && (
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          className="grid h-9 w-9 place-items-center cursor-pointer rounded-full border bg-white shadow hover:bg-gray-50 lg:hidden"
                          onClick={() => go(-1)}
                          aria-label="Previous thumbnail"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex w-full snap-x items-center gap-3 overflow-x-auto pb-1">
                          {THUMBS.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveIdx(i)}
                              className={`relative h-20 w-24 cursor-pointer flex-shrink-0 snap-start overflow-hidden rounded-lg border transition ${
                                i === activeIdx
                                  ? "border-emerald-600 ring-2 ring-emerald-200"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <Image src={img.src} alt={img.alt} fill className="object-cover" />
                            </button>
                          ))}
                        </div>

                        <button
                          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border bg-white shadow hover:bg-gray-50 lg:hidden"
                          onClick={() => go(1)}
                          aria-label="Next thumbnail"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-[9/8] w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
                    No image available
                  </div>
                )}
              </section>

              {/* RIGHT — Product Info */}
              <section className="w-full">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 space-y-1">
                  <p className="text-3xl font-bold text-gray-900 font-poppins">Rs.{product.price}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      4.2
                    </span>
                    <button className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                      27 Reviews
                    </button>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="border-t py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Choose a Color</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {(product.colors?.length ? product.colors : [color]).map((hex) => {
                      const active = hex === color;
                      return (
                        <button
                          key={hex}
                          aria-label={hex}
                          onClick={() => setColor(hex)}
                          className={`relative h-10 w-10 flex cursor-pointer justify-center  items-center rounded-full border-2 transition ${
                            active
                              ? "border-emerald-600 ring-2 ring-emerald-200"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <span
                            className="block h-10 w-10  rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="border-t py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Choose a Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes?.length ? product.sizes : [size]).map((s) => {
                      const active = s === size;
                      return (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer transition ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Delivery Charges Include</p>
                      <p className="text-sm text-gray-600">
                        Additional delivery fee of <b>Rs. 300</b> applies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Return Policy</p>
                      <p className="text-sm text-gray-600">Free 14-day return period.</p>
                    </div>
                  </div>
                </div>

                {/* Selection Summary */}
                <p className="text-sm text-gray-600 flex my-3 gap-3">
                  Selected size: <b>{size}</b> | Color:
                  <span
                    className="inline-block h-4 w-4 rounded-full border ml-1"
                    style={{ backgroundColor: color }}
                  />
                  <code className="text-gray-600">{color}</code>
                </p>

                {/* Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {currentUser && product.category === "T-Shirt" ? (
                    <Link
                      href={`/Customization?id=${encodeURIComponent(
                        product.productId
                      )}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`}
                    >
                      <Buttons context="CUSTOMIZE" icon={Brush} />
                    </Link>
                  ) : (
                    <Buttons context="CUSTOMIZE" icon={Brush} disabled />
                  )}

                  <Buttons
                    context="Add to Cart"
                    icon={ShoppingCart}
                    productId={product.productId}
                    size={size}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
