'use client';

import React, { useState, useEffect } from "react";
import { Trash2, RefreshCw, LogIn, User, Mail, Phone, MapPin, Shield } from "lucide-react";
import axios from "axios";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal] = useState({ show: false, message: "", onConfirm: null });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if token exists
      const token = localStorage.getItem("access_token");
      console.log("Token from localStorage:", token); // Debug
      
      if (!token) {
        setError("No authentication token found. Please login first.");
        setDebugInfo({
          tokenExists: false,
          tokenLength: 0,
          backendUrl: "http://localhost:5000/api/auth/me"
        });
        return;
      }

      setDebugInfo({
        tokenExists: true,
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + "...",
        backendUrl: "http://localhost:5000/api/auth/me"
      });

      console.log("Making request to backend..."); // Debug

      // Make the API request with detailed logging
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      console.log("Request config:", config); // Debug

      const res = await axios.get("http://localhost:5000/api/auth/me", config);

      console.log("Full API Response:", res); // Debug
      console.log("Response data:", res.data); // Debug

      const user = res.data?.user;

      if (!user) {
        throw new Error("No user data received from server");
      }

      // Handle different possible field names from backend
      const fName = user.fName || user.firstName || "";
      const lName = user.lName || user.lastName || "";
      const fullName = `${fName} ${lName}`.trim() || "Unknown User";

      // Create user object for the table
      const userData = {
        id: user.userId || user._id || user.id || 1,
        name: fullName,
        email: user.email || 'N/A',
        contact: user.contact || user.phone || "-",
        address: user.address || "-",
        role: user.role || "Customer",
        avatar: user.photoURL || "/assets/user3.jpg",
      };

      console.log("Processed user data:", userData); // Debug

      setUsers([userData]);

    } catch (err) {
      console.error("Full error object:", err); // Debug
      console.error("Error response:", err.response); // Debug
      
      let errorMessage = "Failed to fetch user data";
      
      if (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERR' || err.message === 'Network Error') {
        errorMessage = "Cannot connect to server. Please check if the backend is running on http://localhost:5000";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        // Clear invalid token
        localStorage.removeItem("token");
        setDebugInfo(prev => ({ ...prev, tokenCleared: true }));
      } else if (err.response?.status === 404) {
        errorMessage = "API endpoint not found. Check if the route exists.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Check backend logs.";
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Server might be slow.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      
      // Update debug info with error details
      setDebugInfo(prev => ({
        ...prev,
        error: {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.message,
          code: err.code,
          responseData: err.response?.data
        }
      }));

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleDelete = (user) => {
    setModal({
      show: true,
      message: `Are you sure you want to delete "${user.name}"?`,
      onConfirm: () => {
        setUsers(users.filter((u) => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
        setModal({ show: false, message: "", onConfirm: null });
      },
    });
  };

  const handleRetry = () => {
    fetchUser();
  };

  // const handleLogin = () => {
  //   // Redirect to login page or show login modal
  //   window.location.href = '/login';
  // };

  // const clearToken = () => {
  //   localStorage.removeItem("token");
  //   setDebugInfo(prev => ({ ...prev, tokenCleared: true }));
  //   setError("Token cleared. Please login again.");
  // };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen font-railway bg-[#F8F4EB]">
        <AdminNavBar />
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading User Data</h2>
            <p className="text-gray-600">Connecting to backend server...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-railway bg-[#F8F4EB]">
      <AdminNavBar />

      <div className="flex-1 flex p-6 gap-6 overflow-hidden mt-16">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Success Message */}
          {users.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium">User data loaded successfully!</span>
              </div>
              <button
                onClick={handleRetry}
                className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          )}

          {/* Users List */}
          <div className="flex-1 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-7 gap-4 font-semibold text-gray-700 bg-gray-50 p-4 border-b">
                <span>User ID</span>
                <span>Profile</span>
                <span>Full Name</span>
                <span>Email</span>
                <span>Contact</span>
                <span>Action</span>
              </div>

              {/* User Rows */}
              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-7 gap-4 items-center">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          #{user.id}
                        </span>
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/48x48?text=👤";
                          }}
                        />
                        <span className="font-semibold text-gray-800">{user.name}</span>
                        <span className="text-sm text-gray-600 truncate" title={user.email}>
                          {user.email}
                        </span>
                        <span className="text-sm text-gray-600">{user.contact}</span>
                        {/* View Button  */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(user);
                            }}
                            className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/56x56?text=👤";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{user.name}</h3>
                            <p className="text-sm text-gray-600 truncate">#{user.id}</p>
                          </div>
                          <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {user.role}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} />
                            <span>{user.contact}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={14} />
                            <span className="truncate">{user.address}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          
                          {/*  Delete User button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(user);
                            }}
                            className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details Sidebar */}
        {selectedUser && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* User Avatar and Basic Info */}
              <div className="text-center mb-6">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-gray-200 mx-auto mb-4 shadow-lg"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80x80?text=👤";
                  }}
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {selectedUser.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  ID: #{selectedUser.id}
                </p>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Email Address</span>
                  </div>
                  <p className="text-gray-800 break-all">{selectedUser.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={16} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Contact Number</span>
                  </div>
                  <p className="text-gray-800">{selectedUser.contact}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Address</span>
                  </div>
                  <p className="text-gray-800">{selectedUser.address}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Role</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <Shield size={14} className="mr-1" />
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Delete</h3>
            <p className="mb-6 text-gray-600">{modal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModal({ show: false, message: "", onConfirm: null })}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={modal.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;