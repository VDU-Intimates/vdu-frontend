"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "../components/footer/footer";
import NavBar from "../components/nav-bar/nav-bar";

export default function AboutPage() {
  const images = [
    { src: "/assets/images/hero_image_1.jpg", caption: "Our Factory" },
    { src: "/assets/images/hero_image_2.jpg", caption: "Our Team" },
    { src: "/assets/images/hero_image_3.jpg", caption: "Innovation in Fashion" },
    { src: "/assets/images/product_image_1.jpg", caption: "Our Vision" },
  ];

  const [current, setCurrent] = useState(0);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div>
      <NavBar />
    
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <h1 className="text-4xl font-bold text-center py-8">About Us</h1>

      {/* Image Slider */}
      <div className="relative w-full max-w-6xl mx-auto h-[450px] overflow-hidden rounded-2xl shadow-xl">
        {images.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={item.src}
              alt={item.caption}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <p className="text-white text-2xl font-semibold">{item.caption}</p>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full ${
                i === current ? "bg-white" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* About Us Content */}
      <div className="max-w-6xl mx-auto mt-12 px-6 space-y-16">
        {/* Our Story */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <Image
            src="/assets/images/hero_image_1.jpg"
            alt="Our Story"
            width={500}
            height={350}
            className="rounded-xl shadow-md hover:scale-105 transition-transform"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              We started this journey to make clothing sustainable and
              comfortable while supporting local communities. Our passion is
              innovation, style, and delivering the best experience for our
              customers.
            </p>
          </div>
        </section>

        {/* Our Vision */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              Our vision is to become a trusted fashion brand known for ethical
              production, premium quality, and timeless style worldwide.
            </p>
          </div>
          <Image
            src="/assets/images/hero_image_2.jpg"
            alt="Our Vision"
            width={500}
            height={350}
            className="rounded-xl shadow-md hover:scale-105 transition-transform"
          />
        </section>

        {/* Our Mission */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <Image
            src="/assets/images/hero_image_3.jpg"
            alt="Our Mission"
            width={500}
            height={350}
            className="rounded-xl shadow-md hover:scale-105 transition-transform"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to offer high-quality products that are sustainable,
              affordable, and bring confidence to everyone who wears them.
            </p>
          </div>
        </section>
      </div>
    </div>
          <Footer/>
    </div>
  );
}
