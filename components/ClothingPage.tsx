import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';
import { useAuth } from './AuthContext';
import { GridViewIcon } from './icons/GridViewIcon';
import { ListViewIcon } from './icons/ListViewIcon';
import { ImportIcon } from './icons/ImportIcon';
import { ClothingImportModal } from './ClothingImportModal';
import type { ValidatedClothingItem } from './ClothingImportModal';

interface ClothingPageProps {
  clothingItems: ClothingItem[];
  addClothingItem: (item: Omit<ClothingItem, 'id'>) => Promise<void>;
  addMultipleClothingItems: (items: Omit<ClothingItem, 'id'>[]) => Promise<void>;
  updateClothingItem: (item: ClothingItem) => Promise<void>;
  deleteClothingItem: (id: number) => Promise<void>;
  rentedItemCounts: Map<number, number>;
  itemsWithRentalHistory: Set<number>;
}

export const ClothingPage: React.FC<ClothingPageProps> = ({ clothingItems, addClothingItem, addMultipleClothingItems, updateClothingItem, deleteClothingItem, rentedItemCounts, itemsWithRentalHistory }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { user } = useAuth();

  const [newItem, setNewItem] = useState({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' });
  const initialEditFormState = { name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' };
  const [editForm, setEditForm] = useState(initialEditFormState);
  
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [sortOption, setSortOption] = useState('default');
  const [addImageSource, setAddImageSource] = useState<'url' | 'upload'>('url');
  const [editImageSource, setEditImageSource] = useState<'url' | 'upload'>('url');
  
  // State for Excel Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ValidatedClothingItem[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (editingItem) {
      setEditForm({
        name: editingItem.name,
        size: editingItem.size,
        rentalPrice: String(editingItem.rentalPrice),
        quantity: String(editingItem.quantity),
        imageUrl: editingItem.imageUrl,
      });
      // Determine if the existing imageUrl is a data URL or a regular URL
      if (editingItem.imageUrl.startsWith('data:image')) {
        setEditImageSource('upload');
      } else {
        setEditImageSource('url');
      }
    } else {
      setEditForm(initialEditFormState);
    }
  }, [editingItem]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setNewItem(prev => ({ ...prev, imageUrl: base64 }));
      } catch (error) {
        console.error("Lỗi chuyển đổi tệp:", error);
        alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
      }
    }
  };
  
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setEditForm(prev => ({ ...prev, imageUrl: base64 }));
      } catch (error) {
        console.error("Lỗi chuyển đổi tệp:", error);
        alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newItem.rentalPrice);
    const quantity = parseInt(newItem.quantity, 10);
    if (newItem.name && newItem.size && !isNaN(price) && !isNaN(quantity) && quantity > 0) {
      await addClothingItem({ 
        name: newItem.name, 
        size: newItem.size, 
        rentalPrice: price,
        quantity: quantity,
        imageUrl: newItem.imageUrl || 'https://www.dongphuctranganh.vn/media/photo/p516-548355.jpg'
      });
      setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' });
      setIsAddModalOpen(false);
      setAddImageSource('url');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const price = parseFloat(editForm.rentalPrice);
    const quantity = parseInt(editForm.quantity, 10);
    if (editForm.name && editForm.size && !isNaN(price) && !isNaN(quantity) && quantity >= 0) {
      await updateClothingItem({
        id: editingItem.id,
        name: editForm.name,
        size: editForm.size,
        rentalPrice: price,
        quantity: quantity,
        imageUrl: editForm.imageUrl || 'https://www.dongphuctranganh.vn/media/photo/p516-548355.jpg'
      });
      setEditingItem(null);
    }
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const hasRentalHistory = itemsWithRentalHistory.has(itemToDelete.id);
    if (hasRentalHistory) {
      setDeleteError(`Không thể xóa "${itemToDelete.name}" vì món đồ này đã có trong lịch sử cho thuê.`);
      return;
    }

    try {
      await deleteClothingItem(itemToDelete.id);
      closeDeleteModal();
    } catch (error: any) {
      console.error("Delete clothing item error:", error);
      // Hiển thị thông báo lỗi cụ thể hơn từ lớp cơ sở dữ liệu
      setDeleteError(`Lỗi: ${error.message}`);
    }
  };

  const sortedAndFilteredItems = useMemo(() => {
    // 1. Filtering
    let items = clothingItems.filter(item => {
        const rentedCount = rentedItemCounts.get(item.id) || 0;
        const availableCount = item.quantity - rentedCount;
        if (filter === 'available') return availableCount > 0;
        if (filter === 'unavailable') return availableCount === 0;
        return true;
    });

    // 2. Sorting
    // Create a mutable copy for sorting
    let sortableItems = [...items];
    switch (sortOption) {
        case 'name-asc':
            sortableItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortableItems.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            sortableItems.sort((a, b) => a.rentalPrice - b.rentalPrice);
            break;
        case 'price-desc':
            sortableItems.sort((a, b) => b.rentalPrice - a.rentalPrice);
            break;
        case 'quantity-asc':
            sortableItems.sort((a, b) => {
                const availableA = a.quantity - (rentedItemCounts.get(a.id) || 0);
                const availableB = b.quantity - (rentedItemCounts.get(b.id) || 0);
                return availableA - availableB;
            });
            break;
        case 'quantity-desc':
            sortableItems.sort((a, b) => {
                const availableA = a.quantity - (rentedItemCounts.get(a.id) || 0);
                const availableB = b.quantity - (rentedItemCounts.get(b.id) || 0);
                return availableB - availableA;
            });
            break;
        default:
            // Default sort maintains the original order (or by ID if stable)
            break;
    }

    return sortableItems;
}, [clothingItems, rentedItemCounts, filter, sortOption]);
  
  const handleExport = () => {
    const dataToExport = clothingItems.map(item => ({
        'ID': item.id,
        'Tên Món Đồ': item.name,
        'Kích Cỡ': item.size,
        'Giá Thuê (VND/ngày)': item.rentalPrice,
        'Tổng Số Lượng': item.quantity,
        'Số Lượng Đang Thuê': rentedItemCounts.get(item.id) || 0,
        'Số Lượng Còn Lại': item.quantity - (rentedItemCounts.get(item.id) || 0)
    }));
    exportToCSV(dataToExport, 'danh-sach-quan-ao.csv');
  };

  // --- Excel Import Handlers ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const XLSX = (window as any).XLSX;
            if (!XLSX) {
                throw new Error("Thư viện 'xlsx' không được tìm thấy. Vui lòng làm mới trang.");
            }
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (json.length === 0) {
              setImportError("Tệp Excel trống hoặc không có dữ liệu.");
              setIsImportModalOpen(true);
              return;
            }

            const validatedData = json.map((row: any, index: number): ValidatedClothingItem => {
                const name = row.name?.toString().trim();
                const size = row.size?.toString().trim();
                const rentalPrice = parseFloat(row.rentalPrice);
                const quantity = parseInt(row.quantity, 10);
                const imageUrl = row.imageUrl?.toString().trim() || '';

                let errors: string[] = [];
                if (!name) errors.push("Thiếu 'Tên'.");
                if (!size) errors.push("Thiếu 'Kích cỡ'.");
                if (isNaN(rentalPrice) || rentalPrice <= 0) errors.push("'Giá thuê' phải là số dương.");
                if (isNaN(quantity) || quantity <= 0) errors.push("'Số lượng' phải là số nguyên dương.");

                return {
                  _row: index + 2,
                  name: name || '',
                  size: size || '',
                  rentalPrice: isNaN(rentalPrice) ? 0 : rentalPrice,
                  quantity: isNaN(quantity) ? 0 : quantity,
                  imageUrl: imageUrl,
                  _error: errors.length > 0 ? errors.join(' ') : null,
                };
            });

            setParsedData(validatedData);
            setIsImportModalOpen(true);
        } catch (error: any) {
            setImportError(`Đã xảy ra lỗi khi đọc tệp: ${error.message}`);
            setIsImportModalOpen(true);
        } finally {
            // Reset file input value to allow selecting the same file again
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async (itemsToImport: ValidatedClothingItem[]) => {
      const validItems = itemsToImport
          .filter(item => !item._error)
          .map(({ name, size, rentalPrice, quantity, imageUrl }) => ({ name, size, rentalPrice, quantity, imageUrl }));

      if (validItems.length > 0) {
          try {
              await addMultipleClothingItems(validItems);
          } catch (error: any) {
              setImportError(`Lỗi khi nhập dữ liệu: ${error.message}`);
              // Don't close the modal, so user can see the error
              return false; // Indicate failure
          }
      }
      return true; // Indicate success
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quản Lý Quần Áo</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 flex-wrap justify-end">
            <div className="w-full sm:w-auto">
                <select 
                    value={sortOption} 
                    onChange={e => setSortOption(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
                >
                    <option value="default">Sắp xếp mặc định</option>
                    <option value="name-asc">Tên: A-Z</option>
                    <option value="name-desc">Tên: Z-A</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="quantity-asc">Còn lại: Ít nhất</option>
                    <option value="quantity-desc">Còn lại: Nhiều nhất</option>
                </select>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow p-1">
                 <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-l-md ${filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Tất cả</button>
                 <button onClick={() => setFilter('available')} className={`px-3 py-1.5 text-sm ${filter === 'available' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Còn hàng</button>
                 <button onClick={() => setFilter('unavailable')} className={`px-3 py-1.5 text-sm rounded-r-md ${filter === 'unavailable' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Hết hàng</button>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow p-1">
                 <button onClick={() => setViewType('grid')} title="Xem dạng lưới" className={`p-1.5 rounded-l-md ${viewType === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}><GridViewIcon/></button>
                 <button onClick={() => setViewType('list')} title="Xem dạng danh sách" className={`p-1.5 rounded-r-md ${viewType === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}><ListViewIcon/></button>
            </div>
            <div className="flex items-center gap-2">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".xlsx, .xls"
              />
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
              >
                <ImportIcon />
                <span className="hidden sm:inline">Nhập Excel</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
              >
                <ExportIcon />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200 flex-shrink-0"
              >
                Thêm Món Mới
              </button>
            )}
        </div>
      </div>
      
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedAndFilteredItems.map(item => {
            const rentedCount = rentedItemCounts.get(item.id) || 0;
            const availableCount = item.quantity - rentedCount;
            const isAvailable = availableCount > 0;
            const hasRentalHistory = itemsWithRentalHistory.has(item.id);

            return (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">Kích cỡ: {item.size}</p>
                    <p className="text-gray-600 dark:text-gray-300">Giá: {item.rentalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}/ngày</p>
                    <p className="text-gray-600 dark:text-gray-300">Còn lại: {availableCount}/{item.quantity}</p>
                    <div className="mt-auto pt-2 flex justify-between items-center">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${isAvailable ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                        {isAvailable ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                    {user?.role === 'admin' && (
                        <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setEditingItem(item)} 
                            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium rounded-md hover:bg-primary-100 dark:hover:bg-gray-700"
                        >
                            Sửa
                        </button>
                        <button 
                            onClick={() => setItemToDelete(item)} 
                            disabled={hasRentalHistory}
                            title={hasRentalHistory ? "Không thể xóa món đồ đã có lịch sử thuê" : "Xóa món đồ"}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium rounded-md hover:bg-red-100 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                        >
                            Xóa
                        </button>
                        </div>
                    )}
                    </div>
                </div>
                </Card>
            )
            })}
        </div>
      ) : (
        <Card>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Món Đồ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kích Cỡ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá Thuê/Ngày</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số Lượng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng Thái</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                        </tr>
                    </thead>
                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredItems.map(item => {
                             const rentedCount = rentedItemCounts.get(item.id) || 0;
                             const availableCount = item.quantity - rentedCount;
                             const isAvailable = availableCount > 0;
                             const hasRentalHistory = itemsWithRentalHistory.has(item.id);
                             return (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-md object-cover" src={item.imageUrl} alt={item.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.size}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.rentalPrice.toLocaleString('vi-VN')} VND</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{availableCount} / {item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                                            {isAvailable ? 'Còn hàng' : 'Hết hàng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      {user?.role === 'admin' && (
                                        <div className="flex items-center justify-end gap-x-4">
                                            <button onClick={() => setEditingItem(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-semibold">Sửa</button>
                                            <button 
                                                onClick={() => setItemToDelete(item)} 
                                                disabled={hasRentalHistory}
                                                title={hasRentalHistory ? "Không thể xóa món đồ đã có lịch sử thuê" : "Xóa món đồ"}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 font-semibold disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                      )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setAddImageSource('url'); setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' }); }} title="Thêm Món Đồ Mới">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <input type="text" name="name" value={newItem.name} onChange={handleInputChange} placeholder="Tên món đồ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="text" name="size" value={newItem.size} onChange={handleInputChange} placeholder="Kích cỡ (VD: S, M, L)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="number" name="rentalPrice" value={newItem.rentalPrice} onChange={handleInputChange} placeholder="Giá thuê (VND/ngày)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="number" name="quantity" value={newItem.quantity} onChange={handleInputChange} placeholder="Số lượng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required min="1" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh</label>
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
              <button type="button" onClick={() => setAddImageSource('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${addImageSource === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
              <button type="button" onClick={() => setAddImageSource('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${addImageSource === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
            </div>
            
            {addImageSource === 'url' ? (
              <input type="text" name="imageUrl" value={newItem.imageUrl} onChange={handleInputChange} placeholder="URL Hình ảnh (tùy chọn)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            ) : (
              <input type="file" accept="image/*" onChange={handleAddImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
            )}
            
            {newItem.imageUrl && <img src={newItem.imageUrl} alt="Xem trước" className="mt-3 rounded-lg max-h-40 w-auto mx-auto object-contain" />}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsAddModalOpen(false); setAddImageSource('url'); setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Thêm</button>
          </div>
        </form>
      </Modal>

      {editingItem && (
        <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Chỉnh Sửa Món Đồ">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} placeholder="Tên món đồ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="text" name="size" value={editForm.size} onChange={handleEditInputChange} placeholder="Kích cỡ (VD: S, M, L)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="number" name="rentalPrice" value={editForm.rentalPrice} onChange={handleEditInputChange} placeholder="Giá thuê (VND/ngày)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditInputChange} placeholder="Số lượng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required min="0" />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh</label>
              <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
                <button type="button" onClick={() => setEditImageSource('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editImageSource === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
                <button type="button" onClick={() => setEditImageSource('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editImageSource === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
              </div>

              {editImageSource === 'url' ? (
                <input type="text" name="imageUrl" value={editForm.imageUrl} onChange={handleEditInputChange} placeholder="URL Hình ảnh (tùy chọn)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
              ) : (
                <input type="file" accept="image/*" onChange={handleEditImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
              )}
              
              {editForm.imageUrl && <img src={editForm.imageUrl} alt="Xem trước" className="mt-3 rounded-lg max-h-40 w-auto mx-auto object-contain" />}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Lưu Thay Đổi</button>
            </div>
          </form>
        </Modal>
      )}

      {itemToDelete && (
        <Modal 
            isOpen={!!itemToDelete} 
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
                Bạn có chắc chắn muốn xóa món đồ "<strong>{itemToDelete.name}</strong>"? Hành động này không thể hoàn tác.
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

      {isImportModalOpen && (
          <ClothingImportModal
              isOpen={isImportModalOpen}
              onClose={() => {
                  setIsImportModalOpen(false);
                  setParsedData([]);
                  setImportError(null);
              }}
              data={parsedData}
              error={importError}
              onConfirmImport={handleConfirmImport}
          />
      )}
    </div>
  );
};