'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from "next/navigation";
import { Plus, Edit } from "lucide-react"; // 1. Import 'Edit' icon

import { User } from "./types";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";
import UserList from "../../components/users-admin-panel/user-list";
import UserDetailsSidebar from "../../components/users-admin-panel/user-sidebar";
import LoadingSpinner from "../../components/common-components/loading-spinner";
import RoleFilterDropdown, { RoleType } from "../../components/users-admin-panel/role-dropdown";
import ReportDownloader from "../../components/reports/report-downloader";
import PrimaryButton from "@/app/components/common-components/primary-button";
// 2. Import the renamed modal (assuming you renamed the file)
import AdminUserModal from "@/app/Modal/admin-modal"; 

// Helper function to get the auth token
const getAuthToken = (): string | null => localStorage.getItem("access_token");

const UserManagementPage = () => {
  // State for the raw data from the API
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State for UI interactions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleType>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 3. Add state to track which user is being edited
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

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
        avatar: user.photoURL || "/assets/icons/account_circle.svg",
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

  // Filters users based on search and role
  const filteredUsers = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';
    let processedUsers = [...allUsers];

    if (searchQuery) {
      processedUsers = processedUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery) ||
        user.id.toLowerCase().includes(searchQuery)
      );
    }
    
    if (roleFilter !== 'All') {
      processedUsers = processedUsers.filter(user => user.role === roleFilter);
    }

    return processedUsers;
  }, [allUsers, roleFilter, searchParams]);

  // This function calls the backend API to permanently delete the user
  const confirmDelete = async (userToDelete: User) => {
    const token = getAuthToken();
    if (!token) return toast.error("Authentication error.");

    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
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
    ), { duration: 6000, icon: '🤔' });
  };

  // 4. Renamed handler for when modal succeeds (create or update)
  const handleAdminSuccess = () => {
    setIsModalOpen(false); // Close the modal
    setUserToEdit(null); // Clear the user being edited
    fetchAllUsers(); // Refresh the user list
  };

  // 5. Add handler to open modal in "Edit Mode"
  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  // 6. Add handler to open modal in "Create Mode"
  const handleOpenCreateModal = () => {
    setUserToEdit(null); // Ensure no user is selected
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen font-railway bg-[#F8F4EB]">
      <Toaster position="top-center" reverseOrder={false} />
      <AdminNavBar />
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden lg:ml-64 mt-16">
        
        {/* Page Header */}
        <div className="flex justify-between items-center flex-shrink-0">
          <h1 className="text-3xl font-bold">Users</h1>
          {/* 7. Update button's onClick handler */}
          <PrimaryButton
            variant="primary"
            context="Create Admin"
            icon={Plus} 
            onClick={handleOpenCreateModal} // Use new handler
          />
        </div>

        {/* Report Downloader component */}
        <div className="flex-shrink-0">
          <ReportDownloader
            title="Download User Report"
            apiEndpoint="/reports/all-users"
            fileNamePrefix="User-Report"
            showDateSelectors={false}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
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
                {/* 8. Pass the onEditUser prop to your UserList */}
                <UserList 
                  users={filteredUsers}
                  onViewUser={setSelectedUser} 
                  onDeleteUser={handleDeleteConfirmation}
                  onEditUser={handleOpenEditModal} 
                />
              </div>
            )}
          </div>

          <UserDetailsSidebar 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        </div>

        {/* 9. Render the Modal with all necessary props */}
        <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAdminSuccess}
          userToEdit={userToEdit} 
        />
      </main>
    </div>
  );

};

export default UserManagementPage;