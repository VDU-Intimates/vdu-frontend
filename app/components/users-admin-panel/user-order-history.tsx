'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Package, DollarSign, Clock } from 'lucide-react';
import DetailItem from '../common-components/detail-item'; // <-- Import DetailItem

// Interface for the summary data from the API
interface OrderSummary {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  statusCounts: { [key: string]: number };
}

interface UserOrderHistoryProps {
  userId: string; // Expects the specific User ID (e.g., USR-...)
}

const getAuthToken = (): string | null => localStorage.getItem("access_token");

// Helper to format currency
const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
// Helper to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const UserOrderHistory = ({ userId }: UserOrderHistoryProps) => {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if a valid userId is provided
    if (userId) {
      const fetchSummary = async () => {
        setLoadingSummary(true);
        setError(null);
        setSummary(null); // Clear previous summary
        const token = getAuthToken();
        try {
          const response = await axios.get<OrderSummary>(
            `http://localhost:5000/api/auth/users/${userId}/order-summary`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSummary(response.data);
        } catch (error) {
          console.error("Failed to fetch order summary:", error);
          setError("Could not load order summary.");
        } finally {
          setLoadingSummary(false);
        }
      };
      fetchSummary();
    } else {
      setLoadingSummary(false); // No user ID, stop loading
    }
  }, [userId]); // Re-run effect if the userId changes

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <ShoppingCart size={18} /> Order Summary
      </h3>
      {loadingSummary ? (
        <div className="text-center text-gray-500 text-sm py-4">Loading summary...</div>
      ) : error ? (
        <div className="text-center text-red-500 text-sm py-4">{error}</div>
      ) : summary && summary.totalOrders > 0 ? (
        <div className="space-y-3 text-sm">
          
          <DetailItem label="Total Orders" icon={Package}>
            <p className="text-gray-900 font-semibold">{summary.totalOrders}</p>
          </DetailItem>
          
          <DetailItem label="Total Spent" icon={DollarSign}>
            <p className="text-gray-900 font-semibold">{formatCurrency(summary.totalSpent)}</p>
          </DetailItem>
          
          <DetailItem label="Last Order" icon={Clock}>
             <p className="text-gray-900 font-semibold">{formatDate(summary.lastOrderDate)}</p>
          </DetailItem>

        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-4">No order history available.</div>
      )}
    </div>
  );
};

export default UserOrderHistory;