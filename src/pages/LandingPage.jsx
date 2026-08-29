import React from 'react';
import { Link } from 'react-router-dom';
import { School, ShieldCheck, Users, ArrowRight, BookOpen, Award, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(5,150,105,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Government Municipal Education Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Education Department <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Liaquatabad Town Centre
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Centralized multi-school governance, digital academic records, teacher transfer management, and transparent municipal oversight for District Municipal Corporation (DMC).
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Access Secure Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register-student"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-base transition-all"
            >
              Student Self-Registration
            </Link>
          </div>

          {/* Governance Tiers Indicator */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold font-display text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Multi-School Isolation</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold font-display text-teal-400">10 Roles</p>
              <p className="text-xs text-slate-400 mt-1">Decoupled Scoped RBAC</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold font-display text-cyan-400">Zero Deletion</p>
              <p className="text-xs text-slate-400 mt-1">Immutable Audit Trail</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold font-display text-amber-400">BFF Shield</p>
              <p className="text-xs text-slate-400 mt-1">Zero Client Key Leakage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-white">Public Sector Academic Governance</h2>
            <p className="text-slate-400 mt-3 text-base">
              Designed according to the official municipal constitution and civil service hierarchy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">Faculty Transfer Engine</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Seamless teacher relocation between schools with persistent single-identity history and executive emergency overrides.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Examinations & Verification</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Standardized grading rubrics, marks verification state machines, and tamper-proof digital report cards.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Government Circulars</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Instant digital dispatch of meeting notices, official circulars, and textbooks via secured Cloudinary document storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 Education Department Liaquatabad Town Centre (DMC). All rights reserved.</p>
        <p className="mt-1">Architected strictly according to the 20-document institutional constitution.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
