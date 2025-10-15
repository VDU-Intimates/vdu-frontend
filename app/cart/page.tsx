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

const API_BASE = 'http://localhost:5000';

interface CartItemType {
  id: string;
  productId: string;     // business productId (string)
  name: string;
  price: number;
  imageUrl: string[];    // main image is imageUrl[0]
  size: string;
  quantity: number;
}

const CartPage = () => {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // align types with DeliveringTo
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: '',
    address: '',
    phoneNumber: '',
    email: '',
    paymentMethod: 'cod', // default
  });

  const getAuthToken = (): string | null => {
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('userToken')
    );
  };

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
      if (!token) return setError('Please log in first.');

      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const transformed: CartItemType[] = data.items.map((it: any) => ({
        id: it._id,
        productId: it.productId,     // business productId
        name: it.productName,
        price: it.price,
        imageUrl: Array.isArray(it.photoUrl) ? it.photoUrl : [it.photoUrl],
        size: it.size,
        quantity: it.quantity,
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

  /**
   * COD flow (unchanged from your logic):
   * - Place order in your system
   * - Create delivery
   * - Clear cart
   * - Redirect to invoice
   */
  const placeOrderCOD = async () => {
    const token = getAuthToken();
    if (!token) { alert('Please log in to place an order'); return; }
    if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber) {
      alert('Please fill in all required delivery information (Full Name, Address, Phone Number)');
      return;
    }
  
    setIsLoading(true);
    try {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const formattedItems = cartItems.map((item) => ({
        name: item.name,
        productId: item.productId,
        customisedProductId: null,
        quantity: item.quantity,
        unitPrice: item.price,
      }));
  
      // NOTE: include paymentType: 'COD'
      const orderResponse = await fetch(`${API_BASE}/api/orders/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subTotal: orderTotals.subtotal,
          deliverFee: orderTotals.deliveryFee,
          discount: orderTotals.discountAmount,
          totalAmount: orderTotals.total,
          date: new Date(),
          quantity: totalQuantity,
          isBulk: totalQuantity > 500,
          items: formattedItems,
          paymentType: 'COD',       // <-- NEW
        }),
      });
  
      if (!orderResponse.ok) {
        if (orderResponse.status === 401) { alert('Session expired. Please log in again.'); return; }
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || `Order API error! status: ${orderResponse.status}`);
      }
  
      const orderData = await orderResponse.json();
      const orderId = orderData.orderId || orderData.order?.orderId;
      if (!orderId) throw new Error('Order placed but no order ID received');
  
      // Best-effort delivery creation
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

  /**
   * Stripe pay-now flow, wired directly here:
   * - Create checkout session on backend
   * - Redirect to Stripe-hosted checkout
   */
  const startStripeCheckout = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Please log in to pay');
      return;
    }
    if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber || !deliveryInfo.email) {
      alert('Please fill in delivery details first');
      return;
    }
  
    setIsLoading(true);
    try {
      // Prepare items with name & image so Stripe checkout looks nice
      const items = cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,             // number in major units (e.g., 1999 => $1,999.00? If you use 1999 as LKR, it's fine; server converts to minor)
        quantity: i.quantity,
        image: i.imageUrl?.[0],     // optional absolute URL, if you have it
      }));
  
      // Send delivery info so server can stash in metadata
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
  
      // If backend returns a URL (recommended), just go there.
      if (data.url) {
        window.location.href = data.url;
        return;
      }
  
      // Otherwise, use session id
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

  /**
   * Decides which flow to run based on selected payment method
   */
  const handleOrderConfirm = async () => {
    if (deliveryInfo.paymentMethod === 'payNow') {
      await startStripeCheckout();
    } else {
      await placeOrderCOD();
    }
  };

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
  
        // 1) Confirm payment and get: items, totals, deliveryInfo (from Stripe metadata)
        const confirmRes = await fetch(`${API_BASE}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId }),
        });
        if (!confirmRes.ok) throw new Error(await confirmRes.text());
        const { items, totals, deliveryInfo: deliveryInfoFromServer } = await confirmRes.json();
  
        // 2) Place the order via your existing API with paymentType ONLINE
        const orderRes = await fetch(`${API_BASE}/api/orders/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            subTotal: totals.subTotal,
            deliverFee: totals.deliveryFee,
            discount: totals.discountAmount,
            totalAmount: totals.totalAmount,
            date: new Date(),
            quantity: items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0),
            isBulk: items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) > 500,
            items,
            paymentType: 'ONLINE',
          }),
        });
        if (!orderRes.ok) throw new Error(await orderRes.text());
        const savedOrder = await orderRes.json();
        const orderId = savedOrder.orderId || savedOrder.order?.orderId;
        if (!orderId) throw new Error('Order placed but no order ID returned');
  
        // 3) Create the Delivery using the server-returned delivery info
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
  
        // 4) Clear cart (best effort)
        try {
          await fetch(`${API_BASE}/api/cart/deleteAll`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}
  
        // 5) Clean the URL and go to Invoice
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
            <button onClick={() => router.back()} className="flex items-center text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
            </button>
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
                    key={item.id}
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
