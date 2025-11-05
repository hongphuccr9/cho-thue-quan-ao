import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, Rental, ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';
import { CustomerDetailModal } from './CustomerDetailModal';
import { useAuth } from './AuthContext';
import { SearchIcon } from './icons/SearchIcon';

interface CustomersPageProps {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (customerId: number) => Promise<void>;
  rentals: Rental[];
  clothingItems: ClothingItem[];
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


export const CustomersPage: React.FC<CustomersPageProps> = ({ customers, addCustomer, rentals, clothingItems, updateCustomer, deleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const initialEditFormState = { name: '', phone: '', address: '' };
  const [editForm, setEditForm] = useState(initialEditFormState);
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const customersWithRentals = useMemo(() => {
    return new Set(rentals.map(r => r.customerId));
  }, [rentals]);
  
  const customerRentalCounts = useMemo(() => {
    const counts = new Map<number, number>();
    rentals.forEach(rental => {
        counts.set(rental.customerId, (counts.get(rental.customerId) || 0) + 1);
    });
    return counts;
  }, [rentals]);

  useEffect(() => {
    if (editingCustomer) {
      setEditForm({
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        address: editingCustomer.address,
      });
    } else {
      setEditForm(initialEditFormState);
    }
  }, [editingCustomer]);
  
  const filteredCustomers = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(customer => 
        customer.name.toLowerCase().includes(lowercasedTerm) ||
        customer.phone.toLowerCase().includes(lowercasedTerm) ||
        customer.address.toLowerCase().includes(lowercasedTerm)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const rawPhone = value.replace(/\D/g, '');
        if (rawPhone.length <= 10) {
            setNewCustomer(prev => ({ ...prev, phone: rawPhone }));
        }
    } else {
        setNewCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const rawPhone = value.replace(/\D/g, '');
        if (rawPhone.length <= 10) {
            setEditForm(prev => ({ ...prev, phone: rawPhone }));
        }
    } else {
        setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAddSuccessMessage(null);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name && newCustomer.phone && newCustomer.address) {
      await addCustomer(newCustomer);
      setNewCustomer({ name: '', phone: '', address: '' });
      setAddSuccessMessage('Thêm khách hàng mới thành công!');
      setTimeout(() => {
        setAddSuccessMessage(null);
      }, 3000);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (editForm.name && editForm.phone && editForm.address) {
      await updateCustomer({
        id: editingCustomer.id,
        ...editForm,
      });
      setEditingCustomer(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      const hasRentals = rentals.some(r => r.customerId === customerToDelete.id);
      if (hasRentals) {
        setDeleteError(`Không thể xóa khách hàng "${customerToDelete.name}" vì họ đã có lịch sử thuê đồ.`);
        return;
      }
      
      try {
        await deleteCustomer(customerToDelete.id);
        closeDeleteModal();
      } catch (error: any) {
        console.error("Delete customer error:", error);
        setDeleteError(`Lỗi: ${error.message}`);
      }
    }
  };

  const closeDeleteModal = () => {
    setCustomerToDelete(null);
    setDeleteError(null);
  };

  const handleExport = () => {
    const dataToExport = customers.map(customer => ({
      'ID': customer.id,
      'Tên Khách Hàng': customer.name,
      'Số Điện Thoại': customer.phone,
      'Địa Chỉ': customer.address
    }));
    exportToCSV(dataToExport, 'danh-sach-khach-hang.csv');
  };
  
  const customerRentals = (customerId: number) => {
    return rentals.filter(rental => rental.customerId === customerId);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Khách Hàng</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
            >
              <ExportIcon />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
              >
                Thêm Mới
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCustomers.map((customer, index) => {
          const hasRentals = customersWithRentals.has(customer.id);
          const rentalCount = customerRentalCounts.get(customer.id) || 0;
          return (
            <Card 
              key={customer.id} 
              className={`
                !p-0 flex flex-col text-center items-center
                transform transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-xl
                ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="p-6 flex-grow w-full flex flex-col items-center">
                  <UserCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"/>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{customer.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">{customer.address}</p>
                  <div className="mt-4 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {rentalCount} lượt thuê
                  </div>
              </div>
              <div className="border-t dark:border-gray-700 w-full p-2 flex justify-around items-center bg-gray-50/50 dark:bg-gray-800/50">
                  <button onClick={() => setSelectedCustomer(customer)} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline px-3 py-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors">
                      Xem chi tiết
                  </button>
                  {user?.role === 'admin' && (
                    <div className="flex items-center">
                      <button
                          onClick={() => setEditingCustomer(customer)}
                          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                          Sửa
                      </button>
                      <button
                          onClick={() => setCustomerToDelete(customer)}
                          disabled={hasRentals}
                          title={hasRentals ? "Không thể xóa khách hàng có lịch sử thuê" : "Xóa khách hàng"}
                          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600"
                      >
                          Xóa
                      </button>
                    </div>
                  )}
              </div>
            </Card>
          )
        })}
      </div>
      {filteredCustomers.length === 0 && (
          <div className="text-center py-16 col-span-full">
              <p className="text-gray-600 dark:text-gray-300 text-lg">Không tìm thấy khách hàng nào.</p>
          </div>
      )}


      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Thêm Khách Hàng Mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          {addSuccessMessage && (
            <div className="p-3 my-2 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-200 text-center" role="alert">
              {addSuccessMessage}
            </div>
          )}
          <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="tel" name="phone" value={formatPhoneNumberForDisplay(newCustomer.phone)} onChange={handleInputChange} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="text" name="address" value={newCustomer.address} onChange={handleInputChange} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Đóng</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Thêm</button>
          </div>
        </form>
      </Modal>

      {editingCustomer && (
        <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Chỉnh Sửa Khách Hàng">
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <input type="tel" name="phone" value={formatPhoneNumberForDisplay(editForm.phone)} onChange={handleEditInputChange} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <input type="text" name="address" value={editForm.address} onChange={handleEditInputChange} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Lưu Thay Đổi</button>
                </div>
            </form>
        </Modal>
      )}

      {customerToDelete && (
        <Modal 
            isOpen={!!customerToDelete} 
            onClose={closeDeleteModal} 
            title={deleteError ? "Lỗi Không Thể Xóa" : "Xác nhận xóa"}
        >
          {deleteError ? (
            <>
                <p className="text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg text-center">
                    {deleteError}
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        type="button"
                        onClick={closeDeleteModal}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                        Đã hiểu
                    </button>
                </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa khách hàng "<strong>{customerToDelete.name}</strong>"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeDeleteModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {selectedCustomer && (
        <CustomerDetailModal 
            customer={selectedCustomer}
            rentals={customerRentals(selectedCustomer.id)}
            clothingItems={clothingItems}
            onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};