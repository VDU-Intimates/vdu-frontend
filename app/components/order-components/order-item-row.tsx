'use client';

import { useRouter } from 'next/navigation';
import PrimaryButton from '@/app/components/common-components/primary-button';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, DollarSign, Package } from 'lucide-react';

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
}

interface OrderItemRowProps {
  id: string;
  price: number;
  status: OrderStatus;
  date: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrderItemRow = ({ id, price, status, date, isSelected, onSelect }: OrderItemRowProps) => {
  const router = useRouter();
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSelected && items.length === 0) {
      const fetchItems = async () => {
        setIsLoadingItems(true);
        setError(null);
        const token = getAuthToken();
        try {
          const response = await fetch(`http://localhost:5000/api/orders/${id}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Could not fetch items.');
          const data: OrderItem[] = await response.json();
          setItems(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoadingItems(false);
        }
      };
      fetchItems();
    }
  }, [isSelected, id, items.length]);

  const handleViewOrderDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    router.push(`/orders/${id}`);
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      'Accepted': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Shipped': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Desktop View - Grid Layout */}
      <div
        className={`hidden md:grid grid-cols-5 gap-4 items-center py-3 px-4 text-sm cursor-pointer border-b ${
          isSelected ? 'bg-yellow-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => onSelect(id)}
      >
        <div className="truncate font-medium text-gray-800">{id}</div>
        <div className="text-gray-600">{new Date(date).toLocaleDateString()}</div>
        <div className="font-semibold text-gray-900">Rs. {price.toLocaleString()}</div>
        <div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <div className="flex justify-end">
          <PrimaryButton
            context="View Details"
            onClick={handleViewOrderDetails}
            className="!w-full !h-9"
          />
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div
        className={`md:hidden border-b ${isSelected ? 'bg-yellow-50' : 'bg-white'}`}
        onClick={() => onSelect(id)}
      >
        <div className="p-4 cursor-pointer">
          {/* Order ID and Status */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Order ID</p>
              <p className="font-semibold text-sm text-gray-900 break-all">{id}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ml-2 ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          {/* Date and Price */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-semibold text-gray-900">Rs. {price.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
              }}
              className="flex items-center gap-1 text-sm text-blue-600 font-medium"
            >
              {isSelected ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Items
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Items
                </>
              )}
            </button>
            <PrimaryButton
              context="View Details"
              onClick={handleViewOrderDetails}
              className="!h-8 !text-xs"
            />
          </div>
        </div>
      </div>

      {/* Expandable Items Section - Responsive */}
      {isSelected && (
        <div className="p-4 bg-gray-50 border-b">
          {isLoadingItems && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Package className="h-4 w-4 animate-pulse" />
              <span>Loading items...</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoadingItems && !error && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items:
              </h4>
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item._id}
                      className="bg-white p-3 rounded-lg border border-gray-200"
                    >
                      {/* Desktop Item Layout */}
                      <div className="hidden md:grid grid-cols-3 gap-4 text-xs">
                        <span className="col-span-1 text-gray-700 font-medium">{item.name}</span>
                        <span className="col-span-1 text-gray-500">Quantity: {item.quantity}</span>
                        <span className="col-span-1 text-gray-800 font-semibold">
                          Rs. {item.unitPrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Mobile Item Layout */}
                      <div className="md:hidden space-y-2">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-gray-900 font-semibold">
                            Rs. {item.unitPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 pl-4">No items found for this order.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OrderItemRow;