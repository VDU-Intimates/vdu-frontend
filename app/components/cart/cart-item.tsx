import React from 'react';
import { Trash2 } from 'lucide-react';
import NumberStepper from './quantity-selector'; // Assuming this is the new NumberStepper file
import Image from 'next/image';

// Use the type defined in CartPage
interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  quantity: number;
}

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (itemId: string, newQuantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  currency?: string;
}

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove, currency = "Rs." }) => {
  // Directly call the parent handler
  const handleQuantityChange = (newQuantity: number) => {
    // The parent (CartPage) handles the state update and API call
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
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          (e.target as HTMLImageElement).src = '/assets/placeholder.jpg';
        }}
        // Next/Image requires style/layout props if not using fill, or specify size
        style={{ width: '64px', height: '64px' }} 
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
          value={item.quantity} // Passes the current quantity
          onChange={handleQuantityChange} // Calls handleQuantityChange
          min={1}
          max={99}
        />

        {/* Price */}
        <div className="text-right min-w-[80px]">
          <span className="font-medium">
            {/* The price automatically reflects the state change from CartPage */}
            {currency}{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-gray-500">
            {currency}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
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