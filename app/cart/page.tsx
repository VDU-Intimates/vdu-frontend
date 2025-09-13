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
        // Check if user is authenticated
        if (!userId) {
            alert('Please log in to place an order');
            // window.location.href = '/login'; // Uncomment to redirect to login
            return;
        }

        // Validate delivery information
        if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber) {
            alert('Please fill in all required delivery information (Full Name, Address, Phone Number)');
            return;
        }

        setIsLoading(true);
        try {
            // Calculate total quantity for isBulk check
            const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            // Format items to match API expectations
            const formattedItems = cartItems.map(item => ({
                name: item.name,
                productId: item.id, // Using item.id as productId
                customisedProductId: null, // Set to null or add if you have this data
                quantity: item.quantity,
                unitPrice: item.price
            }));

            // Get token directly here instead of calling getAuthToken()
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
            
            // Step 1: Place the order
            const orderResponse = await fetch('http://localhost:5000/api/orders/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }) // Include JWT token in header if exists
                },
                body: JSON.stringify({
                    userId: userId, // Use extracted userId from JWT
                    subTotal: subtotal, // API expects 'subTotal' not 'subtotal'
                    deliverFee: deliveryFee, // API expects 'deliverFee' not 'deliveryFee'
                    discount: discountAmount,
                    totalAmount: total, // API expects 'totalAmount' not 'total'
                    date: new Date(),
                    quantity: totalQuantity,
                    isBulk: totalQuantity > 500,
                    items: formattedItems,
                    deliveryInfo: deliveryInfo // Additional field for your use
                })
            });

            if (!orderResponse.ok) {
                if (orderResponse.status === 401) {
                    alert('Session expired. Please log in again.');
                    // window.location.href = '/login'; // Uncomment to redirect
                    return;
                }
                throw new Error(`Order API error! status: ${orderResponse.status}`);
            }

            const orderData = await orderResponse.json();
            console.log('Order placed:', orderData);

            // Step 2: Create delivery record using the orderId from the order response
            const deliveryResponse = await fetch('http://localhost:5000/api/deliveries/create-delivery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }) // Include JWT token in header if exists
                },
                body: JSON.stringify({
                    orderId: orderData.orderId, // Use the orderId from the order response
                    deliverFee: deliveryFee,
                    customerName: deliveryInfo.fullName,
                    address: deliveryInfo.address,
                    phone: deliveryInfo.phoneNumber,
                    email: deliveryInfo.email || '' // Email is optional
                })
            });

            if (!deliveryResponse.ok) {
                console.error('Failed to create delivery record, but order was placed successfully');
                // Don't throw error here since order was successful
                // Just log the issue and continue
                const deliveryError = await deliveryResponse.text();
                console.error('Delivery API error:', deliveryError);
            } else {
                const deliveryData = await deliveryResponse.json();
                console.log('Delivery created:', deliveryData);
            }
            
            // Clear cart and delivery info after successful order
            setCartItems([]);
            setDeliveryInfo({
                fullName: '',
                address: '',
                phoneNumber: '',
                email: ''
            });
            
            alert('Order confirmed and delivery scheduled successfully!');
            
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // FIXED: Only clear delivery info, not cart items
    const handleClearDeliveryInfo = () => {
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

                    {/* Delivering To - FIXED: Use onClear prop name to match component */}
                    <DeliveringTo
                        deliveryInfo={deliveryInfo}
                        onInputChange={handleDeliveryInputChange}
                        onClear={handleClearDeliveryInfo}
                        onOrderConfirm={handleOrderConfirm}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default CartPage;