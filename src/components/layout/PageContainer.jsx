import React from 'react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { useSelector } from 'react-redux';

export const PageContainer = ({ children, title, subtitle, actions }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {(title || actions) && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                {title && <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{title}</h1>}
                {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
