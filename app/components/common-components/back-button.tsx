'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;      // Optional label, defaults to "Back"
  className?: string;  // Optional custom classes
}

const BackButton = ({ label = "Back to All Orders", className = "" }: BackButtonProps) => {
  const router = useRouter();

  // The router.back() function navigates to the previous page in the browser's history
  const handleGoBack = () => {
    router.back();
  };

  return (
    <button 
      onClick={handleGoBack}
      className={`  flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium 
                    transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

export default BackButton;