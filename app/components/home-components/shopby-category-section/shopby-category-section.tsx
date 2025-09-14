import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const CATEGORIES = [
    { name: "WOMEN", image: "/assets/images/hero_image_1.jpg", link: "/category/women" },
    { name: "MEN", image: "/assets/images/hero_image_2.jpg", link: "/category/men" },
    { name: "KIDS", image: "/assets/images/hero_image_3.jpg", link: "/category/kids" },
  ];

const ShopByCategory = () => {
  return (
    <section className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">SHOP BY CATEGORY</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            href={cat.link}
            key={cat.name}
            className="group block overflow-hidden rounded-xl shadow-md bg-white border border-gray-200"
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 text-center font-bold text-lg text-gray-900">{cat.name}</div>
          </Link>
        ))}
      </div>
    </div>
  </section>
  )
}

export default ShopByCategory