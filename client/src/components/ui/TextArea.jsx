import React from 'react';

export const TextArea = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <textarea
      className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-[#00c29f] focus:ring-4 focus:ring-[#00c29f]/10 outline-none transition-all duration-200 min-h-[120px] resize-y`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);