"use client";
import { CreditCard, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Buttons from "../common-components/button";
import Link from "next/link";

const API_BASE = "http://localhost:5000"; // adjust if needed

export type CardProduct = {
  productId: string;
  productName: string;
  price: number;
  photoUrl: string;
  category: string;
  sizes: string[];
  rating?: number;
};

const ProductCard = () => {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.data); // assumes your backend returns an array
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  function Stars({ value = 0 }) {
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

  if (loading) {
    return <p className="text-center text-gray-500">Loading products…</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const priceText = Number.isFinite(p.price) ? `Rs.${p.price}` : "—";
        const defaultSize = p.sizes?.[0] || "M"; // pick first available size

        return (
          <div
            key={p.productId}
            className="w-full min-w-0 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
              <Image
                src={p.photoUrl || "/assets/images/placeholder-tshirt.jpg"}
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

              <p className="mt-1 text-sm text-gray-700"> {p.category}</p>
              <p className="mt-1 text-sm text-gray-700"> {defaultSize}</p>
              <div className="mt-2">
                <Stars value={p.rating ?? 0} />
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
                <Link href={`../ProductDetail?id=${p.productId}`}>
                  <Buttons
                    context="Buy Now"
                    icon={CreditCard}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium"
                  />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductCard;
