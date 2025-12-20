import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({ children, loading, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "relative flex items-center justify-center font-bold rounded-full transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#00c29f] hover:bg-[#00a88a] text-white shadow-[0_4px_14px_0_rgba(0,194,159,0.39)] hover:shadow-[0_6px_20px_rgba(0,194,159,0.23)]",
    outline: "border-2 border-[#00c29f] text-[#00c29f] hover:bg-[#00c29f]/5",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className} py-3 px-6`} disabled={loading} {...props}>
      {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
      {children}
    </button>
  );
};