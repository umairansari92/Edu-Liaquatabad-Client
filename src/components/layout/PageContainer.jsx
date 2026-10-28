import React from 'react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { useSelector } from 'react-redux';

export const PageContainer = ({
  children,
  title,
  subtitle,
  actions,
  maxWidth = 'max-w-7xl',
  fluid = false,
  className = '',
}) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-[#F8FBFD] flex flex-col font-sans text-[#102033]">
      <Navbar />
      <div className="flex-1 flex">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 p-3.5 sm:p-6 lg:p-8 ${fluid ? 'max-w-full px-3 sm:px-6' : maxWidth} mx-auto w-full min-w-0 ${className}`}>
          {(title || actions) && (
            <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4 sm:pb-5 print:hidden">
              <div className="min-w-0">
                {title && <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-[#102033] tracking-tight truncate">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-[#526477] mt-1 truncate">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;

