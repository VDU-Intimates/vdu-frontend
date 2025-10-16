'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Filter, ChevronsUpDown, Paintbrush } from "lucide-react"; 
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import OrderItemRow from "../../components/order-components/order-item-row";
import ReportDownloader from '../../components/reports/report-downloader';
import { useSearchParams } from "next/navigation";
import FilterDropdown from "@/app/components/order-components/filter-dropdown";
import SortDropdown from "@/app/components/order-components/sort-dropdown";

// Define the possible order statuses
type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';
// The filter type now includes 'Customized'
type FilterType = OrderStatus | 'All' | 'Customized';

// The interface now expects the new field from the API
interface OrderListItem {
  orderId: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  date: string;
  hasCustomizedItems: boolean; // This field is required from your API
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
  const [statusFilter, setStatusFilter] = useState<FilterType>('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  const searchParams = useSearchParams();

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

  // useMemo hook to efficiently filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    let processedOrders = [...allOrders];

    // Search filter
    if (searchQuery) {
      processedOrders = processedOrders.filter(order =>
        order.orderId.toLowerCase().includes(searchQuery)
      );
    }

    // Status/Type filter
    if (statusFilter === 'Customized') {
      processedOrders = processedOrders.filter(order => order.hasCustomizedItems);
    } else if (statusFilter !== 'All') {
      processedOrders = processedOrders.filter(order => order.orderStatus === statusFilter);
    }

    // Date sort
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
      <div className="lg:block"><AdminNavBar /></div>
      <main className="flex-1 ml-0 pt-16 lg:pt-0 p-4 lg:p-6"> 
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>

        <div className="mt-12 mb-6">
          <ReportDownloader />
        </div>
        
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-semibold mb-3 sm:mb-0">Real-time Order list</h2>
            
            {/* --- MODIFIED: Restored Dropdown UI --- */}
            <div className="flex items-center gap-4">
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