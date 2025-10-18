
"use client";

import Image from "next/image";
import React from "react";
import ProductCard from "../components/product-card/product-card";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";

const ProductsPage = () => {
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
                src="/assets/images/hero_image_2.jpg"
                alt="Intimates banner"
                fill
                className="object-cover"
                sizes="(min-width:1024px) 50vw, 100vw"
                priority
              />
            </div>
          </div>
        </section>

        {/* Product grid (self-contained fetch inside ProductCard) */}
        <section className="mt-6">
          <ProductCard />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductsPage;

