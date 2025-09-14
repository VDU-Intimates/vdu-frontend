import React from 'react';
import { Trash2 } from 'lucide-react';
import NumberStepper from './quantity-selector';
import Image from 'next/image';

const CartItem = ({ 
    item, 
    onQuantityChange, 
    onRemove,
    currency = "Rs."
}) => {
    
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
            <Image
                src={item.imageUrl}
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