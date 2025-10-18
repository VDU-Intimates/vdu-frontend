'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import Dropdown from '@/app/components/common-components/dropdown';

export type FilterType = 'All' | 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Customized';

interface FilterDropdownProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FilterDropdown = ({ currentFilter, onFilterChange }: FilterDropdownProps) => {
  const filterOptions = [
    { value: 'All', label: 'Filter: All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Customized', label: 'Customized' },
  ];

  return (
    <Dropdown
      value={currentFilter}
      onChange={(value: string) => onFilterChange(value as FilterType)}
      options={filterOptions}
      icon={Filter}
    />
  );
};

export default FilterDropdown;