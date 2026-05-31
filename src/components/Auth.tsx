import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Play, X, Crown, Sparkles, Shield, Fingerprint, Users, Sun, UserPlus, LogIn, User, UserCheck, Info, ArrowUpRight } from 'lucide-react';
import { createSignedOfflineSession } from '../lib/validation';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const CTA_CONTENT = `
### Smart Business Operating System oleh InMarket

InMarket bukan sekadar alat kasir; ini adalah **Smart Business Operating System** yang dirancang untuk mendigitalisasi UMKM Indonesia dengan teknologi <span class="text-fuchsia-400 font-bold px-1.5 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20">Inteligensi Buatan (AI)</span>. Kami memberdayakan pemilik bisnis dengan <span class="text-violet-400 font-bold px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">Data Insight Riil</span> dan operasional yang <span class="text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">Resilien secara Finansial</span>.

#### 🚀 4 Pilar Fitur Utama:
1. **AI Business Consultant**: Analis pintar yang membedah data penjualan dan memberikan strategi taktis pertumbuhan profit.
2. **Voice AI Assistant**: Operasikan inventori dan POS hanya dengan perintah suara di jam sibuk.
3. **Gamified Employee Tiers**: Tingkatkan produktivitas staf dengan sistem leveling dan reward otomatis.
4. **Robust Offline Fallback**: Transaksi tetap lancar tanpa internet dengan sinkronisasi cerdas.

#### 📊 Perbandingan Keunggulan
| Fitur | InMarket OS | POS Konvensional |
| :--- | :--- | :--- |
| **Inteligensi** | AI Prediktif & Konsultatif | Hanya Pencatatan Statis |
| **Aksesibilitas** | Voice Commands & Mobile-First | Terpaku pada Layar/Keyboard |
| **Motivasi Staf** | Sistem Gamifikasi (RPG Style) | Tanpa Insentif Terintegrasi |
| **Reliabilitas** | 100% Offline Resilience | Sering Macet Tanpa Internet |

**Siap revolusi bisnis Anda? Mulai ekosistem InMarket Anda hari ini!**
`;

