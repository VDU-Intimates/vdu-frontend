
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  SlashIcon,
  ShoppingCart,
  Brush,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import Footer from "../components/footer/footer";
import NavBar from "../components/nav-bar/nav-bar";
import Link from "next/link";
import Buttons from "../components/common-components/button";
import TshirtSvg from "../components/tshirt-svg/tshirt-svg";

type Img = { src: string; alt: string };


const IMAGES: Img[] = [
  { src: "/assets/images/product_image_1.jpg", alt: "Model front" },
  { src: "/assets/images/product_image_2.jpg", alt: "Model detail 1" },
  { src: "/assets/images/product_image_3.jpg", alt: "Model detail 2" },
  { src: "/assets/images/product_image_4.jpg", alt: "Model detail 3" },
];

const COLORS = [
  { hex: "#EFDCC3", label: "Sand" },
  { hex: "#D1E4D7", label: "Sage" },
  { hex: "#9DB7FF", label: "Blue" },
  { hex: "#F8B4D9", label: "Pink" },
  { hex: "#B7D7A8", label: "Olive" },
];

const SIZES = ["Small", "Medium", "Large", "Extra Large", "XXL"];

const ProductDetails = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [color, setColor] = useState(COLORS[0].hex);
  const [size, setSize] = useState(SIZES[0]);

  const go = (dir: -1 | 1) =>
    setActiveIdx((i) => (i + dir + IMAGES.length) % IMAGES.length);

  return (
    <div>

    <NavBar />
    <main className="min-h-screen bg-gradient-to-b ">
      {/* page max width */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 lg:px-8">
        {/* breadcrumbs */}
        <nav className="mb-6 hidden text-sm text-gray-500 md:block">
          <ul className="flex flex-wrap items-center gap-2">
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
                <Link href="/ProductDetail">Product Details</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
          </BreadcrumbList>
        </Breadcrumb>
          </ul>
        </nav>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* LEFT: gallery */}
          <section aria-label="Product gallery" className="w-full">
            <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* <div className="relative aspect-[9/8] w-full">
                <Image
                  src={BASE_SVG}
                  alt={IMAGES[activeIdx].alt}
                  fill
                  className="object-cover"
                  priority
                />
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{ backgroundColor: color, opacity: 0.6 }}
                />
              </div> */}
              <div className="relative aspect-[9/8] w-full">
                <TshirtSvg color={color} className="absolute inset-0 h-full w-full" />
              </div>
              {/* prev/next buttons (desktop) */}
              <button
                aria-label="Previous"
                className="absolute cursor-pointer left-3 top-1/2 z-10 hidden -translate-y-1/2
                           rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                onClick={() => go(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next"
                className="absolute right-3 top-1/2 cursor-pointer z-10 hidden -translate-y-1/2
                             rounded-full bg-white/90 p-2 shadow hover:bg-white lg:inline"
                onClick={() => go(1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* thumbnail strip */}
            <div className="mt-4 flex items-center gap-3">
              <button
                className="grid h-9 w-9 place-items-center rounded-full border
                           bg-white shadow  hover:bg-gray-50 lg:hidden"
                onClick={() => go(-1)}
                aria-label="Previous thumbnail"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex w-full snap-x items-center gap-3 overflow-x-auto pb-1">
                {IMAGES.map((img, i) => (
                  <button
                    key={img.src}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Select image ${i + 1}`}
                    className={`relative cursor-pointer h-20 w-24 flex-shrink-0 snap-start overflow-hidden
                               rounded-lg border transition
                      ${
                        i === activeIdx
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              <button
                className="grid h-9 w-9 place-items-center rounded-full border
                         bg-white shadow hover:bg-gray-50 lg:hidden"
                onClick={() => go(1)}
                aria-label="Next thumbnail"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* RIGHT: details */}
          <section aria-label="Product details" className="w-full">
            {/* Title row */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customize</h1>
                <p className="text-sm text-gray-500">Do your own custom</p>
              </div>
              
            </div>

            {/* Price + rating */}
            <div className="mb-6 space-y-1">
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-gray-900 font-poppins">Rs.800</p>
                <span className="text-gray-500 line-through font-poppins">Rs.980</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1
                             text-amber-700">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  3.8
                </span>
                <button className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                  27 Reviews
                </button>
                <span className="text-emerald-700">93%</span>
                <span className="text-gray-500">of buyers have recommended this.</span>
              </div>
            </div>

            {/* Colors */}
            <div className="border-t py-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Choose a Color
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {COLORS.map((c) => {
                  const active = c.hex === color;
                  return (
                    <button
                      key={c.hex}
                      aria-label={c.label}
                      aria-pressed={active}
                      onClick={() => setColor(c.hex)}
                      className={`relative grid h-10 w-10 place-items-center cursor-pointer rounded-full border transition
                      ${active ? "border-emerald-600 ring-2 ring-emerald-200" : 
                        "border-gray-300 hover:border-gray-400"}
                    `}
                    >
                      <span
                        className="block h-8 w-8 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      {active && (
                        <span className="pointer-events-none absolute inset-0 rounded-full ring-2
                                       ring-offset-2 ring-emerald-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            <div className="border-t py-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Choose a Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => {
                  const active = s === size;
                  return (
                    <button
                      key={s}
                      aria-pressed={active}
                      onClick={() => setSize(s)}
                      className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer transition
                        ${
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

            {/* Delivery cards */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Delivery Charges Include
                  </p>
                  <p className="text-sm text-gray-600">
                    An additional delivery fee of <span className="font-poppins font-bold">Rs. 300</span> will be applied.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Return Delivery</p>
                  <p className="text-sm text-gray-600">
                    Free 14 days Delivery Return.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
              <span className="text-sm text-gray-500 flex my-3 gap-3">
                Selected size: <b>{size}</b>{" "}
                <span className="inline-flex items-center gap-2">
                  Selected Colour : 
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <code className="text-gray-600">{color}</code>
                </span>
              </span>
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <Buttons context="CUSTOMIZE" icon={Brush} disabled/>
              
              <Buttons context="ADD TO CART" icon={ShoppingCart} />
            </div>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </div>
  );
}

export default ProductDetails;