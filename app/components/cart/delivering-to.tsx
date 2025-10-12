"use client";

import React, { useMemo, useState } from "react";

type DeliveryInfo = {
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  paymentMethod?: string;
};

type Props = {
  deliveryInfo: DeliveryInfo;
  onInputChange: (field: keyof DeliveryInfo, value: string) => void;
  onClear: () => void;
  onOrderConfirm: () => void;
  isLoading?: boolean;
  termsText?: string;
};

const nameRx = /^[A-Za-zÀ-ÖØ-öø-ÿ''.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ''.-]+)+$/; // at least two words
const emailRx =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Sri Lanka examples: 0XXXXXXXXX (10 digits) or +94XXXXXXXXX (11 digits after +94)
// Also accepts simple intl numbers with 10–15 digits.
const lkPhoneRx = /^(?:\+94\d{9}|0\d{9}|\+?\d{10,15})$/;

function validate(values: DeliveryInfo) {
  const errors: Partial<Record<keyof DeliveryInfo, string>> = {};

  const fullName = (values.fullName || "").trim();
  const address = (values.address || "").trim();
  const phone = (values.phoneNumber || "").trim();
  const email = (values.email || "").trim();

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 3) {
    errors.fullName = "Full name must be at least 3 characters.";
  } else if (!nameRx.test(fullName)) {
    errors.fullName = "Enter first and last name (letters, spaces, - and ' allowed).";
  }

  if (!address) {
    errors.address = "Address is required.";
  } else if (address.length < 10) {
    errors.address = "Address must be at least 10 characters.";
  }

  if (!phone) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!lkPhoneRx.test(phone)) {
    errors.phoneNumber = "Enter a valid phone (e.g., 0XXXXXXXXX or +94XXXXXXXXX).";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!emailRx.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

const DeliveringTo: React.FC<Props> = ({
  deliveryInfo,
  onInputChange,
  onClear,
  onOrderConfirm,
  isLoading = false,
  termsText = 'By clicking "Order Confirmed" I agree to the companies terms of service',
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
    // Mark all as touched if user tries to submit early
    if (!isValid) {
      setTouched({ fullName: true, address: true, phoneNumber: true, email: true });
      return;
    }
    onOrderConfirm();
  };

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
            className={`${inputBase} ${
              touched.fullName && errors.fullName ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!(touched.fullName && errors.fullName)}
            aria-describedby="fullName-error"
            required
          />
          {touched.fullName && errors.fullName && (
            <p id="fullName-error" className={errorText}>
              {errors.fullName}
            </p>
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
            className={`${inputBase} resize-none ${
              touched.address && errors.address ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!(touched.address && errors.address)}
            aria-describedby="address-error"
            required
          />
          {touched.address && errors.address && (
            <p id="address-error" className={errorText}>
              {errors.address}
            </p>
          )}
        </div>

        {/* Phone + Email */}
          <div>
            <input
              type="tel"
              placeholder="Phone number"
              value={deliveryInfo.phoneNumber || ""}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              className={`${inputBase} ${
                touched.phoneNumber && errors.phoneNumber
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              aria-invalid={!!(touched.phoneNumber && errors.phoneNumber)}
              aria-describedby="phoneNumber-error"
              required
            />
            {touched.phoneNumber && errors.phoneNumber && (
              <p id="phoneNumber-error" className={errorText}>
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={deliveryInfo.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`${inputBase} ${
                touched.email && errors.email ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!(touched.email && errors.email)}
              aria-describedby="email-error"
              required
            />
            {touched.email && errors.email && (
              <p id="email-error" className={errorText}>
                {errors.email}
              </p>
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
                checked={deliveryInfo.paymentMethod === 'cod'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 font-medium">Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="payNow"
                checked={deliveryInfo.paymentMethod === 'payNow'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-700 font-medium">Pay Now</span>
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">{termsText}</p>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => {
              setTouched({});
              onClear();
            }}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            Clear ✕
          </button>

          <button
            onClick={tryConfirm}
            disabled={isLoading || !isValid}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Order Confirmed"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveringTo;