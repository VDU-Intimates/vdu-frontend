import { LucideIcon } from "lucide-react";
import React from "react";

type PrimaryButtonProps = {
  context: string;
  icon?: LucideIcon;
  onClick: () => void; // function prop
  type?: "button" | "submit" | "reset"; // optional for forms
};

const PrimaryButton = ({ context, icon: Icon, onClick, type = "button" }: PrimaryButtonProps) => {
  return (
    <div
      className="w-[240px] h-[60px] max-md:w-[180px] max-lg:w-[190px] max-md:gap-1 max-md:h-[40px]
                 rounded-lg p-[2.5px] bg-conic/[from_var(--border-angle)]
                 from-[#6b9765] via-[#E1C16E] to-[#8B7500] from-50%
                 via-90% to-100% animate-rotate-border"
    >
      <button
        type={type}
        onClick={onClick}
        className="p-3 flex items-center justify-center
                   max-md:text-sm bg-dark-green hover:bg-beige hover:text-dark-green w-full h-full
                   rounded-lg text-beige text-lg font-bold gap-2 transition-all duration-500 cursor-pointer
                   border-2 border-dark-green"
      >
        {context}
        {Icon && <Icon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PrimaryButton;
