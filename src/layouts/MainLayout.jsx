import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function MainLayout({ children }) {
  const pathname = useLocation().pathname;
  const isHome = pathname === '/' || pathname === '/blog' || pathname.startsWith('/blog/');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={isHome ? "flex-1 w-full min-w-0 px-3 lg:px-3 py-6" : "flex-1 container mx-auto px-4 py-6 max-w-7xl"}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;