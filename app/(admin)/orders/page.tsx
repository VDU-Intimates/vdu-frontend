'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Filter, ChevronsUpDown } from "lucide-react"; 
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import OrderItemRow from "../../components/order-components/order-item-row";

// Define the possible order statuses
type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
// Define the filter type, including 'All'
type FilterStatus = OrderStatus | 'All';

interface OrderListItem {
  orderId: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  date: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrdersPage = () => {
  // State for the raw data from the API
  const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the interactive UI
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  useEffect(() => {
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
        setAllOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  // useMemo will re-calculate the displayed orders only when the source data or filters change
  const filteredAndSortedOrders = useMemo(() => {
    let processedOrders = [...allOrders];

    // 1. Apply Status Filter
    if (statusFilter !== 'All') {
      processedOrders = processedOrders.filter(order => order.orderStatus === statusFilter);
    }

    // 2. Apply Date Sort
    processedOrders.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });

    return processedOrders;
  }, [allOrders, statusFilter, sortOrder]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  const filterButtons: FilterStatus[] = ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="lg:block"><AdminNavBar /></div>
      <main className="flex-1 ml-0 p-4 lg:p-6"> 
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-semibold mb-3 sm:mb-0">Real-time Order list</h2>
            
            {/* --- FILTER & SORT CONTROLS --- */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'Newest' | 'Oldest')}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Newest">Sort: Newest</option>
                  <option value="Oldest">Sort: Oldest</option>
                </select>
                <ChevronsUpDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
            <Filter className="w-4 h-4 text-gray-500" />
            {filterButtons.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-4 pb-2 border-b-2 font-semibold text-xs text-gray-500 uppercase px-4">
            {/* ... Header remains the same ... */}
          </div>

          <div>
            {loading && <p className="text-center p-4">Loading...</p>}
            {error && <p className="text-center p-4 text-red-500">{error}</p>}
            {!loading && !error && (
              filteredAndSortedOrders.length > 0 ? (
                filteredAndSortedOrders.map((order) => (
                  <OrderItemRow 
                    key={order.orderId}
                    id={order.orderId}
                    price={order.totalAmount}
                    status={order.orderStatus}
                    date={order.date}
                    isSelected={selectedOrderId === order.orderId}
                    onSelect={handleOrderSelect}
                  />
                ))
              ) : (
                <p className="text-center p-8 text-gray-500">No orders match the current filters.</p>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;