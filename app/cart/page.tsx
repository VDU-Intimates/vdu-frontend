'use client';

import React from 'react';
import CartItem from '../components/cart/cart-item';
import OrderSummary from '../components/cart/order-summary';

const CartPage = () => {
    const count = 2;
    return (
        <>
            <div className='container'>
                <div className=''>
                    <h1>
                        Shopping Cart
                    </h1>
                    <p>You have {count} {count <= 1 ? 'item' : 'items'} in your cart</p>
                </div>
                <div>
                    <div className='flex justify-between gap-8 mt-8'>
                        <CartItem 
                            imageUrl='/assets/logo.jpg' 
                            name='test' 
                            price={99} 
                            quantity={500}
                            onDecrease={()=>{}}
                            onIncrease={()=>{}}
                            onRemove={()=>{}}
                        />

                        <OrderSummary 
                            subtotal={200} 
                            deliveryFee={77} 
                            discount={20}
                        />
                    </div>
                    <div>

                    </div>
                </div>
                

            </div>
        </>
    );
}

export default CartPage;