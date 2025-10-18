"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface Product {
  _id: string;
  productName: string;
  price: number;
  photoUrl: string[];
}

const ProductCard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  // Fetch products from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  // Toggle wishlist
  const toggleWishlist = (id: string) => {
    let updated: string[];
    if (wishlist.includes(id)) {
      updated = wishlist.filter((pid) => pid !== id);
    } else {
      updated = [...wishlist, id];
    }
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product._id}
          className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => toggleWishlist(product._id)}
              className="text-[#2f432a] hover:opacity-80"
            >
              {wishlist.includes(product._id) ? (
                <FaHeart className="text-red-500 text-xl" />
              ) : (
                <FaRegHeart className="text-xl" />
              )}
            </button>
          </div>

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
  );
};

export default ProductCard;
