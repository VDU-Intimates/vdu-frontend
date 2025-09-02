//Need to implement the logic where the best selling products are taken from total sales
"use client";

import Image from "next/image";
import ProductCard from "../product-card/product-card";
import Buttons from "../common-components/button";
import { ArrowRight } from "lucide-react";

type Product = {
  id: string;
  title: string;
  price: number | string;
  image: string;
  category:string;
  rating?: number; // 0..5
};

const products: Product[] = [
{ 
    id: "1",
    title: "Diva Melody", 
    price: "Rs.2300", 
    image: "/assets/images/product_image_1.jpg",
    category:'Intimate', 
    rating: 4.2 
},
{ 
    id: "2", 
    title: "Printed T-Shirt & Short", 
    price: "Rs.2300", 
    image: "/assets/images/product_image_2.jpg",
    category:'T-shirt', 
    rating: 4.0 
},
{ 
    id: "3", 
    title: "Women Printed Crop Top", 
    price: "Rs.2300", 
    image: "/assets/images/product_image_3.jpg",
    category:'T-shirt', 
    rating: 3.8 
},
{ 
    id: "4", 
    title: "Printed T-Shirt", 
    price: "Rs.2300", 
    image: "/assets/images/product_image_4.jpg",
    category:'T-shirt', 
    rating: 4.5 
},
];

export default function BestSelling() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mt-20 max-md:px-5">
      {/* Title */}
      <h2 className="mb-6 text-[clamp(28px,5vw,48px)] font-extrabold tracking-wide
                     text-emerald-700 underline underline-offset-8 text-center">
        BEST SELLING
      </h2>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start
 ">
        {/* First two product cards */}
        {products.slice(0, 2).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}

        {/* Promo banner (spans 2 rows on lg) */}
        <aside className="order-last sm:order-last md:order-last lg:order-none col-span-full lg:col-span-1
                             rounded-3xl overflow-hidden relative
                            lg:row-span-2">
          <div className="relative w-full h-full min-h-[320px] lg:min-h-[520px]">
            <Image
              src="/assets/images/sale_image_1.jpg" // replace with your banner image
              alt="30% off on every purchase"
              fill
              className="object-cover"
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              priority
            />
            {/* Overlay text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <div className="absolute left-5 right-5 top-5 flex flex-col gap-2 text-white">
              <p className="text-3xl sm:text-4xl font-extrabold leading-tight">
                ON <br /> EVERY <br /> PURCHASE <br /> GET!
              </p>
              <p className="ml-auto text-red-500 text-4xl sm:text-5xl font-extrabold">30%<br />OFF</p>
            </div>

            <div className="absolute bottom-5 left-5">
            <Buttons context='Shop More' icon={ArrowRight} />
            </div>
          </div>
        </aside>
        {/* Remaining product cards */}
        {products.slice(2).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}

      </div>
    </section>
  );
}
