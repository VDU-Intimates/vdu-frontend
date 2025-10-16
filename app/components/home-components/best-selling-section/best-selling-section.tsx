// components/sections/best-selling/best-selling.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CreditCard, ShoppingCart, Star, ArrowRight } from "lucide-react";
import Buttons from "../../common-components/button";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

const API_BASE = "http://localhost:5000"; // adjust to your backend


type BestProduct = {
  productId: string;
  productName: string;
  price: number;
  photoUrl: string[];
  category: string;
  sizes: string[];
  avgRating?: number;     // NEW: use schema fields
  ratingCount?: number;   // NEW
};

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${full} star rating`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < full ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}




// small product card purpose-built for this section
function BestSellingCard({ p }: { p: BestProduct }) {
  const priceText = Number.isFinite(p.price) ? `Rs.${p.price}` : "—";
  const defaultSize = p.sizes?.[0] || "M";


 


  return (
    <div className="w-full min-w-0 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
        <Image
          src={p.photoUrl[0] || "/assets/images/placeholder-tshirt.jpg"}
          alt={p.productName}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 25vw, (min-width:640px) 45vw, 90vw"
        />
      </div>

      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{p.productName}</h3>
          <span className="font-semibold text-gray-900 whitespace-nowrap">{priceText}</span>
        </div>

        <p className="mt-1 text-xs text-gray-500">{p.category}</p>
        <div className="mt-2">
          <Stars value={p.avgRating ?? 0} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Buttons
            context="Add to Cart"
            productId={p.productId}
            size={defaultSize}
            icon={ShoppingCart}
            combo="beigeGreen"
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium"
          />
          <Buttons
            context="Buy Now"
            icon={CreditCard}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}
const BestSelling = () => {
  const [items, setItems] = useState<BestProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/api/ratings/top-rated?limit=4`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const data = raw.data || [];
        setItems(data);
      } catch (e: unknown) {
        if (!cancelled) setErr(getErrorMessage(e) || "Failed to load best selling products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mt-20">
      {/* Title */}
      <h2 className="mb-6 text-[clamp(28px,5vw,48px)] font-extrabold tracking-wide text-emerald-700 underline underline-offset-8 text-center">
        BEST SELLING
      </h2>

      {/* Status */}
      {loading && <p className="text-center text-gray-600">Loading best sellers…</p>}
      {err && <p className="text-center text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {/* First two product cards */}
          {items.slice(0, 2).map((p) => (
            <BestSellingCard key={p.productId} p={p} />
          ))}

          {/* Promo banner (spans 2 rows on lg) */}
          <aside className="order-last sm:order-last md:order-last lg:order-none col-span-full lg:col-span-1 rounded-3xl overflow-hidden relative lg:row-span-2">
            <div className="relative w-full h-full min-h-[320px] lg:min-h-[520px]">
              <Image
                src="/assets/images/sale_image_1.jpg"
                alt="30% off on every purchase"
                fill
                className="object-cover"
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex flex-col gap-2 text-white">
                <p className="text-3xl sm:text-4xl font-extrabold leading-tight">
                  ON <br /> EVERY <br /> PURCHASE <br /> GET!
                </p>
                <p className="ml-auto text-red-500 text-4xl sm:text-5xl font-extrabold">
                  30%
                  <br />
                  OFF
                </p>
              </div>

              <div className="absolute bottom-5 left-5">
                <Buttons context="Shop More" icon={ArrowRight} />
              </div>
            </div>
          </aside>

          {/* Remaining product cards */}
          {items.slice(2).map((p) => (
            <BestSellingCard key={p.productId} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export default BestSelling;