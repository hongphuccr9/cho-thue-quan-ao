import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, style }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 ${className}`} style={style}>
      {children}
    </div>
  );
};