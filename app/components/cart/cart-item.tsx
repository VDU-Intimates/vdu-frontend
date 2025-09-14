import React from 'react';
import { Trash2 } from 'lucide-react';
import NumberStepper from './quantity-selector';
import Image from 'next/image';

const CartItem = ({ item, onQuantityChange, onRemove, currency = "Rs." }) => {
  const handleQuantityChange = (newQuantity) => {
    onQuantityChange(item.id, newQuantity);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
      <Image
        src={item.imageUrl || '/assets/placeholder.jpg'}
        alt={item.name}
        width={64}
        height={64}
        className="object-cover rounded-md flex-shrink-0"
        onError={(e) => {
          e.target.src = '/assets/placeholder.jpg';
        }}
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
        {item.size && (
          <p className="text-sm text-gray-500">Size: {item.size}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Quantity Controls */}
        <NumberStepper
          value={item.quantity}
          onChange={handleQuantityChange}
          min={1}
          max={99}
        />

        {/* Price */}
        <div className="text-right min-w-[80px]">
          <span className="font-medium">
            {currency}{(item.price * item.quantity).toFixed(2)}
          </span>
          <div className="text-xs text-gray-500">
            {currency}{item.price} each
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700 p-1 transition-colors"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;