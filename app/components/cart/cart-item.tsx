import React from 'react';
import { Trash2 } from 'lucide-react';
import NumberStepper from './quantity-selector';

const CartItem = ({ 
    item, 
    onQuantityChange, 
    onRemove,
    currency = "Rs."
}) => {
    const handleQuantityDecrease = () => {
        if (item.quantity > 1) {
            onQuantityChange(item.id, item.quantity - 1);
        } else {
            onRemove(item.id);
        }
    };

    const handleQuantityIncrease = () => {
        onQuantityChange(item.id, item.quantity + 1);
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
            <img
                src={item.imageUrl}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                    e.target.src = '/assets/placeholder.jpg'; // Fallback image
                }}
            />
            
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            </div>

            <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <NumberStepper />

                {/* Price */}
                <div className="text-right min-w-[80px]">
                    <span className="font-medium">{currency}{item.price}</span>
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