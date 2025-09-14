import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function NumberStepper() {
  const [value, setValue] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('1');

  const increment = () => {
    setValue(prev => prev + 1);
  };

  const decrement = () => {
    setValue(prev => prev - 1);
  };

  const handleNumberClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      setValue(numValue);
    } else {
      setInputValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
      <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Decrement Button */}
        <button
          onClick={decrement}
          className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-l-lg border-r border-gray-200 transition-colors"
        >
          <Minus size={16} />
        </button>

        {/* Number Display/Input */}
        <div className="flex items-center justify-center w-16 h-10">
          {isEditing ? (
            <input
              type="text"
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
              {value}
            </button>
          )}
        </div>

        {/* Increment Button */}
        <button
          onClick={increment}
          className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-r-lg border-l border-gray-200 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
  );
}