'use client';

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react"; 
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import OrderItemRow from "../../components/order-components/order-item-row";

interface OrderListItem {
  orderId: string;
  totalAmount: number;
  orderStatus: 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
  date: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: State to track the ID of the currently expanded order row
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    // ... your fetchAllOrders logic remains the same ...
    const fetchAllOrders = async () => {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      try {
        const response = await fetch(`http://localhost:5000/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const data: OrderListItem[] = await response.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  // NEW: Handler to toggle which order is selected
  const handleOrderSelect = (orderId: string) => {
    // If the clicked order is already selected, deselect it. Otherwise, select it.
    setSelectedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block"><AdminNavBar /></div>
      <main className="flex-1 ml-0 lg:ml-64 pt-0 lg:pt-20 p-4 lg:p-6"> 
        <div className="flex justify-between items-center mb-6 pt-4 lg:pt-0">
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Real-time Order list</h2>
          
          <div className="grid grid-cols-5 gap-4 pb-2 border-b-2 font-semibold text-xs text-gray-500 uppercase px-4">
            {/* ... Header remains the same ... */}
          </div>

          <div>
            {/* ... Loading and Error UI remains the same ... */}
            {!loading && !error && (
              orders.map((order) => (
                <OrderItemRow 
                  key={order.orderId}
                  id={order.orderId}
                  price={order.totalAmount}
                  status={order.orderStatus}
                  date={order.date}
                  // CHANGED: Pass down selection state and handler
                  isSelected={selectedOrderId === order.orderId}
                  onSelect={handleOrderSelect}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;