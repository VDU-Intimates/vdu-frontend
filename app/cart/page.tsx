/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CartItem from '../components/cart/cart-item';
import OrderSummary from '../components/cart/order-summary';
import DeliveringTo, { DeliveryInfo } from '../components/cart/delivering-to';
import NavBar from '../components/nav-bar/nav-bar';
import Footer from '../components/footer/footer';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import BackButton from '../components/common-components/back-button';

const API_BASE = 'http://localhost:5000';

type CustomText = {
  content: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  left?: number;
  top?: number;
  angle?: number;
};

interface CartItemType {
  id: string;
  productId: string;
  productName: string;
  price: number;
  photoUrl: string;
  size: string;
  quantity: number;
  custom?: {
    isCustomized?: boolean;
    designId?: string;
    previewUrl?: string;
    imageUrls?: string[];
    texts?: CustomText[];
    color?: string;
    note?: string;
  };
}

const CartPage = () => {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: '',
    address: '',
    phoneNumber: '',
    email: '',
    paymentMethod: 'cod',
  });

  const getAuthToken = (): string | null =>
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('userToken');

  const handleDeliveryInputChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearDeliveryInfo = () => {
    setDeliveryInfo({ fullName: '', address: '', phoneNumber: '', email: '', paymentMethod: 'cod' });
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) { setError('Please log in first.'); return; }

      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const transformed: CartItemType[] = (data.items || []).map((it: any) => ({
        id: it._id,
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        photoUrl: Array.isArray(it.photoUrl) ? (it.photoUrl[0] || '') : (it.photoUrl || ''),
        size: it.size,
        quantity: it.quantity,
        custom: it.custom?.isCustomized
          ? {
              isCustomized: true,
              designId: it.custom.designId || undefined,
              previewUrl: it.custom.previewUrl || undefined,
              imageUrls: Array.isArray(it.custom.imageUrls) ? it.custom.imageUrls : undefined,
              texts: Array.isArray(it.custom.texts) ? it.custom.texts : undefined,
              color: it.custom.color || undefined,
              note: it.custom.note || undefined,
            }
          : undefined,
      }));

      setCartItems(transformed);
    } catch (err) {
      console.error('Fetch cart error:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const orderTotals = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountPercent = 20;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const deliveryFee = 300;
    const total = subtotal - discountAmount + deliveryFee;
    return { subtotal, discountPercent, discountAmount, deliveryFee, total };
  }, [cartItems]);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return handleRemoveItem(itemId);
    const token = getAuthToken();
    await fetch(`${API_BASE}/api/cart/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity: newQty }),
    });
    setCartItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it)));
  };

  const handleRemoveItem = async (itemId: string) => {
    const token = getAuthToken();
    await fetch(`${API_BASE}/api/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const clearCart = async () => {
    try {
      const token = getAuthToken();
      await fetch(`${API_BASE}/api/cart/deleteAll`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // --- COD order
  const placeOrderCOD = async () => {
    const token = getAuthToken();
    if (!token) { alert('Please log in to place an order'); return; }
    if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber) {
      alert('Please fill in all required delivery information (Full Name, Address, Phone Number)');
      return;
    }

    setIsLoading(true);
    try {
      // const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      const formattedItems = cartItems.map((item) => ({
        name: item.productName,
        productId: item.productId,
        size: item.size,
        customisedProductId: item.custom?.designId || null,
        quantity: item.quantity,
        unitPrice: item.price,
        isCustomized: !!item.custom,
        customPreviewUrl: item.custom?.previewUrl || '',
        customImageUrls: item.custom?.imageUrls || [],
        customTexts: item.custom?.texts || [],
      }));

      const orderResponse = await fetch(`${API_BASE}/api/orders/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subTotal: orderTotals.subtotal,
          deliverFee: orderTotals.deliveryFee,
          discount: orderTotals.discountAmount,
          totalAmount: orderTotals.total,
          date: new Date(),
          items: formattedItems,
          paymentType: 'COD',
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Order API error! status: ${orderResponse.status}`);
      }

      const out = await orderResponse.json();
      const orderId = out.orderId || out.order?.orderId;
      if (!orderId) throw new Error('Order placed but no order ID received');

      // create delivery (best-effort)
      try {
        await fetch(`${API_BASE}/api/deliveries/create-delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            orderId,
            deliverFee: orderTotals.deliveryFee,
            customerName: deliveryInfo.fullName,
            address: deliveryInfo.address,
            phone: deliveryInfo.phoneNumber,
            email: deliveryInfo.email || '',
          }),
        });
      } catch (deliveryErr) {
        console.error('Delivery creation failed:', deliveryErr);
      }

      await clearCart();
      setDeliveryInfo({ fullName: '', address: '', phoneNumber: '', email: '', paymentMethod: 'cod' });
      router.push(`/Invoice?orderId=${encodeURIComponent(orderId)}`);
    } catch (error) {
      console.error('COD order error:', error);
      alert((error as Error).message || 'Failed to place order.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Stripe
  const startStripeCheckout = async () => {
    const token = getAuthToken();
    if (!token) { alert('Please log in to pay'); return; }
    if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber || !deliveryInfo.email) {
      alert('Please fill in delivery details first');
      return;
    }

    setIsLoading(true);
    try {
      const items = cartItems.map((i) => ({
        productId: i.productId,
        name: i.productName,
        price: i.price,
        quantity: i.quantity,
        image: i.custom?.previewUrl || i.photoUrl,
        // include size in metadata on backend if you can
        size: i.size,
        custom: i.custom ? { designId: i.custom.designId, color: i.custom.color } : undefined,
      }));

      const resp = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items,
          deliveryInfo,
          totals: {
            subTotal: orderTotals.subtotal,
            discountAmount: orderTotals.discountAmount,
            deliveryFee: orderTotals.deliveryFee,
            total: orderTotals.total,
          },
        }),
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Failed to create checkout session: ${msg}`);
      }

      const data = await resp.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
      if (!pk) throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      const stripe: Stripe | null = await loadStripe(pk);
      if (!stripe) throw new Error('Stripe failed to initialize');

      const { error } = await (stripe as any).redirectToCheckout({ sessionId: data.id });
      if (error) throw error;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      alert((err as Error).message || 'Payment init failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderConfirm = async () => {
    if (deliveryInfo.paymentMethod === 'payNow') {
      await startStripeCheckout();
    } else {
      await placeOrderCOD();
    }
  };

  // --- Stripe success: build items FROM /payments/confirm response (not cartItems)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('payment') === 'success';
    const sessionId = params.get('session_id');
    if (!isSuccess || !sessionId) return;

    const run = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) throw new Error('Not authorized');

        // 1) Confirm the payment -> get canonical items + totals from backend
        const confirmRes = await fetch(`${API_BASE}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId }),
        });
        if (!confirmRes.ok) throw new Error(await confirmRes.text());
        const { items: confirmedItems, totals, deliveryInfo: deliveryInfoFromServer } = await confirmRes.json();

        // 2) Transform confirmed items to OrderItem shape
        // Make sure your backend put `size` + customization into the confirm response's items metadata
        const itemsForOrder = (confirmedItems || []).map((i: any) => ({
          name: i.name,
          productId: i.productId,
          size: i.size,                                  // must be present (from metadata)
          customisedProductId: i.custom?.designId || null,
          quantity: Number(i.quantity || 0),
          unitPrice: Number(i.unitPrice || 0),           // *** already major units from backend ***
          isCustomized: !!i.custom,
          customPreviewUrl: i.image || '',
          customImageUrls: i.custom?.imageUrls || [],
          customTexts: i.custom?.texts || [],
        })).filter((x: any) => x.productId && x.size && x.quantity > 0);

        if (!itemsForOrder.length) {
          throw new Error('No purchasable items returned from payment confirmation');
        }

        // 3) Place order with ONLINE payment
        const orderRes = await fetch(`${API_BASE}/api/orders/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            subTotal: totals.subTotal,
            deliverFee: totals.deliveryFee,
            discount: totals.discountAmount,
            totalAmount: totals.totalAmount,
            date: new Date(),
            items: itemsForOrder,
            paymentType: 'ONLINE',
          }),
        });
        if (!orderRes.ok) throw new Error(await orderRes.text());
        const savedOrder = await orderRes.json();
        const orderId = savedOrder.orderId || savedOrder.order?.orderId;
        if (!orderId) throw new Error('Order placed but no order ID returned');

        // 4) Create Delivery
        try {
          await fetch(`${API_BASE}/api/deliveries/create-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              orderId,
              deliverFee: totals.deliveryFee,
              customerName: deliveryInfoFromServer.fullName,
              address: deliveryInfoFromServer.address,
              phone: deliveryInfoFromServer.phoneNumber,
              email: deliveryInfoFromServer.email || '',
            }),
          });
        } catch (deliveryErr) {
          console.error('Delivery creation failed:', deliveryErr);
        }

        // 5) Clear cart (best-effort)
        try {
          await fetch(`${API_BASE}/api/cart/deleteAll`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}

        // 6) Clean URL & go invoice
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());

        router.push(`/Invoice?orderId=${encodeURIComponent(orderId)}`);
      } catch (e) {
        console.error(e);
        alert((e as Error).message || 'Failed to finalize order.');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div>
      <NavBar />
      <main className="min-h-screen bg-gray-50 p-4 font-poppins">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <BackButton label="Continue Shopping" />
            {cartItems.length > 0 && (
              <button
                onClick={() =>
                  fetch(`${API_BASE}/api/cart/deleteAll`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                  }).then(fetchCartData)
                }
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" /> Clear Cart
              </button>
            )}
          </div>

          {error && !isLoading ? (
            <div className="text-center py-20 bg-white rounded-lg">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={fetchCartData} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-16">Loading...</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button onClick={() => router.push('/AllProducts')} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Cart</h2>
                {cartItems.map((item) => (
                  <CartItem
                    key={`${item.id}:${item.custom?.designId || item.custom?.previewUrl || 'BASE'}`}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                    currency="Rs."
                  />
                ))}
              </div>

              <div className="lg:col-span-2 space-y-6">
                <OrderSummary
                  subtotal={orderTotals.subtotal}
                  discountPercent={orderTotals.discountPercent}
                  discountAmount={orderTotals.discountAmount}
                  deliveryFee={orderTotals.deliveryFee}
                  total={orderTotals.total}
                  currency="Rs."
                />
                <DeliveringTo
                  deliveryInfo={deliveryInfo}
                  onInputChange={handleDeliveryInputChange}
                  onClear={handleClearDeliveryInfo}
                  onOrderConfirm={handleOrderConfirm}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
