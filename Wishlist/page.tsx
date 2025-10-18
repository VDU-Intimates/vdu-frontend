"use client";

import React, { useEffect, useState } from "react";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";
import Image from "next/image";
import Link from "next/link";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (wishlist.length > 0) {
      fetch("http://localhost:5000/api/products")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter((p: any) =>
            wishlist.includes(p._id)
          );
          setProducts(filtered);
        })
        .catch((err) => console.error(err));
    }
  }, [wishlist]);

  if (wishlist.length === 0)
    return (
      <div>
        <NavBar />
        <div className="py-10 text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Your Wishlist is Empty 💔
          </h2>
          <Link href="/products">
            <button className="mt-4 bg-[#2f432a] text-[#eadfcd] px-4 py-2 rounded-full">
              Browse Products
            </button>
          </Link>
        </div>
        <Footer />
      </div>
    );

  return (
    <div>
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">My Wishlist ❤️</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              <Image
                src={product.photoUrl[0]}
                alt={product.productName}
                width={300}
                height={300}
                className="object-cover w-full h-60"
              />
              <div className="p-3 flex flex-col items-start">
                <h3 className="text-sm font-semibold">{product.productName}</h3>
                <p className="text-gray-600 text-sm">LKR {product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
