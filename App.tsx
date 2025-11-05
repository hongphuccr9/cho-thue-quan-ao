import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClothingPage } from './components/ClothingPage';
import { CustomersPage } from './components/CustomersPage';
import { RentalsPage } from './components/RentalsPage';
import * as db from './database';
import { isSupabaseConfigured } from './database';
import type { View, ClothingItem, Customer, Rental, SiteConfig } from './types';
import { MenuIcon } from './components/icons/MenuIcon';
import { differenceInCalendarDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import type { User } from './components/AuthContext';
import { HomePage } from './components/HomePage';

const viewTitles: Record<View, string> = {
  dashboard: 'Dashboard',
  clothing: 'Quản Lý Quần Áo',
  customers: 'Khách Hàng',
  rentals: 'Quản Lý Lượt Thuê'
};

// Component con cho toàn bộ phần quản trị (sau khi đăng nhập)
const AdminApp: React.FC<{
    clothingItems: ClothingItem[];
    customers: Customer[];
    rentals: Rental[];
    fetchData: () => void;
    user: User;
}> = ({ clothingItems, customers, rentals, fetchData, user }) => {
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const itemsWithRentalHistory = useMemo(() => {
    const itemIds = new Set<number>();
    rentals.forEach(rental => {
        rental.rentedItems.forEach(({ itemId }) => {
            itemIds.add(itemId);
        });
    });
    return itemIds;
  }, [rentals]);

  const activeRentals = useMemo(() => rentals.filter(r => !r.returnDate), [rentals]);
  
  const rentedItemCounts = useMemo(() => {
    const counts = new Map<number, number>();
    activeRentals.forEach(rental => {
        rental.rentedItems.forEach(({ itemId, quantity }) => {
            counts.set(itemId, (counts.get(itemId) || 0) + quantity);
        });
    });
    return counts;
  }, [activeRentals]);

  const handleDbAction = async (action: Promise<any>) => {
      await action;
      await fetchData();
  };

  const addClothingItem = (item: Omit<ClothingItem, 'id'>) => handleDbAction(db.addClothingItem(item));
  const addMultipleClothingItems = (items: Omit<ClothingItem, 'id'>[]) => handleDbAction(db.addMultipleClothingItems(items));
  const updateClothingItem = (itemToUpdate: ClothingItem) => handleDbAction(db.updateClothingItem(itemToUpdate));
  const deleteClothingItem = (itemId: number) => handleDbAction(db.deleteClothingItem(itemId));
  const addCustomer = (customer: Omit<Customer, 'id'>) => handleDbAction(db.addCustomer(customer));
  const updateCustomer = (customerToUpdate: Customer) => handleDbAction(db.updateCustomer(customerToUpdate));
  const deleteCustomer = (customerId: number) => handleDbAction(db.deleteCustomer(customerId));
  const addRental = (rental: Omit<Rental, 'id' | 'totalPrice'>) => handleDbAction(db.addRental(rental));
  const updateRental = (rentalToUpdate: Rental) => handleDbAction(db.updateRental(rentalToUpdate));
  const deleteRental = (rentalId: number) => handleDbAction(db.deleteRental(rentalId));

  const returnRental = async (rentalId: number, surcharge: number = 0): Promise<Rental | undefined> => {
    const rentalToReturn = rentals.find(r => r.id === rentalId);
    if (!rentalToReturn) return undefined;
    
    const returnDate = new Date();
    const rentalDate = parseISO(rentalToReturn.rentalDate);
    
    const daysRented = differenceInCalendarDays(returnDate, rentalDate) + 1;
    const totalDays = Math.max(1, daysRented);

    const dailyRate = rentalToReturn.rentedItems.reduce((acc, rentedItem) => {
        const item = clothingItems.find(c => c.id === rentedItem.itemId);
        return acc + (item?.rentalPrice || 0) * rentedItem.quantity;
    }, 0);
    
    const grossPrice = totalDays * dailyRate;
    const discount = rentalToReturn.discountPercent || 0;
    const discountAmount = grossPrice * (discount / 100);
    const finalPrice = grossPrice - discountAmount + surcharge;

    const updatedRentalData: Rental = { 
      ...rentalToReturn, 
      returnDate: returnDate.toISOString(), 
      totalPrice: Math.round(finalPrice),
      surcharge: surcharge 
    };
    
    await handleDbAction(db.updateRental(updatedRentalData));
    // Refetch and find the updated one to return
    const refreshedRentals = await db.getRentals();
    return refreshedRentals.find(r => r.id === rentalId);
  };
  
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts} setView={setView} />;
      case 'clothing':
        return <ClothingPage clothingItems={clothingItems} addClothingItem={addClothingItem} addMultipleClothingItems={addMultipleClothingItems} rentedItemCounts={rentedItemCounts} updateClothingItem={updateClothingItem} deleteClothingItem={deleteClothingItem} itemsWithRentalHistory={itemsWithRentalHistory} />;
      case 'customers':
        return <CustomersPage customers={customers} addCustomer={addCustomer} rentals={rentals} clothingItems={clothingItems} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />;
      case 'rentals':
        return <RentalsPage rentals={rentals} customers={customers} clothingItems={clothingItems} returnRental={returnRental} addRental={addRental} addCustomer={addCustomer} rentedItemCounts={rentedItemCounts} deleteRental={deleteRental} updateRental={updateRental} />;
      default:
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts} setView={setView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:justify-end">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold capitalize md:hidden">{viewTitles[view]}</h1>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Xin chào, <span className="font-bold capitalize text-primary-600 dark:text-primary-400">{user.role}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

// Component xử lý logic đăng nhập và hiển thị trang quản trị
const AdminPortal: React.FC<{
    clothingItems: ClothingItem[];
    customers: Customer[];
    rentals: Rental[];
    fetchData: () => void;
}> = (props) => {
    const { user } = useAuth();
    if (!user) {
        return <LoginPage />;
    }
    return <AdminApp {...props} user={user} />;
}

// Component chính của ứng dụng, xử lý routing
const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [route, setRoute] = useState(window.location.hash);
    
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
      if (!isSupabaseConfigured) {
          setError('Vui lòng cấu hình thông tin Supabase trong file `database.ts` để kết nối với cơ sở dữ liệu của bạn.');
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
          const [itemsData, customersData, rentalsData, configData] = await Promise.all([
              db.getClothingItems(),
              db.getCustomers(),
              db.getRentals(),
              db.getSiteConfig(),
          ]);
          setClothingItems(itemsData);
          setCustomers(customersData);
          setRentals(rentalsData);
          setSiteConfig(configData);
      } catch (err: any) {
          console.error("Failed to fetch data:", err);
          setError(`Không thể tải dữ liệu từ server. Vui lòng kiểm tra lại cấu hình Supabase và kết nối mạng. Lỗi: ${err.message}`);
      } finally {
          setIsLoading(false);
      }
    }, []);
    
    const handleUpdateSiteConfig = async (configs: { key: string; value: string }[]) => {
        try {
            await db.updateSiteConfig(configs);
            await fetchData();
        } catch (err: any) {
            console.error("Failed to update site config:", err);
            setError(`Không thể cập nhật cấu hình. Lỗi: ${err.message}`);
        }
    };

    useEffect(() => {
      fetchData();
      const handleHashChange = () => {
        setRoute(window.location.hash);
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }, [fetchData]);

    const activeRentals = useMemo(() => rentals.filter(r => !r.returnDate), [rentals]);
    const rentedItemCounts = useMemo(() => {
        const counts = new Map<number, number>();
        activeRentals.forEach(rental => {
            rental.rentedItems.forEach(({ itemId, quantity }) => {
                counts.set(itemId, (counts.get(itemId) || 0) + quantity);
            });
        });
        return counts;
    }, [activeRentals]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
          <p className="text-lg text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="flex justify-center items-center h-screen p-4 bg-gray-100 dark:bg-gray-900">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg relative max-w-2xl text-center shadow-lg" role="alert">
            <strong className="font-bold block text-lg mb-2">Đã xảy ra lỗi kết nối!</strong>
            <span className="block">{error}</span>
            {error.includes('cấu hình') && (
                 <div className="mt-4 text-left bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-semibold">Để khắc phục:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Mở file <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">database.ts</code> trong trình chỉnh sửa.</li>
                        <li>Tìm các biến <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">supabaseUrl</code> và <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">supabaseAnonKey</code>.</li>
                        <li>Thay thế các giá trị placeholder bằng thông tin Project URL và Anon Key từ trang cài đặt Supabase của bạn.</li>
                        <li>Lưu file và làm mới lại trang này.</li>
                    </ol>
                </div>
            )}
          </div>
        </div>
      );
    }

    if (route.startsWith('#/admin')) {
        return <AdminPortal clothingItems={clothingItems} customers={customers} rentals={rentals} fetchData={fetchData} />;
    }

    return <HomePage clothingItems={clothingItems} rentedItemCounts={rentedItemCounts} user={user} siteConfig={siteConfig} onUpdateConfig={handleUpdateSiteConfig} />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;