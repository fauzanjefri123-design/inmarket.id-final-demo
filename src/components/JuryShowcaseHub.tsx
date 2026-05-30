import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Play, Pause, ChevronRight, RefreshCw, Sparkles, ShoppingBag, 
  UserCheck, ShieldCheck, HelpCircle, Eye, Volume2, Cpu, 
  Terminal, Zap, Monitor, Layers, Music, Gift, DollarSign, Users, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface JuryShowcaseHubProps {
  products: any[];
  realtimeSales: any[];
  realtimeExpenses: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setRealtimeSales: React.Dispatch<React.SetStateAction<any[]>>;
  setRealtimeExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  language: 'id' | 'en';
  playClickSound: () => void;
  playScanSound: () => void;
  playSuccessSound: () => void;
  triggerNotification: (type: string, message: string) => void;
  logSystemActivity: (action: string) => void;
  userRole: string;
}

export const JuryShowcaseHub: React.FC<JuryShowcaseHubProps> = ({
  products,
  realtimeSales,
  realtimeExpenses,
  setProducts,
  setRealtimeSales,
  setRealtimeExpenses,
  activeTab,
  setActiveTab,
  language,
  playClickSound,
  playScanSound,
  playSuccessSound,
  triggerNotification,
  logSystemActivity,
  userRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [autoPilotStep, setAutoPilotStep] = useState(0);
  const [simulationLogCount, setSimulationLogCount] = useState(0);
  const [hologramTheme, setHologramTheme] = useState(false);

  // References
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto pilot tour steps config
  const tourSteps = [
    { 
      tab: 'dashboard', 
      title: 'Realtime Executive Dashboard',
      subtitle: 'Analisa Omzet, Heatmap Ramai & Laporan Laba Rugi Otomatis',
      desc: 'Menampilkan data finansial laba rugi riil, target omzet interaktif, heatmap intensitas jam sibuk, serta AI Forecaster Oracle yang menyusun anjuran stok barang secara instan.',
      badge: 'FINTECH SaaS'
    },
    { 
      tab: 'kasir', 
      title: 'Automated POS Kasir Digital',
      subtitle: 'Scan Barcode, Bundling Promo & Cetak Struk',
      desc: 'Kasir adaptif yang mendukung diskon dinamis pelanggan, integrasi loyalty CRM points, serta pencetakan struk struk termal secara native.',
      badge: 'TRANSACTION ENGINE'
    },
    { 
      tab: 'stock', 
      title: 'Intelligent Inventory Control',
      subtitle: 'Thermal Barcode Multiprint & Auto-Alert Stok',
      desc: 'Logistik stok terpusat. Mendukung penambahan barcode cepat, pengunggahan data masal berbasis CSV, serta auto-alert stok kritis.',
      badge: 'LOGISTICS NETWORK'
    },
    { 
      tab: 'absensi', 
      title: 'Biometric Face Attendance Lock',
      subtitle: 'Absensi QR Face Recognition & Verifikasi Geotagging',
      desc: 'Sistem absensi anti-fraud yang melacak foto verifikasi wajah staf serta mencocokkan titik koordinat GPS outlet secara seketika.',
      badge: 'CORE SECURITY'
    },
    { 
      tab: 'customer', 
      title: 'Aesthetic CRM Customer Registry',
      subtitle: 'Tiered Member Loyalty & Multi-Store Cashback Tracker',
      desc: 'Melacak tingkat level keanggotaan pelanggan (Bronze, Silver, Gold, Platinum), mengakumulasikan sisa poin reward, serta meluncurkan cashback belanja.',
      badge: 'CRM SYSTEMS'
    },
    { 
      tab: 'security', 
      title: 'Multi-Role Staff Access Gateway',
      subtitle: 'Multi-Branch Stores & Admin Maintenance Systems',
      desc: 'Kunci akses otorisasi operational. Membatasi fitur staf biasa, mengendalikan status maintenance master, serta keamanan pangkalan data.',
      badge: 'ENTERPRISE GATEWAY'
    }
  ];

  // Simulated live customer names & purchases
  const demoCustomers = ['Syahrul Ramadan', 'Irwan Prasetyo', 'Siti Rahmawati', 'Rian Hidayat', 'Fauzan Jefri', 'Wulan Suci', 'Andi Nugraha'];
  const demoProducts = [
    { name: 'Original Premium Espresso', price: 28000, category: 'Minuman' },
    { name: 'Fresh Milk Matcha Latte', price: 32000, category: 'Minuman' },
    { name: 'Salted Caramel Croissant', price: 35000, category: 'Pastry' },
    { name: 'Vegan Charcoal Burger', price: 58000, category: 'Makanan' },
  ];

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    };
  }, []);

  // Traffic simulation dispatch
  useEffect(() => {
    if (isSimulatingTraffic) {
      simIntervalRef.current = setInterval(() => {
        // Run simulation tick
        const randProduct = demoProducts[Math.floor(Math.random() * demoProducts.length)];
        const randCustomer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
        const randQty = Math.floor(Math.random() * 3) + 1;
        const totalAmount = randProduct.price * randQty;

        // Add to realtimeSales state dynamically to make it pulse/render
        const newSale = {
          id: 'tx_sim_' + Math.floor(Math.random() * 89999 + 10000),
          customerName: randCustomer,
          customerPhone: '0812' + Math.floor(Math.random() * 89999999 + 10000000),
          items: [{ name: randProduct.name, price: randProduct.price, quantity: randQty }],
          total: totalAmount,
          method: Math.random() > 0.4 ? 'QRIS' : 'CASH',
          timestamp: new Date().toLocaleTimeString(),
          isSimulated: true
        };

        setRealtimeSales(prev => [newSale, ...prev]);
        setSimulationLogCount(c => c + 1);

        // Sound cues
        playSuccessSound();

        // High-end Toast alert popping to catch developer attention directly
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-bounce' : 'animate-fadeOut'} max-w-sm w-full bg-[#0b031d]/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] p-4 rounded-3xl flex items-center gap-3 backdrop-blur-xl text-slate-100 font-mono`}>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 text-xs">
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 block mb-0.5">LIVE TRANS-INCOMING</span>
              <p className="font-bold text-slate-100">
                <strong className="text-white">{randCustomer}</strong> bought {randQty}x {randProduct.name}
              </p>
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-mono">
                <span>Total: Rp {totalAmount.toLocaleString()}</span>
                <span className="text-emerald-400 font-black">💳 {newSale.method} APPROVED</span>
              </div>
            </div>
          </div>
        ), { duration: 3500 });

        triggerNotification('transaksi', `SIMULASI: Transaksi baru Rp ${totalAmount.toLocaleString()} terproses oleh AI Auto-Traffic`);
        logSystemActivity(`Automatic simulator membukukan penjualan digital QRIS: Rp ${totalAmount.toLocaleString()}`);

      }, 4000); // Ticks every 4 seconds
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }
  }, [isSimulatingTraffic]);

  // Autopilot loop
  useEffect(() => {
    if (isAutoPilotActive) {
      autoPilotTimerRef.current = setInterval(() => {
        setAutoPilotStep((currentStep) => {
          const nextStep = (currentStep + 1) % tourSteps.length;
          const config = tourSteps[nextStep];
          setActiveTab(config.tab);
          playScanSound();
          
          toast((t) => (
            <div className="text-xs font-mono text-slate-100 py-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <span>Juri Showcase: Beralih ke <strong>{config.title}</strong></span>
            </div>
          ), { icon: '🎯', duration: 2500, position: 'bottom-center' });

          return nextStep;
        });
      }, 7000); // Rotates views every 7 seconds
    } else {
      if (autoPilotTimerRef.current) {
        clearInterval(autoPilotTimerRef.current);
        autoPilotTimerRef.current = null;
      }
    }
  }, [isAutoPilotActive]);

  // Hologram toggle system class Injection helper
  const handleToggleHologram = () => {
    setHologramTheme(!hologramTheme);
    playClickSound();
    if (!hologramTheme) {
      document.body.classList.add('hologram-cyber-effect');
      toast.success('Matrix Spectre Hologram Filter Diaktifkan!', { icon: '🌌' });
    } else {
      document.body.classList.remove('hologram-cyber-effect');
      toast.success('Cyber Filter Dinonaktifkan.');
    }
  };

  const handleManualStepAndNavigate = (idx: number) => {
    playClickSound();
    setAutoPilotStep(idx);
    setActiveTab(tourSteps[idx].tab);
    toast.success(`Berpindah navigasi ke modul: ${tourSteps[idx].title}`);
  };

  const handleSoundTest = () => {
    playSuccessSound();
    toast('🔊 Retro Success Sound Chime OK!', { duration: 1500 });
  };

  const handleAltSoundTest = () => {
    playScanSound();
    toast('🔊 Barcode Beep Target OK!', { duration: 1500 });
  };

  return (
    <>
      {/* FLOATING SPARKLE JURY ACTION BUTTON DESIGNER */}
      <div className="fixed bottom-6 right-6 z-[120]">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClickSound(); setIsOpen(true); }}
          className="px-5 py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-white/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer group"
        >
          <Award className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition duration-300" />
          <span>JURI SHOWCASE HUB</span>
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-400"></span>
          </span>
        </motion.button>
      </div>

      {/* DETAILED JURY SHOWCASE & AUTO-PILOT CONTROL PANEL MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-[#0b031a] border-2 border-cyan-400/30 p-6 md:p-8 rounded-[36px] w-full max-w-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden text-slate-100 max-h-[85vh] overflow-y-auto"
            >
              {/* Top ambient color accents */}
              <div className="absolute top-0 inset-x-16 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Award className="w-6 h-6 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-300 to-violet-300">
                      Vibe Coding Presentation Mode
                    </h3>
                    <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest mt-0.5">Exclusive Jury Sandbox Hub v3.0</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* AUTOMATION MODULES (AUTOPILOT / SIMULATIONS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                {/* WIDGET 1: HIGH FREQUENCY SALES SIMULATOR */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#10072d]/75 to-black border border-cyan-500/10 text-left relative flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-cyan-400 tracking-wider uppercase block">REALTIME FLOW TRAFFIC</span>
                    <h4 className="text-xs font-bold text-slate-200">Simulasi Arus Transaksi POS</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      Menghasilkan data pembeli, pembayaran QRIS, pencatatan struk kasir, serta perubahan stat progres omset secara langsung demi visualisasi interaktif juri.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { playClickSound(); setIsSimulatingTraffic(!isSimulatingTraffic); }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition ${
                        isSimulatingTraffic 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white font-extrabold animate-pulse' 
                          : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold'
                      }`}
                    >
                      {isSimulatingTraffic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isSimulatingTraffic ? 'STOP TRAFFIC' : 'MULAI SIMULASI'}
                    </button>
                    {isSimulatingTraffic && (
                      <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/20 px-2 py-1 rounded-lg">
                        {simulationLogCount} Trx
                      </span>
                    )}
                  </div>
                </div>

                {/* WIDGET 2: SCREEN TOUR AUTOPILOT */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1b082c]/75 to-black border border-violet-500/10 text-left flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-violet-400 tracking-wider uppercase block">AUTOPILOT NAVIGATOR</span>
                    <h4 className="text-xs font-bold text-slate-200">Demo Tour Otomatis App</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      Sistem akan merevolusi pemindahan dashboard menuju POS, absensi karyawan, logistik inventaris, dan CRM setiap 7 detik secara otomatis.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { playClickSound(); setIsAutoPilotActive(!isAutoPilotActive); }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition ${
                        isAutoPilotActive
                          ? 'bg-amber-500 hover:bg-amber-600 text-[#0b031a] font-extrabold animate-bounce' 
                          : 'bg-violet-600 hover:bg-violet-700 text-white font-extrabold'
                      }`}
                    >
                      {isAutoPilotActive ? <Pause className="w-3.5 h-3.5 text-[#0b031a]" /> : <Play className="w-3.5 h-3.5" />}
                      {isAutoPilotActive ? 'PAUSE TOUR' : 'START AUTOPILOT'}
                    </button>
                    {isAutoPilotActive && (
                      <span className="text-[9px] font-mono text-amber-300 font-bold bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded-lg">
                        Tour Aktif
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* CORE APP FEATURES HIGHLIGHT MAP (INTERACTIVE NAVIGATION) */}
              <div className="space-y-3.5">
                <span className="text-[9px] font-mono font-black text-slate-400 tracking-widest uppercase block text-left">
                  🎯 Klik Kategori untuk Highlight Inovasi Utama (Presentasi Staged):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {tourSteps.map((step, idx) => {
                    const isStepActive = activeTab === step.tab;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleManualStepAndNavigate(idx)}
                        className={`p-4 text-left rounded-2xl border transition-all duration-300 relative group cursor-pointer ${
                          isStepActive 
                            ? 'bg-gradient-to-r from-[#170e31] to-black border-cyan-400/40 shadow-inner' 
                            : 'bg-black/25 hover:bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8.5px] font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                            {step.badge}
                          </span>
                          {isStepActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition duration-150">{step.title}</h5>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{step.subtitle}</p>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed mt-2 p-1.5 bg-black/35 rounded-xl border border-white/5">
                          {step.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AUXILIARY DEMO ACTIONS (CYBER SPECTRE HOLOGRAMS, INTERACTIVE SOUNDS) */}
              <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Sound Desk:</span>
                  <button
                    onClick={handleSoundTest}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    🔊 Chime Test
                  </button>
                  <button
                    onClick={handleAltSoundTest}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    🔊 Scan Test
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Cosmic Matrix Layer:</span>
                  <button
                    onClick={handleToggleHologram}
                    className={`py-2 px-3.5 rounded-xl border transition duration-300 text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                      hologramTheme 
                        ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-300' 
                        : 'bg-white/5 border-white/15 text-slate-400'
                    }`}
                  >
                    {hologramTheme ? 'ACTIVE MATRIX SPECTRE' : 'TOGGLE INTERACTION MATRIX'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
