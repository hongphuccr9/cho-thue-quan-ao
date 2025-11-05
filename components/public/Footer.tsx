import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            {/* Social media icons can be added here */}
          </div>
          <div className="mt-8 md:mt-0 md:order-1 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="font-semibold text-base text-gray-800 dark:text-gray-200">Cửa Hàng Thuê Đồ UI</p>
            <p>Địa chỉ: 123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh</p>
            <p>Số điện thoại: (028) 3812 3456</p>
            <p className="mt-4">&copy; {new Date().getFullYear()} Cửa Hàng Thuê Đồ UI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
