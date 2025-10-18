import React from 'react';

interface OrderSummaryProps {
    subtotal: number; 
    discountPercent?: number; 
    discountAmount: number; 
    deliveryFee: number; 
    total: number;
    currency?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    subtotal, 
    discountPercent = 0, // Using default value here for safety, though CartPage passes a calculated object
    discountAmount = 0, 
    deliveryFee = 0, 
    total,
    currency = "Rs."
}) => {
    // Helper to format numbers consistently
    const format = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return (
        <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{currency}{format(subtotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">
                            Discount {discountPercent > 0 && `(-${discountPercent}%)`}:
                        </span>
                        <span className="text-red-500">
                            -{currency}{format(discountAmount)}
                        </span>
                    </div>
                )}
                
                <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>{currency}{format(deliveryFee)}</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{currency}{format(total)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;