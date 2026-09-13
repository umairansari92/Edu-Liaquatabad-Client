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
    <footer className="w-full border-t border-[#003F75]/40 bg-[#00213D] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#006AC7] flex items-center justify-center flex-shrink-0 shadow-md">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                Education Department
              </p>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                Liaquatabad Town Centre (DMC)
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/dataverse-technologies"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-slate-400 hover:text-[#3FA4E8] transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/umairansari92"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-slate-400 hover:text-[#3FA4E8] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/DMCLiaquatabad"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="text-slate-400 hover:text-[#3FA4E8] transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar with credits */}
      <div className="border-t border-[#003F75]/30 bg-[#00172B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              © {new Date().getFullYear()} Education Department Liaquatabad Town Centre (DMC). All rights reserved.
            </span>
            <span className="flex flex-wrap items-center justify-center gap-x-1">
              <span>Powered by</span>
              <a
                href="https://dataversetechnologies.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#3FA4E8] hover:text-[#82C4F5] transition-colors inline-flex items-center gap-0.5"
              >
                DataVerse Technologies
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="mx-1 text-slate-600">|</span>
              <span>Designed &amp; Developed by</span>
              <a
                href="https://app-cvifypro.vercel.app/p/umairansari92"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-0.5"
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
