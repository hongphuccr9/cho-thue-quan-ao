import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ClothingItem, Customer, Rental } from './types';

// ============================================================================
// HÃY THAY THẾ BẰNG THÔNG TIN SUPABASE CỦA BẠN
// ============================================================================
// Hướng dẫn:
// 1. Truy cập https://supabase.com/dashboard/ và tạo một project mới.
// 2. Đi đến "Project Settings" (biểu tượng bánh răng).
// 3. Trong mục "API", bạn sẽ thấy "Project URL" và "Project API Keys".
// 4. Sao chép "URL" và dán vào biến `supabaseUrl` dưới đây.
// 5. Sao chép khóa "anon" (public) và dán vào biến `supabaseAnonKey` dưới đây.
//
// Sau khi cập nhật, hãy làm mới lại trang.
// ============================================================================
const supabaseUrl = 'https://yjbcislrcfdimttrffvs.supabase.co'; // <<<=== THAY THẾ TẠI ĐÂY
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYmNpc2xyY2ZkaW10dHJmZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTQzNDIsImV4cCI6MjA3NzQ5MDM0Mn0.02zHQF5jnQTtrC9o_J6TFtOlnSr32UFJ3D2PngQCF6Y'; // <<<=== THAY THẾ TẠI ĐÂY

// Chúng ta export biến này để App.tsx có thể kiểm tra xem thông tin đã được cấu hình chưa.
export const isSupabaseConfigured = supabaseUrl !== 'https://yjbcislrcfdimttrffvs.supabase.co' && supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYmNpc2xyY2ZkaW10dHJmZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTQzNDIsImV4cCI6MjA3NzQ5MDM0Mn0.02zHQF5jnQTtrC9o_J6TFtOlnSr32UFJ3D2PngQCF6Y';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- Clothing Items ---

export const getClothingItems = async (): Promise<ClothingItem[]> => {
    const { data, error } = await supabase.from('clothing_items').select('*').order('id');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addClothingItem = async (item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> => {
    const { data, error } = await supabase.from('clothing_items').insert(item).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateClothingItem = async (item: ClothingItem): Promise<ClothingItem> => {
    const { data, error } = await supabase.from('clothing_items').update(item).eq('id', item.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteClothingItem = async (id: number): Promise<void> => {
    const { error } = await supabase.from('clothing_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
};


// --- Customers ---

export const getCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateCustomer = async (customer: Customer): Promise<Customer> => {
    const { data, error } = await supabase.from('customers').update(customer).eq('id', customer.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
    // Supabase will throw a foreign key constraint error if the customer has rentals,
    // which will be caught in the component.
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
};


// --- Rentals ---

export const getRentals = async (): Promise<Rental[]> => {
    const { data, error } = await supabase.from('rentals').select('*').order('rentalDate', { ascending: false });
    if (error) throw new Error(error.message);
    // Supabase might return null for JSON fields, ensure rentedItems is an array.
    return (data || []).map(rental => ({...rental, rentedItems: rental.rentedItems || []}));
};

export const addRental = async (rental: Omit<Rental, 'id' | 'totalPrice'>): Promise<Rental> => {
    const { data, error } = await supabase.from('rentals').insert(rental).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateRental = async (rental: Partial<Rental> & { id: number }): Promise<Rental> => {
    const { data, error } = await supabase.from('rentals').update(rental).eq('id', rental.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteRental = async (id: number): Promise<void> => {
    const { error } = await supabase.from('rentals').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

/*
    GHI CHÚ VỀ CẤU TRÚC DATABASE SUPABASE:

    Bạn cần tạo 3 bảng trong Supabase project của bạn:

    1. Bảng `clothing_items`:
        - id: int8 (primary key, generated always as identity)
        - name: text
        - size: text
        - rentalPrice: float8
        - imageUrl: text
        - quantity: int4

    2. Bảng `customers`:
        - id: int8 (primary key, generated always as identity)
        - name: text
        - phone: text
        - address: text

    3. Bảng `rentals`:
        - id: int8 (primary key, generated always as identity)
        - customerId: int8 (foreign key to customers.id, with ON DELETE RESTRICT)
        - rentedItems: jsonb (e.g., [{"itemId": 1, "quantity": 1}])
        - rentalDate: timestamptz
        - dueDate: timestamptz
        - returnDate: timestamptz (nullable)
        - totalPrice: float8 (nullable)
        - notes: text (nullable)
        - discountPercent: float8 (nullable)

    Đảm bảo bật Row Level Security (RLS) cho các bảng và tạo policy cho phép user "anon" có thể đọc và ghi dữ liệu.
    Ví dụ policy cho phép đọc tất cả (select):
    - Name: Allow public read access
    - Target roles: anon, authenticated
    - USING expression: true

    Ví dụ policy cho phép ghi tất cả (insert, update, delete):
    - Name: Allow public write access
    - Target roles: anon, authenticated
    - USING expression: true
    - WITH CHECK expression: true
*/
