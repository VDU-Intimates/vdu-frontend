/* eslint-disable @typescript-eslint/no-explicit-any */
// components/order-components/order-details-card.tsx
import toast from "react-hot-toast";
import PrimaryButton from "@/app/components/common-components/primary-button";
import { Check, X, ShoppingCart, Truck, PackageCheck } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import BackButton from "../common-components/back-button";

type OrderStatus = 'Accepted' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered';

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId: string;
  photoUrl: string | null;
  isCustomized?: boolean;
  customPreviewUrl?: string | null;
}

interface OrderDetails {
  date: string;
  customerName: string;
  orderStatus: OrderStatus;
  discount: number;
  totalAmount: number;
}

interface OrderDetailsCardProps {
  order: OrderDetails;
  items: OrderItem[];
  orderId: string;
}

const getAuthToken = () => localStorage.getItem('access_token');

const OrderDetailsCard = ({ order, items, orderId }: OrderDetailsCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateOrderStatus = async (status: OrderStatus) => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) { toast.error("Authentication error."); setIsLoading(false); return; }
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status.');
      toast.success(`Order successfully updated to ${status.toLowerCase()}!`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subTotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
      case 'Accepted':
      case 'Shipped':
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const ActionButton = () => {
    switch (order.orderStatus) {
      case 'Pending':
        return (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Actions</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "ACCEPT ORDER"}
              icon={Check}
              onClick={() => updateOrderStatus('Accepted')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
            />
            <div className={`w-full h-auto rounded-lg p-[1px] bg-red-600 ${isLoading ? 'opacity-50' : ''}`}>
              <button
                onClick={() => updateOrderStatus('Cancelled')}
                disabled={isLoading}
                className="p-3 flex items-center justify-center bg-red-600 hover:bg-red-700 w-full h-full rounded-lg text-white font-bold gap-2 transition-colors disabled:cursor-not-allowed"
              >
                REJECT ORDER <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 'Accepted':
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS SHIPPED"}
              icon={Truck}
              onClick={() => updateOrderStatus('Shipped')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
            />
          </div>
        );
      case 'Shipped':
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Next Step</h4>
            <PrimaryButton
              context={isLoading ? "Processing..." : "MARK AS DELIVERED"}
              icon={PackageCheck}
              onClick={() => updateOrderStatus('Delivered')}
              className={`!w-full !h-auto ${isLoading ? 'opacity-50' : ''}`}
            />
          </div>
        );
      default:
        return (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h4>
            <div className={`w-full text-center p-3 rounded-lg font-bold text-md ${getStatusClasses(order.orderStatus)}`}>
              {order.orderStatus}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full border border-gray-100">
      <BackButton label="Back to All Orders" className="mb-4" />

      {/* Pricing */}
      <div className="space-y-2 text-sm mb-6">
        <div className="font-medium text-lg">Order ID: <span className="font-semibold">{orderId}</span></div>
        <hr className="my-2"/>
        <div className="font-medium">Customer: <span className="float-right font-normal">{order.customerName}</span></div>
        <div className="font-medium">Order Placed: <span className="float-right font-normal">{new Date(order.date).toLocaleDateString()}</span></div>
        <hr className="my-3 border-dashed"/>
        <div className="font-medium">Subtotal: <span className="float-right font-normal">Rs. {subTotal.toLocaleString()}</span></div>
        {order.discount > 0 && (
          <div className="font-medium text-red-500">Discount: <span className="float-right font-normal">- Rs. {order.discount.toLocaleString()}</span></div>
        )}
        <div className="font-bold text-base pt-1">Grand Total: <span className="float-right">Rs. {order.totalAmount.toLocaleString()}</span></div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          Items in this Order
        </h3>
        <div className="space-y-4 border rounded-lg p-3 bg-gray-50/50">
          {items.map(item => {
            const preferred =
            (item.isCustomized && item.customPreviewUrl ? item.customPreviewUrl : item.photoUrl) || null;
          const safeSrc = preferred || '/assets/icons/logo.jpg';
            return (
              <div key={item._id} className="grid grid-cols-12 gap-4 items-center text-sm">
                <div className="col-span-2">
                  <Image
                    src={safeSrc}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover aspect-square bg-gray-100"
                  />
                </div>
                <div className="col-span-5">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <p className="text-xs text-gray-500">{item.productId}</p>
                </div>
                <span className="col-span-2 text-gray-600">Qty: {item.quantity}</span>
                <span className="col-span-3 text-right font-semibold text-gray-900">
                  Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <ActionButton />
      </div>
    </div>
  );
};

export default OrderDetailsCard;
