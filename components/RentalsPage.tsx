import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Rental, Customer, ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { InvoiceModal } from './InvoiceModal';
import { format, differenceInCalendarDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ActiveRentalDetailModal } from './ActiveRentalDetailModal';
import { TrashIcon } from './icons/TrashIcon';
import { useAuth } from './AuthContext';

interface RentalsPageProps {
  rentals: Rental[];
  customers: Customer[];
  clothingItems: ClothingItem[];
  returnRental: (rentalId: number, surcharge: number) => Promise<Rental | undefined>;
  addRental: (rental: Omit<Rental, 'id' | 'totalPrice'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  rentedItemCounts: Map<number, number>;
  deleteRental: (rentalId: number) => Promise<void>;
  updateRental: (rental: Rental) => Promise<void>;
}

interface RentalRowProps {
    rental: Rental;
    customer?: Customer;
    clothingMap: Map<number, ClothingItem>;
    onInitiateReturn?: (rental: Rental) => void;
    onShowInvoice?: (rental: Rental) => void;
    onDelete?: (rental: Rental) => void;
}

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const phoneNumberLength = digits.length;
  if (phoneNumberLength < 5) return digits;
  if (phoneNumberLength < 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
};


const RentalRow: React.FC<RentalRowProps> = ({rental, customer, clothingMap, onInitiateReturn, onShowInvoice, onDelete}) => {
    const { user } = useAuth();
    const isOverdue = !rental.returnDate && new Date() > parseISO(rental.dueDate);
    const isCompleted = !!rental.returnDate;

    const temporaryTotal = useMemo(() => {
        if (isCompleted) return null;

        const today = new Date();
        const rentalDate = parseISO(rental.rentalDate);
        const daysRentedSoFar = Math.max(1, differenceInCalendarDays(today, rentalDate) + 1);
        
        const dailyRate = rental.rentedItems.reduce((acc, rentedItem) => {
            const item = clothingMap.get(rentedItem.itemId);
            return acc + (item?.rentalPrice || 0) * rentedItem.quantity;
        }, 0);

        const grossPrice = dailyRate * daysRentedSoFar;
        const discount = rental.discountPercent || 0;
        const discountAmount = grossPrice * (discount / 100);
        
        return Math.round(grossPrice - discountAmount);
    }, [rental, clothingMap, isCompleted]);

    const handleRowClick = () => {
        if (!isCompleted && onInitiateReturn) {
            onInitiateReturn(rental);
        } else if (isCompleted && onShowInvoice) {
            onShowInvoice(rental);
        }
    };
    
    const itemsRentedString = rental.rentedItems.map(({ itemId, quantity }) => {
        const item = clothingMap.get(itemId);
        return `${item?.name || 'Unknown'} (x${quantity})`;
    }).join(', ');

    const rowCursorClass = (user?.role === 'admin' && !isCompleted) || isCompleted ? 'cursor-pointer' : '';
    const rowClasses = [
        isOverdue ? "bg-red-50 dark:bg-red-900/20" : "",
        (onInitiateReturn || onShowInvoice) ? `${rowCursorClass} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150` : ""
    ].filter(Boolean).join(" ");


    return (
        <tr onClick={handleRowClick} className={rowClasses}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer?.name || 'Unknown'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
            {itemsRentedString}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{format(parseISO(rental.rentalDate), 'dd/MM/yyyy')}</td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-300'}`}>{format(parseISO(rental.dueDate), 'dd/MM/yyyy')}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
            {rental.returnDate ? format(parseISO(rental.returnDate), 'dd/MM/yyyy') : 'Chưa trả'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={rental.notes}>{rental.notes || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
             <div className="flex items-center">
                {isCompleted ? (
                    <span>{rental.totalPrice ? rental.totalPrice.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'}) : 'N/A'}</span>
                ) : (
                    <div className="flex flex-col items-start">
                        <span>
                            {temporaryTotal?.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'})}
                        </span>
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 italic">
                            (Tạm tính)
                        </span>
                    </div>
                )}
                {rental.discountPercent && rental.discountPercent > 0 && (
                    <span 
                        title={`Giảm giá ${rental.discountPercent}%`} 
                        className="ml-2 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-2 py-0.5 rounded-full self-start"
                    >
                        -%
                    </span>
                )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end gap-x-2">
              {!isCompleted && onInitiateReturn && (
                <span className="text-indigo-600 font-semibold">Xem chi tiết</span>
              )}
              {isCompleted && onShowInvoice && (
                <span className="text-primary-600 font-semibold">Xem hóa đơn</span>
              )}
               {isCompleted && user?.role === 'admin' && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(rental);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-700 transition-colors"
                        title="Xóa lượt thuê"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
          </td>
        </tr>
    )
}

// FIX: Define a specific type for sortable keys to ensure type safety.
type SortableRentalKeys = 'customerName' | 'rentalDate' | 'dueDate' | 'returnDate' | 'totalPrice';

export const RentalsPage: React.FC<RentalsPageProps> = ({ rentals, customers, clothingItems, returnRental, addRental, addCustomer, rentedItemCounts, deleteRental, updateRental }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState<Rental | null>(null);
  const [rentalToConfirmReturn, setRentalToConfirmReturn] = useState<Rental | null>(null);
  const [selectedActiveRental, setSelectedActiveRental] = useState<Rental | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);
  const [rentalToEdit, setRentalToEdit] = useState<Rental | null>(null);
  const [surcharge, setSurcharge] = useState<number>(0);
  const { user } = useAuth();
  
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const initialNewRentalState = { customerId: '', rentedItems: [] as { itemId: number, quantity: number }[], rentalDate: todayString, dueDate: '', notes: '', discountPercent: '' };
  const [newRental, setNewRental] = useState(initialNewRentalState);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const initialNewCustomerState = { name: '', phone: '', address: '' };
  const [newCustomer, setNewCustomer] = useState(initialNewCustomerState);

  // FIX: Use the specific SortableRentalKeys type for the sortConfig state.
  const [sortConfig, setSortConfig] = useState<{ key: SortableRentalKeys; direction: 'ascending' | 'descending' }>({ key: 'returnDate', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');

  const customerMap = useMemo(() => new Map<number, Customer>(customers.map(c => [c.id, c])), [customers]);
  const clothingMap = useMemo(() => new Map<number, ClothingItem>(clothingItems.map(c => [c.id, c])), [clothingItems]);

  useEffect(() => {
    if (rentalToEdit) {
      setNewRental({
        customerId: rentalToEdit.customerId.toString(),
        rentedItems: rentalToEdit.rentedItems,
        rentalDate: format(parseISO(rentalToEdit.rentalDate), 'yyyy-MM-dd'),
        dueDate: format(parseISO(rentalToEdit.dueDate), 'yyyy-MM-dd'),
        notes: rentalToEdit.notes || '',
        discountPercent: rentalToEdit.discountPercent?.toString() || '',
      });
      setIsModalOpen(true);
    }
  }, [rentalToEdit]);
  
  const getItemsForRental = useCallback((rental: Rental): ClothingItem[] => {
    return rental.rentedItems.map(({itemId}) => clothingMap.get(itemId)).filter((i): i is ClothingItem => !!i);
  }, [clothingMap])
  
  const filteredRentals = useMemo(() => {
    if (!searchTerm) {
      return rentals;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return rentals.filter(rental => {
      const customer = customerMap.get(rental.customerId);
      if (customer?.name.toLowerCase().includes(lowercasedTerm)) return true;

      const items = getItemsForRental(rental);
      if (items.some(item => item.name.toLowerCase().includes(lowercasedTerm))) return true;

      if (format(parseISO(rental.rentalDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;
      if (format(parseISO(rental.dueDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;
      if (rental.returnDate && format(parseISO(rental.returnDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;

      return false;
    });
  }, [searchTerm, rentals, customerMap, getItemsForRental]);


  const { activeRentals, pastRentals } = useMemo(() => {
    const active: Rental[] = [];
    const past: Rental[] = [];
    filteredRentals.forEach(r => (r.returnDate ? past.push(r) : active.push(r)));
    active.sort((a,b) => parseISO(b.rentalDate).getTime() - parseISO(a.rentalDate).getTime());
    return { activeRentals: active, pastRentals: past };
  }, [filteredRentals]);

  const itemsForSelectionInModal = useMemo(() => {
      const itemsInThisRental = new Set(rentalToEdit?.rentedItems.map(ri => ri.itemId) || []);
      const availableNowItems = clothingItems.filter(item => {
          const rentedCount = rentedItemCounts.get(item.id) || 0;
          return item.quantity - rentedCount > 0;
      });
      
      const combined = new Map<number, ClothingItem>();
      
      itemsInThisRental.forEach(id => {
        const item = clothingMap.get(id);
        if (item) combined.set(id, item);
      });
      
      availableNowItems.forEach(item => {
        combined.set(item.id, item);
      });
      
      return Array.from(combined.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [clothingItems, rentedItemCounts, rentalToEdit, clothingMap]);

  // FIX: Refactor sorting logic for type safety. This prevents errors from comparing different types (e.g., string vs. number) and from unsafe property access.
  const sortedPastRentals = useMemo(() => {
    const sortableItems = [...pastRentals];
    if (sortConfig) {
        sortableItems.sort((a, b) => {
            const key = sortConfig.key;

            const getSortValue = (rental: Rental): string | number | null => {
                switch(key) {
                    case 'customerName': 
                        return customerMap.get(rental.customerId)?.name || '';
                    case 'rentalDate': 
                        return parseISO(rental.rentalDate).getTime();
                    case 'dueDate':
                        return parseISO(rental.dueDate).getTime();
                    case 'returnDate': {
                        // All past rentals have a return date, so this check is for type safety.
                        const dateValue = rental.returnDate;
                        return dateValue ? parseISO(dateValue).getTime() : 0;
                    }
                    case 'totalPrice': 
                        return rental.totalPrice ?? null;
                }
            };
            
            const aValue = getSortValue(a);
            const bValue = getSortValue(b);
            
            if (aValue === null) return 1;
            if (bValue === null) return -1;
            
            const direction = sortConfig.direction === 'ascending' ? 1 : -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * direction;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * direction;
            }

            return 0;
        });
    }
    return sortableItems;
  }, [pastRentals, sortConfig, customerMap]);
  
  const requestSort = (key: SortableRentalKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <span className="opacity-30">↕</span>;
    }
    if (sortConfig.direction === 'ascending') {
        return <span className="text-primary-600">▲</span>;
    }
    return <span className="text-primary-600">▼</span>;
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRentalToEdit(null);
    setNewRental(initialNewRentalState);
    setIsAddingCustomer(false);
    setNewCustomer(initialNewCustomerState);
  };
  
  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const rawPhone = value.replace(/\D/g, '');
        if (rawPhone.length <= 10) {
            setNewCustomer(p => ({ ...p, phone: rawPhone }));
        }
    } else {
        setNewCustomer(p => ({ ...p, [name]: value }));
    }
  };


  const handleAddNewCustomer = async () => {
    if (newCustomer.name && newCustomer.phone && newCustomer.address) {
        const addedCustomer = await addCustomer(newCustomer);
        setNewRental(p => ({ ...p, customerId: addedCustomer.id.toString() }));
        setNewCustomer(initialNewCustomerState);
        setIsAddingCustomer(false);
    } else {
        alert("Vui lòng điền đầy đủ thông tin khách hàng.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = parseInt(newRental.customerId);
    const discountPercent = newRental.discountPercent ? parseFloat(newRental.discountPercent) : undefined;
    if (customerId && newRental.rentedItems.length > 0 && newRental.rentalDate && newRental.dueDate) {
        if (rentalToEdit) {
            const rentalData: Rental = {
                ...rentalToEdit,
                customerId,
                rentedItems: newRental.rentedItems,
                rentalDate: new Date(newRental.rentalDate).toISOString(),
                dueDate: new Date(newRental.dueDate).toISOString(),
                notes: newRental.notes,
                discountPercent,
            };
            await updateRental(rentalData);
        } else {
            await addRental({
                customerId,
                rentedItems: newRental.rentedItems,
                rentalDate: new Date(newRental.rentalDate).toISOString(),
                dueDate: new Date(newRental.dueDate).toISOString(),
                notes: newRental.notes,
                discountPercent,
            });
        }
        handleCloseModal();
    }
  };

  const handleItemToggle = (itemId: number) => {
    setNewRental(prev => {
      const existingItemIndex = prev.rentedItems.findIndex(i => i.itemId === itemId);
      if (existingItemIndex > -1) {
        return {
          ...prev,
          rentedItems: prev.rentedItems.filter(i => i.itemId !== itemId),
        };
      } else {
        return {
          ...prev,
          rentedItems: [...prev.rentedItems, { itemId: itemId, quantity: 1 }],
        };
      }
    });
  };

  const handleQuantityChange = (itemId: number, quantityStr: string) => {
      const quantity = parseInt(quantityStr, 10);
      setNewRental(prev => ({
        ...prev,
        rentedItems: prev.rentedItems.map(item =>
          item.itemId === itemId ? { ...item, quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity } : item
        ),
      }));
  };

  
  const handleExport = () => {
    const dataToExport = rentals.map(rental => {
        const customer = customerMap.get(rental.customerId);
        const items = rental.rentedItems.map(({itemId, quantity}) => {
            const item = clothingMap.get(itemId);
            return `${item?.name || 'N/A'} (x${quantity})`;
        }).join('; ');

        return {
            'ID Lượt Thuê': rental.id,
            'Tên Khách Hàng': customer?.name || 'N/A',
            'ID Khách Hàng': rental.customerId,
            'Các Món Đồ': items,
            'Ngày Thuê': format(parseISO(rental.rentalDate), 'dd/MM/yyyy'),
            'Ngày Hẹn Trả': format(parseISO(rental.dueDate), 'dd/MM/yyyy'),
            'Ngày Đã Trả': rental.returnDate ? format(parseISO(rental.returnDate), 'dd/MM/yyyy') : 'Chưa trả',
            'Giảm giá (%)': rental.discountPercent || 0,
            'Phụ thu (VND)': rental.surcharge || 0,
            'Tổng Tiền (VND)': rental.totalPrice ?? 'N/A',
            'Ghi Chú': rental.notes || ''
        };
    });
    exportToCSV(dataToExport, 'lich-su-thue.csv');
  };

  const handleConfirmReturn = async () => {
    if (rentalToConfirmReturn) {
      const updatedRental = await returnRental(rentalToConfirmReturn.id, surcharge);
      if (updatedRental) {
        setSelectedRentalForInvoice(updatedRental);
      }
      setRentalToConfirmReturn(null);
      setSurcharge(0);
    }
  };

  const handleConfirmDelete = async () => {
    if (rentalToDelete) {
        await deleteRental(rentalToDelete.id);
        setRentalToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex-shrink-0">Quản Lý Lượt Thuê</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
             <div className="relative flex-grow max-w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    title="Tìm kiếm theo tên khách hàng, tên món đồ, hoặc ngày (dd/mm/yyyy)."
                />
            </div>
            <button
              onClick={handleExport}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
            >
              <ExportIcon />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setRentalToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
              >
                Tạo Mới
              </button>
            )}
        </div>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Đang Thuê</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món đồ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày thuê</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày hẹn trả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày đã trả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tổng tiền</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeRentals.length > 0 ? (
                    activeRentals.map(r => <RentalRow key={r.id} rental={r} customer={customerMap.get(r.customerId)} clothingMap={clothingMap} onInitiateReturn={setSelectedActiveRental} onShowInvoice={setSelectedRentalForInvoice}/>)
                ) : (
                    <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">Không tìm thấy lượt thuê nào.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={rentalToEdit ? "Chỉnh Sửa Lượt Thuê" : "Tạo Lượt Thuê Mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAddingCustomer ? (
            <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-900/50 space-y-3">
              <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200">Thêm Khách Hàng Mới</h4>
              <input type="text" name="name" value={newCustomer.name} onChange={handleNewCustomerChange} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <input type="tel" name="phone" value={formatPhoneNumberForDisplay(newCustomer.phone)} onChange={handleNewCustomerChange} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <input type="text" name="address" value={newCustomer.address} onChange={handleNewCustomerChange} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAddingCustomer(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded text-sm">Hủy</button>
                <button type="button" onClick={handleAddNewCustomer} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Lưu Khách Hàng</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Khách hàng</label>
              <div className="flex items-center gap-2 mt-1">
                <select value={newRental.customerId} onChange={e => setNewRental(p => ({...p, customerId: e.target.value}))} className="block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                  <option value="">Chọn một khách hàng</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setIsAddingCustomer(true)} className="px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900 text-sm whitespace-nowrap">Thêm Mới</button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Các món đồ</label>
            <div className="mt-1 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 space-y-2">
              {itemsForSelectionInModal.length > 0 ? itemsForSelectionInModal.map(item => {
                const selectedItem = newRental.rentedItems.find(i => i.itemId === item.id);
                const isSelected = !!selectedItem;
                
                const originallyRentedQty = rentalToEdit?.rentedItems.find(ri => ri.itemId === item.id)?.quantity || 0;
                const rentedByOthers = (rentedItemCounts.get(item.id) || 0) - originallyRentedQty;
                const maxQuantity = item.quantity - rentedByOthers;

                const isAvailableForSelection = maxQuantity > 0;

                return (
                    <div key={item.id} className={`flex items-center justify-between p-2 rounded-md ${!isAvailableForSelection && !isSelected ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-600/50'}`}>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={`item-${item.id}`} 
                                checked={isSelected} 
                                onChange={() => handleItemToggle(item.id)}
                                disabled={!isAvailableForSelection && !isSelected}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                            />
                            <label htmlFor={`item-${item.id}`} className={`ml-3 text-sm text-gray-900 dark:text-gray-200 ${!isAvailableForSelection && !isSelected ? 'cursor-not-allowed' : ''}`}>
                                {item.name} 
                                <span className="text-xs text-gray-500 dark:text-gray-400"> (Tối đa: {maxQuantity})</span>
                            </label>
                        </div>
                        {isSelected && (
                            <div className="flex items-center gap-2">
                                <label htmlFor={`quantity-${item.id}`} className="text-sm">Số lượng:</label>
                                <input
                                    type="number"
                                    id={`quantity-${item.id}`}
                                    min="1"
                                    max={maxQuantity}
                                    value={selectedItem.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                    className="w-20 p-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-center"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                    </div>
                )
              }) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Không có đồ nào có sẵn.</p>}
            </div>
          </div>
          <div className="flex flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ngày thuê</label>
                <input type="date" value={newRental.rentalDate} onChange={e => setNewRental(p => ({...p, rentalDate: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ngày hẹn trả</label>
                <input type="date" value={newRental.dueDate} onChange={e => setNewRental(p => ({...p, dueDate: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Giảm giá (%)</label>
            <input type="number" value={newRental.discountPercent} onChange={e => setNewRental(p => ({...p, discountPercent: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" placeholder="Ví dụ: 10" min="0" max="100"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
            <textarea value={newRental.notes} onChange={e => setNewRental(p => ({...p, notes: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" rows={2} placeholder="Ví dụ: yêu cầu đặc biệt của khách, tình trạng đồ..."></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">{rentalToEdit ? 'Lưu Thay Đổi' : 'Tạo'}</button>
          </div>
        </form>
      </Modal>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Lịch Sử Thuê</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('customerName')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Khách hàng</span>
                            {getSortIndicator('customerName')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món đồ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('rentalDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày thuê</span>
                            {getSortIndicator('rentalDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('dueDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày hẹn trả</span>
                            {getSortIndicator('dueDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('returnDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày đã trả</span>
                            {getSortIndicator('returnDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('totalPrice')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Tổng tiền</span>
                            {getSortIndicator('totalPrice')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hành động</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedPastRentals.length > 0 ? (
                    sortedPastRentals.map(r => <RentalRow key={r.id} rental={r} customer={customerMap.get(r.customerId)} clothingMap={clothingMap} onShowInvoice={setSelectedRentalForInvoice} onDelete={setRentalToDelete} />)
                ) : (
                     <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">Không tìm thấy lượt thuê nào.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </Card>
      
      {selectedRentalForInvoice && (
        <InvoiceModal 
            rental={selectedRentalForInvoice}
            customer={customerMap.get(selectedRentalForInvoice.customerId)}
            items={clothingItems}
            onClose={() => setSelectedRentalForInvoice(null)}
        />
      )}

      {rentalToConfirmReturn && (
        <Modal 
            isOpen={!!rentalToConfirmReturn} 
            onClose={() => setRentalToConfirmReturn(null)} 
            title="Xác nhận trả đồ"
        >
            <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                    Xác nhận trả đồ cho khách hàng "<strong>{customerMap.get(rentalToConfirmReturn.customerId)?.name}</strong>"?
                </p>
                 <div>
                    <label htmlFor="surcharge" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phụ thu (nếu có)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                            type="number"
                            name="surcharge"
                            id="surcharge"
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 pr-12"
                            placeholder="0"
                            value={surcharge || ''}
                            onChange={(e) => setSurcharge(Number(e.target.value))}
                            min="0"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">VND</span>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Nhập chi phí phát sinh như sửa chữa, giặt ủi, v.v.</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button 
                        type="button" 
                        onClick={() => {
                            setRentalToConfirmReturn(null);
                            setSurcharge(0);
                        }} 
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        type="button" 
                        onClick={handleConfirmReturn} 
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </Modal>
      )}

      {selectedActiveRental && (
        <ActiveRentalDetailModal
            rental={selectedActiveRental}
            customer={customerMap.get(selectedActiveRental.customerId)}
            items={clothingItems}
            onClose={() => setSelectedActiveRental(null)}
            onConfirmReturn={(rental) => {
                setSelectedActiveRental(null);
                setRentalToConfirmReturn(rental);
            }}
            onEdit={(rental) => {
                setSelectedActiveRental(null);
                setRentalToEdit(rental);
            }}
            onDelete={(rental) => {
                setSelectedActiveRental(null);
                setRentalToDelete(rental);
            }}
        />
      )}

    {rentalToDelete && (
        <Modal
            isOpen={!!rentalToDelete}
            onClose={() => setRentalToDelete(null)}
            title="Xác nhận xóa lượt thuê"
        >
            <p className="text-gray-700 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa vĩnh viễn lượt thuê của khách hàng "<strong>{customerMap.get(rentalToDelete.customerId)?.name}</strong>" vào ngày <strong>{format(parseISO(rentalToDelete.rentalDate), 'dd/MM/yyyy')}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold">Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setRentalToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                    Hủy
                </button>
                <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Xác nhận Xóa
                </button>
            </div>
        </Modal>
    )}

    </div>
  );
};
