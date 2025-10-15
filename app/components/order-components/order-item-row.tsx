'use client';

import { useRouter } from 'next/navigation';
import PrimaryButton from '@/app/components/common-components/primary-button';
import { useState, useEffect } from 'react';

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

// NEW: Interface for the items within an order
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
  onSelect: (id: string) => void; // Function to tell the parent it was clicked
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrderItemRow = ({ id, price, status, date, isSelected, onSelect }: OrderItemRowProps) => {
  const router = useRouter();
  
  // NEW: State for this specific row's items
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Fetch items only when this row is selected
  useEffect(() => {
    // Only fetch if the row is selected and we haven't fetched items yet
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
  }, [isSelected, id, items.length]); // Dependencies for the effect

  const handleViewOrderDetails = () => {
    router.push(`/orders/${id}`);
  };

  return (
    // Use a fragment to group the row and its expandable content
    <>
      {/* The main clickable row */}
      <div
        className={`grid grid-cols-5 gap-4 items-center py-3 px-4 text-sm cursor-pointer border-b ${
          isSelected ? 'bg-yellow-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => onSelect(id)} // Tell the parent page this row was clicked
      >
        <div className="truncate font-medium text-gray-800">{id}</div>
        <div className="text-gray-600">{new Date(date).toLocaleDateString()}</div>
        <div className="font-semibold text-gray-900">Rs. {price.toLocaleString()}</div>
        <div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium`}>{status}</span>
        </div>
        <div className="flex justify-end">
          <PrimaryButton
            context="View Details"
            onClick={handleViewOrderDetails}
            className="!w-full !h-9"
          />
        </div>
      </div>

      {/* NEW: Conditionally rendered expandable section for items */}
      {isSelected && (
        <div className="p-4 bg-gray-50 border-b">
          {isLoadingItems && <p className="text-sm text-gray-500">Loading items...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoadingItems && !error && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Order Items:</h4>
              {items.length > 0 ? (
                items.map(item => (
                  <div key={item._id} className="grid grid-cols-3 gap-4 text-xs pl-4">
                    <span className="col-span-1 text-gray-700">{item.name}</span>
                    <span className="col-span-1 text-gray-500">Quantity: {item.quantity}</span>
                    <span className="col-span-1 text-gray-800">Price: Rs. {item.unitPrice.toLocaleString()}</span>
                  </div>
                ))
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