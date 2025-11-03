import React, { useState, useEffect } from 'react';
import { Modal } from './shared/Modal';
import { AdminIcon } from './icons/AdminIcon';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error: string | null;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ isOpen, onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Đặt lại mật khẩu mỗi khi modal mở
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yêu Cầu Xác Thực">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/50 mb-4">
                <AdminIcon className="h-6 w-6 text-primary-600 dark:text-primary-300"/>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
                Vui lòng nhập mật khẩu quản trị viên để tiếp tục.
            </p>
        </div>
        
        <div>
          <label htmlFor="admin-password" className="sr-only">Mật khẩu</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-center"
            placeholder="********"
            required
            autoFocus
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">
            Hủy
          </button>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">
            Xác nhận
          </button>
        </div>
      </form>
    </Modal>
  );
};