import React, { useState, useEffect } from 'react';
import { Modal } from './shared/Modal';
import type { SiteConfig } from '../types';

interface HeroEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSave: (configs: { key: string; value: string }[]) => Promise<void>;
}

export const HeroEditModal: React.FC<HeroEditModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [zaloPhone, setZaloPhone] = useState('');
  const [zaloName, setZaloName] = useState('');
  const [hotlinePhone, setHotlinePhone] = useState('');
  const [zaloIconUrl, setZaloIconUrl] = useState('');
  const [hotlineIconUrl, setHotlineIconUrl] = useState('');

  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [zaloIconSource, setZaloIconSource] = useState<'url' | 'upload'>('url');
  const [hotlineIconSource, setHotlineIconSource] = useState<'url' | 'upload'>('url');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(config.hero_title || '');
      setSubtitle(config.hero_subtitle || '');
      setImageUrl(config.hero_image_url || '');
      setZaloPhone(config.contact_zalo_phone || '');
      setZaloName(config.contact_zalo_name || '');
      setHotlinePhone(config.contact_hotline_phone || '');
      setZaloIconUrl(config.contact_zalo_icon_url || '');
      setHotlineIconUrl(config.contact_hotline_icon_url || '');

      if (config.hero_image_url?.startsWith('data:image')) {
        setImageSource('upload');
      } else {
        setImageSource('url');
      }
      
      if (config.contact_zalo_icon_url?.startsWith('data:image')) {
        setZaloIconSource('upload');
      } else {
        setZaloIconSource('url');
      }
      
      if (config.contact_hotline_icon_url?.startsWith('data:image')) {
        setHotlineIconSource('upload');
      } else {
        setHotlineIconSource('url');
      }
    }
  }, [isOpen, config]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setter(base64);
      } catch (error) {
        console.error("Error converting file:", error);
        alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const configsToUpdate = [
      { key: 'hero_title', value: title },
      { key: 'hero_subtitle', value: subtitle },
      { key: 'hero_image_url', value: imageUrl },
      { key: 'contact_zalo_phone', value: zaloPhone },
      { key: 'contact_zalo_name', value: zaloName },
      { key: 'contact_hotline_phone', value: hotlinePhone },
      { key: 'contact_zalo_icon_url', value: zaloIconUrl },
      { key: 'contact_hotline_icon_url', value: hotlineIconUrl },
    ];
    await onSave(configsToUpdate);
    setIsSaving(false);
  };

  // Helper component for image inputs
  const ImageInput = ({ label, value, onValueChange, source, onSourceChange, onFileUpload }: { label: string; value: string; onValueChange: (val: string) => void; source: 'url' | 'upload'; onSourceChange: (src: 'url' | 'upload') => void; onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
            <button type="button" onClick={() => onSourceChange('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${source === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
            <button type="button" onClick={() => onSourceChange('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${source === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
        </div>
        
        {source === 'url' ? (
            <input type="text" value={value} onChange={(e) => onValueChange(e.target.value)} placeholder="URL Hình ảnh" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
        ) : (
            <input type="file" accept="image/*" onChange={onFileUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
        )}
        
        {value && <img src={value} alt="Xem trước" className="mt-3 rounded-lg max-h-48 w-auto mx-auto object-contain" />}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Trang Chủ">
      <form onSubmit={handleSave} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Nội dung Banner</h3>
        <div>
          <label htmlFor="hero_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề chính</label>
          <input
            id="hero_title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Bộ Sưu Tập Thời Trang Cho Thuê"
          />
        </div>

        <div>
          <label htmlFor="hero_subtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề phụ</label>
          <textarea
            id="hero_subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Khám phá những bộ trang phục tuyệt đẹp..."
          />
        </div>
        
        <ImageInput 
          label="Ảnh Banner"
          value={imageUrl}
          onValueChange={setImageUrl}
          source={imageSource}
          onSourceChange={setImageSource}
          onFileUpload={(e) => handleImageUpload(e, setImageUrl)}
        />
        
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4">Thông tin Liên hệ</h3>
        <div>
          <label htmlFor="hotline_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số Hotline</label>
          <input
            id="hotline_phone"
            type="text"
            value={hotlinePhone}
            onChange={(e) => setHotlinePhone(e.target.value)}
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="0975.475.789"
          />
        </div>
        <div>
          <label htmlFor="zalo_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số Zalo</label>
          <input
            id="zalo_phone"
            type="text"
            value={zaloPhone}
            onChange={(e) => setZaloPhone(e.target.value)}
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="0975475789 (không dấu chấm)"
          />
        </div>
         <div>
          <label htmlFor="zalo_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên hiển thị Zalo</label>
          <input
            id="zalo_name"
            type="text"
            value={zaloName}
            onChange={(e) => setZaloName(e.target.value)}
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Cộng Studio"
          />
        </div>
        
        <div className="pt-2 space-y-4">
            <ImageInput 
              label="Icon Zalo"
              value={zaloIconUrl}
              onValueChange={setZaloIconUrl}
              source={zaloIconSource}
              onSourceChange={setZaloIconSource}
              onFileUpload={(e) => handleImageUpload(e, setZaloIconUrl)}
            />
             <ImageInput 
              label="Icon Hotline"
              value={hotlineIconUrl}
              onValueChange={setHotlineIconUrl}
              source={hotlineIconSource}
              onSourceChange={setHotlineIconSource}
              onFileUpload={(e) => handleImageUpload(e, setHotlineIconUrl)}
            />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-gray-400">
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};