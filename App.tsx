
import React from 'react';
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
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import type { User } from './components/AuthContext';

const viewTitles: Record<View, string> = {
  dashboard: 'Dashboard',
  clothing: 'Quản Lý Quần Áo',
  customers: 'Khách Hàng',
  rentals: 'Quản Lý Lượt Thuê'
};

const MainLayout: React.FC<{user: User}> = ({ user }) => {
  const [view, setView] = React.useState<View>('dashboard');
  const [clothingItems, setClothingItems] = React.useState<ClothingItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [rentals, setRentals] = React.useState<Rental[]>([]);
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const itemsWithRentalHistory = React.useMemo(() => {
    const itemIds = new Set<number>();
    rentals.forEach(rental => {
        rental.rentedItems.forEach(({ itemId }) => {
            itemIds.add(itemId);
        });
    });
    return itemIds;
  }, [rentals]);

  const activeRentals = React.useMemo(() => rentals.filter(r => !r.returnDate), [rentals]);
  
  const rentedItemCounts = React.useMemo(() => {
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
  
  const addMultipleClothingItems = async (items: Omit<ClothingItem, 'id'>[]) => {
    if (items.length === 0) return;
    const newItems = await db.addMultipleClothingItems(items);
    setClothingItems(prev => [...prev, ...newItems]);
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
    await db.deleteCustomer(customerId);
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
  };

  const addRental = async (rental: Omit<Rental, 'id' | 'totalPrice'>) => {
    const newRental = await db.addRental(rental);
    setRentals(prev => [newRental, ...prev]);
  };
  
  const updateRental = async (rentalToUpdate: Rental) => {
    const updatedRentalFromDb = await db.updateRental(rentalToUpdate);
    setRentals(prev => prev.map(r => r.id === rentalToUpdate.id ? updatedRentalFromDb : r));
  };

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


const AppContent: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <LoginPage />;
    }

    return <MainLayout user={user} />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
