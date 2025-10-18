'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Minus, Plus, Trash2, ShoppingCart, PlusIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Buttons from '../components/common-components/button';
import Footer from '../components/footer/footer';
import NavBar from '../components/nav-bar/nav-bar';
import Link from 'next/link';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message?: unknown }).message);
  }
  return 'Something went wrong.';
}

const API_BASE = 'http://localhost:5000';
const MIN_QTY = 500;

type Product = {
  _id: string;             // <-- add this
  productId: string;       // business id (keep for display)
  productName: string;
  price: number;
  photoUrl: string[];
  category: string;
  sizes?: string[];
};

type AddToCartItem = {
  productId: string;   // can be business productId or Mongo _id (controller resolves either)
  size: string;
  quantity: number;
};

type SelectionItem = {
  // populated document from backend:
  productId: Product | null;      // populated Product doc
  size: string;
  qty: number;
  status: 'in_review' | 'in_cart' | 'ordered' | 'removed'; // <-- NEW
  unitPriceSnapshot?: number;        // optional snapshots from backend
  productNameSnapshot?: string;
};

type SelectionDoc = { items: SelectionItem[] };

type RowState = {
  size: string;
  qty: number;
  selected: boolean;
};

function getToken() {
  try {
    return localStorage.getItem('access_token') || '';
  } catch {
    return '';
  }
}

