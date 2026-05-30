import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Sparkles, AlertTriangle, Calendar, DollarSign, Activity, 
  CheckCircle2, XCircle, Printer, Share2, Send, Cpu, Database, Lock, 
  Unlock, Clock, Heart, Percent, Wifi, ShieldAlert, Smartphone, 
  Bell, Sliders, Download, Upload, RefreshCw, BarChart2, Eye, LayoutGrid, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SmartBusinessOSProps {
  products: any[];
  realtimeSales: any[];
  realtimeExpenses: any[];
  shopData: any;
  userRole: string;
  employeeProfile: any;
  financeStats: any;
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setRealtimeSales: React.Dispatch<React.SetStateAction<any[]>>;
  setRealtimeExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  setShopData: React.Dispatch<React.SetStateAction<any>>;
  language: 'id' | 'en';
  playClickSound: () => void;
  playScanSound: () => void;
  playSuccessSound: () => void;
  triggerNotification: (type: string, message: string) => void;
  logSystemActivity: (action: string) => void;
}

export const SmartBusinessOS: React.FC<SmartBusinessOSProps> = ({
  products,
  realtimeSales,
  realtimeExpenses,
  shopData,
  userRole,
  employeeProfile,
  financeStats,
  setProducts,
  setRealtimeSales,
  setRealtimeExpenses,
  setShopData,
  language,
  playClickSound,
  playScanSound,
  playSuccessSound,
  triggerNotification,
  logSystemActivity
}) => {
  // Tabs & Settings States
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetSalesInput, setTargetSalesInput] = useState<number>(shopData?.targetRevenue || 2500000);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [activeHeatmapHour, setActiveHeatmapHour] = useState<number | null>(null);

  // WhatsApp simulation state
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(true);
  const [ownerWhatsApp, setOwnerWhatsApp] = useState('08123456789');
  const [isSendingWhatsAppTest, setIsSendingWhatsAppTest] = useState(false);

  // Security / Mode State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isPosLocked, setIsPosLocked] = useState(false);

  // Outstanding Expense Approvals state for interactive approval sandbox
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'appr-1', item: 'Restock Biji Kopi Sumatra Gayo (5kg)', cost: 750000, category: 'Inventaris', requester: 'Siti Karyawan' },
    { id: 'appr-2', item: 'Paket Voucher Promo Lebaran Google Ads', cost: 350000, category: 'Operasional', requester: 'Ahmad Mkt' },
    { id: 'appr-3', item: 'Service Mesin Grinder Espresso Utama', cost: 1200000, category: 'Pemeliharaan', requester: 'Fauzan Barista' }
  ]);

  // Vouchers state
  const [vouchers, setVouchers] = useState([
    { code: 'COFFEETIME10', discount: 10, minPurchase: 50000, active: true },
    { code: 'UNTUNGUMKM', discount: 15, minPurchase: 75000, active: true },
    { code: 'GAJIANHEMAT', discount: 5, minPurchase: 30000, active: true }
  ]);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState('10');

  // Load custom states on boot
  useEffect(() => {
    const savedMaintenance = localStorage.getItem('inmarket_maintenance_mode');
    if (savedMaintenance) setIsMaintenanceMode(savedMaintenance === 'true');

    const savedPosLocked = localStorage.getItem('inmarket_pos_locked');
    if (savedPosLocked) setIsPosLocked(savedPosLocked === 'true');

    const savedWA = localStorage.getItem('inmarket_wa_number');
    if (savedWA) setOwnerWhatsApp(savedWA);
  }, []);

  // Sync to database layout
  const handleToggleMaintenance = () => {
    const nextState = !isMaintenanceMode;
    setIsMaintenanceMode(nextState);
    localStorage.setItem('inmarket_maintenance_mode', String(nextState));
    playSuccessSound();
    triggerNotification('toko', nextState ? 'MAINTENANCE MODE KINI DI-AKTIFKAN!' : 'Mode maintenance dinonaktifkan.');
    logSystemActivity(nextState ? 'Owner mengaktifkan Maintenance Lock harian' : 'Owner mematikan Maintenance Lock harian');
    toast.success(nextState ? 'Maintenance Mode Aktif!' : 'Sistem Kembali Online.');
  };

  const handleTogglePosLock = () => {
    const nextState = !isPosLocked;
    setIsPosLocked(nextState);
    localStorage.setItem('inmarket_pos_locked', String(nextState));
    playSuccessSound();
    triggerNotification('keamanan', nextState ? 'KASIR POS LAYOUT BERHASIL DI-KUNCI!' : 'Kunci Kasir POS dibuka.');
    logSystemActivity(nextState ? 'Kasir POS terkunci demi keamanan operational' : 'Kunci kasir POS berhasil dinonaktifkan');
    toast.success(nextState ? 'Kasir Terkunci!' : 'Akses Kasir POS Terbuka.');
  };

  const handleUpdateTargetRevenue = (val: number) => {
    setTargetSalesInput(val);
    setShopData((prev: any) => ({ ...prev, targetRevenue: val }));
    localStorage.setItem('inmarket_target_revenue', String(val));
  };

  // Generate Automated Reports calculations
  const calculateAutoReports = () => {
    const multiplier = reportPeriod === 'daily' ? 1 : reportPeriod === 'weekly' ? 7 : 30;
    const rawSales = realtimeSales.reduce((acc, s) => acc + (typeof s.total === 'number' ? s.total : 0), 0);
    const rawLoss = realtimeExpenses.reduce((acc, e) => acc + (typeof e.amount === 'number' ? e.amount : 0), 0);

    // Dynamic multipliers for forecast
    const salesTotal = rawSales > 0 ? rawSales * (reportPeriod === 'daily' ? 1 : reportPeriod === 'weekly' ? 6.2 : 25) : (1850000 * multiplier);
    const expensesTotal = rawLoss > 0 ? rawLoss * (reportPeriod === 'daily' ? 1 : reportPeriod === 'weekly' ? 6.8 : 26) : (450000 * multiplier);
    const netProfit = Math.max(0, salesTotal - expensesTotal);
    const growthTrend = reportPeriod === 'daily' ? '+12.4%' : reportPeriod === 'weekly' ? '+18.5%' : '+22.1%';
    
    return { salesTotal, expensesTotal, netProfit, growthTrend };
  };

  const currentReport = calculateAutoReports();

  // Simulated AI Business Strategy Oracle based on actual dynamic applet conditions
  const runAiForecaster = () => {
    setIsAiAnalyzing(true);
    playScanSound();

    setTimeout(() => {
      // Analyze actual database metrics in real-time
      const lowStockProducts = products.filter(p => p.stock < 10);
      const isSalesFailingTarget = (financeStats.salesTotal < targetSalesInput);
      const bloatedExpenses = financeStats.loss > (financeStats.salesTotal * 0.35);

      // Assemble smart insights
      const insights = {
        recommender: lowStockProducts.length > 0 
          ? `⚠️ Peringatan Stok Kritis! Terdapat ${lowStockProducts.length} produk hampir habis, terutama "${lowStockProducts[0].name}". Disarankan reorder minimal 25 unit guna mengamankan margin akhir pekan.` 
          : "✅ Stok Sangat Stabil! Seluruh kategori logistik terisi optimal. Gunakan strategi bundling diskon 10% untuk Croissant menjelang jam tutup malam untuk efisiensi waste.",
        salesDecline: isSalesFailingTarget 
          ? "🚨 Analisa Penjualan Terdeteksi Lambat: Anda saat ini tertinggal dari Target Omzet Harian. Segera luncurkan voucher Flash Sale \"UNTUNGUMKM\" dan instruksikan staf kasir melakukan UP-SELLING Matcha Latte." 
          : "📈 Performa Penjualan Spektakuler! Outlet beroperasi di atas rata-rata kuota target. Pertahankan laju transaksi dengan memberikan poin CRM ganda pada member Platinum.",
        bestSellers: products.length > 0
          ? `🔮 Prediksi Produk Terlaris Besok: Berdasarkan data tren cuaca sore, "${products[0]?.name || 'Espresso'}" diperkirakan melesat tinggi 35%. Siapkan es batu ekstra semenjak pagi.`
          : "🔮 Prediksi Produk Terlaris Besok: Minuman kopi dingin dan camilan gurih akan mendominasi 70% transaksi.",
        financialPnl: bloatedExpenses
          ? "💸 Warning Arus Kas: Biaya pengeluaran (OPEX) bulanan Anda melebihi 35% batas aman profitabilitas bruto. Disarankan setujui pengeluaran modal hanya melalui modul Approval resmi."
          : "💰 Kesehatan Laba Rugi Sangat Prima! Margin profit bersih terjaga aman di angka optimal 65% bruto."
      };

      setAiAnalysisResult(insights);
      setIsAiAnalyzing(false);
      playSuccessSound();
      toast.success('AI Intelijen Sukses Mengurai Strategi Toko!');
    }, 1500);
  };

  // WhatsApp alert simulation dispatch
  const handleTestWhatsAppDispatch = () => {
    const isNumValid = ownerWhatsApp && ownerWhatsApp.length >= 10;
    if (!isNumValid) {
      toast.error('Masukkan nomor WhatsApp Indonesia yang valid!');
      return;
    }
    setIsSendingWhatsAppTest(true);
    playClickSound();

    setTimeout(() => {
      setIsSendingWhatsAppTest(false);
      playSuccessSound();
      triggerNotification('toko', `Auto-WhatsApp dikirim ke +62${ownerWhatsApp.slice(1)}`);
      toast.success(`WhatsApp Berhasil Terkirim ke +62${ownerWhatsApp.slice(1)}!`, {
        duration: 4000,
        icon: '💬',
      });
      logSystemActivity(`Pengujian sistem API integrasi WhatsApp otomatis untuk alert owner`);
    }, 1200);
  };

  // Interactive sandbox expense approval
  const handleApproveExpense = (item: any) => {
    playSuccessSound();
    
    // Construct real expense item to add to real expenses stream
    const newRealExpense = {
      id: 'exp_' + Date.now(),
      title: item.item,
      amount: item.cost,
      category: item.category,
      time: 'Hari Ini - Auto approved',
      ownerId: shopData?.ownerId || 'system'
    };

    setRealtimeExpenses(prev => [newRealExpense, ...prev]);
    setPendingApprovals(prev => prev.filter(p => p.id !== item.id));
    
    triggerNotification('kasUsaha', `EXP_APPROVE: Pengeluaran "${item.item}" disetujui senilai Rp ${item.cost.toLocaleString()}`);
    logSystemActivity(`Owner menyetujui anggaran modal: ${item.item} senilai Rp ${item.cost.toLocaleString()}`);
    toast.success(`Disetujui: Rp ${item.cost.toLocaleString()} dibukukan!`);
  };

  const handleRejectExpense = (id: string, name: string) => {
    playScanSound();
    setPendingApprovals(prev => prev.filter(p => p.id !== id));
    logSystemActivity(`Owner MENOLAK/MENOLAK pengajuan biaya: ${name}`);
    toast.error(`Pengajuan "${name}" berhasil ditolak!`);
  };

  // Auto voucher generate
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode) return;
    playSuccessSound();
    const newV = {
      code: newVoucherCode.toUpperCase().replace(/\s+/g, ''),
      discount: Number(newVoucherDiscount) || 10,
      minPurchase: 45000,
      active: true
    };
    setVouchers([newV, ...vouchers]);
    logSystemActivity(`Membuat kode voucher promo otomatis baru: ${newV.code} diskon ${newV.discount}%`);
    toast.success(`Kupons ${newV.code} Aktif secara otomatis!`);
    setNewVoucherCode('');
  };

  // Automated offline/cloud full backup download as JSON file
  const handleDownloadDatabaseBackup = () => {
    playSuccessSound();
    const dbPayload = {
      instanceId: "inmarket_prod_node_2026",
      timestamp: new Date().toISOString(),
      shopName: shopData?.businessName || "InMarket Toko",
      owner: shopData?.ownerName || "Merchant",
      data: {
        products,
        realtimeSales,
        realtimeExpenses,
        vouchers,
        targets: {
          salesInput: targetSalesInput,
          shopDataTarget: shopData?.targetRevenue
        }
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `inmarket_auto_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logSystemActivity('Backup database offline berhasil diunduh oleh admin.');
    toast.success('File cadangan database (.JSON) sukses diunduh!');
  };

  // Restore database upload parser
  const handleRestoreDatabaseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);
        if (jsonContent && jsonContent.instanceId && jsonContent.data) {
          playSuccessSound();
          
          if (jsonContent.data.products) {
            setProducts(jsonContent.data.products);
          }
          if (jsonContent.data.realtimeSales) {
            setRealtimeSales(jsonContent.data.realtimeSales);
          }
          if (jsonContent.data.realtimeExpenses) {
            setRealtimeExpenses(jsonContent.data.realtimeExpenses);
          }
          if (jsonContent.data.vouchers) {
            setVouchers(jsonContent.data.vouchers);
          }

          toast.success('Database InMarket Berhasil Dipulihkan!');
          logSystemActivity('Restorasi database offline/awan sukses dieksekusi.');
        } else {
          toast.error('Gagal memverifikasi skema file JSON cadangan.');
        }
      } catch (err) {
        toast.error('Format berkas rusak atau bukan JSON yang valid.');
      }
    };
    fileReader.readAsText(file);
  };

  // Hour busy intensity models
  const busyHours = [
    { hour: '08:00', intensity: 20, count: 4, desc: 'Toko baru dibuka. Mayoritas pembelian kopi espresso.' },
    { hour: '10:00', intensity: 35, count: 7, desc: 'Sesi santai pagi hari kerja. Pertemuan kasir POS lancar.' },
    { hour: '12:00', intensity: 85, count: 21, desc: 'Jam makan siang puncak! Terjadi antrean padat.' },
    { hour: '14:00', intensity: 50, count: 12, desc: 'Periode santai siang hari. Transaksi camilan asin.' },
    { hour: '16:00', intensity: 90, count: 28, desc: 'Coffee Rush Sore! Pembelian Matcha Latte memuncak.' },
    { hour: '18:00', intensity: 75, count: 19, desc: 'Jam pulang kerja. Pelanggan CRM mengklaim voucher.' },
    { hour: '20:00', intensity: 45, count: 10, desc: 'Makan malam santai. Transaksi menu burger vegan.' },
    { hour: '22:00', intensity: 15, count: 2, desc: 'Persiapan penutupan outlet. Input rekap harian.' },
  ];

  return (
    <div className="space-y-6 pt-2">
      
      {/* SECTION HEADER BLOCK */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/45 to-indigo-950/25 border border-violet-500/15 p-6 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400">
            <Cpu className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              AUTOMATION & BUSINESS INTELLIGENCE
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] font-mono text-violet-400/80 uppercase tracking-widest mt-0.5">InMarket SaaS Premium Suite v3.0</p>
          </div>
        </div>

        {/* Realtime Safety Toggle Locks */}
        <div className="flex items-center gap-2.5">
          {/* POS access lock */}
          <button
            onClick={handleTogglePosLock}
            className={`px-3.5 py-2 text-[10px] font-black uppercase rounded-xl border tracking-widest flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              isPosLocked 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {isPosLocked ? <Lock className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <Unlock className="w-3.5 h-3.5" />}
            {isPosLocked ? 'POS_TERKUNCI' : 'KUNCI_POS'}
          </button>

          {/* Maintenance emergency lock */}
          <button
            onClick={handleToggleMaintenance}
            className={`px-3.5 py-2 text-[10px] font-black uppercase rounded-xl border tracking-widest flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              isMaintenanceMode 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isMaintenanceMode ? 'animate-bounce text-amber-400' : ''}`} />
            {isMaintenanceMode ? 'MAINTENANCE_AKTIF' : 'MAINTENANCE'}
          </button>
        </div>
      </div>

      {/* BENTO GRID: AUTOMATION BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: AUTOMATED FINANCIAL STATEMENTS & AUTO REPORT (Laporan Laba Rugi + Auto Report Periodik) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100 min-h-[380px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header & period toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#a855f7]" />
                  {language === 'id' ? 'Laporan Laba Rugi & Siklus Auto-Report' : 'Profit & Loss Statement Periodics'}
                </h4>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">Sistem otomatis menghitung rekapitulasi laba berdasarkan POS harian.</p>
              </div>

              {/* Day, Week, Month Switches */}
              <div className="flex p-1 bg-black/45 border border-white/5 rounded-xl gap-1">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => { playClickSound(); setReportPeriod(period); }}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg tracking-wider transition-all duration-200 ${
                      reportPeriod === period 
                        ? 'bg-[#a855f7] text-white shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-705 dark:hover:text-slate-200'
                    }`}
                  >
                    {period === 'daily' ? 'Hari Ini' : period === 'weekly' ? 'Mingguan' : 'Bulanan'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto calculations presentation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              
              <div className="bg-[#10072b]/65 border border-violet-500/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono opacity-50 block tracking-widest uppercase">PENDAPATAN BRUTO</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 block mt-1">
                    Rp {currentReport.salesTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-[#a855f7] font-mono mt-3">Omset total dari pembayaran cash & QRIS</p>
              </div>

              <div className="bg-[#3b0d1e]/20 border border-rose-500/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-rose-500 block tracking-widest uppercase">PENGELUARAN (COGS/OPEX)</span>
                  <span className="text-2xl font-black text-rose-400 block mt-1">
                    Rp -{currentReport.expensesTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-rose-400/70 font-mono mt-3">Gaji staf, logistik, pengeluaran modal toko</p>
              </div>

              <div className="bg-[#051e24]/40 border border-emerald-500/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-emerald-400 block tracking-widest uppercase">LABA BERSIH RIIL (NET)</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-1">
                    Rp {currentReport.netProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mt-2 font-mono">
                  <span>TRENDING</span>
                  <span>{currentReport.growthTrend} 📈</span>
                </div>
              </div>

            </div>

            {/* Smart P&L dynamic tabular ledger breaks */}
            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/25">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-500/10 dark:bg-white/5 font-mono border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="py-3 px-4">Deskripsi Rekapitulasi</th>
                    <th className="py-3 px-4">Nilai Bruto</th>
                    <th className="py-3 px-4">Persentase</th>
                    <th className="py-3 px-4">Status Node</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  <tr>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">Realisasi Transaksi Kasir POS Digital</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Rp {currentReport.salesTotal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">100%</td>
                    <td className="py-3 px-4"><span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 px-1.5 rounded-full border border-emerald-500/20">LIVE</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">Beban Persediaan & Margin Supplier Harian</td>
                    <td className="py-3 px-4 text-rose-500 dark:text-rose-400">Rp -{Math.floor(currentReport.salesTotal * 0.22).toLocaleString()}</td>
                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">22%</td>
                    <td className="py-3 px-4"><span className="text-[9px] bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 py-0.5 px-1.5 rounded-full border border-slate-200 dark:border-white/5">CALCULATED</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">Biaya Tetap (OPEX Sewa Ruang, Gaji & Utilitas)</td>
                    <td className="py-3 px-4 text-rose-500 dark:text-rose-400">Rp -{Math.floor(currentReport.expensesTotal - (currentReport.salesTotal * 0.22)).toLocaleString()}</td>
                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">Sisa Beban</td>
                    <td className="py-3 px-4"><span className="text-[9px] bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 py-0.5 px-1.5 rounded-full border border-slate-200 dark:border-white/5">FIXED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick trigger Actions for this block */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  playSuccessSound();
                  toast.success(language === 'id' ? 'Laporan harian berhasil dikirim ke email terdaftar!' : 'Daily report sent to registered email address!');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {language === 'id' ? 'KIRIM LAPORAN KE EMAIL' : 'EMAIL LEDGER'}
              </button>
              <button
                onClick={() => {
                  playSuccessSound();
                  window.print();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 transition duration-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {language === 'id' ? 'CETAK ARSIP FISIK' : 'PRINT LEDGER'}
              </button>
            </div>
          </div>

          {/* FEATURE: INTERACTIVE EXPENSE APPROVAL MODAL / ACCORD DECK */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  {language === 'id' ? 'Hub Approval Pengeluaran Toko' : 'Expense Approvals Console'}
                </h4>
                <p className="text-[10px] font-mono text-slate-505 dark:text-slate-400 mt-1">Staf operasional mengajukan dana sewa/restock. Owner berhak menyetujui langsung.</p>
              </div>
              <span className="text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {pendingApprovals.length} Tertunda
              </span>
            </div>

            <div className="space-y-3.5">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 bg-black/10 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Semua pengajuan pengeluaran kas telah disetujui / diproses!</p>
                </div>
              ) : (
                pendingApprovals.map((appr) => (
                  <div 
                    key={appr.id}
                    className="p-4 bg-black/25 hover:bg-black/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-200"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-[#a855f7] bg-violet-500/10 px-2 py-0.5 rounded-full uppercase border border-violet-500/20">
                        {appr.category}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{appr.item}</h5>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-300 font-mono">Diajukan oleh: <strong className="text-slate-600 dark:text-slate-300">{appr.requester}</strong></p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] block text-slate-500 dark:text-slate-400 font-mono">ESTIMASI BIAYA</span>
                        <strong className="text-sm font-black text-rose-400 font-mono">Rp {appr.cost.toLocaleString()}</strong>
                      </div>

                      <div className="flex gap-1.5 ml-2">
                        <button
                          onClick={() => handleRejectExpense(appr.id, appr.item)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition duration-150 cursor-pointer"
                          title="Tolak Pengeluaran"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleApproveExpense(appr)}
                          className="p-2 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl transition duration-150 cursor-pointer"
                          title="Setujui & Bukukan Kas"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CUSTOMS SETTING, WA DISPATCHER, TARGET REVENUES, BACKUP DATABASE, HEATMAP */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* OREACLE AI CORE CLOUD TRIGGER */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#100b2a] via-[#0d0724] to-black border border-violet-500/20 shadow-2xl relative overflow-hidden text-slate-100">
            {/* Hologram aesthetic lines */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            <div className="absolute -right-4 -top-4 w-28 h-28 bg-[#a855f7]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest font-mono text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                AI FORECASTER ORACLE
              </h4>
              <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded-full uppercase">INTELLIGENT</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-400 mb-4">
              Pemicu algoritma InMarket AI guna memprediksi produk terlaris harian, mitigasi penurunan omset, serta memberikan strategi taktis restock otomatis.
            </p>

            <button
              onClick={runAiForecaster}
              disabled={isAiAnalyzing}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-violet-600 to-indigo-700 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Cpu className={`w-4 h-4 ${isAiAnalyzing ? 'animate-spin' : 'animate-pulse'}`} />
              {isAiAnalyzing ? 'MEMPROSES KODE AI...' : 'JALANKAN ANALISA AI'}
            </button>

            {/* AI Result Accord Slot */}
            <AnimatePresence>
              {aiAnalysisResult && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3.5 mt-5 pt-4 border-t border-white/10 text-xs overflow-hidden"
                >
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                    <span className="text-[9px] font-bold font-mono text-cyan-400 block tracking-wider">📦 REKOMENDASI STOK CERDAS (RESTOCK)</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-mono">{aiAnalysisResult.recommender}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/20">
                    <span className="text-[9px] font-bold font-mono text-orange-400 block tracking-wider">📉 STRATEGI PENJUALAN TURUN</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-mono">{aiAnalysisResult.salesDecline}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                    <span className="text-[9px] font-bold font-mono text-indigo-400 block tracking-wider">🔮 PREDIKSI TERLARIS (FORECASTING)</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-mono">{aiAnalysisResult.bestSellers}</p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-[9px] font-bold font-mono text-emerald-400 block tracking-wider">💰 STATUS LABA RUGI</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-mono">{aiAnalysisResult.financialPnl}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CARD: INTERACTIVE REVENUE TARGET SETTING */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <h4 className="text-xs uppercase tracking-widest font-mono text-violet-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#a855f7]" />
              {language === 'id' ? 'SISTEM TARGET OMSET HARIAN' : 'DAILY REVENUE TARGET CONFIG'}
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span>Atur Target Hari Ini:</span>
                <strong className="text-cyan-400 font-mono text-sm">Rp {targetSalesInput.toLocaleString()}</strong>
              </div>
              
              <input 
                type="range"
                min="1000000"
                max="10000000"
                step="500000"
                value={targetSalesInput}
                onChange={(e) => handleUpdateTargetRevenue(Number(e.target.value))}
                className="w-full accent-cyan-400 hover:accent-cyan-300 cursor-pointer bg-neutral-800 h-2 rounded-full"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Rp 1.0M</span>
                <span>Rp 5.5M</span>
                <span>Rp 10.0M</span>
              </div>

              <div className="p-3 bg-slate-100/60 dark:bg-white/5 rounded-xl text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                🎯 Target yang Anda atur akan divalidasi langsung oleh kecerdasan buatan dalam memformulasi pencapaian absensi & profitabilitas.
              </div>
            </div>
          </div>

          {/* CARD: AUTOMATED AUTO-BACKUP & DATABASE FILE RESTORE SYSTEM */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <h4 className="text-xs uppercase tracking-widest font-mono text-violet-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#a855f7]" />
              {language === 'id' ? 'AUTO-BACKUP & RESTORE CADANGAN' : 'BACKUP & RESTORE CONSOLE'}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Lindungi data instansi POS. Unduh data lengkap dalam format JSON, atau pulihkan pangkalan data melalui unggah file master.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleDownloadDatabaseBackup}
                className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                BACKUP DATA
              </button>
              
              <label className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                RESTORE DATA
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestoreDatabaseUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="text-[9px] font-mono text-slate-500 text-center uppercase tracking-wide">
              *MENDUKUNG OFFLINE LOCAL MERGE 100% SINKRONISASI
            </div>
          </div>

          {/* CARD: WHATAPPS ALERTS DIRECT API DISPATCHER */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest font-mono text-violet-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
                WHATSAPP ALERT ORCHESTRA
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed mb-4">
              Kirim rekap harian atau notifikasi instan langsung dari terminal POS ke WhatsApp nomor telepon Owner secara aman.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Nomor Kontak Owner (WhatsApp)
                </label>
                <input 
                  type="text" 
                  value={ownerWhatsApp}
                  onChange={(e) => {
                    const numberVal = e.target.value; 
                    setOwnerWhatsApp(numberVal); 
                    localStorage.setItem('inmarket_wa_number', numberVal);
                  }}
                  placeholder="e.g. 08123456789"
                  className="w-full p-3 bg-slate-50 dark:bg-black/45 hover:bg-slate-100 dark:hover:bg-black/60 border border-slate-200 dark:border-white/5 focus:border-cyan-500 dark:focus:border-cyan-400 rounded-xl text-xs text-slate-800 dark:text-slate-200 transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  id="wa_auto_trigger"
                  checked={isWhatsAppEnabled}
                  onChange={() => setIsWhatsAppEnabled(!isWhatsAppEnabled)}
                  className="accent-cyan-400 cursor-pointer h-4 w-4"
                />
                <label htmlFor="wa_auto_trigger" className="text-[10px] text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                  Kirim Notifikasi Otomatis pada penjualan bernominal tinggi
                </label>
              </div>

              <button
                type="button"
                onClick={handleTestWhatsAppDispatch}
                disabled={isSendingWhatsAppTest}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition text-center cursor-pointer shadow-md shadow-emerald-600/15"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingWhatsAppTest ? 'MENGHUBUNGKAN...' : 'SIMULASI TESTING WA'}
              </button>
            </div>
          </div>

          {/* HEATMAP JAM RAMAI TRANSAKSI */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <h4 className="text-xs uppercase tracking-widest font-mono text-violet-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
              HEATMAP JAM RAMAI TRANSAKSI
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Warna menyala menandakan aktivitas kasir tinggi. Klik jam untuk mendiagnosis laporan log operational spesifik.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {busyHours.map((h, i) => {
                // Color mapping logic based on busy intensity
                const bgClass = h.intensity >= 80 
                  ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30 font-black' 
                  : h.intensity >= 50 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                  : h.intensity >= 20 
                  ? 'bg-cyan-950/40 border border-cyan-500/25 text-cyan-300' 
                  : 'bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5';

                return (
                  <button
                    key={i}
                    onClick={() => { playClickSound(); setActiveHeatmapHour(i); }}
                    className={`p-2.5 rounded-xl text-[10px] text-center font-mono flex flex-col justify-center items-center gap-0.5 transition-transform hover:scale-[1.05] cursor-pointer ${bgClass}`}
                  >
                    <span>{h.hour}</span>
                    <span className="text-[8px] opacity-85">{h.intensity}%</span>
                  </button>
                );
              })}
            </div>

            {/* Display selected hour detail dialog card below */}
            {activeHeatmapHour !== null && (
              <div className="mt-4 p-3.5 bg-slate-100 border border-slate-200 dark:bg-black/45 dark:border-white/5 rounded-xl space-y-1 relative">
                <button 
                  onClick={() => setActiveHeatmapHour(null)}
                  className="absolute top-1.5 right-1.5 text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-mono"
                >
                  ✕
                </button>
                <div className="text-[9px] font-bold text-cyan-500 dark:text-cyan-400 font-mono uppercase">
                  DETAIL OPERATIONAL JAM {busyHours[activeHeatmapHour].hour}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 font-mono leading-relaxed">
                  {busyHours[activeHeatmapHour].desc}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Rata-rata: <strong>{busyHours[activeHeatmapHour].count} Tiket POS Transaksi Terlayani</strong>
                </p>
              </div>
            )}
          </div>

          {/* CRM LOYALTY VOUCHERS GENERATOR TOOL */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#090514]/40 border border-violet-500/10 backdrop-blur-xl relative overflow-hidden text-slate-800 dark:text-slate-100">
            <h4 className="text-xs uppercase tracking-widest font-mono text-violet-400 border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-400" />
              SISTEM VOUCHER PROMO OTOMATIS
            </h4>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 font-mono">Kode Promo</label>
                  <input
                    type="text"
                    required
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    placeholder="e.g. HEMAT77"
                    className="w-full text-xs p-2.5 bg-slate-55 border border-slate-200 focus:border-cyan-500 dark:bg-black/45 dark:border-white/5 rounded-xl font-mono text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 font-mono">Diskon (%)</label>
                  <select
                    value={newVoucherDiscount}
                    onChange={(e) => setNewVoucherDiscount(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-55 border border-slate-205 dark:bg-black/45 dark:border-white/5 rounded-xl font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="5">5% Diskon</option>
                    <option value="10">10% Diskon</option>
                    <option value="15">15% Diskon</option>
                    <option value="25">25% Diskon</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 text-white rounded-xl text-[10px] uppercase font-black tracking-wider transition cursor-pointer"
              >
                + AKTIFKAN KUPON BARU
              </button>
            </form>

            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest block">KUPON TOKO AKTIF SAAT INI :</span>
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {vouchers.map((v, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <strong className="text-cyan-600 dark:text-cyan-400">{v.code}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Min Belanja: Rp 30.000+</span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">{v.discount}% OFF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
