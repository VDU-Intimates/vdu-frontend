import React, { useEffect, useState } from 'react'
import Buttons from '../../common-components/button';
import Link from 'next/link';
import { CreditCard, ShoppingCart } from 'lucide-react';
import Image from 'next/image';


const API_BASE ="http://localhost:5000";

/* ---- Types must match your backend ---- */
type ApiProduct = {
  _id: string;
  productId: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string;
  category: string;
};

const NewArrivals = () => {

    const [items, setItems] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
    
        async function load() {
          try {
            setErr(null);
            setLoading(true);
    
            // Grab the latest 6 products; tweak sort/limit to your needs
            const res = await fetch(
              `${API_BASE}/api/products?sort=-createdAt&limit=6`,
              { cache: "no-store" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: { data: ApiProduct[] } = await res.json();
            if (!cancelled) setItems(json.data || []);
          } catch (e: unknown) {
            if (!cancelled)
              setErr(e instanceof Error ? e.message : "Failed to load products");
          } finally {
            if (!cancelled) setLoading(false);
          }
        }
    
        load();
        return () => {
          cancelled = true;
        };
      }, []);



  return (
    <section className="py-10 bg-[#e1f1dc]">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-green-900 mb-6">NEW ARRIVALS</h2>

        {loading && (
          <p className="text-sm text-gray-600">Loading new arrivals…</p>
        )}
        {err && (
          <p className="text-sm text-red-600">Error: {String(err)}</p>
        )}
        {!loading && !err && items.length === 0 && (
          <p className="text-sm text-gray-600">No products found.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.productId || p._id}
              className="rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={p.photoUrl || "/assets/images/placeholder-tshirt.jpg"}
                  alt={p.productName}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>

              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold line-clamp-2">{p.productName}</h3>
                <p className="text-gray-500 text-sm">{p.category}</p>
                <p className="font-bold text-lg">Rs.{p.price}</p>

                <div className="flex gap-2 mt-3">
                  <Buttons
                    context="Add To Cart"
                    icon={ShoppingCart}
                    productId={p.productId}
                    // if you need a size here, pass default from p.sizes?.[0]
                    className="w-full"
                  />
                  <Link href={`/ProductDetail?id=${encodeURIComponent(p.productId)}`}>
                    <Buttons
                      context="Buy"
                      icon={CreditCard}
                      className="w-full"
                      combo="beigeGreen"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/AllProduct">
            <Buttons context="Shop More" combo="beigeGreen" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NewArrivals