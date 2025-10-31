import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClothingPage } from './components/ClothingPage';
import { CustomersPage } from './components/CustomersPage';
import { RentalsPage } from './components/RentalsPage';
import * as db from './database';
import { isSupabaseConfigured } from './database';
import type { View, ClothingItem, Customer, Rental } from './types';
import { MenuIcon } from './components/icons/MenuIcon';
import { differenceInCalendarDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

const viewTitles: Record<View, string> = {
  dashboard: 'Bảng Điều Khiển',
  clothing: 'Quản Lý Quần Áo',
  customers: 'Khách Hàng',
  rentals: 'Quản Lý Lượt Thuê'
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
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
        const [itemsData, customersData, rentalsData] = await Promise.all([
            db.getClothingItems(),
            db.getCustomers(),
            db.getRentals(),
        ]);
        setClothingItems(itemsData);
        setCustomers(customersData);
        setRentals(rentalsData);
    } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(`Không thể tải dữ liệu từ server. Vui lòng kiểm tra lại cấu hình Supabase và kết nối mạng. Lỗi: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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

  const addClothingItem = async (item: Omit<ClothingItem, 'id'>) => {
    const newItem = await db.addClothingItem(item);
    setClothingItems(prev => [...prev, newItem]);
  };

  const updateClothingItem = async (itemToUpdate: ClothingItem) => {
    const updatedItem = await db.updateClothingItem(itemToUpdate);
    setClothingItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteClothingItem = async (itemId: number) => {
    await db.deleteClothingItem(itemId);
    setClothingItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer = await db.addCustomer(customer);
    setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
    return newCustomer;
  };

  const updateCustomer = async (customerToUpdate: Customer) => {
    const updatedCustomer = await db.updateCustomer(customerToUpdate);
    setCustomers(prev => prev.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer));
  };

  const deleteCustomer = async (customerId: number) => {
    // Error will be thrown from db layer if there's a foreign key constraint
    await db.deleteCustomer(customerId);
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
  };

  const addRental = async (rental: Omit<Rental, 'id' | 'totalPrice'>) => {
    const newRental = await db.addRental(rental);
    setRentals(prev => [newRental, ...prev]);
  };

  const returnRental = async (rentalId: number): Promise<Rental | undefined> => {
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
    const totalPrice = grossPrice - discountAmount;

    const updatedRentalData: Rental = { ...rentalToReturn, returnDate: returnDate.toISOString(), totalPrice: Math.round(totalPrice) };
    
    const updatedRentalFromDb = await db.updateRental(updatedRentalData);
    setRentals(prev => prev.map(r => r.id === rentalId ? updatedRentalFromDb : r));
    return updatedRentalFromDb;
  };

  const deleteRental = async (rentalId: number) => {
    await db.deleteRental(rentalId);
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  };
  
  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-lg text-gray-500 dark:text-gray-400">Đang tải dữ liệu từ server...</p>
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="flex justify-center items-center h-full p-4">
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

    switch (view) {
      case 'dashboard':
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts}/>;
      case 'clothing':
        return <ClothingPage clothingItems={clothingItems} addClothingItem={addClothingItem} rentedItemCounts={rentedItemCounts} updateClothingItem={updateClothingItem} deleteClothingItem={deleteClothingItem} />;
      case 'customers':
        return <CustomersPage customers={customers} addCustomer={addCustomer} rentals={rentals} clothingItems={clothingItems} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />;
      case 'rentals':
        return <RentalsPage rentals={rentals} customers={customers} clothingItems={clothingItems} returnRental={returnRental} addRental={addRental} addCustomer={addCustomer} rentedItemCounts={rentedItemCounts} deleteRental={deleteRental} />;
      default:
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:justify-end">
           <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
             <MenuIcon className="h-6 w-6" />
           </button>
          <h1 className="text-xl font-semibold capitalize md:hidden">{viewTitles[view]}</h1>
          <div className="w-10 h-10"></div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;