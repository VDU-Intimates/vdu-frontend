//sidebar

import React from 'react';
import { User } from '../../(admin)/users/types';
import { Mail, Phone, MapPin, Shield } from 'lucide-react';

interface UserDetailsSidebarProps {
  user: User | null;
  onClose: () => void;
}

const UserDetailsSidebar = ({ user, onClose }: UserDetailsSidebarProps) => {
  if (!user) {
    return null; // Don't render anything if no user is selected
  }

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="text-center mb-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-20 w-20 rounded-full object-cover border-4 border-gray-200 mx-auto mb-4 shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = "/assets/icons/account_circle.svg"; }}
          />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{user.name}</h3>
          <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">ID: #{user.id}</p>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Mail size={16} className="text-gray-600" /><span className="font-semibold text-gray-700">Email Address</span></div>
            <p className="text-gray-800 break-all">{user.email}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Phone size={16} className="text-gray-600" /><span className="font-semibold text-gray-700">Contact Number</span></div>
            <p className="text-gray-800">{user.contact}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-gray-600" /><span className="font-semibold text-gray-700">Address</span></div>
            <p className="text-gray-800">{user.address}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-gray-600" /><span className="font-semibold text-gray-700">Role</span></div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${user.role === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}><Shield size={14} className="mr-1" />{user.role}</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Close Details</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsSidebar;
