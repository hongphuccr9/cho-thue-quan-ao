import React from 'react';

export const ZaloIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-12 h-12"} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="#0068FF"/>
        <path d="M28.9831 16.291C28.9831 15.0253 27.9578 14 26.6921 14H18.9995C16.2381 14 14 16.2381 14 18.9995V26.6921C14 27.9578 15.0253 28.9831 16.291 28.9831H21.2843V34L28.9831 26.262V18.9995C28.9831 17.5029 28.9831 16.291 28.9831 16.291Z" fill="white"/>
    </svg>
);