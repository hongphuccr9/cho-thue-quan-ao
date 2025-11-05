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
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(config.hero_title || '');
      setSubtitle(config.hero_subtitle || '');
      setImageUrl(config.hero_image_url || '');

      if (config.hero_image_url?.startsWith('data:image')) {
        setImageSource('upload');
      } else {
        setImageSource('url');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setImageUrl(base64);
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
    ];
    await onSave(configsToUpdate);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Banner Trang Chủ">
      <form onSubmit={handleSave} className="space-y-4">
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh Banner</label>
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
            <button type="button" onClick={() => setImageSource('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${imageSource === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
            <button type="button" onClick={() => setImageSource('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${imageSource === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
          </div>
          
          {imageSource === 'url' ? (
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL Hình ảnh" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
          ) : (
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
          )}
          
          {imageUrl && <img src={imageUrl} alt="Xem trước" className="mt-3 rounded-lg max-h-48 w-auto mx-auto object-contain" />}
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
