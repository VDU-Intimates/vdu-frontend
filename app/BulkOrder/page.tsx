'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
} from 'lucide-react';
import { toast } from "react-hot-toast";
import Buttons from '../components/common-components/button';
import Footer from '../components/footer/footer';
import NavBar from '../components/nav-bar/nav-bar';

type Product = {
  id: string;
  name: string;
  category: 'T-Shirt' | 'Intimate';
  price: number;
  img: string;
  sizes: Array<'S' | 'M' | 'L' | 'XL'>;
  stock: number;
};

const ALL_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'W-T Shirt', 
    category: 'T-Shirt', 
    price: 500, 
    img: '/assets/images/placeholder-tshirt.jpg', 
    sizes: ['S','M','L','XL'], 
    stock: 120 
  },
  { 
    id: 'p2', 
    name: 'M-T Shirt', 
    category: 'T-Shirt', 
    price: 500, 
    img: '/assets/images/placeholder-tshirt.jpg', 
    sizes: ['S','M','L','XL'], 
    stock: 75 },
  { 
    id: 'p3', 
    name: 'W-Undergarment', 
    category: 'Intimate', 
    price: 500, 
    img: '/assets/images/placeholder-tshirt.jpg', 
    sizes: ['S','M','L','XL'], 
    stock: 140 },
  { 
    id: 'p4', 
    name: 'M-Undergarment', 
    category: 'Intimate', 
    price: 500, 
    img: '/assets/images/placeholder-tshirt.jpg', 
    sizes: ['S','M','L','XL'], 
    stock: 95 },
  { 
    id: 'p5', 
    name: 'C-T Shirt', 
    category: 'T-Shirt', 
    price: 500, 
    img: '/assets/images/placeholder-tshirt.jpg', 
    sizes: ['S','M','L','XL'], 
    stock: 60 
  },
  
];

type Line = {
  id: string;
  size: Product['sizes'][number];
  qty: number;
  selected: boolean;
};

