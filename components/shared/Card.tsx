
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Added an optional `style` prop to allow passing inline styles for animations and other use cases.
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, style }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 ${className}`} style={style}>
      {children}
    </div>
  );
};
