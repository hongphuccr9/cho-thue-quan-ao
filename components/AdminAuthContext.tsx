import React, { createContext, useState, useContext, ReactNode } from 'react';
import { PasswordPromptModal } from './PasswordPromptModal';

// Mật khẩu quản trị viên
const ADMIN_PASSWORD = "Tam@0707";

interface AdminAuthContextType {
  requestAdminAction: (action: () => void | Promise<void>) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void | Promise<void>) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestAdminAction = (action: () => void | Promise<void>) => {
    setActionToConfirm(() => action); // Lưu hành động vào state
    setError(null);
    setIsPromptOpen(true);
  };

  const handleClosePrompt = () => {
    setIsPromptOpen(false);
    setActionToConfirm(null);
    setError(null);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (password === ADMIN_PASSWORD) {
      if (actionToConfirm) {
        await actionToConfirm();
      }
      handleClosePrompt();
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <AdminAuthContext.Provider value={{ requestAdminAction }}>
      {children}
      <PasswordPromptModal
        isOpen={isPromptOpen}
        onClose={handleClosePrompt}
        onSubmit={handlePasswordSubmit}
        error={error}
      />
    </AdminAuthContext.Provider>
  );
};