'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Eye, EyeOff } from 'lucide-react';
import PrimaryButton from '@/app/components/common-components/primary-button';
import { User } from '../(admin)/users/types'; 

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Renamed from onAdminCreated
  userToEdit: User | null; // <-- New prop to pass user data for editing
}

const getAuthToken = (): string | null => localStorage.getItem("access_token");

const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, onSuccess, userToEdit }) => {
  // --- 1. Determine mode and set dynamic text ---
  const isEditMode = Boolean(userToEdit);
  const title = isEditMode ? "Update Admin Account" : "Create New Admin";
  const submitText = isEditMode ? "Update Account" : "Create Account";
  const passwordLabel = isEditMode ? "New Password (optional)" : "Password";

  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 2. Add useEffect to populate form in Edit Mode ---
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && userToEdit) {
        // Split the full name back into first and last
        const nameParts = userToEdit.name.split(' ');
        setFName(nameParts[0] || '');
        setLName(nameParts.slice(1).join(' ') || ''); // Handles names with more than 2 parts
        setEmail(userToEdit.email);
        setPassword(''); // Always clear password field on open
      } else {
        // Reset form for Create Mode
        setFName('');
        setLName('');
        setEmail('');
        setPassword('');
      }
      setError(null); // Clear errors on open
    }
  }, [userToEdit, isEditMode, isOpen]); // Rerun when modal is opened

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // In edit mode, password is optional
    if (!fName || !lName || !email || (!isEditMode && !password)) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(isEditMode ? 'Updating account...' : 'Creating account...');
    const token = getAuthToken();

    // --- 3. Prepare data and API call ---
    const data: any = { fName, lName, email };
    // Only send password if it's not empty
    if (password) {
      data.password = password;
    }
    
    try {
      if (isEditMode) {
        // --- UPDATE (PATCH) ---
        await axios.patch(
          `http://localhost:5000/api/auth/users/${userToEdit?.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Admin account updated!', { id: toastId });
      } else {
        // --- CREATE (POST) ---
        await axios.post(
          'http://localhost:5000/api/auth/users/create-admin',
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Admin account created!', { id: toastId });
      }
      
      onSuccess(); // This will close modal and refetch

    } catch (err: any) {
      const message = err.response?.data?.message || (isEditMode ? "Failed to update account." : "Failed to create account.");
      setError(message);
      toast.error(message, { id: toastId });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2> {/* Dynamic Title */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            {/* First Name */}
            <div className="flex-1">
              <label htmlFor="fName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="fName"
                type="text"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Last Name */}
            <div className="flex-1">
              <label htmlFor="lName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                id="lName"
                type="text"
                value={lName}
                onChange={(e) => setLName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{passwordLabel}</label> {/* Dynamic Label */}
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <PrimaryButton
              type="button"
              variant="secondary"
              context="Cancel"
              onClick={onClose}
              disabled={isLoading}
            />
            <PrimaryButton
              type="submit"
              variant="primary"
              context={submitText}
              disabled={isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserModal;