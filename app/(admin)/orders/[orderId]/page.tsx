'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OrderDetailsCard from '../../../components/order-components/order-details-card'; // Adjust path if needed

// Main order details from GET /api/orders/:orderId
interface OrderDetailsFromAPI {
  price: number;
  date: string;
  fName: string;
  lName: string;
  orderStatus: 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
}

// Item details from GET /api/orders/:orderId/items
interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrderDetailsPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetailsFromAPI | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchAllOrderData = async () => {
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
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`http://localhost:5000/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        ]);

        if (!mainOrderResponse.ok || !itemsResponse.ok) {
          throw new Error('Failed to fetch complete order data.');
        }

        const mainOrderData = await mainOrderResponse.json();
        const itemsData = await itemsResponse.json();
        
        setOrder(mainOrderData);
        setItems(itemsData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrderData();
  }, [orderId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading Order...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!order) {
    return <div className="flex justify-center items-center h-screen">Order not found.</div>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>
      <div className="max-w-2xl mx-auto">
        <OrderDetailsCard order={order} items={items} orderId={orderId} />
      </div>
    </main>
  );
};

export default OrderDetailsPage;