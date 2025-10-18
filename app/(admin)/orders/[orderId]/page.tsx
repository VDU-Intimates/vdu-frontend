/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OrderDetailsCard from '../../../components/order-components/order-details-card';

interface OrderDetailsFromAPI {
  // whatever your API returns today:
  price?: number;
  date: string;
  fName?: string;
  lName?: string;
  orderStatus: 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
  discount?: number;
  totalAmount?: number;
  customerName?: string; // some endpoints might already send this
}

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string | null;
  isCustomized?: boolean;           // <-- new
  customPreviewUrl?: string | null; // <-- new
}

const getAuthToken = (): string | null => localStorage.getItem('access_token');

const OrderDetailsPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetailsFromAPI | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    (async () => {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const [mainOrderResponse, itemsResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:5000/api/orders/${orderId}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!mainOrderResponse.ok || !itemsResponse.ok) {
          throw new Error('Failed to fetch complete order data.');
        }

        const main = (await mainOrderResponse.json()) as OrderDetailsFromAPI;
        const its = (await itemsResponse.json()) as OrderItem[];

        setOrder(main);
        setItems(its);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Order...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!order) return <div className="flex justify-center items-center h-screen">Order not found.</div>;

  // 🔧 Normalize the data shape for the card here:
  const orderForCard = {
    date: order.date,
    customerName:
      order.customerName ||
      [order.fName, order.lName].filter(Boolean).join(' ').trim() ||
      'N/A',
    orderStatus: order.orderStatus,
    discount: order.discount ?? 0,
    totalAmount: order.totalAmount ?? order.price ?? 0,
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>
      <div className="max-w-2xl mx-auto">
        <OrderDetailsCard order={orderForCard} items={items} orderId={orderId} />
      </div>
    </main>
  );
};

export default OrderDetailsPage;
