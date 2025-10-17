// usermanagement page frontend

'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from "next/navigation";

// Import your shared types and components
import { User } from "./types";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import UserList from "../../components/users-admin-panel/user-list";
import UserDetailsSidebar from "../../components/users-admin-panel/user-sidebar";
import LoadingSpinner from "../../components/common-components/loading-spinner";
import RoleFilterDropdown, { RoleType } from "../../components/users-admin-panel/role-dropdown";

// Helper function to get the auth token
const getAuthToken = (): string | null => localStorage.getItem("access_token");

const UserManagementPage = () => {
  // State for the raw data from the API
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State for UI interactions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleType>('All');
  
  // Hook to read search params from the URL
  const searchParams = useSearchParams();

  // Fetches all users from the backend
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token not found. Please log in.");

      const response = await axios.get<any[]>("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const processedUsers: User[] = response.data.map((user: any) => ({
        id: user.userId || user._id,
        name: `${user.fName || ''} ${user.lName || ''}`.trim() || "N/A",
        email: user.email || 'N/A',
        contact: user.contact || "-",
        address: user.address || "-",
        role: user.role || "Customer",
        avatar: user.photoURL || "/assets/icons/account_circle.svg", // Using a valid fallback
      }));

      setAllUsers(processedUsers);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      let errorMessage = "Failed to fetch user list.";
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Authentication failed or you do not have permission.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // useMemo hook to efficiently filter users by search query AND role
  const filteredUsers = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    let processedUsers = [...allUsers];

    // 1. Apply search filter (name or email)
    if (searchQuery) {
      processedUsers = processedUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery)
      );
    }
    
    // 2. Apply role filter
    if (roleFilter !== 'All') {
      processedUsers = processedUsers.filter(user => user.role === roleFilter);
    }

    return processedUsers;
  }, [allUsers, roleFilter, searchParams]); // Re-runs when data, filter, or search changes

  // This function calls the backend API to permanently delete the user
  const confirmDelete = async (userToDelete: User) => {
    const token = getAuthToken();
    if (!token) {
        return toast.error("Authentication error.");
    }

    try {
        await axios.delete(`http://localhost:5000/api/auth/users/${userToDelete.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // If API call is successful, update the UI
        setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        if (selectedUser?.id === userToDelete.id) {
            setSelectedUser(null);
        }
        toast.success(`User "${userToDelete.name}" deleted successfully.`);

    } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        const errorMessage = error.response?.data?.message || "Failed to delete user.";
        toast.error(errorMessage);
    }
  };

  // This function opens the confirmation toast
  const handleDeleteConfirmation = (user: User) => {
    toast((t) => (
        <div className="flex flex-col gap-4 p-2 text-center">
            <p className="font-semibold text-gray-800">
                Are you sure you want to delete <br /> "{user.name}"?
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => {
                        confirmDelete(user);
                        toast.dismiss(t.id);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm transition-colors"
                >
                    Delete
                </button>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium text-sm transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    ), {
        duration: 6000,
        icon: '🤔',
    });
  };

  return (
    <div className="flex h-screen font-railway bg-[#F8F4EB]">
      <Toaster position="top-center" reverseOrder={false} />
      <AdminNavBar />
      <main className="flex-1 flex p-6 gap-6 overflow-hidden mt-16 lg:ml-64">
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading User Data..." />
          ) : (
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b">
                <h2 className="text-lg font-semibold mb-3 sm:mb-0">
                  User List ({filteredUsers.length})
                </h2>
                <RoleFilterDropdown 
                  currentFilter={roleFilter} 
                  onFilterChange={setRoleFilter} 
                />
              </div>
              <UserList 
                users={filteredUsers}
                onViewUser={setSelectedUser} 
                onDeleteUser={handleDeleteConfirmation}
              />
            </div>
          )}
        </div>

        <UserDetailsSidebar 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      </main>
    </div>
  );
};

export default UserManagementPage;
