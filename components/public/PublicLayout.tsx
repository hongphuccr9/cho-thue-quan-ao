import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ContactWidget } from './ContactWidget';
import type { SiteConfig } from '../../types';

interface PublicLayoutProps {
  children: React.ReactNode;
  siteConfig?: SiteConfig;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, siteConfig }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-800">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {siteConfig && <ContactWidget siteConfig={siteConfig} />}
      <Footer />
    </div>
  );
};