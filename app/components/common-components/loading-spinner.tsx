// loading spinner

import React from 'react';

const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
      <p className="text-gray-600">Please wait a moment...</p>
    </div>
  </div>
);

export default LoadingSpinner;
