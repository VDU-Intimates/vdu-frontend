'use client';
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CartItem from '../components/cart/cart-item';
import OrderSummary from '../components/cart/order-summary';
import DeliveringTo from '../components/cart/delivering-to';

const CartPage = () => {
    // Mock data - will be replaced with API data
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            imageUrl: '/assets/shirt1.jpg',
            name: 'Heart unisex T-shirt',
            price: 1500,
            quantity: 1
        },
        {
            id: 2,
            imageUrl: '/assets/shirt2.jpg',
            name: 'Believe Printed Oversized Baggy T-shirt',
            price: 2300,
            quantity: 1
        },
        {
            id: 3,
            imageUrl: '/assets/shirt3.jpg',
            name: 'Fit short sleeve',
            price: 2300,
            quantity: 1
        },
        {
            id: 4,
            imageUrl: '/assets/shirt4.jpg',
            name: 'Women Sport Intimates',
            price: 2300,
            quantity: 1
        },
        {
            id: 5,
            imageUrl: '/assets/shirt5.jpg',
            name: 'Men Unpadded Athletic Underwear',
            price: 1100,
            quantity: 1
        },
        {
            id: 6,
            imageUrl: '/assets/shirt6.jpg',
            name: 'Yellow & Steel Gray Sport T-shirt',
            price: 2500,
            quantity: 1
        }
    ]);

    const [isLoading, setIsLoading] = useState(false);
    
    // Form data for delivery
    const [deliveryInfo, setDeliveryInfo] = useState({
        fullName: '',
        address: '',
        phoneNumber: '',
        email: ''
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = 20;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const deliveryFee = 300;
    const total = subtotal - discountAmount + deliveryFee;

    // Handlers
    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (itemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const handleDeliveryInputChange = (field, value) => {
        setDeliveryInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOrderConfirm = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/orders/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'USR-20250913-396130',
                    items: cartItems,
                    subtotal: subtotal,
                    discount: discountAmount,
                    deliveryFee: deliveryFee,
                    total: total,
                    deliveryInfo: deliveryInfo,
                    date: new Date()
                })
            });

            const data = await response.json();
            console.log('Order placed:', data);
            alert('Order confirmed successfully!');
            
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setCartItems([]);
        setDeliveryInfo({
            fullName: '',
            address: '',
            phoneNumber: '',
            email: ''
        });
    };

    const handleContinueShopping = () => {
        // Navigate back to products page
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <button 
                        onClick={handleContinueShopping}
                        className="flex items-center text-gray-700 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Continue Shopping
                    </button>
                </div>

                <hr className="border-gray-300 mb-6" />

                {/* Shopping Cart Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Shopping cart</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                    </p>

                    {/* Cart Items */}
                    <div className="space-y-4 mb-8">
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onQuantityChange={handleQuantityChange}
                                onRemove={handleRemoveItem}
                                currency="Rs."
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <OrderSummary
                        subtotal={subtotal}
                        discountPercent={discountPercent}
                        discountAmount={discountAmount}
                        deliveryFee={deliveryFee}
                        total={total}
                        currency="Rs."
                    />

                    {/* Delivering To */}
                    <DeliveringTo
                        deliveryInfo={deliveryInfo}
                        onInputChange={handleDeliveryInputChange}
                        onClear={handleClear}
                        onOrderConfirm={handleOrderConfirm}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default CartPage;