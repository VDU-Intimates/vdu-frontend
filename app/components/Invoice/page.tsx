import React, { useEffect, useState } from "react";

const Invoice = () => {
  const [user, setUser] = useState({
    fName: "",
    lName: "",
    address: "",
    email: "",
    contact: "",
  });

  const [orders, setOrders] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    deliveryFee: 0,
    totalAmount: 0,
    subtotal: 0
  });

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage.");
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch user:", res.status);
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
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Fetch orders + items with delivery fee and total amount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/orders/get-order-invoice"
        );
        if (!res.ok) {
          console.error("Failed to fetch orders:", res.status);
          return;
        }

        const data = await res.json();
        setOrders(data);

        // Calculate totals from API data
        if (data.length > 0) {
          // Calculate subtotal from items
          const subtotal = data.reduce((orderTotal, order) => {
            return orderTotal + order.items.reduce((itemTotal, item) => {
              return itemTotal + (item.quantity * item.unitPrice);
            }, 0);
          }, 0);

          // Extract delivery fee and total amount from API response
          // Assuming the API returns these fields in the first order or as separate fields
          const deliveryFee = data[0].deliveryFee || data.deliveryFee || 350; // fallback to 350
          const totalAmount = data[0].totalAmount || data.totalAmount || (subtotal + deliveryFee);

          setInvoiceData({
            deliveryFee,
            totalAmount,
            subtotal
          });
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
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
            {orders.length > 0 && (
              <p className="text-sm text-gray-500 mb-1">
                Order ID: {orders[0].orderId}
              </p>
            )}
            <h3 className="text-2xl font-bold text-gray-700">
              Total: Rs.{invoiceData.totalAmount.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Dates and Customer Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-1 text-sm">
            <p>
              Date:{" "}
              {orders.length > 0
                ? new Date(orders[0].date).toLocaleDateString()
                : ""}
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
            <p>Address: {user.address}</p>
            <p>Email: {user.email}</p>
            <p>Contact: {user.contact}</p>
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
            {orders.flatMap((order, orderIndex) =>
              order.items.map((item, idx) => (
                <tr key={`${orderIndex}-${idx}`} className="border-t">
                  <td className="p-3">{idx + 1}</td>
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
              ))
            )}

            {/* Subtotal Row - Remove since backend handles calculations */}
            
            {/* Delivery Charges Row - Using API data */}
            <tr className="border-t bg-gray-50">
              <td colSpan="4" className="p-3 text-right font-medium">
                Delivery Charges
              </td>
              <td className="p-3 text-right font-mono tabular-nums">
                Rs.{invoiceData.deliveryFee.toLocaleString()}
              </td>
            </tr>

            {/* Table Footer Row for Final Total - Using API data */}
            <tr className="border-t bg-gray-100 font-semibold">
              <td colSpan="4" className="p-3 text-right">
                Grand Total
              </td>
              <td className="p-3 text-right font-mono tabular-nums">
                Rs.{invoiceData.totalAmount.toLocaleString()}
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
  );
};

export default Invoice;