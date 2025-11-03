import React, { useState, useMemo } from 'react';
import { Modal } from './shared/Modal';
import type { ClothingItem } from '../types';

export type ValidatedClothingItem = Omit<ClothingItem, 'id'> & {
  _row: number;
  _error: string | null;
};

interface ClothingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ValidatedClothingItem[];
  error: string | null;
  onConfirmImport: (itemsToImport: ValidatedClothingItem[]) => Promise<boolean>;
}

export const ClothingImportModal: React.FC<ClothingImportModalProps> = ({ isOpen, onClose, data, error, onConfirmImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  const validItemsCount = useMemo(() => data.filter(item => !item._error).length, [data]);
  const invalidItemsCount = useMemo(() => data.filter(item => item._error).length, [data]);

  const handleConfirm = async () => {
    setIsImporting(true);
    const success = await onConfirmImport(data);
    setIsImporting(false);
    if (success) {
      setImportSuccess(validItemsCount);
    }
  };

  const handleClose = () => {
    onClose();
    // Delay resetting success state to avoid flash of content
    setTimeout(() => {
        setImportSuccess(null);
    }, 300);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nhập Sản Phẩm từ Excel">
      {importSuccess !== null ? (
        <div className="text-center p-4">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Nhập Thành Công!</h3>
            <p className="text-gray-700 dark:text-gray-300">
                Đã thêm thành công <strong>{importSuccess}</strong> sản phẩm mới vào hệ thống.
            </p>
            <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
            >
                Hoàn tất
            </button>
        </div>
      ) : (
        <div className="space-y-4">
          {error ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-200">
                <p><strong>Hướng dẫn:</strong> Tệp Excel của bạn phải có các cột sau:</p>
                <code className="block mt-2 text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">name, size, rentalPrice, quantity, imageUrl (tùy chọn)</code>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300">
                Đã tìm thấy <strong>{data.length}</strong> dòng. 
                <span className="text-green-600 dark:text-green-400 font-semibold"> {validItemsCount} hợp lệ</span>, 
                <span className="text-red-600 dark:text-red-400 font-semibold"> {invalidItemsCount} không hợp lệ</span>.
              </p>

              <div className="max-h-80 overflow-y-auto border dark:border-gray-600 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dòng</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tên</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Giá Thuê</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((item) => (
                      <tr key={item._row} className={item._error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item._row}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.rentalPrice.toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-semibold">{item._error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isImporting || validItemsCount === 0 || error !== null}
              className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Đang nhập...' : `Xác nhận Nhập (${validItemsCount})`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};