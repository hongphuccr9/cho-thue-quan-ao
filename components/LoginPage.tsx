import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError(null);

    // Simulate a network request
    setTimeout(() => {
        const success = login(password);
        if (!success) {
            setError('Mật khẩu không hợp lệ. Vui lòng thử lại.');
        }
        setIsLoggingIn(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">Thuê Đồ UI</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Chào mừng! Vui lòng đăng nhập để tiếp tục.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password-input" className="sr-only">Mật khẩu</label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-lg text-center border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>
            )}

            <div>
                <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                >
                    {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </button>
            </div>
        </form>
         <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4">
            <p><span className="font-semibold">Admin:</span> Tam@0707</p>
            <p><span className="font-semibold">User:</span> Tam@1234</p>
        </div>
      </div>
    </div>
  );
};
