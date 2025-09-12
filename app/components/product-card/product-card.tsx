// components/product-card/product-card.tsx
import { CreditCard, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import React from "react";
import Buttons from "../common-components/button";
import Link from "next/link";

export type CardProduct = {
  id: string;
  title: string;
  price: number;         // keep as number for consistency
  image: string;
  category: string;
  rating?: number;
};

const ProductCard = ({ p }: { p: CardProduct }) => {
  function Stars({ value = 0 }) {
    const full = Math.round(value);
    return (
      <div className="flex items-center gap-0.5" aria-label={`${full} star rating`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < full ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    );
  }

  const priceText = Number.isFinite(p.price) ? `Rs.${p.price}` : "—";

  return (
    <div className="w-full min-w-0 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
        <Image
          src={p.image || "/assets/images/placeholder-tshirt.jpg"}
          alt={p.title}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 25vw, (min-width:640px) 45vw, 90vw"
        />
      </div>

      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{p.title}</h3>
          <span className="font-semibold text-gray-900 whitespace-nowrap">{priceText}</span>
        </div>

        <p className="mt-1 text-xs text-gray-500">{p.category}</p>
        <div className="mt-2"><Stars value={p.rating ?? 0} /></div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Buttons context="Add to Cart" icon={ShoppingCart} combo="beigeGreen" className="w-full sm:w-auto px-4 py-2 text-sm font-medium" />
          <Link href='../ProductDetail'><Buttons context="Buy Now" icon={CreditCard} className="w-full sm:w-auto px-4 py-2 text-sm font-medium" /></Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
