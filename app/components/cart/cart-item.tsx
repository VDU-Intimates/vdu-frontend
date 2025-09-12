"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

type CartItemProps = {
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onSetQuantity?: (newQty: number) => void;
};

const CartItem: FC<CartItemProps> = ({
  name,
  price,
  imageUrl,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
  onSetQuantity,
}) => {
  const [editing, setEditing] = useState(false);
  const [tempQty, setTempQty] = useState(quantity);

  const handleBlur = () => {
    setEditing(false);
    if (tempQty > 0 && onSetQuantity) onSetQuantity(tempQty);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl p-4 
    shadow-md bg-white/95 w-[40%]">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        </div>
        <span className="font-medium">{name}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <button
            onClick={onIncrease}
            className="rounded-md border p-1 hover:bg-gray-100"
          >
            <ChevronUp size={16} />
          </button>

          {editing ? (
            <input
              type="number"
              min={1}
              value={tempQty}
              onChange={(e) => setTempQty(Number(e.target.value))}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-12 rounded border px-1 text-center text-sm"
              autoFocus
            />
          ) : (
            <span
              className="mx-1 w-5 cursor-pointer text-center"
              onClick={() => setEditing(true)}
            >
              {quantity}
            </span>
          )}

          <button
            onClick={onDecrease}
            className="rounded-md border p-1 hover:bg-gray-100"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <span className="font-medium">Rs.{price}</span>
        <button onClick={onRemove} className="text-red-500 hover:text-red-600">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
