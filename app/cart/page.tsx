'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CartItem from '../components/cart/cart-item';
import OrderSummary from '../components/cart/order-summary';
import DeliveringTo from '../components/cart/delivering-to';
import NavBar from '../components/nav-bar/nav-bar';
import Footer from '../components/footer/footer';

// --- TYPE DEFINITIONS ---

interface CartItemType {
  id: string; // The item ID in the cart (backend _id)
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  quantity: number;
}

interface DeliveryInfoType {
  fullName: string;
  address: string;
  phoneNumber: string;
  email: string;
}

// --- CART PAGE COMPONENT ---

const CartPage = () => {
  const router = useRouter(); 
  
  // 1. Explicitly type useState for cartItems
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Explicitly type useState for deliveryInfo
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfoType>({
    fullName: '',
    address: '',
    phoneNumber: '',
    email: ''
  });

  // Get token helper function (no change needed here)
  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('access_token') ||
           localStorage.getItem('jwt') ||
           localStorage.getItem('userToken');
  };

  // Fetch cart data when component mounts (no change needed here)
  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getAuthToken();

      console.log('Debug - Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN FOUND');

      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Debug - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Debug - Error response body:', errorText);
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          return;
        }
        throw new Error(`Failed to fetch cart: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Debug - Cart data received:', data);
      
      // Transform backend data to match frontend expectations
      // Ensure the structure matches CartItemType
      const transformedItems: CartItemType[] = data.items.map((item: any) => ({
        id: item._id as string,
        productId: item.productId as string,
        name: item.productName as string,
        price: item.price as number,
        imageUrl: item.photoUrl as string,
        size: item.size as string,
        quantity: item.quantity as number
      }));

      console.log('Debug - Transformed items:', transformedItems);
      setCartItems(transformedItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Casting 'err' to Error to safely access properties
      setError((err as Error).message || 'Failed to load cart items');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals using useMemo to optimize re-renders
  const orderTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = 20;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const deliveryFee = 300;
    const total = subtotal - discountAmount + deliveryFee;

    console.log('📊 Order totals recalculated:', { subtotal, discountAmount, deliveryFee, total });

    return {
      subtotal,
      discountPercent,
      discountAmount,
      deliveryFee,
      total
    };
  }, [cartItems]);

  // 3. Add explicit types for function parameters (itemId: string, newQuantity: number)
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const token = getAuthToken();

      if (!token) {
        alert('Please log in to update cart');
        return;
      }

      console.log('🔄 Updating quantity for item:', itemId, 'to:', newQuantity);

      // Optimistically update UI first
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Update in backend
      const response = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        // Revert to original cart items state on failure
        const errorData = await response.json();
        await fetchCartData(); // Re-fetch to ensure data is correct
        throw new Error(errorData.message || 'Failed to update quantity');
      }

      const data = await response.json();
      console.log('✅ Quantity updated successfully:', data);

    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  // 4. Add explicit type for function parameter (itemId: string)
  const handleRemoveItem = async (itemId: string) => {
    try {
      const token = getAuthToken();

      if (!token) {
        alert('Please log in to remove items');
        return;
      }

      console.log('🗑️ Removing item with ID:', itemId);

      const itemToRemove = cartItems.find(item => item.id === itemId);
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

      const response = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (itemToRemove) {
          // Revert removal on failure
          setCartItems(prevItems => [...prevItems, itemToRemove]);
        }
        throw new Error(errorData.message || 'Failed to remove item');
      }

      const data = await response.json();
      console.log('✅ Item removed successfully:', data);
      
    } catch (error) {
      console.error('❌ Error removing item:', error);
      alert((error as Error).message || 'Failed to remove item. Please try again.');
    }
  };

  // Clear all items from cart (no change needed here)
  const handleClearAllCart = async () => {
    const confirmClear = window.confirm('Are you sure you want to clear all items from your cart?');
    
    if (!confirmClear) return;

    try {
      const token = getAuthToken();

      if (!token) {
        alert('Please log in to clear cart');
        return;
      }

      console.log('🗑️ Clearing entire cart...');

      const previousItems = [...cartItems];
      setCartItems([]);

      const response = await fetch('http://localhost:5000/api/cart/deleteAll', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCartItems(previousItems);
        throw new Error(errorData.message || 'Failed to clear cart');
      }

      const data = await response.json();
      console.log('✅ Cart cleared successfully:', data);
      
      alert('All items removed from cart');
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      alert((error as Error).message || 'Failed to clear cart. Please try again.');
    }
  };

  // 5. Add explicit types for function parameters (field: string, value: string)
  const handleDeliveryInputChange = (field: keyof DeliveryInfoType, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderConfirm = async () => {
    const token = getAuthToken();
    
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
        productId: item.productId,
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
          subTotal: orderTotals.subtotal,
          deliverFee: orderTotals.deliveryFee,
          discount: orderTotals.discountAmount,
          totalAmount: orderTotals.total,
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
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || `Order API error! status: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order placed:', orderData);

      // Extract orderId from response
      const orderId = orderData.orderId || orderData.order?.orderId;
      
      if (!orderId) {
        console.error('No orderId in response:', orderData);
        throw new Error('Order placed but no order ID received');
      }

      // Create delivery record
      try {
        const deliveryResponse = await fetch('http://localhost:5000/api/deliveries/create-delivery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: orderId,
            deliverFee: orderTotals.deliveryFee,
            customerName: deliveryInfo.fullName,
            address: deliveryInfo.address,
            phone: deliveryInfo.phoneNumber,
            email: deliveryInfo.email || ''
          })
        });

        if (!deliveryResponse.ok) {
          console.error('Failed to create delivery record, but order was placed successfully');
        } else {
          console.log('✅ Delivery record created');
        }
      } catch (deliveryError) {
        console.error('Error creating delivery record:', deliveryError);
        // Don't throw - order was successful
      }

      // Clear cart (both frontend and backend)
      await clearCart();
      
      // Clear delivery info
      setDeliveryInfo({ fullName: '', address: '', phoneNumber: '', email: '' });
      
      // Redirect to invoice page with orderId
      console.log('🧾 Redirecting to invoice page with orderId:', orderId);
      router.push(`/Invoice?orderId=${orderId}`);
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert((error as Error).message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart after successful order (no change needed here)
  const clearCart = async () => {
    try {
      const token = getAuthToken();

      await fetch('http://localhost:5000/api/cart/deleteAll', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Don't throw - this shouldn't prevent invoice redirect
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

  // Error state (no change needed here)
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleContinueShopping} className="flex items-center text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </button>
            
            {/* Clear All Cart Button */}
            {cartItems.length > 0 && (
              <button 
                onClick={handleClearAllCart}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cart
              </button>
            )}
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
              {/* Empty cart state */}
              {cartItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                  <button onClick={handleStartShopping} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Side - Cart Items */}
                  <div className="lg:col-span-3">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Shopping cart</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                    </p>
                    <div className="space-y-4">
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

                  {/* Right Side - Order Summary and Delivery */}
                  <div className="lg:col-span-2 space-y-6">
                    <OrderSummary
                      subtotal={orderTotals.subtotal}
                      discountPercent={orderTotals.discountPercent}
                      discountAmount={orderTotals.discountAmount}
                      deliveryFee={orderTotals.deliveryFee}
                      total={orderTotals.total}
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;