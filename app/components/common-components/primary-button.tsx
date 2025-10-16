import { LucideIcon } from 'lucide-react';
import React from 'react'

type primaryButtonProps = {
    context:string,
    icon?: LucideIcon; 
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: "button" | "submit" | "reset";
    className?: string; // Added the className prop here
}

// Destructure the className prop from primaryButtonProps
const PrimaryButton = ({context, icon: Icon, onClick, type = "button", className = ""}: primaryButtonProps) => {
  return (
    // Apply the passed className prop to the outermost div.
    // This will override or supplement the fixed width classes like w-[240].
    <div 
        className={`w-[240] h-[60] max-md:w-[180] max-lg:w-[190] max-md:gap-1 max-md:h-[40]
                    rounded-lg p-[2.5px] bg-conic/[from_var(--border-angle)]
                    from-[#6b9765] via-[#E1C16E] to-[#8B7500] from-50%
                    via-90% to-100% animate-rotate-border ${className}`}
    >
        <button 
            onClick={onClick} 
            type={type} 
            className='p-3 flex items-center justify-center
                            max-md:text-sm bg-dark-green hover:bg-beige hover:text-dark-green w-full h-full
                            rounded-lg text-beige tex-lg font-bold gap-2 transition-all duration-500 cursor-pointer
                            border-2 border-dark-green'
        >
            {context} 
            {Icon && <Icon className="w-5 h-5" />} 
        </button>
    </div>
  )
}

export default PrimaryButton;