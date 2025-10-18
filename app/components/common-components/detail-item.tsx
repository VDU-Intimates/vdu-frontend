import React from 'react';

interface DetailItemProps {
  // The icon component itself (e.g., Mail, Phone)
  icon: React.ElementType;
  label: string;
  // The content (value) to display
  children: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, children }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Header part with Icon and Label */}
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-gray-600" />
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      
      {/* The value, rendered as children */}
      {children}
    </div>
  );
};

export default DetailItem;