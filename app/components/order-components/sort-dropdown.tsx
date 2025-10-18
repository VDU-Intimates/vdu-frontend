'use client';

import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import Dropdown from '@/app/components/common-components/dropdown'; // Adjust path if needed

export type SortType = 'Newest' | 'Oldest';

interface SortDropdownProps {
  currentSort: SortType;
  onSortChange: (sort: SortType) => void;
}

const SortDropdown = ({ currentSort, onSortChange }: SortDropdownProps) => {
  const sortOptions = [
    { value: 'Newest', label: 'Sort: Newest' },
    { value: 'Oldest', label: 'Sort: Oldest' },
  ];

  return (
    <Dropdown
      value={currentSort}
      onChange={(value) => onSortChange(value as SortType)}
      options={sortOptions}
      icon={ChevronsUpDown}
    />
  );
};

export default SortDropdown;