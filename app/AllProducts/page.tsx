"use client";

import React from "react";
import Image from "next/image";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/product-card/product-card";

type Product = {
  id: string;
  title: string;
  price: number | string;
  image: string;
  category: string;
  rating?: number;
};

// CRUD: READ — data source for listing products
const PRODUCTS: Product[] = [
  { id: "p1", title: "Diva Melody", price: "Rs.2300", image: "/assets/products/diva-melody.jpg", category: "Intimate Type", rating: 4 },
  { id: "p2", title: "Embroidery Lingerie", price: "Rs.2400", image: "/assets/products/embroidery-lingerie.jpg", category: "Intimate Type", rating: 4 },
  { id: "p3", title: "Sleep Wear", price: "Rs.2000", image: "/assets/products/sleep-wear.jpg", category: "Night Wear", rating: 3 },
  { id: "p4", title: "Bikini G-String", price: "Rs.3200", image: "/assets/products/bikini-gstring.jpg", category: "Intimate Type", rating: 3 },
  { id: "p5", title: "Short Sleeve T-shirt", price: "Rs.2000", image: "/assets/products/tshirt-red.jpg", category: "Casual Wear", rating: 2 },
  { id: "p6", title: "Cotton Short Sleeve", price: "Rs.2900", image: "/assets/products/tshirt-blue.jpg", category: "Casual Wear", rating: 3 },
  { id: "p7", title: "Cap Sleeve", price: "Rs.1900", image: "/assets/products/tshirt-teal.jpg", category: "Casual Wear", rating: 2 },
  { id: "p8", title: "Navy Blue T-Shirt", price: "Rs.3000", image: "/assets/products/tshirt-navy.jpg", category: "Casual Wear", rating: 3 },
];

const Chip = ({ label, withCaret }: { label: string; withCaret?: boolean }) => (
  <button className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" type="button">
    {label}
    {withCaret && <ChevronDown className="h-4 w-4" />}
  </button>
);

const ProductsPage: React.FC = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-10 lg:p-12 flex flex-col gap-4">
            <span className="text-xs font-semibold tracking-wide text-[#2f432a]">VDU INTIMATES</span>
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
            <Image src="/assets/banners/hero-intimates.jpg" alt="Intimates banner" fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" priority />
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <Chip label="Intimate Type" withCaret />
        <Chip label="Price" withCaret />
        <Chip label="Size" withCaret />
        <Chip label="Color" withCaret />
        <Chip label="Material" withCaret />
        <Chip label="Offer" withCaret />
        <div className="ml-auto" />
        <button type="button" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" aria-label="More filters">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* CRUD: READ — rendering the list */}
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </section>
    </main>
  );
};

export default ProductsPage;