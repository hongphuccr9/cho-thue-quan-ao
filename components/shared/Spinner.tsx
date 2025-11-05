import React from 'react';

interface SpinnerProps {
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = "Đang tải dữ liệu...", className }) => {
  return (
    <div className={`flex flex-col justify-center items-center h-full space-y-4 ${className}`}>
      <div
        className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
        role="status"
        aria-live="polite"
        aria-label="Đang tải"
      >
      </div>
      {text && <p className="text-lg text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
};