export default function Auth({ onNavigate, initialRole = 'owner' }: { onNavigate: (view: any) => void, initialRole?: 'owner' | 'employee' | 'demo' }) {
  const { refreshAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Removed selectedAuthRole to simplify flow
  
  // Registration specific
  const [fullName, setFullName] = useState('');
  const [regRole, setRegRole] = useState<'owner' | 'karyawan'>('owner');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  // Demo Modal (kept for legacy if needed, but the main UI now has a demo card)
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    if (!email || !password) {
      setError('Email dan Password wajib diisi.');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Try server API login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        completeLoginFlow(data.user.email, data.user.displayName, data.user.role, data.user.uid);
        return;
      }

      // 2. Fallback to offline/local user if API fails (offline-first capability)
      const localUserStr = localStorage.getItem('local_user_' + email);
      if (localUserStr) {
        const lUser = JSON.parse(localUserStr);
        if (await bcrypt.compare(password, lUser.password)) {
          completeLoginFlow(lUser.email, lUser.nama_lengkap || lUser.displayName || email.split('@')[0], lUser.role, lUser.uid);
          return;
        }
      }

      setError(data.error || 'Email atau Katasandi salah.');
    } catch (err: any) {
      console.warn("Server auth failed, checking offline session:", err);
      const localUserStr = localStorage.getItem('local_user_' + email);
      if (localUserStr) {
        const lUser = JSON.parse(localUserStr);
        if (await bcrypt.compare(password, lUser.password)) {
          completeLoginFlow(lUser.email, lUser.nama_lengkap || lUser.displayName || email.split('@')[0], lUser.role, lUser.uid);
          return;
        }
      }
      setError('Gagal terhubung ke server atau akun tidak ditemukan offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !fullName) {
      setError('Nama, Email, dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // 0. Check local user first to prevent duplicates
      const existingOfflineUser = localStorage.getItem('local_user_' + email);
      if (existingOfflineUser) {
        setError('Email ini sudah terdaftar di ekosistem InMarket. Silakan langsung masuk.');
        setIsLoading(false);
        return;
      }

      const regRoleMapped = regRole === 'owner' ? 'Owner' : 'Employee';
      
      // 1. Attempt server registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: regRoleMapped,
          username: fullName
        })
      });

      const data = await response.json();

      if (response.ok) {
        triggerNotification('sukses', 'Akun berhasil didaftarkan di sistem cloud!');
      } else {
        console.warn('Server registration failed:', data.error);
      }

      // 2. Always save locally for offline-first resilience
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        uid: data.uid || 'u_' + Date.now(),
        email,
        password: hashedPassword,
        nama_lengkap: fullName,
        role: regRoleMapped
      };
      
      localStorage.setItem('local_user_' + email, JSON.stringify(newUser));
      
      triggerNotification('sukses', 'Akun siap digunakan! Silakan Login.');
      setIsLogin(true);
    } catch (err) {
      setError('Koneksi terputus. Registrasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dummy triggerNotification helper as it seems to be used elsewhere
  const triggerNotification = (type: string, message: string) => {
    if (type === 'sukses') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const completeLoginFlow = (userEmail: string, userName: string, userRole: string, uid: string, isDemo = false) => {
    const standardizedRole = userRole.toLowerCase() === 'owner' ? 'Owner' : 'Employee';
    console.log('[Auth] Login complete, role set to:', standardizedRole);
    
    const simulatedUser = createSignedOfflineSession({
      uid: uid,
      email: userEmail,
      displayName: userName || userEmail.split('@')[0],
      role: standardizedRole,
      businessId: 'bus_' + uid,
      ownerId: uid
    });

    localStorage.setItem('inmarket_user_role', standardizedRole);
    localStorage.setItem('offline_logged_in_user', JSON.stringify(simulatedUser));
    
    if (!isDemo) {
      localStorage.removeItem('inmarket_demo_mode');
    }
    
    refreshAuth();
    onNavigate('dashboard');
  };

  const handleDemoLogin = (demoRole: 'owner' | 'karyawan') => {
    const standardRole = demoRole === 'owner' ? 'Owner' : 'Employee';
    localStorage.setItem('inmarket_demo_mode', 'true');
    completeLoginFlow(
      `demo_${demoRole}@inmarket.com`,
      demoRole === 'owner' ? 'Demo Admin' : 'Demo Staff',
      standardRole,
      `demo_uid_${demoRole}`,
      true
    );
  };

  const enterQuickDemo = () => {
    // Default to owner for quick demo
    handleDemoLogin('owner');
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] relative w-full overflow-hidden bg-[#070b13] font-sans selection:bg-fuchsia-500/30 selection:text-white">
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-violet-500/10 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      </div>

      <button 
        onClick={() => onNavigate('landing')}
        className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-50 cursor-pointer border border-white/5 flex items-center gap-2 group text-[10px] font-bold font-mono tracking-widest"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>BACK</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px] mx-4 p-10 bg-[#0c0f1a]/95 backdrop-blur-3xl rounded-[48px] border border-white/5 shadow-2xl shadow-black"
      >
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-80" />

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1c2e] rounded-2xl border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.15)] mb-8 transition-transform hover:scale-105 duration-500">
            <Fingerprint size={32} className="text-violet-400" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-3 font-sans">
            {isLogin ? 'Log In' : 'Register'}
          </h2>
          <p className="text-[10px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase">
            INMARKET SECURE LEDGER SYSTEM
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }} animate={{ height: 'auto', opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -10 }}
              className="mb-8 p-5 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-rose-400 text-[11px] text-center font-medium flex items-center justify-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-10 p-1 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/5 shadow-inner">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3.5 rounded-[28px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${isLogin ? 'bg-white text-black' : 'text-slate-500 hover:text-slate-300'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3.5 rounded-[28px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${!isLogin ? 'bg-white text-black' : 'text-slate-500 hover:text-slate-300'}`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-6">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key="creds-options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-4"
            >
              {!isLogin && (
                <>
                  <div className="space-y-3 mb-6">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block px-1">Registrasi Sebagai</label>
                    <div className="flex gap-2">
                       <button 
                         type="button"
                         onClick={() => setRegRole('owner')}
                         className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border ${regRole === 'owner' ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                       >
                         Owner / Pemilik
                       </button>
                       <button 
                         type="button"
                         onClick={() => setRegRole('karyawan')}
                         className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border ${regRole === 'karyawan' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                       >
                         Karyawan
                       </button>
                    </div>
                  </div>
                  <div className="relative group mb-6">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors pointer-events-none group-focus-within:text-violet-400">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" 
                      className="w-full bg-[#080a13] text-white placeholder-slate-600 border border-white/[0.03] rounded-[22px] py-4.5 pl-14 pr-4 outline-none focus:border-violet-500/30 transition-all text-sm"
                    />
                  </div>
                </>
              )}

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors pointer-events-none group-focus-within:text-violet-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your business email" 
                  className="w-full bg-[#080a13] text-white placeholder-slate-600 border border-white/[0.03] rounded-[22px] py-4.5 pl-14 pr-4 outline-none focus:border-violet-500/30 transition-all text-sm shadow-inner"
                />
              </div>

              <div className="relative group p-0">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors pointer-events-none group-focus-within:text-fuchsia-400">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter 6+ character password" 
                  className="w-full bg-[#080a13] text-white placeholder-slate-600 border border-white/[0.03] rounded-[22px] py-4.5 pl-14 pr-14 outline-none focus:border-fuchsia-500/30 transition-all text-sm shadow-inner"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 cursor-pointer p-1.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full relative group/btn bg-white text-black font-extrabold py-5 rounded-[26px] transition-all shadow-xl hover:shadow-white/5 active:scale-[0.98] flex justify-center items-center gap-3 cursor-pointer mt-8"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : (
                  <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] font-mono group-hover/btn:tracking-[0.25em] transition-all uppercase">
                    {isLogin ? "PROCEED AUTHENTICATION" : "INITIALIZE ACCOUNT"}
                  </span>
                )}
              </button>

              <p className="text-[11px] text-slate-500 mt-6 text-center font-medium">
                {isLogin ? (
                  <>
                    Belum bergabung dengan ekosistem kami?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors duration-200 cursor-pointer"
                    >
                      Daftar sekarang
                    </button>
                  </>
                ) : (
                  <>
                    Sudah memiliki akun InMarket?{" "}
                    <button 
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-violet-400 hover:text-violet-300 font-bold transition-colors duration-200 cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </>
                )}
              </p>

              {isLogin && (
                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">Atau coba demo cepat offline</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('owner')}
                      className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-violet-600/20 text-violet-300 rounded-xl hover:bg-violet-600/30 transition border border-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown size={10} /> DEMO OWNER
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('karyawan')}
                      className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest bg-fuchsia-600/20 text-fuchsia-300 rounded-xl hover:bg-fuchsia-600/30 transition border border-fuchsia-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserCheck size={10} /> DEMO KARYAWAN
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </form>

        <div className="mt-12 space-y-4">
          {isLogin ? (
            <button 
              onClick={() => setShowCTA(true)}
              className="w-full group relative flex items-center justify-between p-6 rounded-[32px] bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.05)] hover:border-violet-500/40 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-black transition-all duration-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <Info size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-[11px] font-black text-white tracking-widest uppercase mb-1">Call to Action / CTA</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Jelajahi Ekosistem InMarket OS</p>
                </div>
              </div>
              <ArrowUpRight size={20} className="text-violet-400 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-700" />
            </button>
          ) : null}
          
          <p className="text-[9px] font-mono tracking-widest text-slate-700 text-center uppercase">
            InMarket Suite 2026 • Encrypted Access
          </p>
        </div>

        {/* CTA Modal */}
        <AnimatePresence>
          {showCTA && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowCTA(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#0c0f1a] border border-white/10 rounded-[40px] p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl"
              >
                <button 
                  onClick={() => setShowCTA(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="prose prose-invert prose-slate max-w-none prose-p:text-[13px] prose-p:leading-relaxed prose-headings:tracking-tight prose-headings:text-white prose-td:text-[12px] prose-th:text-[12px] prose-th:font-black prose-th:uppercase prose-th:tracking-wider prose-th:text-slate-400">
                  <div className="markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeRaw]}
                    >
                      {CTA_CONTENT}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">System Ready for UMKM Indonesia</span>
                  </div>
                  <button 
                    onClick={() => setShowCTA(false)}
                    className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] tracking-[0.2em] rounded-2xl transition-all border border-white/10 uppercase cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} /> KEMBALI KE LOGIN
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
