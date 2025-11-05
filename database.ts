import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ClothingItem, Customer, Rental, SiteConfig } from './types';

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
// FIX: Add explicit string types to prevent TypeScript from inferring literal types,
// which causes a comparison error on the configuration check below.
const supabaseUrl: string = 'https://yjbcislrcfdimttrffvs.supabase.co'; // <<<=== THAY THẾ TẠI ĐÂY
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYmNpc2xyY2ZkaW10dHJmZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTQzNDIsImV4cCI6MjA3NzQ5MDM0Mn0.02zHQF5jnQTtrC9o_J6TFtOlnSr32UFJ3D2PngQCF6Y'; // <<<=== THAY THẾ TẠI ĐÂY

// Chúng ta export biến này để App.tsx có thể kiểm tra xem thông tin đã được cấu hình chưa.
export const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Chỉ khởi tạo client khi cấu hình hợp lệ để tránh lỗi 'Invalid URL'.
const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --- Site Config ---

// Lấy tất cả các giá trị cấu hình và trả về dưới dạng một đối tượng duy nhất
export const getSiteConfig = async (): Promise<SiteConfig> => {
    if (!supabase) return {}; // Guard: Trả về mặc định nếu chưa cấu hình.
    
    const { data, error } = await supabase.from('site_config').select('key, value');

    // Lỗi '42P01' có nghĩa là bảng không tồn tại.
    // Chúng ta xử lý lỗi này một cách nhẹ nhàng để ứng dụng không bị sập.
    // Ứng dụng sẽ hoạt động với các giá trị mặc định cho đến khi bảng được tạo.
    if (error && error.code === '42P01') {
        console.warn("Cảnh báo: Bảng 'site_config' không được tìm thấy. Sử dụng các giá trị mặc định. Vui lòng tạo bảng trong Supabase để bật tính năng chỉnh sửa banner. Xem hướng dẫn trong file database.ts.");
        return {};
    }

    if (error) throw new Error(error.message);
    if (!data) return {};

    // Chuyển đổi mảng {key, value} thành một đối tượng duy nhất
    const config = data.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as SiteConfig);
    
    return config;
};

// Cập nhật một hoặc nhiều giá trị cấu hình
export const updateSiteConfig = async (configs: { key: string; value: string }[]): Promise<void> => {
    if (!supabase) return; // Guard
    const { error } = await supabase.from('site_config').upsert(configs, { onConflict: 'key' });
    if (error && error.code === '42P01') {
        throw new Error("Không thể lưu: Bảng 'site_config' không tồn tại. Vui lòng tạo bảng trong Supabase. Xem hướng dẫn trong file database.ts.");
    }
    if (error) throw new Error(error.message);
};

// --- Clothing Items ---

export const getClothingItems = async (): Promise<ClothingItem[]> => {
    if (!supabase) return []; // Guard
    const { data, error } = await supabase.from('clothing_items').select('*').order('id');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addClothingItem = async (item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('clothing_items').insert(item).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const addMultipleClothingItems = async (items: Omit<ClothingItem, 'id'>[]): Promise<ClothingItem[]> => {
    if (!supabase) return []; // Guard
    const { data, error } = await supabase.from('clothing_items').insert(items).select();
    if (error) throw new Error(error.message);
    return data;
};

export const updateClothingItem = async (item: ClothingItem): Promise<ClothingItem> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('clothing_items').update(item).eq('id', item.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteClothingItem = async (id: number): Promise<void> => {
    if (!supabase) return; // Guard
    const { error, count } = await supabase.from('clothing_items').delete({ count: 'exact' }).eq('id', id);
    if (error) {
        // Ràng buộc khóa ngoại không được mong đợi dựa trên schema, nhưng đây là một biện pháp bảo vệ tốt.
        if (error.code === '23503') { 
            throw new Error('Không thể xóa sản phẩm vì nó được tham chiếu trong một lượt thuê.');
        }
        throw new Error(error.message);
    }
    if (count === 0) {
        throw new Error("Sản phẩm không tồn tại hoặc bạn không có quyền xóa.");
    }
};


// --- Customers ---

export const getCustomers = async (): Promise<Customer[]> => {
    if (!supabase) return []; // Guard
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateCustomer = async (customer: Customer): Promise<Customer> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('customers').update(customer).eq('id', customer.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
    if (!supabase) return; // Guard
    const { error, count } = await supabase.from('customers').delete({ count: 'exact' }).eq('id', id);
    if (error) {
        if (error.code === '23503') { // foreign_key_violation
            throw new Error('Không thể xóa khách hàng này vì họ có lịch sử thuê đồ.');
        }
        throw new Error(error.message);
    }
    if (count === 0) {
        throw new Error("Khách hàng không tồn tại hoặc bạn không có quyền xóa.");
    }
};


// --- Rentals ---

export const getRentals = async (): Promise<Rental[]> => {
    if (!supabase) return []; // Guard
    const { data, error } = await supabase.from('rentals').select('*').order('rentalDate', { ascending: false });
    if (error) throw new Error(error.message);
    // Supabase might return null for JSON fields, ensure rentedItems is an array.
    return (data || []).map(rental => ({...rental, rentedItems: rental.rentedItems || []}));
};

export const addRental = async (rental: Omit<Rental, 'id' | 'totalPrice'>): Promise<Rental> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('rentals').insert(rental).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateRental = async (rental: Partial<Rental> & { id: number }): Promise<Rental> => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.'); // Guard
    const { data, error } = await supabase.from('rentals').update(rental).eq('id', rental.id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteRental = async (id: number): Promise<void> => {
    if (!supabase) return; // Guard
    const { error } = await supabase.from('rentals').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

/*
    GHI CHÚ VỀ CẤU TRÚC DATABASE SUPABASE:
    
    **GẶP LỖI "Could not find the table 'public.site_config'"?**
    Lỗi này xảy ra vì bảng `site_config` chưa được tạo trong database Supabase của bạn.
    Đây là bảng cần thiết cho tính năng chỉnh sửa banner.
    
    Để khắc phục, hãy vào Supabase dashboard, đi đến "SQL Editor", và chạy đoạn mã SQL sau đây:

    -- Bảng để lưu trữ cấu hình chung của trang web, ví dụ: banner
    CREATE TABLE public.site_config (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    -- Bật Row Level Security (RLS)
    ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

    -- Cho phép mọi người đọc (select)
    CREATE POLICY "Allow public read access"
    ON public.site_config
    FOR SELECT
    USING (true);

    -- Cho phép mọi người ghi (insert, update)
    CREATE POLICY "Allow public write access"
    ON public.site_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

    -- (Tùy chọn) Thêm dữ liệu ban đầu cho banner
    INSERT INTO public.site_config (key, value)
    VALUES
      ('hero_title', 'Bộ Sưu Tập Thời Trang Cho Thuê'),
      ('hero_subtitle', 'Khám phá những bộ trang phục tuyệt đẹp cho mọi dịp đặc biệt. Phong cách, tiện lợi và đẳng cấp.'),
      ('hero_image_url', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop')
    ON CONFLICT (key) DO NOTHING;
    
    ---

    Cấu trúc đầy đủ của các bảng cần có:

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
        - surcharge: float8 (nullable)

    4. Bảng `site_config`:
        - key: text (primary key)
        - value: text (nullable)
*/