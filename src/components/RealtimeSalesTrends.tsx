import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Zap,
  BarChart2,
  LineChart as LineIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface RealtimeSalesTrendsProps {
  realtimeSales: any[];
  language?: string;
}

export const RealtimeSalesTrends: React.FC<RealtimeSalesTrendsProps> = ({ 
  realtimeSales = [], 
  language = 'id' 
}) => {
  const [chartType, setChartType] = useState<'hourly' | 'sequential' | 'cumulative'>('hourly');

  // Unified, safe parser for Firestore or local timestamps
  const parseSaleDate = (s: any): Date => {
    if (!s || !s.date) return new Date();
    if (typeof s.date === 'object' && s.date !== null && 'seconds' in s.date) {
      return new Date((s.date as { seconds: number }).seconds * 1000);
    }
    const dStr = typeof s.date === 'string' || typeof s.date === 'number' ? s.date : s.createdAt || s.date;
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // 1. Hourly Aggregation Data (Only today's sales grouped by hour)
  const hourlyData = useMemo(() => {
    const hoursMap: { [key: string]: { hourLabel: string; totalSales: number; txCount: number } } = {};
    
    // Initialize 24 hours to make the line stable or dynamic based on active hours
    // To keep it clean, we initialize hours between 06:00 to 22:00
    for (let h = 7; h <= 21; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      hoursMap[h] = { hourLabel: label, totalSales: 0, txCount: 0 };
    }

    const todayStr = new Date().toDateString();

    realtimeSales.forEach(sale => {
      const saleDate = parseSaleDate(sale);
      if (saleDate.toDateString() === todayStr) {
        const hour = saleDate.getHours();
        const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
        
        if (hoursMap[hour]) {
          hoursMap[hour].totalSales += saleTotal;
          hoursMap[hour].txCount += 1;
        } else {
          // If transaction falls outside initial 07-21, dynamically create it
          const label = `${String(hour).padStart(2, '0')}:00`;
          hoursMap[hour] = { hourLabel: label, totalSales: saleTotal, txCount: 1 };
        }
      }
    });

    return Object.keys(hoursMap)
      .map(key => ({
        hour: parseInt(key, 10),
        ...hoursMap[key]
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [realtimeSales]);

  // 2. Sequential live feed data (plot last 12 sales individually)
  const sequentialData = useMemo(() => {
    const sortedSales = [...realtimeSales]
      .map((sale, idx) => {
        const saleDate = parseSaleDate(sale);
        return {
          id: sale.id || `s-${idx}`,
          total: typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0,
          date: saleDate,
          customer: sale.customerName || sale.customer?.name || (language === 'id' ? 'Pelanggan' : 'Customer'),
          timeLabel: saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Take the last 15 sales to show a high-density stream
    return sortedSales.slice(-15);
  }, [realtimeSales, language]);

  // 3. Cumulative Growth over time (Today's performance progression)
  const cumulativeData = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    // Filter and sort today's transactions chronologically
    const todaysSortedSales = [...realtimeSales]
      .filter(sale => parseSaleDate(sale).toDateString() === todayStr)
      .map(sale => ({
        total: typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0,
        date: parseSaleDate(sale)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningTotal = 0;
    return todaysSortedSales.map((sale, idx) => {
      runningTotal += sale.total;
      return {
        seq: idx + 1,
        time: sale.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: runningTotal,
        saleAmount: sale.total
      };
    });
  }, [realtimeSales]);

  // Summary Metrics
  const calculatedMetrics = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaysSales = realtimeSales.filter(s => parseSaleDate(s).toDateString() === todayStr);
    
    const todayVolume = todaysSales.reduce((sum, s) => sum + (typeof s.total === 'number' ? s.total : parseFloat(s.total) || 0), 0);
    const todayTxCount = todaysSales.length;
    const aov = todayTxCount > 0 ? todayVolume / todayTxCount : 0;

    // Find peak hour
    let peakHourStr = '--:--';
    let maxSales = 0;
    hourlyData.forEach(h => {
      if (h.totalSales > maxSales) {
        maxSales = h.totalSales;
        peakHourStr = h.hourLabel;
      }
    });

    return {
      todayVolume,
      todayTxCount,
      aov,
      peakHour: peakHourStr
    };
  }, [realtimeSales, hourlyData]);

  // Handle empty state gracefully
  const isTodayEmpty = calculatedMetrics.todayTxCount === 0;

  return (
    <div className="w-full p-6 rounded-3xl bg-white dark:bg-black/25 border border-indigo-100/10 shadow-xl flex flex-col space-y-6 relative overflow-hidden">
      {/* Background Ambience Lines */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-mono text-indigo-500 flex items-center gap-2 font-bold mb-1">
            <Activity className="text-violet-500 animate-pulse" size={16} /> 
            {language === 'id' ? 'TREN PENJUALAN REAL-TIME UMKM' : 'REAL-TIME SALES TREND METRIC'}
          </h4>
          <p className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-indigo-300">
            {language === 'id' ? 'Kecepatan Sesi Kasir & Grafik Volume' : 'Cashier Session Velocity & Volume Logs'}
          </p>
        </div>

        {/* Chart Selector Switcher */}
        <div className="flex bg-slate-100 dark:bg-white/5 border border-indigo-500/10 p-1 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setChartType('hourly')}
            className={`px-4 py-2 text-[10px] font-mono uppercase font-bold rounded-xl transition-all cursor-pointer ${
              chartType === 'hourly' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {language === 'id' ? 'Jam Hari Ini' : 'Hourly Today'}
          </button>
          <button
            onClick={() => setChartType('sequential')}
            className={`px-4 py-2 text-[10px] font-mono uppercase font-bold rounded-xl transition-all cursor-pointer ${
              chartType === 'sequential' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {language === 'id' ? 'Sifat Aliran' : 'Sequential Feed'}
          </button>
          <button
            onClick={() => setChartType('cumulative')}
            className={`px-4 py-2 text-[10px] font-mono uppercase font-bold rounded-xl transition-all cursor-pointer ${
              chartType === 'cumulative' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {language === 'id' ? 'Akumulatif Laba' : 'Day Progression'}
          </button>
        </div>
      </div>

      {/* Grid of Micro Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 z-10">
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-indigo-100/5 hover:border-violet-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <DollarSign size={12} className="text-[#a855f7]" /> {language === 'id' ? 'Volume Hari Ini' : 'Volume Today'}
          </span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            Rp {calculatedMetrics.todayVolume.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-indigo-100/5 hover:border-cyan-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <ShoppingBag size={12} className="text-[#22d3ee]" /> {language === 'id' ? 'Total Transaksi' : 'Total Transactions'}
          </span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            {calculatedMetrics.todayTxCount} Tx
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-indigo-100/5 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <Zap size={12} className="text-emerald-400" /> {language === 'id' ? 'Rata-rata Order' : 'Avg Order Value'}
          </span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            Rp {Math.round(calculatedMetrics.aov).toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-indigo-100/5 hover:border-amber-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <Clock size={12} className="text-amber-400" /> {language === 'id' ? 'Jam Sibuk' : 'Peak Business Hour'}
          </span>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            {calculatedMetrics.peakHour}
          </div>
        </div>
      </div>

      {/* Recharts Render Stage */}
      <div className="w-full min-h-[300px] bg-slate-900/5 dark:bg-black/15 p-4 rounded-2xl border border-indigo-100/5 relative flex items-center justify-center">
        {isTodayEmpty && chartType !== 'sequential' ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
            <TrendingUp size={44} className="mb-3 opacity-20 text-indigo-500 animate-bounce" />
            <span className="text-xs font-mono font-black uppercase tracking-wider">
              {language === 'id' ? 'MENUNGGU TRANSAKSI HARI INI...' : 'AWAITING TODAY\'S TRANSACTIONS...'}
            </span>
            <p className="text-[10px] opacity-65 max-w-[280px] mt-1">
              {language === 'id' 
                ? 'Lakukan penjualan di menu POS/Kasir untuk melihat dinamika penjualan masuk.' 
                : 'Process sales in the POS cashier menu to populate instant analytics stream.'}
            </p>
          </div>
        ) : realtimeSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
            <TrendingUp size={44} className="mb-3 opacity-20 text-indigo-500 animate-pulse" />
            <span className="text-xs font-mono font-black uppercase tracking-wider">
              {language === 'id' ? 'DATA SINKRONISASI KOSONG' : 'NO TRANSACTIONS RECORDED'}
            </span>
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'hourly' ? (
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="realtimeSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a855f70a" vertical={false} />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="#6b7280" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#090514', 
                      border: '1px solid #c084fc', 
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: '#ffffff'
                    }}
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, (language === 'id' ? 'Penjualan' : 'Sales')]}
                  />
                  <Area 
                    type="monotone" 
                    name={language === 'id' ? 'Penjualan' : 'Sales'} 
                    dataKey="totalSales" 
                    stroke="#a855f7" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#realtimeSalesGrad)" 
                  />
                </AreaChart>
              ) : chartType === 'sequential' ? (
                <BarChart data={sequentialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sequentialGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee08" vertical={false} />
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="#6b7280" 
                    fontSize={9} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#080c14', 
                      border: '1px solid #22d3ee', 
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: '#ffffff'
                    }}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload;
                      return item ? `${item.timeLabel} - ${item.customer}` : label;
                    }}
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, (language === 'id' ? 'Nilai Transaksi' : 'Order Value')]}
                  />
                  <Bar 
                    name={language === 'id' ? 'Nilai Transaksi' : 'Order Value'} 
                    dataKey="total" 
                    fill="url(#sequentialGrad)" 
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              ) : (
                <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10b9810a" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#6b7280" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#05140f', 
                      border: '1px solid #10b981', 
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: '#ffffff'
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      if (name === 'value') {
                        return [`Rp ${Number(value).toLocaleString('id-ID')}`, (language === 'id' ? 'Akumulasi Pendapatan' : 'Cumulative Sales')];
                      }
                      return [`Rp ${Number(value).toLocaleString('id-ID')}`, (language === 'id' ? 'Baru Masuk' : 'Order Amount')];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Line 
                    type="monotone" 
                    name={language === 'id' ? 'Akumulasi Profit' : 'Running Sales'} 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    name={language === 'id' ? 'Transaksi Terbaru' : 'New Order'} 
                    dataKey="saleAmount" 
                    stroke="#f59e0b" 
                    strokeOpacity={0.6}
                    strokeWidth={1.5} 
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer Insight bar */}
      <div className="flex justify-between items-center bg-[#f5f3fa] dark:bg-black/35 p-3.5 rounded-2xl border border-indigo-500/5 text-[10px] font-mono opacity-80 z-10 transition-colors">
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-violet-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {language === 'id' ? 'SINKRONISASI AKTIF: TRANSMISI REAL-TIME' : 'SYNC LIVE: REAL-TIME FEED ACTIVE'}
        </span>
        <span className="text-indigo-400 font-bold">
          UP-TO-DATE (2026-05-31)
        </span>
      </div>
    </div>
  );
};
