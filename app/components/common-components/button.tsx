
"use client";
import React from "react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000"; // adjust to your backend

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
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;

  // Needed for cart API
  productId?: string;
  size?: string;
  quantity?: number;
};

const Buttons = ({
  context,
  icon: Icon,
  combo = "greenBeige",
  disabled,
  onClick,
  className = "",
  productId,
  size,
  quantity = 1,
}: ButtonProps) => {
  const { base, hover } = colorCombos[combo];

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    // always run custom handler first
    if (onClick) onClick(e);

    if (disabled) return;

    // Check if this is an Add to Cart button
    if (context.trim().toLowerCase() === "add to cart") {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          alert("Please log in first.");
          toast("")
          return;
        }

        if (!productId || !size) {
          console.error("Missing productId or size for addToCart");
          return;
        }

        const res = await fetch(`${API_BASE}/api/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, size, quantity }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to add to cart");

        toast.success("Added to cart ");

      } catch (err) {
        toast.error("Add to Cart failed")
        console.error(":", err);
      }
    }
  };

  return (
    <button
      onClick={handleClick}

      disabled={disabled}
      className={[
        "w-fit h-[40px] px-3 border-2 font-bold rounded-2xl transition-all duration-300 shadow-md",
        "flex items-center justify-center gap-3 max-xl:py-6 max-xl:text-xs lg:text-sm",
        base,
        disabled
          ? "opacity-50 cursor-not-allowed pointer-events-none hover:shadow-none"
          : `cursor-pointer ${hover}`,

        className,
      ].join(" ")}
    >
      {context}
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
};


export default Buttons;
