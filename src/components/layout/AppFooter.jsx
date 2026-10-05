import React from 'react';
import { School, Linkedin, Github, Twitter, ExternalLink } from 'lucide-react';

/**
 * AppFooter — Appears on every page in the client portal (auth pages & dashboard).
 * In accordance with docs/DESIGN.md:
 * - Footer Background: Deep Navy #00213D (structural foundation)
 * - Brand Blue: #006AC7
 * - Includes official branding, developer credit with links, and social links.
 */
export const AppFooter = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#006AC7] flex items-center justify-center text-white shadow-2xs">
              <School className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">
              © {new Date().getFullYear()} Education Department, Liaquatabad Town Centre (DMC)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Official Municipal Education Portal</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <span>Developed by</span>
              <a
                href="https://app-cvifypro.vercel.app/p/umairansari92"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#006AC7] hover:underline inline-flex items-center gap-0.5"
              >
                Umair Ahmed
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
