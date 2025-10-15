import React from 'react';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import NumberStepper from './quantity-selector';

interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string[];
  size: string;
  quantity: number;
}

interface Props {
  item: CartItemType;
  onQuantityChange: (itemId: string, newQuantity: number) => void | Promise<void>;
  onRemove: (itemId: string) => void | Promise<void>;
  currency?: string;
}

const CartItem: React.FC<Props> = ({ item, onQuantityChange, onRemove, currency = 'Rs.' }) => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
    <Image
      src={item.imageUrl?.[0] || '/assets/images/placeholder-tshirt.jpg'}
      alt={item.name}
      width={64}
      height={64}
      className="rounded-md object-cover flex-shrink-0"
    />
    <div className="flex-1">
      <h3 className="font-medium text-gray-900">{item.name}</h3>
      <p className="text-sm text-gray-500">Size: {item.size}</p>
    </div>
    <NumberStepper value={item.quantity} min={1}
          max={1000} onChange={(q) => onQuantityChange(item.id, q)} />
    <div className="text-right">
      <div className="font-semibold">
        {currency}{(item.price * item.quantity).toLocaleString()}
      </div>
      <div className="text-xs text-gray-500">{currency}{item.price.toLocaleString()} each</div>
    </div>
    <button onClick={() => onRemove(item.id)} className="text-red-500 cursor-pointer hover:text-red-700 p-2">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

export default CartItem;




