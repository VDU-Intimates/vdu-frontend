//dropdown 

'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import Dropdown from '@/app/components/common-components/dropdown';

// Define the types for the filter options
export type RoleType = 'All' | 'Admin' | 'Customer';

interface RoleFilterDropdownProps {
  currentFilter: RoleType;
  onFilterChange: (filter: RoleType) => void;
}

const RoleFilterDropdown = ({ currentFilter, onFilterChange }: RoleFilterDropdownProps) => {
  const filterOptions = [
    { value: 'All', label: 'Filter by Role: All' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Customer', label: 'Customer' },
  ];

  return (
    <Dropdown
      value={currentFilter}
      onChange={(value) => onFilterChange(value as RoleType)}
      options={filterOptions}
      icon={Filter}
    />
  );
};

export default RoleFilterDropdown;
