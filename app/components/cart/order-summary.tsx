"use client";

import { FC } from "react";

type OrderSummaryProps = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
};

const calculateDiscount = (subtotal: number, discount: number) => {
    return Math.round(subtotal * (discount / 100));
}

const OrderSummary: FC<OrderSummaryProps> = ({ subtotal, discount, deliveryFee }) => {
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4 bg-white/95 shadow-md w-full max-w-sm">
        <h2 className="font-semibold text-lg mb-2">Order Summary</h2>

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>Rs.{subtotal.toLocaleString()}</span>
        </div>

        {/* Discount */}
        {discount && 
            <div className="flex justify-between text-sm text-red-500">
                <span>Discount (-{discount.toLocaleString()}%)</span>
                <span>-Rs.{calculateDiscount(subtotal, discount).toLocaleString()}</span>
            </div>
        }
        

        {/* Delivery Fee */}
        <div className="flex justify-between text-sm">
            <span>Delivery Fee</span>
            <span>Rs.{deliveryFee.toLocaleString()}</span>
        </div>

        <hr className="my-2" />

        {/* Total */}
        <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>Rs.{total.toLocaleString()}</span>
        </div>
    </div>
  );
};

export default OrderSummary;
