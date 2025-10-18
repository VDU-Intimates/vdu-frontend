import { LucideIcon } from 'lucide-react';
import React from 'react';

// Define the styles for each button variant
const variants = {
  primary: {
    border: "bg-conic/[from_var(--border-angle)] from-[#6b9765] via-[#E1C16E] to-[#8B7500]",
    button: "bg-dark-green text-beige hover:bg-beige hover:text-dark-green border-dark-green",
  },
  danger: {
    border: "bg-conic/[from_var(--border-angle)] from-red-500 via-red-600 to-red-800",
    button: "bg-red-600 text-white hover:bg-white hover:text-red-600 border-red-600",
  },
  secondary: {
    border: "bg-conic/[from_var(--border-angle)] from-gray-300 via-gray-400 to-gray-500",
    button: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
  },
  info: {
    border: "bg-conic/[from_var(--border-angle)] from-blue-400 via-blue-500 to-blue-700",
    button: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
  }
};

type PrimaryButtonProps = {
  context: string;
  icon?: LucideIcon;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  variant?: keyof typeof variants; // 'primary', 'danger', 'secondary', 'info'
  disabled?: boolean;
}

const PrimaryButton = ({
  context,
  icon: Icon,
  onClick,
  type = "button",
  className = "",
  variant = "primary",
  disabled = false
}: PrimaryButtonProps) => {
  
  const style = variants[variant] || variants.primary;

  return (
    <div
      className={`w-[240px] h-[60px] max-md:w-[180px] max-lg:w-[190px] max-md:h-[40px]
                  rounded-lg p-[2.5px] animate-rotate-border 
                  ${style.border} ${className}`}
    >
      <button 
        onClick={onClick} 
        type={type}
        disabled={disabled}
        className={`p-3 flex items-center justify-center
                    max-md:text-sm w-full h-full rounded-lg text-lg font-bold gap-2 
                    transition-all duration-500 cursor-pointer border-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${style.button}`}
      >
        {context} 
        {Icon && <Icon className="w-5 h-5" />} 
      </button>
    </div>
  );
};

export default PrimaryButton;