export default function BulkOrders() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [review, setReview] = useState<SelectionItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  // Load products
  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error(`Failed products (${res.status})`);
        const payload = await res.json();
        const list: Product[] = payload?.data || payload || [];
        setProducts(list);

        // init per Mongo _id
        const init: Record<string, RowState> = {};
        for (const p of list) init[p._id] = { size: (p.sizes?.[0] ?? 'M'), qty: MIN_QTY, selected: false };
        setRows(init);
      } catch (e) {
        toast.error(getErrorMessage(e) || 'Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, []);

  // Load current review selection
  const loadReview = async () => {
    setLoadingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/selections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Failed review (${res.status})`);
      const doc: SelectionDoc = await res.json();
      setReview(doc?.items || []);
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Failed to load review');
    } finally {
      setLoadingReview(false);
    }
  };
  useEffect(() => {
    loadReview();
  }, []);

  const bulkItems: AddToCartItem[] = useMemo(() => {
    return review
      .filter(
        (it) =>
          it.status === 'in_review' &&
          typeof it.productId === 'object' &&
          it.productId !== null
      )
      .map((it) => {
        const p = it.productId as Product;
        // Prefer business productId if present; fall back to Mongo _id
        const idForCart = p.productId || p._id;
        return {
          productId: idForCart,
          size: it.size,
          quantity: it.qty,
        };
      });
  }, [review]);

  const toggle = (id: string) =>
    setRows((s) => ({ ...s, [id]: { ...s[id], selected: !s[id]?.selected } }));

  const changeSize = (id: string, size: string) =>
    setRows((s) => ({ ...s, [id]: { ...s[id], size } }));

  const setQty = (id: string, nextQty: number) =>
    setRows((s) => ({ ...s, [id]: { ...s[id], qty: Math.max(MIN_QTY, nextQty) } }));

  const selectedIds = useMemo(
    () => products.filter((p) => rows[p._id]?.selected).map((p) => p._id), // <-- use _id
    [products, rows]
  );

  const addSelected = async () => {
    if (selectedIds.length === 0) {
      toast('No items selected');
      return;
    }
    const items = selectedIds.map((id) => ({
      productId: id,            // <-- send Mongo _id to backend
      size: rows[id].size,
      qty: rows[id].qty,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/selections/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Add failed (${res.status}) ${text}`);
      }

      // unselect
      setRows((s) => {
        const copy = { ...s };
        for (const id of selectedIds) copy[id] = { ...copy[id], selected: false };
        return copy;
      });

      await loadReview();
      toast.success('Items added to review');
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Failed to add items');
    }
  };

  const removeOne = async (mongoId: string | null, size: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/selections/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId: mongoId, size }), // send Mongo _id
      });
      if (!res.ok) throw new Error('Remove failed');
      toast.success('Removed');
      await loadReview();
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Failed to remove');
    }
  };

  // const totalValue = useMemo(
  //   () =>
  //     review.reduce((sum, it) => {
  //       const price = it.productId?.price ?? 0;
  //       return sum + price * it.qty;
  //     }, 0),
  //   [review]
  // );

  return (
    <div>
      <NavBar />
      <main className="min-h-screen py-20 font-poppins max-md:px-5 max-[1085px]:overflow-x-scroll">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* LEFT: All Products */}
          <section className="rounded-xl bg-[#bfcfbf]/65 shadow-sm ring-1 ring-black/5">
            <header className="px-5 py-4 text-xl font-semibold text-gray-800 underline flex items-center justify-between">
              <span>All Products</span>
              <button
                onClick={addSelected}
                className="rounded-lg px-4 py-2 point bg-[#608860] text-white text-sm disabled:opacity-60"
                disabled={loadingProducts || selectedIds.length === 0}
              >
                Add Selected Items ({selectedIds.length})
              </button>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#608860] text-white">
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
                  {loadingProducts && (
                    <tr>
                      <td className="px-5 py-4 text-gray-700" colSpan={6}>
                        Loading products…
                      </td>
                    </tr>
                  )}

                  {!loadingProducts && products.length === 0 && (
                    <tr>
                      <td className="px-5 py-4 text-gray-700" colSpan={6}>
                        No products found.
                      </td>
                    </tr>
                  )}

                  {!loadingProducts &&
                    products.map((p) => {
                      const row = rows[p._id] || { size: 'M', qty: MIN_QTY, selected: false };
                      return (
                        <tr key={p._id} className="align-middle">
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              className="size-4 accent-emerald-600"
                              checked={row.selected}
                              onChange={() => toggle(p._id)}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative size-10 overflow-hidden rounded-md ring-1 ring-gray-200 shrink-0">
                                <Image
                                  src={p.photoUrl[0] || '/assets/images/placeholder-tshirt.jpg'}
                                  alt={p.productName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{p.productName}</div>
                                <div className="text-xs text-gray-600">{p.category}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-4 text-gray-700 font-semibold">
                            Rs. {Number(p.price).toLocaleString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 cursor-pointer">
                              <select
                                className="bg-transparent outline-none cursor-pointer"
                                value={row.size}
                                onChange={(e) => changeSize(p._id, e.target.value)}
                              >
                                {(p.sizes?.length ? p.sizes : ['S', 'M', 'L', 'XL']).map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1.5">
                              <button
                                className="rounded-md p-1 hover:bg-gray-100"
                                onClick={() => {
                                  if (row.qty <= MIN_QTY) {
                                    toast.error(`Minimum of ${MIN_QTY} for bulk orders`);
                                    setQty(p._id, MIN_QTY);
                                  } else {
                                    setQty(p._id, row.qty - 1);
                                  }
                                }}
                                aria-label="Decrease"
                              >
                                <Minus className="h-4 w-4 cursor-pointer" />
                              </button>

                              <input
                                type="number"
                                value={row.qty}
                                min={MIN_QTY}
                                onChange={(e) => {
                                  const next = Number(e.target.value);
                                  if (Number.isFinite(next) && next >= MIN_QTY) setQty(p._id, next);
                                  else {
                                    toast.error(`Minimum of ${MIN_QTY} for bulk orders`);
                                    setQty(p._id, MIN_QTY);
                                  }
                                }}
                                className="w-16 text-center tabular-nums border-none focus:ring-0 outline-none"
                              />

                              <button
                                className="rounded-md p-1 hover:bg-gray-100"
                                onClick={() => setQty(p._id, row.qty + 1)}
                                aria-label="Increase"
                              >
                                <Plus className="h-4 w-4 cursor-pointer" />
                              </button>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {row.selected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                          </td>
                        </tr>
                      );
                    })}

                  <tr>
                    <td className="px-5 py-4" colSpan={6}>
                      <Buttons
                        onClick={addSelected}
                        disabled={loadingProducts || selectedIds.length === 0}
                        context={`Add ${selectedIds.length} Selected Items `}
                        icon={PlusIcon}
                        className="w-full rounded-lg px-4 py-2 bg-[#608860] text-white text-sm disabled:opacity-60"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* RIGHT: Review Selection */}
          <section className="rounded-xl border border-black/10 bg-[#e5d8bd] p-4 sm:p-6">
  <h2 className="mb-4 text-center text-xl font-semibold underline">Review Selection</h2>

  {loadingReview && <p className="text-sm text-gray-600">Loading selection…</p>}

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 xl:px-10 lg:min-w-[300px]">
    {!loadingReview && review.length === 0 && (
      <p className="col-span-full rounded-lg bg-white/70 p-6 text-center text-sm text-gray-600">
        Nothing here yet. Select items on the left and press “Add Selected Items”.
      </p>
    )}

    {review.map((it) => {
      // it.productId may be: populated object | string id | null
      const productObj = typeof it.productId === 'object' && it.productId !== null ? it.productId : null;
      const productIdRaw =
        productObj?._id ??
        (typeof it.productId === 'string' ? it.productId : null);

      const unavailable = !productObj;
      const imgSrc =
        productObj?.photoUrl?.[0] ?? '/assets/images/placeholder-tshirt.jpg';
      const productName = productObj?.productName ?? 'Product unavailable (deleted)';
      const unitPrice = Number(productObj?.price ?? 0);
      const lineTotal = unitPrice * it.qty;

      return (
        <article
          key={`${productIdRaw ?? 'missing'}-${it.size}`}
          className={`rounded-xl bg-white shadow-sm ring-1 gap-5 lg:min-w-[300px] ${
            unavailable ? 'ring-red-300' : 'ring-black/40'
          }`}
        >
          <div className="p-3">
            <div className="relative mx-auto h-40 w-full overflow-hidden rounded-lg">
              <Image
                src={imgSrc}
                alt={productName}
                fill
                className="object-cover"
              />
              {unavailable && (
                <span className="absolute top-2 left-2 rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-semibold text-white">
                  Unavailable / Deleted
                </span>
              )}
            </div>

            <div className="mt-3 rounded-lg border flex flex-col gap-2 border-gray-200 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Product Name</span>
                <span className={`font-medium ${unavailable ? 'text-red-700' : 'text-gray-900'}`}>
                  {productName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Size</span>
                <span className="font-medium">{it.size}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Quantity</span>
                <span className="font-medium">{it.qty}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Total Price</span>
                <span className="font-bold">
                  {unavailable ? (
                    <span className="text-red-700">N/A</span>
                  ) : (
                    <>Rs. {lineTotal.toLocaleString()}</>
                  )}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 justify-between">
                <span className={`text-xs ${unavailable ? 'text-red-700' : 'text-gray-600'}`}>
                  {unavailable ? 'This product has been removed from the catalog.' : 'In Review'}
                </span>

                {/* Only enable remove if we have some id to send */}
                <span>
                <Buttons
                  context={unavailable ? 'Remove entry' : 'Remove'}
                  combo="redTransparent"
                  icon={Trash2}
                  onClick={() => {
                    removeOne(productIdRaw ?? null, it.size);
                  }}
                />
                </span>
              </div>
            </div>
          </div>
        </article>
      );
    })}
  </div>

  <div className='flex justify-end my-5'>
    <span className='w-fit h-fit  p-2 text-[#278039] rounded shadow-md shadow-[#278039] border-dark-green border-2
                   font-bold text-md bg-[#dbbf92]'>
        TOTAL -  Rs.{review
      .filter((it) => typeof it.productId === 'object' && it.productId)
      .reduce((sum, it) => sum + Number((it.productId as Product).price ?? 0) * it.qty, 0)
      .toLocaleString()}
    </span>
  </div>
  {/* Use only available items to compute the total */}
  <div className="mt-6 flex justify-center">
    
    {getToken() !== '' ? (
      <div>
        <Link href="#">
        <Buttons
        context={`ADD TO CART`}
        icon={ShoppingCart}
        disabled={review.filter((it) => typeof it.productId === 'object' && it.productId && it.status === 'in_review').length === 0}
        items={bulkItems}
        />
        </Link>
      </div>
      
    ) : (
      <Link href="/Login">
        <Buttons
        context={`ADD TO CART`}
        icon={ShoppingCart}
        disabled={review.filter((it) => typeof it.productId === 'object' && it.productId && it.status === 'in_review').length === 0}
        items={bulkItems}
        />
      </Link>
    )}
  </div>
</section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
