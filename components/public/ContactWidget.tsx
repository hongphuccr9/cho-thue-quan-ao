import React, { useState, useEffect } from 'react';
import type { SiteConfig } from '../../types';
import { PhoneIcon } from '../icons/PhoneIcon';
import { ZaloIcon } from '../icons/ZaloIcon';

interface ContactWidgetProps {
  siteConfig: SiteConfig;
}

export const ContactWidget: React.FC<ContactWidgetProps> = ({ siteConfig }) => {
  const [isVisible, setIsVisible] = useState(false);

  const zaloPhone = siteConfig.contact_zalo_phone || '0975475789';
  const zaloName = siteConfig.contact_zalo_name || 'Cộng Studio';
  const hotlinePhone = siteConfig.contact_hotline_phone || '0975475789';
  const zaloIconUrl = siteConfig.contact_zalo_icon_url;
  const hotlineIconUrl = siteConfig.contact_hotline_icon_url;

  useEffect(() => {
    // A little delay to allow for page transitions before showing the widget
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const formattedHotline = hotlinePhone?.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');

  if (!zaloPhone && !hotlinePhone) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-20 flex flex-col gap-3 transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
      {/* Zalo Button */}
      {zaloPhone && zaloName && (
        <a 
          href={`https://zalo.me/${zaloPhone.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center p-2 sm:pr-5 sm:gap-3 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          aria-label={`Chat with ${zaloName} on Zalo`}
        >
          <div className="w-12 h-12 flex items-center justify-center">
             {zaloIconUrl ? (
                <img src={zaloIconUrl} alt="Zalo" className="w-full h-full object-cover rounded-full" />
             ) : (
                <ZaloIcon />
             )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm text-gray-500 leading-tight">Zalo</p>
            <p className="font-bold text-gray-800 leading-tight">{zaloName}</p>
          </div>
        </a>
      )}
      
      {/* Hotline Button */}
      {hotlinePhone && (
        <a 
          href={`tel:${hotlinePhone.replace(/\D/g, '')}`} 
          className="flex items-center p-2 sm:pr-5 sm:gap-3 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          aria-label={`Call hotline at ${hotlinePhone}`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!hotlineIconUrl ? 'bg-gradient-to-br from-green-400 to-teal-500' : ''}`}>
             {hotlineIconUrl ? (
                <img src={hotlineIconUrl} alt="Hotline" className="w-full h-full object-cover rounded-full" />
             ) : (
                <PhoneIcon className="w-6 h-6 text-white"/>
             )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm text-gray-500 leading-tight">Hotline</p>
            <p className="font-bold text-gray-800 tracking-wider">{formattedHotline}</p>
          </div>
        </a>
      )}
    </div>
  );
};