import React from 'react';
import type { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { ClothingIcon } from './icons/ClothingIcon';
import { CustomerIcon } from './icons/CustomerIcon';
import { RentalIcon } from './icons/RentalIcon';
import { XIcon } from './icons/XIcon';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 w-full text-left rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-300 hover:bg-primary-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="mx-4 font-medium">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen }) => {

  const handleNavClick = (newView: View) => {
    setView(newView);
    if(window.innerWidth < 768) {
      setOpen(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: <DashboardIcon /> },
    { id: 'clothing', label: 'Quần Áo', icon: <ClothingIcon /> },
    { id: 'customers', label: 'Khách Hàng', icon: <CustomerIcon /> },
    { id: 'rentals', label: 'Lượt Thuê', icon: <RentalIcon /> },
  ] as const;

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setOpen(false)}></div>
      <div className={`fixed md:relative inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out bg-primary-900 text-white w-64 space-y-6 py-7 px-2 z-30 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between px-4 mb-10">
              <h2 className="text-2xl font-extrabold text-white">Thuê Đồ UI</h2>
               <button onClick={() => setOpen(false)} className="md:hidden p-1 rounded-md hover:bg-primary-700">
                 <XIcon />
               </button>
            </div>
            <nav>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={view === item.id}
                  onClick={() => handleNavClick(item.id)}
                />
              ))}
            </nav>
          </div>
          <div className="px-4 py-2 text-center text-sm text-gray-400">
             © {new Date().getFullYear()} Cửa Hàng Thuê Đồ
          </div>
      </div>
    </>
  );
};