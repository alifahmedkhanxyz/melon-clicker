import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'connect';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-bold shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-gray-800 hover:bg-gray-50 border-2 border-white/50",
    secondary: "bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border border-white/30",
    danger: "bg-danger text-white hover:bg-red-600",
    connect: "bg-[#0088cc] text-white hover:bg-[#0077b5]" // Telegram blue-ish
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};