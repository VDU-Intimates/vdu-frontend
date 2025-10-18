'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Map as MapIcon } from "lucide-react"; // Renamed the import to avoid conflict
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import OrderItemRow from "../../components/order-components/order-item-row";
import ReportDownloader from '../../components/reports/report-downloader';
import FilterDropdown, { FilterType } from "@/app/components/order-components/filter-dropdown";
import SortDropdown from "@/app/components/order-components/sort-dropdown";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "Something went wrong.";
}

const OrderHeatmap = dynamic(() => import('@/app/components/maps/order-heatmap'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"><p className="text-white">Loading Map...</p></div>
});

interface OrderListItem {
  orderId: string;
  totalAmount: number;
  orderStatus: 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
  date: string;
  hasCustomizedItems: boolean;
}

const getAuthToken = (): string | null => localStorage.getItem('access_token');

let socket: Socket;

const OrdersPage = () => {
  const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterType>('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Failed to fetch orders.');
      const response = await fetch(`http://localhost:5000/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch orders.');
      const data: OrderListItem[] = await response.json();
      setAllOrders(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  useEffect(() => {
    socket = io("http://localhost:5000");

    socket.on('connect', () => console.log('🔗 Connected to WebSocket server!'));
    socket.on('new_order', (newOrder: OrderListItem) => {
      console.log("🎉 Frontend received 'new_order' event:", newOrder);
      setAllOrders(prevOrders => [newOrder, ...prevOrders]);
      toast((t) => (
        <div className="flex flex-col gap-3 p-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold">New Order Received!</p>
              <p className="text-sm text-gray-600">Order ID: {newOrder.orderId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                router.push(`/orders/${newOrder.orderId}`);
                toast.dismiss(t.id);
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              View Details
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    });

    return () => {
      socket.off('new_order');
      socket.disconnect();
    };
  }, [router]);

  const filteredAndSortedOrders = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    let processedOrders = [...allOrders];
    if (searchQuery) {
      processedOrders = processedOrders.filter(order => order.orderId.toLowerCase().includes(searchQuery));
    }
    if (statusFilter === 'Customized') {
      processedOrders = processedOrders.filter(order => order.hasCustomizedItems);
    } else if (statusFilter !== 'All') {
      processedOrders = processedOrders.filter(order => order.orderStatus === statusFilter);
    }
    processedOrders.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
    });
    return processedOrders;
  }, [allOrders, statusFilter, sortOrder, searchParams]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="lg:block"><AdminNavBar /></div>
      <main className="flex-1 ml-0 lg:ml-64 pt-16 p-4 lg:p-6"> 
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>

        <div className="mb-6">
          <ReportDownloader 
            title="Download Monthly Order Report"
            apiEndpoint="/reports/monthly-orders"
            fileNamePrefix="Order-Report"
          />
        </div>
        
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-semibold mb-3 sm:mb-0">Real-time Order list</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMapVisible(true)}
                className="flex items-center gap-2 p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <MapIcon className="w-4 h-4" /> {/* Use the aliased name */}
                Map View
              </button>
              <FilterDropdown 
                currentFilter={statusFilter}
                onFilterChange={setStatusFilter}
              />
              <SortDropdown 
                currentSort={sortOrder}
                onSortChange={setSortOrder}
              />
            </div>
          </div>
          
          <div className="hidden md:grid grid-cols-5 gap-4 pb-2 border-b-2 font-semibold text-xs text-gray-500 uppercase px-4">
            <div>Order ID</div>
            <div>Date</div>
            <div>Price</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          <div>
            {loading ? <p className="text-center p-4">Loading...</p> : 
             error ? <p className="text-center p-4 text-red-500">{error}</p> :
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
              )}
          </div>
        </div>
      </main>

      {isMapVisible && (
        <OrderHeatmap 
          isVisible={isMapVisible}
          onClose={() => setIsMapVisible(false)}
        />
      )}
    </div>
  );
};

export default OrdersPage;