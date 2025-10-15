import toast from "react-hot-toast";
import PrimaryButton from "@/app/components/common-components/primary-button";
import { Check, X, ShoppingCart } from "lucide-react";
import { useState } from "react";
import Image from "next/image"; // Import the Next.js Image component

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

// MODIFIED: The OrderItem interface now includes productId and photoUrl
interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string;
}

interface OrderDetails {
  date: string;
  fName: string;
  lName: string;
  orderStatus: OrderStatus;
}

interface OrderDetailsCardProps {
  order: OrderDetails;
  items: OrderItem[];
  orderId: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const OrderDetailsCard = ({ order, items, orderId }: OrderDetailsCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderStatus = async (status: 'Accepted' | 'Cancelled') => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication error.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status.');
      toast.success(`Order successfully ${status.toLowerCase()}!`);
      window.location.reload(); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => updateOrderStatus('Accepted');
  const handleReject = () => updateOrderStatus('Cancelled');

  const subTotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full border border-gray-100">
      
      {/* Main Order Info Section */}
      <div className="space-y-2 text-sm mb-6">
        <div className="font-medium text-lg">Order ID: <span className="font-semibold">{orderId}</span></div>
        <hr className="my-2"/>
        <div className="font-medium">Customer: <span className="float-right font-normal">{order.fName} {order.lName}</span></div>
        <div className="font-medium">Order Placed: <span className="float-right font-normal">{new Date(order.date).toLocaleDateString()}</span></div>
        <div className="font-medium">Order Total: <span className="float-right font-bold text-base">Rs. {subTotal.toLocaleString()}</span></div>
      </div>

      {/* Items List Section */}
      <div className="mb-6">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600"/>
              Items in this Order
          </h3>
          <div className="space-y-4 border rounded-lg p-3 bg-gray-50/50">
              {items.length > 0 ? (
                  items.map(item => (
                      <div key={item._id} className="grid grid-cols-12 gap-4 items-center text-sm">
                          
                          {/* MODIFICATION: Image Column */}
                          <div className="col-span-2">
                            <Image
                              src={item.photoUrl || '/assets/icons/logo.jpg'} // Use a fallback image if photoUrl is missing
                              alt={item.name}
                              width={80}
                              height={80}
                              className="rounded-md object-cover aspect-square"
                            />
                          </div>

                          {/* MODIFICATION: Name and ID Column */}
                          <div className="col-span-5">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <p className="text-xs text-gray-500">{item.productId}</p>
                          </div>

                          {/* Quantity Column */}
                          <span className="col-span-2 text-gray-600">Qty: {item.quantity}</span>
                          
                          {/* Price Column */}
                          <span className="col-span-3 text-right font-semibold text-gray-900">
                              Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                          </span>
                      </div>
                  ))
              ) : (
                  <p className="text-sm text-gray-500">No items found for this order.</p>
              )}
          </div>
      </div>

      {/* Action Buttons Section with Validation */}
      <div className="mt-6">
        {order.orderStatus === 'Pending' ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Actions</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "ACCEPT ORDER"}
              icon={Check}
              onClick={handleAccept}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className='w-full'>
              <div className={`w-full h-auto rounded-lg p-[1px] bg-red-600 ${isLoading ? 'opacity-50' : ''}`}>
                <button 
                  onClick={handleReject} 
                  type="button" 
                  disabled={isLoading}
                  className='p-3 flex items-center justify-center bg-red-600 hover:bg-red-700 w-full h-full rounded-lg text-white font-bold gap-2 transition-colors disabled:cursor-not-allowed'
                >
                  {isLoading ? "Processing..." : "REJECT ORDER"} <X className="w-5 h-5" /> 
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h4>
            <div className={`w-full text-center p-3 rounded-lg font-bold text-md ${getStatusClasses(order.orderStatus)}`}>
              {order.orderStatus}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsCard;