import type { ClothingItem, Customer, Rental } from '../types';

// Khóa định danh để lưu trữ trạng thái ứng dụng trong localStorage.
const STORAGE_KEY = 'clothingRentalAppState';

/**
 * Định nghĩa cấu trúc của trạng thái ứng dụng sẽ được lưu trữ.
 */
export interface AppState {
  clothingItems: ClothingItem[];
  customers: Customer[];
  rentals: Rental[];
}

/**
 * Lưu toàn bộ trạng thái ứng dụng vào localStorage.
 * @param state - Trạng thái hiện tại của ứng dụng.
 */
export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Lỗi: Không thể lưu trạng thái vào localStorage.", error);
  }
};

/**
 * Tải trạng thái ứng dụng từ localStorage.
 * @returns Trạng thái ứng dụng đã lưu, hoặc undefined nếu không tìm thấy hoặc có lỗi.
 */
export const loadState = (): AppState | undefined => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return undefined; // Chưa có trạng thái nào được lưu
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Lỗi: Không thể tải trạng thái từ localStorage.", error);
    return undefined;
  }
};
