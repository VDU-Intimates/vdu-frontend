'use client';
import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";
import Image from "next/image";
import BackButton from "../components/common-components/back-button";

// --- TYPE DEFINITIONS ---
// These types must reflect the data structure returned by the backend's getOrderInvoiceById

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// 💡 NEW/MODIFIED INTERFACE: Reflects the delivery data fetched from the Delivery model
interface OrderDeliveryDetails {
  fullName: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
}

interface OrderDetails {
  orderId: string;
  userId: string; 
  date: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  deliveryFee: number;
  items: OrderItem[];
  // CRITICAL: This object is populated from the Delivery model on the backend
  deliveryDetails: OrderDeliveryDetails; 
}

// --- INVOICE PAGE COMPONENT ---

const Invoice = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  // 💡 REMOVED: No need for the separate 'user' state

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    const safeAmount = Number(amount) || 0;
    return safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // 💡 REMOVED: fetchUserForOrder is no longer needed

  // --- FETCH ORDER DETAILS (ONLY) ---
  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
          setError("Authentication required to view invoice.");
          setLoading(false);
          return;
      }
      
      try {
        // Fetch the order, which now includes the deliveryDetails from the backend
        const ordersRes = await fetch(
          `http://localhost:5000/api/orders/get-order-invoice/${orderId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!ordersRes.ok) {
          throw new Error(`Failed to fetch order: ${ordersRes.statusText}`);
        }

        const foundOrder: OrderDetails = await ordersRes.json();

        if (!foundOrder || !foundOrder.orderId) {
          throw new Error(`Order with ID ${orderId} not found`);
        }

        // Set the full order object, including nested delivery details
        setOrder(foundOrder);

      } catch (err) {
        console.error("Error fetching order:", err);
        setError((err as Error).message || "Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };


    fetchOrder();
  }, [orderId]);


  // --- RENDERING LOGIC ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8 text-center">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <NavBar />
        <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8 text-center">
            <p className="text-red-500">Error: {error || "Order not found."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Dates for display
  const orderDate = new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const finalDate = new Date(new Date().setDate(new Date(order.date).getDate() + 30)).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // const dueDateObj = new Date(order.date);
  // dueDateObj.setDate(dueDateObj.getDate() + 30);

  // const dueDate = dueDateObj.toLocaleDateString('en-GB', {
  //   day: '2-digit',
  //   month: '2-digit',
  //   year: 'numeric'
  // });


  // 💡 Extract delivery details for clean rendering
  const delivery = order.deliveryDetails;

  return (
    <div>
      <NavBar />
      <div className="min-h-screen bg-[#D9EAD6] font-poppins flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-5xl shadow-xl rounded-xl p-8 text-sm">
          
            <BackButton label="Back to Cart" className="self-start mb-4"/>
          {/* TOP HEADER SECTION */}
          <div className="flex justify-between pb-6 border-b border-gray-200">
            {/* Left: Company Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Image src="/assets/icons/logo.jpg" alt="VDU" width={40} height={40} className="w-10 h-10 object-cover rounded-full" /> 
                <h1 className="text-xl font-bold text-gray-800">VDU INTIMATES</h1>
              </div>
              <p className="pl-12 text-gray-600">Prasanna Meemana</p>
              <p className="pl-12 text-gray-600">Email: vduintimates@gmail.com</p>
              <p className="pl-12 text-gray-600">Contact: 070 181 2787</p>
            </div>

            {/* Right: Invoice # and Total Amount */}
            <div className="text-right space-y-2">
              <p className="text-gray-500 font-medium">#{order.orderId}</p>
              <div className="mt-4">
                <h4 className="text-lg text-gray-700">Total Amount</h4>
                <p className="text-3xl font-bold text-gray-900">
                  Rs.{formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOMER & DATES SECTION */}
          <div className="grid grid-cols-2 pt-6 pb-6 border-b border-gray-200">
            {/* Left: Dates */}
            <div className="space-y-2 pr-6">
              <p className="flex justify-between">
                <span className="font-semibold">Date</span>
                <span className="text-gray-700">{orderDate}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Due Date</span>
                <span className="text-gray-700">{orderDate}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-xs text-gray-600">Replacement period</span>
                <span className="text-gray-700">30 days after payment</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Final Date</span>
                <span className="text-gray-700">{finalDate}</span>
              </p>
            </div>

            {/* Right: Customer Details - NOW USES DELIVERY DATA */}
            <div className="space-y-2 pl-6 border-l border-gray-100">
              <h3 className="font-bold mb-2">Customer Details</h3>
              {/* 💡 Rendering the specific delivery data */}
              <p>Name: {delivery.fullName || 'N/A'}</p>
              <p>Address: {delivery.address || 'N/A'}</p>
              <p>Email: {delivery.email || 'N/A'}</p>
              <p>Contact: {delivery.phoneNumber || 'N/A'}</p>
              
              <p className="pt-2 text-xs text-gray-500 italic">
                Thank you for your purchase! This invoice serves as a detailed
                record of the products/services you have received, along with their
                quantities, prices, and applicable taxes.
              </p>
            </div>
          </div>

          {/* ITEMS TABLE SECTION */}
          <table className="w-full text-left text-sm mt-6">
            <thead className="text-xs uppercase text-gray-500 border-b border-gray-300">
              <tr>
                <th className="py-2 w-8">N°</th>
                <th className="py-2 w-1/3">ARTICLE</th>
                <th className="py-2 text-right">QUANTITY</th>
                <th className="py-2 text-right">PRICE PER</th>
                <th className="py-2 text-right">TAX</th>
                <th className="py-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {/* Conditional rendering for item rows */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <tr key={item._id || index} className="border-b border-gray-100 h-12">
                    <td className="font-medium text-gray-800">{index + 1}</td>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-right text-gray-700">
                      {item.quantity} Unit(s)
                    </td>
                    <td className="text-right text-gray-700">
                      Rs.{formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-right text-gray-700">
                      Rs.0.00
                    </td>
                    <td className="text-right font-medium text-gray-800">
                      Rs.{formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="h-20">
                    <td colSpan={6} className="text-center text-gray-500">
                        No items found for this order.
                    </td>
                </tr>
              )}
              
              {/* Spacer row to push totals down */}
              <tr className="h-4"><td></td></tr> 
            </tbody>
          </table>
          
          {/* TOTALS FOOTER */}
          <div className="flex justify-end mt-4">
            <div className="w-96 space-y-2">
                
                {/* Total (Subtotal) */}
                <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Sub Total</span>
                    <span className="text-gray-700">Rs.{formatCurrency(order.subTotal)}</span>
                </div>

                {/* Total (Subtotal) */}
                <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Discount</span>
                    <span className="text-red-500">(Rs.{formatCurrency(order.discount)})</span>
                </div>
                
                {/* Deliver Fee */}
                <div className="flex justify-between">
                    <span className="font-medium">Deliver Fee</span>
                    <span className="text-gray-700">Rs.{formatCurrency(order.deliveryFee)}</span>
                </div>
                
                {/* Grand Total */}
                <div className="flex justify-between border-t border-gray-400 pt-2 text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-gray-900">Rs.{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>
          </div>

        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Invoice;