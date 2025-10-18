'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import CartItem from '../components/cart/cart-item';
import OrderSummary from '../components/cart/order-summary';
import DeliveringTo from '../components/cart/delivering-to';
import NavBar from '../components/nav-bar/nav-bar';
import Footer from '../components/footer/footer';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Form data for delivery
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    address: '',
    phoneNumber: '',
    email: ''
  });

  // Fetch cart data when component mounts
  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug: Check all possible token locations
      const authToken = localStorage.getItem('authToken');
      const token = localStorage.getItem('token');
      const access_token = localStorage.getItem('access_token');
      const jwtToken = localStorage.getItem('jwt');
      const userToken = localStorage.getItem('userToken');

      console.log('Debug - Available tokens:', {
        authToken: authToken ? 'exists' : 'null',
        token: token ? 'exists' : 'null',
        accessToken: access_token ? 'exists' : 'null',
        jwtToken: jwtToken ? 'exists' : 'null',
        userToken: userToken ? 'exists' : 'null'
      });

      // Get token from localStorage - check all common locations
      const finalToken = authToken || token || access_token || jwtToken || userToken;

      console.log('Debug - Using token:', finalToken ? `${finalToken.substring(0, 20)}...` : 'NO TOKEN FOUND');

      if (!finalToken) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalToken}`
      };

      console.log('Debug - Request headers:', headers);

      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'GET',
        headers: headers
      });

      console.log('Debug - Response status:', response.status);
      console.log('Debug - Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Debug - Error response body:', errorText);
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Optionally clear invalid tokens
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          return;
        }
        throw new Error(`Failed to fetch cart: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Debug - Cart data received:', data);
      
      // Transform backend data to match frontend expectations
      const transformedItems = data.items.map(item => ({
        id: item.productId,
        name: item.productName,
        price: item.price,
        imageUrl: item.photoUrl,
        size: item.size,
        quantity: item.quantity
      }));

      console.log('Debug - Transformed items:', transformedItems);
      setCartItems(transformedItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart items');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals - use backend subtotal if available, otherwise calculate
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountPercent = 20;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const deliveryFee = 300;
  const total = subtotal - discountAmount + deliveryFee;

  // Update quantity in backend and frontend
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('accessToken');

      // Update in backend (you'll need to create this endpoint)
      const response = await fetch(`http://localhost:5000/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          productId: itemId,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // Update frontend state
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  // Remove item from backend and frontend
  const handleRemoveItem = async (itemId) => {
    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('accessToken');

      // Remove from backend (you'll need to create this endpoint)
      const response = await fetch(`http://localhost:5000/api/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          productId: itemId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Update frontend state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleDeliveryInputChange = (field, value) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderConfirm = async () => {
    // Get userId from token (you might want to decode JWT properly)
    const token = localStorage.getItem('authToken') || 
                 localStorage.getItem('token') || 
                 localStorage.getItem('accessToken');
    
    if (!token) {
      alert('Please log in to place an order');
      return;
    }

    // Validate delivery information
    if (!deliveryInfo.fullName || !deliveryInfo.address || !deliveryInfo.phoneNumber) {
      alert('Please fill in all required delivery information (Full Name, Address, Phone Number)');
      return;
    }

    setIsLoading(true);
    try {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const formattedItems = cartItems.map(item => ({
        name: item.name,
        productId: item.id,
        customisedProductId: null,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      // Place order
      const orderResponse = await fetch('http://localhost:5000/api/orders/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subTotal: subtotal,
          deliverFee: deliveryFee,
          discount: discountAmount,
          totalAmount: total,
          date: new Date(),
          quantity: totalQuantity,
          isBulk: totalQuantity > 500,
          items: formattedItems,
          deliveryInfo: deliveryInfo
        })
      });

      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
          alert('Session expired. Please log in again.');
          return;
        }
        throw new Error(`Order API error! status: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      console.log('Order placed:', orderData);

      // Create delivery record
      const deliveryResponse = await fetch('http://localhost:5000/api/deliveries/create-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          deliverFee: deliveryFee,
          customerName: deliveryInfo.fullName,
          address: deliveryInfo.address,
          phone: deliveryInfo.phoneNumber,
          email: deliveryInfo.email || ''
        })
      });

      if (!deliveryResponse.ok) {
        console.error('Failed to create delivery record, but order was placed successfully');
      }

      // Clear cart (both frontend and backend)
      await clearCart();
      setDeliveryInfo({ fullName: '', address: '', phoneNumber: '', email: '' });
      alert('Order confirmed and delivery scheduled successfully!');
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart after successful order
  const clearCart = async () => {
    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('accessToken');

      await fetch('http://localhost:5000/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleClearDeliveryInfo = () => {
    setDeliveryInfo({ fullName: '', address: '', phoneNumber: '', email: '' });
  };

  const handleContinueShopping = () => {
    window.history.back();
  };
  const handleStartShopping = () => {
    window.location.assign("/AllProducts")
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button onClick={handleContinueShopping} className="flex items-center text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </button>
          </div>
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button 
              onClick={fetchCartData}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={handleContinueShopping} className="flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </button>
        </div>
        <hr className="border-gray-300 mb-6" />

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading cart...</span>
          </div>
        ) : (
          <>
            {/* Shopping Cart Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Shopping cart</h2>
              <p className="text-sm text-gray-600 mb-6">
                You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
              </p>

              {/* Empty cart state */}
              {cartItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                  <button onClick={handleStartShopping} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <>
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

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <OrderSummary
                      subtotal={subtotal}
                      discountPercent={discountPercent}
                      discountAmount={discountAmount}
                      deliveryFee={deliveryFee}
                      total={total}
                      currency="Rs."
                    />
                    <DeliveringTo
                      deliveryInfo={deliveryInfo}
                      onInputChange={handleDeliveryInputChange}
                      onClear={handleClearDeliveryInfo}
                      onOrderConfirm={handleOrderConfirm}
                      isLoading={isLoading}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    <Footer />
    </div>

  );
};

export default CartPage;