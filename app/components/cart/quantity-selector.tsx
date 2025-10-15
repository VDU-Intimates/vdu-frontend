import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min: number;
  max: number;
}

export default function NumberStepper({ value, onChange, min, max }: NumberStepperProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  // Keep local state in sync with external prop value
  useEffect(() => {
    setLocalValue(value);
    if (!isEditing) {
        setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const updateQuantity = (newValue: number) => {
    const finalValue = Math.max(min, Math.min(max, newValue));
    setLocalValue(finalValue);
    onChange(finalValue); // Propagate change up to CartItem -> CartPage
  };

  const increment = () => {
    updateQuantity(localValue + 1);
  };

  const decrement = () => {
    updateQuantity(localValue - 1);
  };

  const handleNumberClick = () => {
    setIsEditing(true);
    setInputValue(localValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      updateQuantity(numValue);
    } else {
      setInputValue(localValue.toString());
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(localValue.toString());
      setIsEditing(false);
    }
  };

  const canDecrement = localValue > min;
  const canIncrement = localValue < max;

  return (
      <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Decrement Button */}
        <button
          onClick={decrement}
          className={`flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 rounded-l-lg border-r border-gray-200 transition-colors ${canDecrement ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!canDecrement}
        >
          <Minus size={16} />
        </button>

        {/* Number Display/Input */}
        <div className="flex items-center justify-center w-16 h-10">
          {isEditing ? (
            <input
              type="text"
              pattern="\d*" // Suggests only digits are expected
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-full h-full text-center text-lg font-medium border-none outline-none bg-transparent"
              autoFocus
            />
          ) : (
            <button
              onClick={handleNumberClick}
              className="w-full h-full text-lg font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              {localValue}
            </button>
          )}
        </div>

        {/* Increment Button */}
        <button
          onClick={increment}
          className={`flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 rounded-r-lg border-l border-gray-200 transition-colors ${canIncrement ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!canIncrement}
        >
          <Plus size={16} />
        </button>
      </div>
  );
}