const BulkOrders = () => {
  const [lines, setLines] = useState<Record<string, Line>>(
    Object.fromEntries(
      ALL_PRODUCTS.map((p) => [
        p.id,
        { id: p.id, size: p.sizes[0], qty: 500, selected: p.id === 'p1' },
      ]),
    ),
  );

  const toggle = (id: string) =>
    setLines((s) => ({ ...s, [id]: { ...s[id], selected: !s[id].selected } }));

  const changeSize = (id: string, size: Line['size']) =>
    setLines((s) => ({ ...s, [id]: { ...s[id], size } }));

  const changeQty = (id: string, delta: number) =>
    setLines((s) => {
      const next = Math.max(1, (s[id]?.qty ?? 1) + delta);
      return { ...s, [id]: { ...s[id], qty: next } };
    });

  const selected = useMemo(
    () =>
      ALL_PRODUCTS.filter((p) => lines[p.id]?.selected).map((p) => ({
        product: p,
        line: lines[p.id],
        total: p.price * (lines[p.id]?.qty ?? 1),
      })),
    [lines],
  );

  const cartTotal = selected.reduce((sum, x) => sum + x.total, 0);

  return (
    <div>
      <NavBar />
    
    <main className="min-h-screen py-20 font-poppins max-md:px-5 max-[1085px]:overflow-x-scroll">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* LEFT: All products table */}
          <section className="rounded-xl bg-[#bfcfbf]/65 shadow-sm ring-1 ring-black/5">
            <header className="px-5 py-4 text-xl font-semibold text-gray-800 underline">
              All Products
            </header>

            {/* Table wrapper: horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className=" bg-[#608860] border-b-1 text-white">
                  <tr className="text-left">
                    <th className="w-14 px-5 py-3"></th>
                    <th className="min-w-[220px] px-5 py-3">Product</th>
                    <th className="w-28 px-5 py-3">Price</th>
                    <th className="w-44 px-5 py-3">Size</th>
                    <th className="w-40 px-5 py-3">Quantity</th>
                    <th className="w-16 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500">
                  {ALL_PRODUCTS.map((p) => {
                    const line = lines[p.id];
                    return (
                      <tr key={p.id} className="align-middle">
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            className="size-4 accent-emerald-600"
                            checked={!!line?.selected}
                            onChange={() => toggle(p.id)}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 overflow-hidden rounded-md ring-1
                                       ring-gray-200 shrink-0">
                              <Image
                                src={p.img}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {p.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {p.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-gray-700 font-semibold">
                          Rs. {p.price.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-1 rounded-md border
                                         border-gray-300 bg-white px-2.5 py-1.5 cursor-pointer ">
                            <select
                              className="bg-transparent outline-none cursor-pointer"
                              value={line.size}
                              onChange={(e) =>
                                changeSize(p.id, e.target.value as Line['size'])
                              }
                            >
                              {p.sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="inline-flex items-center gap-2 rounded-md border
                                      border-gray-300 bg-white px-2 py-1.5"
                          >
                            {/* Decrease */}
                            <button
                              className="rounded-md p-1 hover:bg-gray-100"
                              onClick={() => {
                                if (line.qty > 500) {
                                  changeQty(p.id, -1);
                                } else {
                                  toast.error("Minimum of 500 quantity is required for bulk orders");
                                }
                              }}
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4 cursor-pointer" />
                            </button>

                            {/* Editable input */}
                            <input
                              type="number"
                              value={line.qty}
                              min={500}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                if (newValue < 500) {
                                  toast.error("Minimum of 500 quantity is required for bulk orders");
                                  changeQty(p.id, 500 - line.qty); // reset to 500
                                } else {
                                  changeQty(p.id, newValue - line.qty);
                                }
                              }}
                              className="w-14 text-center tabular-nums border-none focus:ring-0 outline-none"
                            />

                            {/* Increase */}
                            <button
                              className="rounded-md p-1 hover:bg-gray-100"
                              onClick={() => changeQty(p.id, +1)}
                              aria-label="Increase"
                            >
                              <Plus className="h-4 w-4 cursor-pointer" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {line.selected ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* RIGHT: Selected products */}
          <section className="rounded-xl border border-black/10 bg-[#e5d8bd] p-4 sm:p-6">
            <h2 className="mb-4 text-center text-xl font-semibold underline">
              Your Products
            </h2>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 xl:px-10 lg:min-w-[300px]">
              {selected.map(({ product, line, total }) => (
                <article
                  key={product.id}
                  className="rounded-xl bg-white shadow-sm ring-1 ring-black/40 gap-5 lg:min-w-[300px]"
                >
                  <div className="p-3">
                    <div className="relative mx-auto h-40 w-full overflow-hidden rounded-lg">
                      <Image
                        src={product.img}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="mt-3 rounded-lg border flex flex-col gap-2 border-gray-200 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">Product Name</span>
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">Size</span>
                        <span className="font-medium">{line.size}</span>
                      </div>
                        
                      <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">Quantity</span>
                          <span className="font-medium">{line.qty}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">Total Price</span>
                        <span className="font-bold">
                          Rs. {total.toLocaleString()}
                        </span>
                      </div>

                      {/* Row of qty + delete (optional) */}
                      <div className="mt-2 flex items-center gap-3 justify-between">
                        <div className="inline-flex items-center gap-2 rounded-md border
                                       border-gray-300 bg-white px-2 py-1">
                          <button
                            className="rounded-md p-1 hover:bg-gray-100"
                            onClick={() => changeQty(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            className="rounded-md p-1 hover:bg-gray-100"
                            onClick={() => changeQty(product.id, +1)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span onClick={() => toggle(product.id)}>
                            <Buttons context='Remove'
                                     combo='redTransparent' icon={Trash2}/>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {selected.length === 0 && (
                <p className="col-span-full rounded-lg bg-white/70 p-6 text-center text-sm text-gray-600">
                  No products selected yet. Tick items on the left to add them
                  here.
                </p>
              )}
            </div>

            {/* Footer button */}
            <div className='mt-6 flex justify-center'>
              {selected.length === 0? <Buttons context={`ADD TO CART -  Rs. ${cartTotal.toLocaleString()}`} icon={ShoppingCart} disabled/>
              : <Buttons context={`ADD TO CART -  Rs. ${cartTotal.toLocaleString()}`} icon={ShoppingCart}/>}
              
            </div>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </div>
  );
}

export default BulkOrders;