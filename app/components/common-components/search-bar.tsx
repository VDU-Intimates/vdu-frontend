'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

const widths = {
    xs: "w-[200px]",
    sm: "w-[300px]",
    md: "w-[400px]",
    lg: "w-[500px]",
} as const;

type size = keyof typeof widths;

interface SearchBarProps {
    size: size;
    placeholder?: string;
    value: string; // The current search term, provided by the parent
    onSearchChange: (query: string) => void; // A function to call when the text changes
}

const SearchBar = ({ size, placeholder = "Search...", value, onSearchChange }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        onSearchChange(''); // Tell the parent to clear the search term
        inputRef.current?.focus();
    };

    const handleIconClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${widths[size]} max-lg:w-[180px]`}>
            <input
                ref={inputRef}
                type="text"
                value={value} // The value is now controlled by the parent
                onChange={(e) => onSearchChange(e.target.value)} // Report changes to the parent
                placeholder={placeholder}
                className="w-full h-10 border-light-green  outline-0 border-2 pr-20 pl-4 rounded-2xl
                           placeholder:text-sm font-bold placeholder:text-dark-green"
            />
            
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-11 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 rounded-full transition-colors"
                    aria-label="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <Image
                src="/assets/icons/search_icon.svg"
                alt="Search-Icon"
                width={20}
                height={20}
                onClick={handleIconClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            />
        </div>
    );
};

export default SearchBar;