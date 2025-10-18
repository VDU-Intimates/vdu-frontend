'use client'
import React, { useEffect, useState } from "react";
import NavBar from "../components/nav-bar/nav-bar";
import Footer from "../components/footer/footer";

const Invoice = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState({
    fName: "",
    lName: "",
    address: "",
    email: "",
    contact: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch specific order and user details
  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required");
      setLoading(false);
      return;
    }

    const fetchOrderAndUser = async () => {
      try {
        // Fetch all orders first (you might want to create a specific endpoint for single order)
        const ordersRes = await fetch(
          "http://localhost:5000/api/orders/get-order-invoice"
        );
        
        if (!ordersRes.ok) {
          throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
        }

        const ordersData = await ordersRes.json();
        
        // Find the specific order by orderId
        const foundOrder = ordersData.find(o => o.orderId === orderId);
        
        if (!foundOrder) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        
        setOrder(foundOrder);
        
        // Fetch user details for this order
        await fetchUserForOrder(foundOrder.userId);
        
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndUser();
  }, [orderId]);

  // Fetch user details for the order
  const fetchUserForOrder = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/me/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch user ${userId}:`, res.status);
        return;
      }

      const data = await res.json();
      if (data.user) {
        setUser({
          fName: data.user.fName || "",
          lName: data.user.lName || "",
          address: data.user.address || "",
          email: data.user.email || "",
          contact: data.user.contact || "",
        });
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
  };

  if (loading) {
    return (
      
      <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8 text-center">
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>

      <NavBar />
      <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8 text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
      <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8 text-center">
          <p className="text-gray-500">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
    <NavBar />
    <div className="min-h-screen bg-[#D9EAD6] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-5xl shadow-lg rounded-xl p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          {/* Logo + Company */}
          <div>
            <img src="/assets/logo.jpg" alt="VDU Logo" className="w-24 mb-3" />
            <h2 className="text-xl font-bold">VDU INTIMATES</h2>
            <p className="text-sm">Prasanna Meemana</p>
            <p className="text-sm">Email: vduintimates@gmail.com</p>
            <p className="text-sm">Contact: 070 181 2787</p>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">
              Order ID: {order.orderId}
            </p>
            <h3 className="text-2xl font-bold text-gray-700">
              Total: Rs.{order.totalAmount.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Dates and Customer Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-1 text-sm">
            <p>
              Date: {new Date(order.date).toLocaleDateString()}
            </p>
            <p>Due Date: {new Date().toLocaleDateString()}</p>
            <p>Replacement Period: 30 days after the payment</p>
            <p>
              Final Date:{" "}
              {new Date(
                new Date().setDate(new Date().getDate() + 30)
              ).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Customer Details</h4>
            <p>
              Name: {user.fName} {user.lName}
            </p>
            <p>Address: {user.address || 'N/A'}</p>
            <p>Email: {user.email}</p>
            <p>Contact: {user.contact || 'N/A'}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Price per</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, itemIndex) => (
              <tr key={itemIndex} className="border-t">
                <td className="p-3">{itemIndex + 1}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-right font-mono tabular-nums">
                  {item.quantity}
                </td>
                <td className="p-3 text-right font-mono tabular-nums">
                  Rs.{item.unitPrice.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono tabular-nums">
                  Rs.{(item.quantity * item.unitPrice).toLocaleString()}
                </td>
              </tr>
            ))}

            {/* Subtotal Row */}
            <tr className="border-t bg-gray-50">
              <td colSpan="4" className="p-3 text-right font-medium">
                Subtotal
              </td>
              <td className="p-3 text-right font-mono tabular-nums">
                Rs.{order.subTotal.toLocaleString()}
              </td>
            </tr>

            {/* Discount Row - Only show if discount > 0 */}
            {order.discount > 0 && (
              <tr className="border-t bg-gray-50">
                <td colSpan="4" className="p-3 text-right font-medium text-green-600">
                  Discount
                </td>
                <td className="p-3 text-right font-mono tabular-nums text-green-600">
                  -Rs.{order.discount.toLocaleString()}
                </td>
              </tr>
            )}
            
            {/* Delivery Charges Row */}
            <tr className="border-t bg-gray-50">
              <td colSpan="4" className="p-3 text-right font-medium">
                Delivery Charges
              </td>
              <td className="p-3 text-right font-mono tabular-nums">
                Rs.{order.deliveryFee.toLocaleString()}
              </td>
            </tr>

            {/* Grand Total Row */}
            <tr className="border-t bg-gray-100 font-semibold">
              <td colSpan="4" className="p-3 text-right">
                Grand Total
              </td>
              <td className="p-3 text-right font-mono tabular-nums">
                Rs.{order.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Note */}
        <div className="mt-6 text-sm text-gray-600">
          <p>
            Thank you for your purchase! This invoice serves as a detailed
            record of the products/services you have received, along with their
            quantities, prices, and applicable taxes.
          </p>
        </div>
      </div>
    </div>
            <Footer/>
    </div>
  );
};

export default Invoice;