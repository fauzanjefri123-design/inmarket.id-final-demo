/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const DashboardPage = React.lazy(() => import('./components/Dashboard'));
const OpeningAnimation = React.lazy(() => import('./components/OpeningAnimation'));
const OnboardingPopup = React.lazy(() => import('./components/OnboardingPopup'));
const Auth = React.lazy(() => import('./components/Auth'));
import { Loader2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import HolographicLoader from './components/HolographicLoader';
import { getPartitionedKey } from './lib/utils';
import { ThemeLanguageProvider, useThemeLanguage } from './context/ThemeLanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';


interface EBProps { children: React.ReactNode }
interface EBState { 
  hasError: boolean; 
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends React.Component<EBProps, EBState> {
  public state: EBState;

  constructor(props: EBProps) {
    super(props);
    // Removed redundant this.props assignment (Not needed in TypeScript/React)
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error) { 
    return { hasError: true, error, errorInfo: null }; 
  }
  
  componentDidCatch(error: Error, errorInfo: any) { 
    console.error("Uncaught error captured by boundary:", error, errorInfo); 
  }

  handleRestart = () => {
    // Reset hasError state before reload to ensure consistent state
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      this.setState({ hasError: false, error: null, errorInfo: null });
      window.location.reload();
    } catch (e) {
      this.setState({ hasError: false, error: null, errorInfo: null });
      window.location.reload();
    }
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030107] flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden select-none font-sans">
          {/* Neon accent shapes */}
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(139,92,246,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.15)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          <div className="max-w-lg p-8 rounded-3xl bg-slate-900/40 backdrop-blur-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] space-y-6 relative">
            {/* Holographic brackets inside error container */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500/40" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500/40" />

            <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-4">
              {/* Indonesian Warning */}
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider text-red-400">
                  Terjadi kesalahan saat memuat halaman.
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-bold">
                  Sistem mendeteksi inkonsistensi data atau crash runtime saat merender antarmuka.
                </p>
              </div>

              {/* English Warning */}
              <div className="pt-3 border-t border-slate-800/60">
                <h1 className="text-sm font-black uppercase tracking-wider text-violet-300">
                  Something went wrong while loading the page.
                </h1>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">
                  The framework detected data inconsistencies or a layout renderer failure.
                </p>
              </div>
            </div>

            {/* Error detail console block */}
            {this.state.error && (
              <div className="p-3 bg-black/50 border border-red-500/15 rounded-xl text-left font-mono text-[9px] text-red-300/80 max-h-32 overflow-y-auto custom-scrollbar">
                <span className="font-black text-red-400 uppercase">[X] FATAL_EXCEPTION: </span>
                {this.state.error.message || String(this.state.error)}
                {this.state.error.stack && (
                  <pre className="mt-1 opacity-55 leading-relaxed text-[8px] whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Recovery Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleRestart}
                className="w-full py-3.5 px-4 rounded-xl bg-violet-600/25 hover:bg-violet-600/40 border border-violet-500/35 font-black text-xs tracking-widest text-violet-200 uppercase duration-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.15)]"
              >
                <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={this.handleResetState}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 hover:border-red-500/50 font-black text-xs tracking-widest text-red-200 uppercase duration-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                title="Clears all local storage variables to fix schema mismatches"
              >
                <Database size={14} />
                <span>Reset Offline Cache</span>
              </button>
            </div>

            <p className="text-[9px] font-mono tracking-widest text-slate-500 text-center uppercase">
              RECONSTRUCTION PROTOCOL SEC_v2.06
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThemeAwareApp() {
  const { theme } = useThemeLanguage();
  const { userData, authLoading, refreshAuth, hasBusiness, setHasBusiness } = useAuth();
  const [currentView, setCurrentView] = useState<'splash' | 'landing' | 'auth' | 'dashboard' | 'products' | 'attendance' | 'kasir' | 'wallet' | 'profile'>('splash');
  const [authRole, setAuthRole] = useState<'owner' | 'employee' | 'demo'>('owner');

  const handleNavigate = (view: any) => {
    if (view === 'auth-demo') {
      setAuthRole('demo');
      setCurrentView('auth');
    } else if (view === 'auth') {
      setAuthRole('owner');
      setCurrentView('auth');
    } else {
      setCurrentView(view);
    }
  };

  const getThemeBGClass = () => {
    return theme === 'dark' 
      ? 'bg-[#080512] text-slate-100 font-sans' 
      : 'bg-[#f5f3fa] text-slate-900 font-sans';
  };

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('inmarket_demo_mode') === 'true');
  }, [userData]);

  useEffect(() => {
    if (authLoading) return;

    const v = currentView;
    const isOfflineLoggedIn = localStorage.getItem('offline_logged_in_user');
    const isLoggedIn = !!(userData || isOfflineLoggedIn);
    
    // Redirect logic
    if (isLoggedIn && (v === 'landing' || v === 'auth')) {
      setCurrentView('dashboard');
    } else if (!isLoggedIn && v !== 'landing' && v !== 'splash') {
      setCurrentView('auth');
    }
  }, [authLoading, userData, currentView]);

  if (authLoading && currentView !== 'splash') {
    return <HolographicLoader />;
  }

  return (
    <div className={`min-h-screen ${getThemeBGClass()} relative overflow-hidden transition-colors duration-700 ease-in-out`}>

      {/* Ambient Mesh Gradients based on theme */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#7c3aed] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-[#06b6d4] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        </>
      )}
      {theme === 'light' && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#cbd5e1] rounded-full blur-[130px] opacity-35 pointer-events-none"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-[#e2e8f0] rounded-full blur-[110px] opacity-30 pointer-events-none"></div>
        </>
      )}
      
      <div className="relative z-10 h-full">
        <React.Suspense fallback={<HolographicLoader />}>
          {currentView === 'splash' && (
            <OpeningAnimation 
              onComplete={() => {
                const isOfflineLoggedIn = localStorage.getItem('offline_logged_in_user');
                if (userData || isOfflineLoggedIn) {
                  handleNavigate('dashboard');
                } else {
                  handleNavigate('landing');
                }
              }} 
            />
          )}
          {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
          {currentView === 'auth' && <Auth onNavigate={handleNavigate} initialRole={authRole} />}
          {(currentView === 'dashboard' || currentView === 'products' || currentView === 'attendance' || currentView === 'kasir' || currentView === 'wallet' || currentView === 'profile') && (
             <>
               {isDemoMode && (
                 <div className="bg-amber-500 text-slate-900 border-b-2 border-amber-600 p-2 sm:p-3 text-center sticky top-0 z-[100] flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold shadow-lg">
                    <span className="flex-1 min-w-[200px]">Mode Demo Aktif: Anda bebas mengakses dashboard siapa saja tanpa login!</span>
                    <div className="flex gap-2">
                      <button onClick={() => { 
                         localStorage.removeItem('inmarket_demo_mode'); 
                         localStorage.removeItem('offline_logged_in_user');
                         localStorage.removeItem('inmarket_user_role');
                         refreshAuth();
                      }} className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 rounded transition">Keluar</button>
                    </div>
                 </div>
               )}
               {!hasBusiness && <OnboardingPopup onComplete={() => setHasBusiness(true)} />}
               <DashboardPage currentView={currentView} onNavigate={handleNavigate} />
             </>
          )}
        </React.Suspense>
      </div>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#1a1025', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.1)' 
          } 
        }} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeLanguageProvider>
          <ThemeAwareApp />
        </ThemeLanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
