'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Eye, EyeOff } from 'lucide-react';
import PrimaryButton from '@/app/components/common-components/primary-button';
import { User } from '../(admin)/users/types'; // Adjust this import path as needed

const getAuthToken = (): string | null => localStorage.getItem("access_token");

// ✅ Password Validation Function (copied from Register.tsx)
function isPasswordStrong(password: string): boolean {
  const regex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:'",.<>?/\\|`~=_+-]).{10,}$/;
  return regex.test(password);
}

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit: User | null;
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, onSuccess, userToEdit }) => {
  const isEditMode = Boolean(userToEdit);
  const title = isEditMode ? "Update Admin Account" : "Create New Admin";
  const submitText = isEditMode ? "Update Account" : "Create Account";
  
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  
  // --- New states for password and validation ---
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Real-time validation logic ---
  const passwordValid = isPasswordStrong(password);
  const confirmValid = password === confirm;

  const commonValid = !!fName && !!lName && !!email;
  let canSubmit;

  if (isEditMode) {
    // In edit mode, password is optional.
    // But if provided, it must be strong and confirmed.
    const passwordPartValid = (password.length === 0 && confirm.length === 0) || (passwordValid && confirmValid);
    canSubmit = commonValid && passwordPartValid;
  } else {
    // In create mode, all fields (including a valid password) are required.
    canSubmit = commonValid && password.length > 0 && passwordValid && confirmValid;
  }
  // --- End of validation logic ---

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && userToEdit) {
        // Populate form for editing
        const nameParts = userToEdit.name.split(' ');
        setFName(nameParts[0] || '');
        setLName(nameParts.slice(1).join(' ') || '');
        setEmail(userToEdit.email);
      } else {
        // Reset form for creating
        setFName('');
        setLName('');
        setEmail('');
      }
      // Reset fields for both modes on open
      setPassword('');
      setConfirm('');
      setError(null);
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [userToEdit, isEditMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Button's 'disabled' state handles this, but as a fallback:
    if (!canSubmit) {
      setError("Please fix the errors in the form.");
      return;
    }

    setError(null);
    setIsLoading(true);
    const toastId = toast.loading(isEditMode ? 'Updating account...' : 'Creating account...');
    const token = getAuthToken();

    const data: any = { fName, lName, email };
    // Only send password if it's not empty (applies to both create/edit)
    if (password) {
      data.password = password;
    }
    
    try {
      if (isEditMode) {
        await axios.patch(
          `http://localhost:5000/api/auth/users/${userToEdit?.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Admin account updated!', { id: toastId });
      } else {
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>

        {/* --- FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="fName" className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input
                id="fName"
                type="text"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="Enter first name"
                className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lName" className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                id="lName"
                type="text"
                value={lName}
                onChange={(e) => setLName(e.target.value)}
                placeholder="Enter last name"
                className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400"
            />
          </div>

          {/* --- PASSWORD FIELD + VALIDATION --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isEditMode ? "New Password (optional)" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border shadow-sm text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                  password.length > 0 && !passwordValid
                    ? "border-red-300 focus:ring-red-500 hover:border-red-400"
                    : "border-gray-300 focus:ring-indigo-500 hover:border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements Display */}
            {password.length > 0 && !passwordValid && (
              <div className="mt-2 text-xs text-red-500 space-y-1">
                <p>Password must include:</p>
                <ul className="list-disc ml-4">
                  <li>At least 10 characters</li>
                  <li>One uppercase letter (A–Z)</li>
                  <li>One lowercase letter (a–z)</li>
                  <li>One number (0–9)</li>
                  <li>One special character (!@#$%^&*...)</li>
                </ul>
              </div>
            )}
          </div>

          {/* --- CONFIRM PASSWORD FIELD + VALIDATION --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-type your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border shadow-sm text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                  confirm.length > 0 && !confirmValid
                    ? "border-red-300 focus:ring-red-500 hover:border-red-400"
                    : "border-gray-300 focus:ring-indigo-500 hover:border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {confirm.length > 0 && !confirmValid && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <span className="font-medium">⚠</span> Passwords do not match.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* --- ACTION BUTTONS --- */}
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
              disabled={!canSubmit || isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserModal;