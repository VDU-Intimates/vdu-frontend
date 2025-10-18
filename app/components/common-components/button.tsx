"use client";
import React from "react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";

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

// Input shape for bulk adds
export type AddToCartItem = {
  productId: string;     // accepts Mongo _id OR business productId
  size: string;
  quantity?: number;
};

type ButtonProps = {
  context: string;
  icon?: LucideIcon;
  combo?: ComboKey;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;

  /** Single add (legacy) */
  productId?: string;
  size?: string;
  quantity?: number;

  /** Bulk add */
  items?: AddToCartItem[];
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
  items,
}: ButtonProps) => {
  const { base, hover } = colorCombos[combo];

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    if (onClick) onClick(e);
    if (disabled) return;

    // Only run "add to cart" behavior if text implies so OR bulk items provided
    const isAddToCart = items?.length || context.trim().toLowerCase().includes("add to cart");

    if (!isAddToCart) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please log in first.");
        return;
      }

      // Prefer bulk payload when items are provided
      const payload =
        Array.isArray(items) && items.length > 0
          ? { items: items.map((it) => ({ ...it, quantity: it.quantity ?? 1 })) }
          : { productId, size, quantity };

      // Validate minimal payload
      if (!("items" in payload)) {
        if (!payload.productId || !payload.size) {
          console.error("Missing productId or size for addToCart");
          toast.error("Missing product id or size");
          return;
        }
      } else if (payload.items?.length === 0) {
        toast("No items selected");
        return;
      }

      const res = await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      const msg =
        data?.message ||
        (`items` in payload
          ? `${payload.items?.length} item(s) added to cart`
          : "Added to cart");
      toast.success(msg);
      window.location.reload();
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Add to Cart failed");
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
        disabled ? "opacity-50 cursor-not-allowed hover:shadow-none" : `cursor-pointer ${hover}`,
        className,
      ].join(" ")}
    >
      {context}
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
};

export default Buttons;
