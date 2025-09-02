import React from "react";
import type { LucideIcon } from "lucide-react";

const colorCombos = {
  greenBeige: {
    base: "bg-light-green text-beige border-light-green",
    hover: "hover:bg-beige hover:text-light-green",
  },
  beigeGreen: {
    base: "bg-beige text-light-green border-light-green",
    hover: "hover:bg-light-green hover:text-beige",
  },
} as const;

type ComboKey = keyof typeof colorCombos;

type ButtonProps = {
  context: string;
  icon?: LucideIcon;
  combo?: ComboKey;
};

const Buttons = ({ context, icon: Icon, combo = "greenBeige" }: ButtonProps) => {
  const { base, hover } = colorCombos[combo];
  return (
    <button
      className={`w-fit h-[40px] px-3 border-2  font-bold
                 rounded-2xl 
                 transition-all duration-500 shadow-md 
                 hover:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_0_15px_rgba(34,197,94,0.5)]
                  flex items-center justify-center gap-3 max-lg:text-sm cursor-pointer
                  ${base} ${hover}`}
    >
      {context}
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
};

export default Buttons;
