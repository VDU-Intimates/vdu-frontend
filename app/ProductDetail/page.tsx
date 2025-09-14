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

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import Footer from "../components/footer/footer";
import NavBar from "../components/nav-bar/nav-bar";
import Link from "next/link";
import Buttons from "../components/common-components/button";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
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
  photoUrl: string;
  colors: string[];
  sizes: string[];
  category: "T-Shirt" | "Intimate";
  stock: number;
};

const API_BASE = "http://localhost:5000";

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



export default function ProductDetails() {

  

  const search = useSearchParams();
  const paramId = search.get("id")?.trim() || "";

  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);

  

  // UI selections
  const defaultColor = useMemo(() => product?.colors?.[0] || "#EFDCC3", [product]);
  const defaultSize = useMemo(() => product?.sizes?.[0] || "M", [product]);
  const [color, setColor] = useState<string>(defaultColor);
  const [size, setSize] = useState<string>(defaultSize);
  const [activeIdx, setActiveIdx] = useState(0);

  // sync when product changes
  useEffect(() => {
    setColor(defaultColor);
    setSize(defaultSize);
    setActiveIdx(0);
  }, [defaultColor, defaultSize]);

  // load user once
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

  // load product
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
        if (!cancelled) setProduct(doc);
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

  // simple 4 “thumbnails” – all the same image for now
  const THUMBS = useMemo(() => {
    const src = product?.photoUrl || "/assets/images/placeholder-tshirt.jpg";
    return [
      { src, alt: "Image 1" },
      { src, alt: "Image 2" },
      { src, alt: "Image 3" },
      { src, alt: "Image 4" },
    ];
  }, [product?.photoUrl]);

  const go = (dir: -1 | 1) =>
    setActiveIdx((i) => (i + dir + THUMBS.length) % THUMBS.length);

  return (
    <div>
      <NavBar />

      <main className="min-h-screen bg-gradient-to-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          {/* breadcrumbs */}
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

          {/* states */}
          {loading && <p className="text-sm text-gray-600">Loading product…</p>}
          {!loading && err && <p className="text-sm text-red-600">Error: {err}</p>}
          {!loading && !err && !product && (
            <p className="text-sm text-gray-600">Product not found.</p>
          )}

          {!loading && product && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* LEFT: gallery */}
              <section aria-label="Product gallery" className="w-full">
                {/* main image */}
                <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative aspect-[9/8] w-full">
                    <Image
                      src={THUMBS[activeIdx].src}
                      alt={THUMBS[activeIdx].alt}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  {/* desktop prev/next */}
                  <button
                    aria-label="Previous"
                    className="absolute cursor-pointer left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                    onClick={() => go(-1)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next"
                    className="absolute right-3 top-1/2 cursor-pointer z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                    onClick={() => go(1)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* thumbnails */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-full border bg-white shadow hover:bg-gray-50 lg:hidden"
                    onClick={() => go(-1)}
                    aria-label="Previous thumbnail"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex w-full snap-x items-center gap-3 overflow-x-auto pb-1">
                    {THUMBS.map((img, i) => (
                      <button
                        key={`${img.src}-${i}`}
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Select image ${i + 1}`}
                        className={`relative cursor-pointer h-20 w-24 flex-shrink-0 snap-start overflow-hidden rounded-lg border transition ${
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
                    className="grid h-9 w-9 place-items-center rounded-full border bg-white shadow hover:bg-gray-50 lg:hidden"
                    onClick={() => go(1)}
                    aria-label="Next thumbnail"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </section>

              {/* RIGHT: details */}
              <section aria-label="Product details" className="w-full">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>

                {/* Price + sample rating */}
                <div className="mb-6 space-y-1">
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold text-gray-900 font-poppins">Rs.{product.price}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      4.2
                    </span>
                    <button className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                      27 Reviews
                    </button>
                    <span className="text-emerald-700">93%</span>
                    <span className="text-gray-500">of buyers recommend this.</span>
                  </div>
                </div>

                {/* Colors */}
                <div className="border-t py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Choose a Color</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {(product.colors?.length ? product.colors : [defaultColor]).map((hex) => {
                      const active = hex === color;
                      return (
                        <button
                          key={hex}
                          aria-label={hex}
                          aria-pressed={active}
                          onClick={() => setColor(hex)}
                          className={`relative grid h-10 w-10 place-items-center cursor-pointer rounded-full border transition ${
                            active ? "border-emerald-600 ring-2 ring-emerald-200" : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <span className="block h-8 w-8 rounded-full" style={{ backgroundColor: hex }} />
                          {active && (
                            <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-offset-2 ring-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div className="border-t py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Choose a Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes?.length ? product.sizes : [defaultSize]).map((s) => {
                      const active = s === size;
                      return (
                        <button
                          key={s}
                          aria-pressed={active}
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

                {/* Info cards */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Delivery Charges Include</p>
                      <p className="text-sm text-gray-600">
                        An additional delivery fee of <span className="font-poppins font-bold">Rs. 300</span> will be
                        applied.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Return Delivery</p>
                      <p className="text-sm text-gray-600">Free 14 days Delivery Return.</p>
                    </div>
                  </div>
                </div>

                {/* Selected summary + CTAs */}
                <span className="text-sm text-gray-500 flex my-3 gap-3">
                  Selected size: <b>{size}</b>{" "}
                  <span className="inline-flex items-center gap-2">
                    Selected Colour :
                    <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                    <code className="text-gray-600">{color}</code>
                  </span>
                </span>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {currentUser && product.category === "T-Shirt" ? (
                    <Link
                    href={`/Customization?id=${encodeURIComponent(product.productId)}&size=${encodeURIComponent(
                      size
                    )}&color=${encodeURIComponent(color)}`}
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
