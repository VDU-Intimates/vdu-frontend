import React from "react";
import type { LucideIcon } from "lucide-react";

const colorCombos = {
  greenBeige: {
    base: "bg-light-green text-beige border-light-green",
    hover: "hover:bg-beige hover:text-light-green hover:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_0_15px_rgba(34,197,94,0.5)]",
  },
  beigeGreen: {
    base: "bg-beige text-light-green border-light-green",
    hover: "hover:bg-light-green hover:text-beige hover:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_0_15px_rgba(34,197,94,0.5)]",
  },
  redTransparent: {
    base: "bg-[#BB4848] text-white border-[#BB4848]",
    hover: "hover:bg-transparent hover:text-[#BB4848] hover:shadow-[0_4px_6px_rgba(0,0,0,0.25),0_0_15px_rgba(239,68,68,0.6)]",
  },
} as const;

type ComboKey = keyof typeof colorCombos;

type ButtonProps = {
  context: string;
  icon?: LucideIcon;
  combo?: ComboKey;
  disabled?:boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

const Buttons = ({ context, icon: Icon, combo = "greenBeige",disabled, onClick,
  className = "", }: ButtonProps) => {
  const { base, hover } = colorCombos[combo];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-fit h-[40px] px-3 border-2 font-bold rounded-2xl transition-all duration-300 shadow-md",
        "flex items-center justify-center gap-3 max-xl:py-6 max-xl:text-xs lg:text-sm",
        base,
        disabled
          ? "opacity-50 cursor-not-allowed pointer-events-none hover:shadow-none"
          : `cursor-pointer ${hover} hover:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_0_15px_rgba(34,197,94,0.5)]`,
        className,
      ].join(" ")}
    >
      {context}
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
};

export default Buttons;
