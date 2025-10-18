// app/components/cart/delivering-to.tsx
"use client";

import React, { useMemo, useState } from "react";
import PrimaryButton from "../common-components/primary-button";

export type DeliveryInfo = {
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  paymentMethod?: "cod" | "payNow";
};

type Props = {
  deliveryInfo: DeliveryInfo;
  onInputChange: (field: keyof DeliveryInfo, value: string) => void;
  onClear: () => void;
  onOrderConfirm: () => void;
  isLoading?: boolean;
  termsText?: string;
};

const nameRx = /^[A-Za-zÀ-ÖØ-öø-ÿ''.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ''.-]+)+$/;
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const lkPhoneRx = /^(?:\+94\d{9}|0\d{9}|\+?\d{10,15})$/;

function validate(values: DeliveryInfo) {
  const errors: Partial<Record<keyof DeliveryInfo, string>> = {};

  const fullName = (values.fullName || "").trim();
  const address = (values.address || "").trim();
  const phone = (values.phoneNumber || "").trim();
  const email = (values.email || "").trim();

  if (!fullName) errors.fullName = "Full name is required.";
  else if (fullName.length < 3) errors.fullName = "Full name must be at least 3 characters.";
  else if (!nameRx.test(fullName)) errors.fullName = "Enter first and last name.";

  if (!address) errors.address = "Address is required.";
  else if (address.length < 10) errors.address = "Address must be at least 10 characters.";

  if (!phone) errors.phoneNumber = "Phone number is required.";
  else if (!lkPhoneRx.test(phone)) errors.phoneNumber = "Enter a valid phone (e.g., 0XXXXXXXXX or +94XXXXXXXXX).";

  if (!email) errors.email = "Email is required.";
  else if (!emailRx.test(email)) errors.email = "Enter a valid email address.";

  return errors;
}

const DeliveringTo: React.FC<Props> = ({
  deliveryInfo,
  onInputChange,
  onClear,
  onOrderConfirm,
  isLoading = false,
  termsText = 'By clicking the button I agree to the terms of service',
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => validate(deliveryInfo), [deliveryInfo]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    onInputChange(field, value);
  };

  const handleBlur = (field: keyof DeliveryInfo) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const inputBase =
    "w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const errorText = "mt-1 text-sm text-red-600";

  const tryConfirm = () => {
    if (!isValid) {
      setTouched({ fullName: true, address: true, phoneNumber: true, email: true });
      return;
    }
    onOrderConfirm();
  };

  const payBtnLabel =
    deliveryInfo.paymentMethod === "payNow" ? "Pay Securely" : "Order Confirmed";

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="text-lg font-medium mb-4">Delivering To</h3>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={deliveryInfo.fullName || ""}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            className={`${inputBase} ${touched.fullName && errors.fullName ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {touched.fullName && errors.fullName && (
            <p className={errorText}>{errors.fullName}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <textarea
            placeholder="Address"
            rows={3}
            value={deliveryInfo.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            className={`${inputBase} resize-none ${touched.address && errors.address ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {touched.address && errors.address && (
            <p className={errorText}>{errors.address}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <input
            type="tel"
            placeholder="Phone number"
            value={deliveryInfo.phoneNumber || ""}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            onBlur={() => handleBlur("phoneNumber")}
            className={`${inputBase} ${touched.phoneNumber && errors.phoneNumber ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {touched.phoneNumber && errors.phoneNumber && (
            <p className={errorText}>{errors.phoneNumber}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email"
            value={deliveryInfo.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`${inputBase} ${touched.email && errors.email ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {touched.email && errors.email && (
            <p className={errorText}>{errors.email}</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={(deliveryInfo.paymentMethod || "cod") === "cod"}
                onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 font-medium">
                Cash on Delivery (COD)
              </span>
            </label>
            <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="payNow"
                checked={deliveryInfo.paymentMethod === "payNow"}
                onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 font-medium">
                Pay Online
              </span>
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">{termsText}</p>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <PrimaryButton
            variant="danger" // Use the danger style for clearing
            context="Clear ✕"
            onClick={() => {
              setTouched({});
              onClear();
            }}
            disabled={isLoading}
            // Override default size to fit the layout
            className="!w-full sm:!w-auto !h-12 !text-sm flex-shrink-0" 
          />
          <PrimaryButton
            variant="primary" // Default primary style
            context={isLoading ? "Processing..." : payBtnLabel}
            onClick={tryConfirm}
            disabled={isLoading || !isValid}
            // Override default size and make it grow
            className="!w-full !h-12 !text-sm flex-grow" 
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveringTo;
