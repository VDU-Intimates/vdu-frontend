'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react'; // Import the 'X' icon

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
}

const SearchBar = ({ size, placeholder = "Search..." }: SearchBarProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const inputRef = useRef<HTMLInputElement>(null); // Create a ref to access the input element

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // This effect updates the URL 300ms after the user stops typing
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm) {
                params.set('search', searchTerm);
            } else {
                params.delete('search');
            }
            router.replace(`${pathname}?${params.toString()}`);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, pathname, router, searchParams]);

    // Handler to clear the search input
    const handleClear = () => {
        setSearchTerm('');
        inputRef.current?.focus(); // Keep the input focused after clearing
    };

    // Handler for when the search icon is clicked
    const handleIconClick = () => {
        inputRef.current?.focus(); // Focus the input field
    };

    return (
        <div className={`relative ${widths[size]} max-md:w-[180px]`}>
            <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                // Increased right padding to make space for both icons
                className="w-full h-10 border-light-green outline-0 border-2 pr-20 pl-4 rounded-2xl
                           placeholder:text-sm font-bold placeholder:text-dark-green"
            />
            
            {/* Clear button - only shows when there is text */}
            {searchTerm && (
                <button
                    onClick={handleClear}
                    className="absolute right-11 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 rounded-full transition-colors"
                    aria-label="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Search icon - now clickable */}
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