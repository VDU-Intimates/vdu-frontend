import React from 'react';

const DeliveringTo = ({ 
    deliveryInfo, 
    onInputChange, 
    onClear,  // This matches what's being passed from parent
    onOrderConfirm,
    isLoading = false,
    termsText = 'By clicking "Order Confirmed" I agree to the companies terms of service'
}) => {
    const handleInputChange = (field, value) => {
        onInputChange(field, value);
    };

    return (
        <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-medium mb-4">Delivering To</h3>
            
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={deliveryInfo.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                />
                
                <textarea
                    placeholder="Address"
                    rows={3}
                    value={deliveryInfo.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    required
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="tel"
                        placeholder="Phone number"
                        value={deliveryInfo.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={deliveryInfo.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                    />
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    {termsText}
                </p>

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClear}  // FIXED: Use the correct prop name
                        className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        disabled={isLoading}
                    >
                        Clear ✕
                    </button>
                    <button
                        onClick={onOrderConfirm}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Order Confirmed'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveringTo;