import React from 'react';

const OrderSummary = ({ 
    subtotal, 
    discountPercent = 0, 
    discountAmount = 0, 
    deliveryFee = 0, 
    total,
    currency = "Rs."
}) => {
    return (
        <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{currency}{subtotal.toLocaleString()}</span>
                </div>
                
                {discountAmount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">
                            Discount {discountPercent > 0 && `(-${discountPercent}%)`}:
                        </span>
                        <span className="text-red-500">
                            -{currency}{discountAmount.toLocaleString()}
                        </span>
                    </div>
                )}
                
                <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>{currency}{deliveryFee}</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{currency}{total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;