import React from 'react';
import { Trash2, ImageIcon, Type } from 'lucide-react';
import Image from 'next/image';
import NumberStepper from './quantity-selector';

type CustomText = {
  content: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  left?: number;
  top?: number;
  angle?: number;
};

export interface CartItemType {
  id: string;                 // Mongo id from backend
  productId: string;           // public product id
  productName: string;
  price: number;
  photoUrl: string;            // base product image
  size: string;
  quantity: number;
  custom?: {
    isCustomized?: boolean;
    designId?: string;
    previewUrl?: string;
    imageUrls?: string[];
    texts?: CustomText[];
    color?: string;
    note?: string;
  };
}

interface Props {
  item: CartItemType;
  onQuantityChange: (itemId: string, newQuantity: number) => void | Promise<void>;
  onRemove: (itemId: string) => void | Promise<void>;
  currency?: string;
}

const CartItem: React.FC<Props> = ({ item, onQuantityChange, onRemove, currency = 'Rs.' }) => {
  const isCustomized = !!item.custom?.isCustomized;
  const displayImg =
    (isCustomized && item.custom?.previewUrl) ||
    item.photoUrl ||
    '/assets/images/placeholder-tshirt.jpg';

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Image */}
      <div className="relative">
        <Image
          src={displayImg}
          alt={item.productName}
          width={72}
          height={72}
          className="rounded-md object-cover flex-shrink-0"
        />
        {isCustomized && (
          <span className="absolute -top-2 -right-2 rounded-full bg-emerald-600 text-white text-[10px] px-2 py-0.5 shadow">
            Customized
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.productName}</h3>
        <p className="text-sm text-gray-500">Size: {item.size}</p>
      </div>

      {/* Quantity */}
      <NumberStepper
        value={item.quantity}
        min={1}
        max={1000}
        onChange={(q) => onQuantityChange(item.id, q)}
      />

      {/* Price */}
      <div className="text-right w-[120px]">
        <div className="font-semibold">
          {currency}
          {(item.price * item.quantity).toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">
          {currency}
          {item.price.toLocaleString()} each
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 cursor-pointer hover:text-red-700 p-2"
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CartItem;
