//user list frontend

import React from 'react';
import { User } from '../../(admin)/users/types';
import PrimaryButton from '@/app/components/common-components/primary-button';
import { Trash2, User as UserIcon } from 'lucide-react';

interface UserListProps {
  users: User[];
  onViewUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const UserList = ({ users, onViewUser, onDeleteUser }: UserListProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <UserIcon size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No users found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-6 gap-4 font-semibold text-gray-700 bg-gray-50 p-4 border-b">
          <span className="col-span-2">User</span>
          <span>Email</span>
          <span>Contact</span>
          <span>Role</span>
          <span>Action</span>
        </div>
        {/* User Rows */}
        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* User Info Column */}
              <div className="col-span-2 flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/assets/icons/account_circle.svg"; }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 font-mono">#{user.id}</p>
                </div>
              </div>
              {/* Other Columns */}
              <span className="text-sm text-gray-600 truncate hidden md:block" title={user.email}>{user.email}</span>
              <span className="text-sm text-gray-600 hidden md:block">{user.contact}</span>
              <span className="hidden md:block">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {user.role}
                </span>
              </span>
              {/* Action Buttons */}
              <div className="flex gap-2">
                <PrimaryButton
                  variant="info"
                  context="View"
                  onClick={() => onViewUser(user)}
                  className="!w-full !h-9 !text-xs !max-w-[100px]"
                />
                <PrimaryButton
                  variant="danger"
                  context="" // No text for the icon-only button
                  icon={Trash2}
                  onClick={() => onDeleteUser(user)}
                  className="!w-9 !h-9 !p-0" // Square button for the icon
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserList;
