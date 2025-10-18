import React from 'react';
import { User } from '../../(admin)/users/types';
import { Mail, Phone, MapPin, Shield } from 'lucide-react';
import PrimaryButton from '@/app/components/common-components/primary-button';
import UserOrderHistory from './user-order-history';
import DetailItem from '../common-components/detail-item'; // <-- Import DetailItem

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

          <DetailItem label="Email Address" icon={Mail}>
            <p className="text-gray-800 break-all">{user.email}</p>
          </DetailItem>

          <DetailItem label="Contact Number" icon={Phone}>
            <p className="text-gray-800">{user.contact}</p>
          </DetailItem>

          <DetailItem label="Address" icon={MapPin}>
            <p className="text-gray-800">{user.address}</p>
          </DetailItem>

          <DetailItem label="Role" icon={Shield}>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${user.role === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              <Shield size={14} className="mr-1" />{user.role}
            </span>
          </DetailItem>
          
        </div>

        {user.role !== 'Admin' && 
          <UserOrderHistory userId={user.id} 
        />}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <PrimaryButton
            variant="secondary"
            context="Close Details"
            onClick={onClose}
            className="!w-full !h-12 !text-base" // Override size to fit
          />
        </div>
      </div>
    </div>
  );
};

export default UserDetailsSidebar;