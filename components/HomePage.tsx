import React, { useState, useMemo } from 'react';
import type { ClothingItem, SiteConfig } from '../types';
import { PublicLayout } from './public/PublicLayout';
import { Card } from './shared/Card';
import { SearchIcon } from './icons/SearchIcon';
import type { User } from './AuthContext';
import { HeroEditModal } from './HeroEditModal';
import { PencilIcon } from './icons/PencilIcon';

interface HomePageProps {
  clothingItems: ClothingItem[];
  rentedItemCounts: Map<number, number>;
  user: User | null;
  siteConfig: SiteConfig;
  onUpdateConfig: (configs: { key: string; value: string }[]) => Promise<void>;
}

export const HomePage: React.FC<HomePageProps> = ({ clothingItems, rentedItemCounts, user, siteConfig, onUpdateConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return clothingItems
      .filter(item => {
        // Filter by availability
        const isAvailable = item.quantity - (rentedItemCounts.get(item.id) || 0) > 0;
        if (availabilityFilter === 'available' && !isAvailable) {
          return false;
        }
        // Filter by search term
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  }, [clothingItems, rentedItemCounts, searchTerm, availabilityFilter]);
  
  const handleSaveConfig = async (configs: { key: string; value: string }[]) => {
      await onUpdateConfig(configs);
      setIsEditModalOpen(false);
  };

  const heroTitle = siteConfig.hero_title || 'Bộ Sưu Tập Thời Trang Cho Thuê';
  const heroSubtitle = siteConfig.hero_subtitle || 'Khám phá những bộ trang phục tuyệt đẹp cho mọi dịp đặc biệt. Phong cách, tiện lợi và đẳng cấp.';
  const heroImageUrl = siteConfig.hero_image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop';

  return (
    <PublicLayout siteConfig={siteConfig}>
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8">
           <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ zIndex: -1, backgroundImage: `url('${heroImageUrl}')` }}></div>
           <div className="absolute inset-0 bg-black/50" style={{ zIndex: -1 }}></div>
           
           {user?.role === 'admin' && (
             <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors"
                >
                    <PencilIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Chỉnh sửa Banner</span>
                </button>
             </div>
           )}

          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{heroTitle}</h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">{heroSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Product List Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8 md:flex md:items-center md:justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Danh Mục Sản Phẩm</h2>
            <div className="mt-4 flex items-center gap-4 md:mt-0">
                {/* Search Input */}
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        placeholder="Tìm kiếm theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm bg-white dark:bg-gray-800"
                    />
                </div>
                {/* Availability Filter */}
                <div className="flex items-center rounded-lg p-1 bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setAvailabilityFilter('all')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${availabilityFilter === 'all' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tất cả</button>
                    <button onClick={() => setAvailabilityFilter('available')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${availabilityFilter === 'available' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Còn hàng</button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {filteredItems.map(item => {
              const availableCount = item.quantity - (rentedItemCounts.get(item.id) || 0);
              const isAvailable = availableCount > 0;
              return (
                <div key={item.id} className="group">
                  <Card className="!p-0 overflow-hidden w-full h-full flex flex-col">
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden xl:aspect-h-8 xl:aspect-w-7">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cỡ: {item.size}</p>
                      <div className="flex-grow" />
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {item.rentalPrice.toLocaleString('vi-VN')}đ
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ngày</span>
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                          {isAvailable ? 'Còn hàng' : 'Đã hết'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
           {filteredItems.length === 0 && (
              <div className="text-center py-16">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">Không tìm thấy sản phẩm nào phù hợp.</p>
              </div>
            )}
        </div>
      </div>
      {user?.role === 'admin' && (
          <HeroEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              config={siteConfig}
              onSave={handleSaveConfig}
          />
      )}
    </PublicLayout>
  );
};