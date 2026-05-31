import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  Zap, 
  Mail, 
  Instagram, 
  MessageCircle, 
  ArrowRight, 
  Package, 
  Wallet, 
  LayoutDashboard, 
  BrainCircuit, 
  ShieldCheck, 
  Lock, 
  Compass, 
  HelpCircle, 
  ChevronDown, 
  MessageSquareQuote,
  Star,
  Sparkles,
  Terminal,
  MessageSquareCode,
  Bot,
  Volume2,
  Tv,
  Crown,
  UserCheck,
  Shield,
  X,
  TrendingDown,
  FileText,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import ThemeLanguageSwitcher from './ThemeLanguageSwitcher';
import { translations } from '../lib/translations';
import { playSuccessSound, playClickSound, playScanSound } from '../lib/sounds';
import { getPartitionedKey } from '../lib/utils';
import { createSignedOfflineSession } from '../lib/validation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  color: string;
}

// FIXED: Isolated component to render <spline-viewer> completely outside React virtual DOM reconciliation.
// Now upgraded with robust safety timeouts, global error capture, and a gorgeous local interactive cosmic canvas backup.
function SafeSplineViewer({ url, scrollY }: { url: string; scrollY: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  // Error listener & safety timeout
  useEffect(() => {
    let timer = setTimeout(() => {
      console.warn("Spline-viewer timeout reached. Loading local cosmic interactive backdrop.");
      setUseFallback(true);
      setLoading(false);
    }, 1200); // 1.2s timeout for extremely fast fallback triggers

    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('buffer') || e.message?.includes('spline') || e.message?.includes('WebGL')) {
        setUseFallback(true);
        setLoading(false);
        clearTimeout(timer);
      }
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.toString() || '';
      if (msg.includes('buffer') || msg.includes('spline') || msg.includes('WebGL')) {
        setUseFallback(true);
        setLoading(false);
        clearTimeout(timer);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Try loading spline element
  useEffect(() => {
    if (useFallback) return;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const spline = document.createElement('spline-viewer');
    spline.setAttribute('url', url);
    spline.style.width = '100%';
    spline.style.height = '100%';
    spline.style.display = 'block';

    const handleLoad = () => {
      setLoading(false);
    };

    spline.addEventListener('load', handleLoad);
    container.appendChild(spline);

    return () => {
      spline.removeEventListener('load', handleLoad);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [url, useFallback]);

  // Parallax translation effect
  useEffect(() => {
    const container = containerRef.current;
    if (container && container.firstElementChild && !useFallback) {
      (container.firstElementChild as HTMLElement).style.transform = `translateY(${scrollY * 0.15}px)`;
    }
  }, [scrollY, useFallback]);

  // Interactive 3D/Cosmic nebula canvas simulation
  useEffect(() => {
    if (!useFallback) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.height = canvas.parentElement?.clientHeight || 600;

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Mouse interactive coords
    let mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Initialize 90 cosmic particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
      pulseVal: number;
    }
    const particles: Particle[] = [];
    const colors = [
      'rgba(236, 72, 153, ',  // Pink / Fuchsia
      'rgba(168, 85, 247, ',  // Purple
      'rgba(59, 130, 246, ',  // Blue
      'rgba(6, 182, 212, ',   // Cyan
    ];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseVal: Math.random() * Math.PI,
      });
    }

    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing nebula backdrop
      const radialGrad = ctx.createRadialGradient(
        width / 2 + (mouse.active ? (mouse.x - width / 2) * 0.15 : 0),
        height / 2 + (mouse.active ? (mouse.y - height / 2) * 0.15 : 0) - (scrollY * 0.15),
        50,
        width / 2,
        height / 2,
        width * 0.6
      );
      radialGrad.addColorStop(0, 'rgba(168, 85, 247, 0.12)'); // Deep Purple glow
      radialGrad.addColorStop(0.3, 'rgba(236, 72, 153, 0.05)'); // Fuchsia envelope
      radialGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.02)');   // Cyber Cyan hint
      radialGrad.addColorStop(1, 'rgba(3, 1, 7, 0)');           // Seamless core edge
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Update and draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.18;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Move and draw particles
      particles.forEach(p => {
        // Gravitational pull to mouse
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // Parallax scroll reaction
        const drawY = p.y + (scrollY * 0.08);

        // Boundary bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Dampen velocity to keep it elegant and steady
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Pulse alpha
        p.pulseVal += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.15;

        // Draw particle core
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.max(0.1, Math.min(1, currentAlpha)) + ')';
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for fast rendering
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [useFallback, scrollY]);

  if (useFallback) {
    return <canvas ref={canvasRef} className="w-full h-full block pointer-events-none opacity-80" />;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#030107]/50 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { language, theme, setLanguage, t } = useThemeLanguage();

  // Scroll tracking for cinematic parallax transitions
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Formulated metrics counter effect
  const [metricCounts, setMetricCounts] = useState({ transactions: 11420, businesses: 320, satisfaction: 94 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricCounts(prev => ({
        transactions: prev.transactions < 342500 ? prev.transactions + Math.floor(Math.random() * 450) + 180 : 342500,
        businesses: prev.businesses < 1580 ? prev.businesses + Math.floor(Math.random() * 3) + 1 : 1580,
        satisfaction: 99
      }));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const [showDemoModal, setShowDemoModal] = useState(false);

  // Demo Guest login bypassing standard auth flows
  const handleDemoGuestLogin = () => {
    playClickSound();
    onNavigate('auth-demo');
  };

  const handleDemoSelectLogin = (demoRole: 'owner' | 'karyawan') => {
    localStorage.setItem('inmarket_demo_mode', 'true');
    
    const demoUser = createSignedOfflineSession({
      uid: `demo_uid_${demoRole}`,
      email: `demo_${demoRole}@inmarket.com`,
      displayName: demoRole === 'owner' ? 'Demo Pemilik' : 'Karyawan Demo',
      role: demoRole === 'owner' ? 'Owner' : 'Employee',
      businessId: 'bus_demo_uid_' + demoRole,
      ownerId: 'demo_uid_' + demoRole
    });

    localStorage.setItem('inmarket_user_role', demoRole === 'owner' ? 'Owner' : 'Employee');
    localStorage.setItem('offline_logged_in_user', JSON.stringify(demoUser));
    
    // Pre-populate business data if not existing
    const businessKey = getPartitionedKey('inmarket_business', true);
    if (!localStorage.getItem(businessKey)) {
      localStorage.setItem(businessKey, JSON.stringify({
        businessName: 'InMarket Lounge Ltd',
        phone: '0812-3456-7890',
        country: 'Indonesia',
        description: 'F&B Cafe & Retail'
      }));
    }
    
    setShowDemoModal(false);
    playSuccessSound();
    onNavigate('dashboard');
  };

  // Sound testing trigger
  const handleTestChime = () => {
    playSuccessSound();
  };

  // FAQ collapse active state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Background animated particles coordinator
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  useEffect(() => {
    const colors = [
      'rgba(168, 85, 247, 0.45)', // Neon Purple
      'rgba(34, 211, 238, 0.45)', // Holographic Blue
      'rgba(236, 72, 153, 0.35)', // Cyber Pink
    ];
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 3,
      speedY: -(Math.random() * 0.7 + 0.3),
      speedX: (Math.random() * 0.4 - 0.2),
      color: colors[i % colors.length]
    }));
    setParticles(generated);
  }, []);

  // Spline loaded tracking indicator
  const [splineLoaded, setSplineLoaded] = useState(false);

  // Headline static tagline
  const taglineText = "“Smart Business Operating System”";

  // Global Toast mechanism for interactions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Whenever theme or language changes, show a toast
    setToastMessage(`Sistem beralih ke mode ${theme === 'dark' ? 'Gelap' : 'Terang'} • Bahasa: ${language.toUpperCase()}`);
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [theme, language]);

  // AI Assistant dialog loop & Voice state
  const [aiOpen, setAiOpen] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiMessage, setAiMessage] = useState(
    language === 'id' 
      ? "Halo! Saya INMARKET AI. Asisten Cerdas untuk mengelola bisnis Anda. Ketik 'Apa isi web ini?' atau 'Panduan' untuk memulai." 
      : "Hello! I am INMARKET AI. Your Smart Business Assistant. Type 'What is this web' or 'Guide' to start."
  );

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to set voice based on language
    utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleAiQuestion = (topicText: string) => {
    if (!topicText.trim()) return;
    playClickSound();
    setAiTyping(true);
    
    // Handle specific queries based on keywords
    const lowerTopic = topicText.toLowerCase();
    let answer = "";
    
    if (lowerTopic.includes('isi') || lowerTopic.includes('tentang') || lowerTopic.includes('about')) {
      answer = language === 'id'
        ? "InMarket.id adalah Sistem Operasi Bisnis pintar (Smart Business OS). Berisi modul Kasir (POS) yang canggih, Manajemen Stok Multi-cabang otomatis, Absensi Karyawan dengan pengenalan wajah biometrik, laporan laba rugi instan, dan integrasi QRIS real-time. Semua data Anda dilindungi enkripsi kelas enterprise!"
        : "InMarket.id is a Smart Business Operating System. It contains an advanced Point of Sale (POS) module, automated Multi-branch Stock Management, Employee Attendance with biometric facial recognition, instant profit/loss reporting, and real-time QRIS integration. All your data is secured with enterprise-grade encryption!";
    } else if (lowerTopic.includes('panduan') || lowerTopic.includes('cara') || lowerTopic.includes('guide')) {
      answer = language === 'id'
        ? "Panduan Singkat Memulai: Pertama, klik tombol 'MASUK AKUN' atau 'LOGIN OWNER' jika Anda sudah punya akun. Jika belum, Anda bisa mencoba 'DEMO GUEST' untuk mengeksplorasi fitur kasir, melihat grafik penjualan, dan mencoba kelola stok seolah-olah Anda adalah pemilik bisnis. Coba sekarang!"
        : "Quick Start Guide: First, click 'LOGIN ACCOUNT' or 'LOGIN OWNER' if you already have an account. If not, you can try 'DEMO GUEST' to explore POS features, view sales charts, and try managing stock as if you were the business owner. Try it now!";
    } else if (lowerTopic.includes('analytic') || lowerTopic.includes('data')) {
      answer = language === 'id'
        ? "Analitik kami memberikan Anda kekuatan untuk melihat masa depan! AI memprediksi kapan barang akan habis, mencatat tren jam sibuk otomatis, dan memberi saran harga strategis berdasarkan margin penjualan."
        : "Our analytics give you the power to see the future! AI predicts when stock will run out, automatically logs peak hour trends, and suggests strategic pricing based on sales margins.";
    } else {
      answer = language === 'id' 
        ? "Sistem AI kami siap merespons. Web ini diciptakan khusus untuk merevolusi efisiensi UMKM modern. Coba klik tombol Demo untuk melihat lebih detail!" 
        : "Our neural architecture is ready to respond. This web is specifically crafted to revolutionize modern SME efficiency. Try clicking the Demo button to see more!";
    }

    setTimeout(() => {
      setAiMessage(answer);
      setAiTyping(false);
      speakText(answer);
      playScanSound();
    }, 850);
  };

  const liveChartData = [
    { name: '08:00', sales: 2400 },
    { name: '10:00', sales: 5800 },
    { name: '12:00', sales: 11200 },
    { name: '14:00', sales: 8900 },
    { name: '16:00', sales: 15400 },
    { name: '18:00', sales: 22800 },
    { name: '20:00', sales: 31500 }
  ];

  const faqs = [
    {
      q: language === 'id' ? "Apa itu InMarket.id?" : "What is InMarket.id?",
      a: language === 'id' 
        ? "InMarket.id adalah sistem operasi bisnis modular (SaaS) yang menggabungkan kasir digital POS, manajemen stok multi-kategori, sistem gaji & absensi selfie karyawan, dan asisten AI prediktif untuk menumbuhkan margin laba UMKM."
        : "InMarket.id is a modular workspace syncing point-of-sale checkout, multi-tier inventory controls, biometric worker dockets (payroll/selfies), and predictive AI models to accelerate commercial yields."
    },
    {
      q: language === 'id' ? "Apakah sistem InMarket.id aman?" : "Is InMarket.id secure?",
      a: language === 'id' 
        ? "Sangat aman. Data usaha terenkripsi di enkripsi cloud Firebase premium, diisolasi aman per-instansi, serta dioperasikan di bawah proteksi mutakhir Sandbox."
        : "Highly secure. Encoded on Firebase clouds, logically isolated by corporate identifier nodes, and locked behind security protocols."
    },
    {
      q: language === 'id' ? "Bagaimana asisten AI membantu bisnis saya?" : "How does the AI assistant uplift operations?",
      a: language === 'id' 
        ? "Dari mengantisipasi pola penjualan akhir pekan, menganalisis fluktuasi laba bulanan, menata harga jual terlaris, hingga memantau anomali stok yang menipis secara otomatis!"
        : "By charts mapping weekend demand surges, analyzing sales margins, auto-calculating reordering times, and advising strategic pricing indexes!"
    }
  ];

  return (
    <div className={`font-sans min-h-screen text-base selection:bg-cyan-500/30 overflow-x-hidden relative transition-colors duration-700 ease-in-out ${theme === 'dark' ? 'bg-[#080512] text-slate-100' : 'bg-[#f5f3fa] text-slate-900'}`}>
      
      {/* GLOBAL INTERACTIVE TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full border shadow-[0_0_30px_rgba(124,58,237,0.3)] backdrop-blur-xl flex items-center gap-3 text-[11px] font-bold tracking-widest font-mono uppercase transition-colors duration-700 ${theme === 'dark' ? 'bg-[#080512]/90 border-[#7c3aed]/40 text-cyan-400' : 'bg-white/90 border-[#7c3aed]/30 text-[#7c3aed]'}`}
          >
            <Sparkles size={14} className="animate-spin-slow" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* 1. IMMERSIVE FIXED BACKGROUND STYLES & FLUIDS      */}
      {/* ================================================= */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden select-none pointer-events-none">
        
        {/* Dynamic Holographic Spline Interactive Viewer Canvas Embedding */}
        <div className="absolute inset-0 w-full h-full transition-opacity duration-1000 opacity-30 mix-blend-screen">
          <SafeSplineViewer url="https://prod.spline.design/615b9422-9985-43f6-8593-d7d7bc3b0be1/scene.splinecode" scrollY={scrollY} />
        </div>

        {theme === 'dark' ? (
          <>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7c3aed]/20 blur-[130px] rounded-full mix-blend-screen pointer-events-none transition-all duration-700" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06b6d4]/15 blur-[150px] rounded-full mix-blend-screen pointer-events-none transition-all duration-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[40vh] bg-fuchsia-500/5 blur-[100px] pointer-events-none rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7c3aed]/10 blur-[130px] rounded-full mix-blend-multiply pointer-events-none transition-all duration-700" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06b6d4]/10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none transition-all duration-700" />
          </>
        )}

        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            animate={{
              x: [0, p.speedX * 180, 0],
              y: [0, p.speedY * 260, 0],
              opacity: [0.15, 0.75, 0.15]
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              filter: `blur(${p.size < 5 ? '1px' : '2px'})`,
            }}
          />
        ))}
      </div>

      {/* ================================================= */}
      {/* 2. HEADER NAVBAR                                   */}
      {/* ================================================= */}
      <nav className={`relative z-50 w-full px-4 md:px-12 py-4 md:h-24 flex flex-col md:flex-row justify-between items-center bg-transparent border-b backdrop-blur-xl transition-all duration-700 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          {/* Neon interactive icon badge */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] cursor-pointer hover:rotate-12 hover:scale-110 transition-all">
            M
          </div>
          <div>
            <div className="flex items-baseline">
              <span className={`text-xl md:text-2xl font-black tracking-tighter bg-clip-text text-transparent transition-all duration-700 ${theme === 'dark' ? 'bg-gradient-to-r from-white via-indigo-100 to-cyan-400' : 'bg-gradient-to-r from-black via-zinc-700 to-[#7c3aed]'}`}>
                InMarket
              </span>
              <span className="text-xl md:text-2xl font-black text-cyan-500">.id</span>
            </div>
            <div className="text-[8px] md:text-[10px] tracking-[0.4em] font-mono text-cyan-500/80 font-black uppercase leading-none mt-1">Smart AI Hub 2026</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="scale-90 md:scale-100">
            <ThemeLanguageSwitcher />
          </div>
          
          <button 
            onClick={() => { playClickSound(); onNavigate('auth'); }}
            className={`px-4 py-2 bg-transparent ${theme === 'dark' ? 'hover:bg-white/5 text-violet-300 hover:text-white' : 'hover:bg-black/5 text-[#7c3aed] hover:text-black'} font-black text-[10px] md:text-xs tracking-[0.2em] transition-all duration-500 cursor-pointer uppercase rounded-xl border border-transparent hover:border-white/10`}
          >
            LOGIN OWNER
          </button>

          <button 
            onClick={handleDemoGuestLogin}
            className="px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white rounded-2xl text-[10px] md:text-xs font-black shadow-[0_0_25px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer uppercase border border-white/20 tracking-widest"
          >
            <span>DEMO GUEST</span> <ArrowRight size={14} className="animate-pulse" />
          </button>
        </div>
      </nav>

      {/* ================================================= */}
      {/* 3. HERO OPENING VIEW (100vh Landing Canopy)       */}
      {/* ================================================= */}
      <section className="relative z-20 min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-6 text-center overflow-hidden">
        
        {/* Soft parallax container translates down as scroll departs */}
        <motion.div
          style={{
            transform: `translateY(${scrollY * 0.28}px)`,
            opacity: Math.max(0, 1 - scrollY / 550)
          }}
          className="max-w-4xl mx-auto space-y-8 relative transition-all"
        >
          {/* Cybernetic Pill Label */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border tracking-[0.2em] font-sans uppercase font-bold animate-pulse ${theme === 'dark' ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#7c3aed] shadow-[0_0_15px_rgba(124,58,237,0.2)]' : 'bg-[#7c3aed]/5 border-[#7c3aed]/20 text-[#7c3aed]'} text-[11px]`}>
            <Sparkles size={13} className="text-[#06b6d4] animate-spin-slow" /> {language === 'id' ? 'PLATFORM LEDGER HOLOGRAFIK' : 'DEEP HOLOGRAPHIC LEDGER PLATFORM'}
          </div>

          {/* Epic Main Headline with floating neon text animations */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[145px] font-black tracking-tighter leading-[0.85] select-none relative py-4 md:py-2 flex flex-col items-center">
            <span className={`text-transparent bg-clip-text transition-all duration-700 ${theme === 'dark' ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_40px_rgba(139,92,246,0.3)]' : 'bg-gradient-to-r from-zinc-900 to-zinc-600'}`}>
              InMarket
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              .id
            </span>
          </h1>

          {/* Triggering Hero Headline - Problem & Solution Pairing */}
          <div className="space-y-3 max-w-3xl mx-auto px-4">
            <h2 className="text-lg md:text-2xl font-black text-red-500 dark:text-red-400 tracking-tight leading-snug">
              {language === 'id' 
                ? "⚠️ 78% UMKM INDONESIA HAMPIR BANGKRUT AKIBAT MANAJEMEN MANUAL & KEBOCORAN KAS." 
                : "⚠️ 78% OF INDONESIAN MSMEs STRUGGLE FROM MANUAL MANAGEMENT & CASH LEAKAGE."}
            </h2>
            <p className="text-sm md:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {language === 'id'
                ? "💡 Solusi: InMarket Mengotomatiskan POS, Kontrol Stok Riil & Absensi Wajah Berbasis AI Sekali Klik."
                : "💡 Solution: InMarket Automates POS, Real-Time Stock & Face Detection AI in One Click."}
            </p>
          </div>

          {/* Static tagline layout wrapper */}
          <div className="h-10 md:h-12 flex items-center justify-center px-4">
            <span className="text-xs md:text-lg font-black text-cyan-400 tracking-[0.25em] font-mono border-y border-cyan-400/20 py-2 md:py-1 uppercase">
              {language === 'id' ? "SISTEM OPERASI BISNIS TERPADU" : "SMART BUSINESS OPERATING SYSTEM"}
            </span>
          </div>

          {/* Subtext description */}
          <p className={`text-xs md:text-lg max-w-3xl mx-auto leading-relaxed font-medium px-4 md:px-0 transition-colors duration-700 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {language === 'id' 
              ? 'Singkirkan buku tulis dan Excel rawan manipulasi. Dilengkapi asisten AI prediktif berbasis agen kognitif untuk akselerasi profit Anda.'
              : 'Eliminate error-prone spreadsheets. Equipped with predictive AI assistants and cognitive agents to accelerate your profit margins.'}
          </p>

          {/* Glassmorphic Glowing Button cluster */}
          <div className="flex flex-col md:flex-row justify-center items-stretch md:items-center gap-4 md:gap-8 pt-4 w-full max-w-lg mx-auto md:max-w-none px-4">
            <button
              onClick={() => { playSuccessSound(); onNavigate('auth'); }}
              className="px-8 py-5 md:px-12 md:py-6 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl font-black text-xs md:text-sm text-white uppercase tracking-[0.2em] hover:scale-[1.05] transition-all duration-500 relative group overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.5)] cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">{language === 'id' ? 'MULAI SEKARANG' : 'START NOW'} <ArrowRight size={18} /></span>
              <div className="absolute inset-0 bg-white/20 hover:opacity-100 opacity-0 transition-opacity" />
            </button>

            <button
              onClick={() => { playClickSound(); onNavigate('auth'); }}
              className={`px-8 py-5 md:px-12 md:py-6 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all border-2 border-white/5 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] cursor-pointer backdrop-blur-xl ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-black/5 text-slate-800'}`}
            >
              {language === 'id' ? 'MASUK AKUN' : 'LOGIN ACCOUNT'}
            </button>

            <button
              onClick={handleDemoGuestLogin}
              className={`px-8 py-5 md:px-12 md:py-6 bg-transparent rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-3`}
            >
              <Bot size={20} className="shrink-0 animate-bounce" />
              <span>DEMO GUEST</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ================================================= */}
      {/* 1B. PROBLEM STATEMENT SECTION (3 Shocking Stats) */}
      {/* ================================================= */}
      <section className="relative z-30 px-6 max-w-6xl mx-auto py-16">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400 font-bold' : 'bg-red-500/5 border-red-500/10 text-red-600 font-bold'}`}
          >
            <TrendingDown size={12} /> {language === 'id' ? 'REALITAS UMKM INDONESIA' : 'INDONESIAN MSME REALITY'}
          </motion.div>
          
          <h3 className={`text-2xl md:text-5xl font-black tracking-tight mt-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {language === 'id' 
              ? 'Mengapa Banyak UMKM Terjebak di Zona Merah?' 
              : 'Why are Most MSMEs Stuck in the Red Zone?'}
          </h3>
          <p className="text-xs md:text-lg text-slate-500 max-w-2xl mx-auto mt-2 font-medium">
            {language === 'id'
              ? 'Tiga kendala utama yang membunuh potensi laba usaha mikro setiap hari tanpa disadari.'
              : 'Three hidden obstacles draining micro-business profits every single day without being noticed.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[32px] backdrop-blur-2xl bg-black/40 border border-white/5 hover:border-violet-500/30 transition-all shadow-xl group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-500 mb-6">
              <FileText size={24} />
            </div>
            <div className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 mb-2">
              78%
            </div>
            <h4 className="text-lg font-black text-slate-100 dark:text-white mb-2">
              {language === 'id' ? 'Buta Pembukuan Riil' : 'No Accurate Ledger'}
            </h4>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
              {language === 'id'
                ? 'Mayoritas UMKM berjuang dalam 2 tahun pertama karena masih memakai buku tulis atau Excel manual yang rumit dan rawan hilang.'
                : 'Most MSMEs struggle in their first 2 years due to relying on paper notes or clumsy, easily lost spreadsheet formulas.'}
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[32px] backdrop-blur-2xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all shadow-xl group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-2xl group-hover:bg-cyan-600/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 mb-6">
              <Wallet size={24} />
            </div>
            <div className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 mb-2">
              Rp 12.4M+
            </div>
            <h4 className="text-lg font-black text-slate-100 dark:text-white mb-2">
              {language === 'id' ? 'Kebocoran Kas Tersembunyi' : 'Monthly Financial Leakage'}
            </h4>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
              {language === 'id'
                ? 'Rata-rata pemilik kehilangan hingga belasan juta per tahun akibat fraud karyawan, selisih stok fisik, dan struk tak tercatat.'
                : 'Store owners lose up to millions annually due to employee pricing fraud, physical stock errors, and untracked discounts.'}
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-[32px] backdrop-blur-2xl bg-black/40 border border-white/5 hover:border-red-500/30 transition-all shadow-xl group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-6">
              <EyeOff size={24} />
            </div>
            <div className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2">
              Rp 4.2Jt
            </div>
            <h4 className="text-lg font-black text-slate-100 dark:text-white mb-2">
              {language === 'id' ? 'Kerugian Bulanan Ekstra' : 'Extra Monthly Losses'}
            </h4>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
              {language === 'id'
                ? 'Rata-rata UMKM kehilangan dana operasional jutaan rupiah tanpa jejak per bulan. Seringkali akibat selisih stok manual dan absensi karyawan yang dimanipulasi.'
                : 'The average SME blindly leaks millions of rupiah every month without a trace. Mostly caused by manual stock discrepancies and manipulated staff check-ins.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 1C. "BEFORE VS AFTER" COMPARISON SECTION          */}
      {/* ================================================= */}
      <section className="relative z-30 px-6 max-w-6xl mx-auto py-8">
        <div className="text-center mb-12">
          <h3 className={`text-xl md:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {language === 'id' ? 'Komparasi Realitas Operasional' : 'Operational Reality Comparison'}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">
            {language === 'id' ? 'Dua jalan berbeda: Sistem lama manual vs Otomasi Canggih InMarket' : 'Two distinct paths: Legacy manual system vs InMarket Adaptive AI'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legacy Path (Red Glow) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[32px] bg-red-950/10 dark:bg-red-950/5 border border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 font-mono text-[10px] tracking-widest font-black text-red-500 bg-red-500/10 rounded-bl-2xl">
              LEGACY SYSTEM
            </div>
            <h4 className="text-xl font-black text-red-400 flex items-center gap-2 mb-6">
              <XCircle size={20} /> {language === 'id' ? 'Tanpa InMarket (Buku/Excel)' : 'Without InMarket (Manual Cards)'}
            </h4>
            <ul className="space-y-4 text-xs md:text-sm text-slate-400 font-medium">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">❌</span>
                <span>{language === 'id' ? 'Selisih kas harian yang misterius saat tutup buku tiap malam.' : 'Mysterious daily cash errors when balancing registers at night.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">❌</span>
                <span>{language === 'id' ? 'Staf bolos atau titip absen manual tanpa bukti koordinat GPS.' : 'Staff falsifying logs or sharing codes without valid GPS coordinate lock.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">❌</span>
                <span>{language === 'id' ? 'Produk terlaris mendadak habis tanpa alert, kehilangan puluhan pesanan.' : 'Best-sellers sell out without warning, bleeding thousands in profits.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">❌</span>
                <span>{language === 'id' ? 'Buta loyalitas pembeli, tidak tahu pelanggan setia yang loyal.' : 'Completely blind to CRM metrics—no way to reward loyal regulars.'}</span>
              </li>
            </ul>
          </motion.div>

          {/* Connected Path (Emerald Glow) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[32px] bg-emerald-950/10 dark:bg-emerald-950/5 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 font-mono text-[10px] tracking-widest font-black text-emerald-400 bg-emerald-400/10 rounded-bl-2xl">
              SMART BUSINESS OS
            </div>
            <h4 className="text-xl font-black text-emerald-400 flex items-center gap-2 mb-6">
              <CheckCircle size={20} /> {language === 'id' ? 'Dengan InMarket.id (Smart AI)' : 'With InMarket.id (Smart AI)'}
            </h4>
            <ul className="space-y-4 text-xs md:text-sm text-slate-300 font-medium">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{language === 'id' ? 'Laporan laba rugi instan & otomatis akurat dalam 2 detik.' : 'Instant, absolute P&L accuracy calculated automatically in 2 seconds.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{language === 'id' ? 'Presensi wajah biometrik anti-manipulasi terkunci titik koordinat GPS.' : 'Secure, tamper-proof face biometric login bound to physical GPS.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{language === 'id' ? 'AI pintar meramal restock otomatis sebelum bahan dagangan ludes.' : 'Adaptive AI predicts stock exhaustion, sending auto-restock orders.'}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{language === 'id' ? 'CRM terintegrasi memetakan tier keanggotaan otomatis berdaya tarik cashback.' : 'Integrated CRM automates membership levels with attractive cashback.'}</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>



      {/* CHATBOT ASISTEN (Sudut Kanan Bawah) */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-24 right-6 w-[340px] rounded-2xl border shadow-2xl overflow-hidden z-50 flex flex-col transition-colors duration-700 ${theme === 'dark' ? 'bg-[#080512]/95 border-[#7c3aed]/30 backdrop-blur-xl' : 'bg-white/95 border-[#06b6d4]/20 backdrop-blur-xl'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#7c3aed]/20 to-[#06b6d4]/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>INMARKET AI</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-[#06b6d4] font-bold uppercase tracking-wider">Online Assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && <Volume2 size={14} className="text-[#06b6d4] animate-pulse" />}
                <button onClick={() => setAiOpen(false)} className={`opacity-60 hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-4 flex-1 h-44 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              <div className="flex items-start gap-2 max-w-[90%]">
                <div className="w-6 h-6 rounded-full bg-[#7c3aed]/20 shrink-0 flex items-center justify-center mt-1">
                  <Bot size={12} className="text-[#06b6d4]" />
                </div>
                <div className={`p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-[#f5f3fa] border-black/5 text-slate-700'}`}>
                  {aiTyping ? (
                    <div className="flex items-center gap-1 h-4 px-2">
                      <span className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce delay-0" />
                      <span className="w-1.5 h-1.5 bg-[#d946ef] rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-[#7c3aed] rounded-full animate-bounce delay-200" />
                    </div>
                  ) : (
                    aiMessage
                  )}
                </div>
              </div>

              {/* Quick Prompt Chips */}
              {!aiTyping && (
                <div className="flex flex-wrap gap-2 mt-2 justify-end">
                  <button 
                    onClick={() => {
                      setAiInputText(language === 'id' ? 'Apa isi web ini?' : 'What is this web?');
                      handleAiQuestion('isi web');
                    }}
                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${theme === 'dark' ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-violet-300 hover:bg-[#7c3aed]/30' : 'bg-[#7c3aed]/5 border-[#7c3aed]/20 text-[#7c3aed] hover:bg-[#7c3aed]/10'}`}
                  >
                    {language === 'id' ? 'Apa isi web ini?' : 'What is this web?'}
                  </button>
                  <button 
                    onClick={() => {
                      setAiInputText(language === 'id' ? 'Tampilkan Panduan' : 'Show Guide');
                      handleAiQuestion('panduan');
                    }}
                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${theme === 'dark' ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-cyan-300 hover:bg-[#06b6d4]/30' : 'bg-[#06b6d4]/5 border-[#06b6d4]/20 text-[#06b6d4] hover:bg-[#06b6d4]/10'}`}
                  >
                    {language === 'id' ? 'Tampilkan Panduan' : 'Show Guide'}
                  </button>
                </div>
              )}
            </div>

            <div className={`p-3 border-t flex items-center gap-2 ${theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-black/5 bg-white/40'}`}>
              <input 
                type="text" 
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiInputText.trim()) {
                    handleAiQuestion(aiInputText);
                  }
                }}
                disabled={aiTyping}
                placeholder={language === 'id' ? "Tanya asisten (Panduan/Isi Web)..." : "Ask assistant (Guide/About)..."} 
                className={`flex-1 bg-transparent border-none outline-none text-xs px-2 placeholder:opacity-50 ${theme === 'dark' ? 'text-white' : 'text-black'}`}
              />
              <button 
                onClick={() => {
                  if (aiInputText.trim()) handleAiQuestion(aiInputText);
                }} 
                disabled={aiTyping || !aiInputText.trim()} 
                className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] flex items-center justify-center text-white shadow-md disabled:opacity-50 hover:scale-105 transition-transform cursor-pointer shrink-0"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Removed AI toggle button per user request */}

      {/* ================================================= */}
      {/* 4. DOCKING FLOATING DASHBOARD PREVIEW              */}
      {/* ================================================= */}
      <section className="relative z-30 px-6 max-w-6xl mx-auto py-12" id="workspace_preview">
        <motion.div
          initial={{ opacity: 0, y: 75, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
          className="relative rounded-3xl overflow-hidden border border-violet-500/20 shadow-2xl p-6 md:p-10 backdrop-blur-3xl bg-slate-950/70 shadow-[0_0_50px_rgba(139,92,246,0.15)]"
        >
          {/* Neon Scanner Line running vertical */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] pointer-events-none animate-pulse" />

          {/* Top terminal HUD strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/5 pb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <span className="font-mono text-xs opacity-75 text-cyan-400 text-left">LEDGER://INMARKET_QUANTUM_ANALYTICS_2026</span>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
                ● {t('activeSaas')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sales ledger chart simulation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl bg-black/40 border border-white/5 p-5 relative">
                <p className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-3 font-mono">{t('salesVelocity')}</p>
                <div className="h-[80%]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={liveChartData}>
                      <XAxis dataKey="name" stroke="#a78bfa" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#a78bfa" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0c071a', border: '1px solid #c084fc', borderRadius: '12px', color: '#fff' }} />
                      <Line type="monotone" dataKey="sales" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#22d3ee', strokeWidth: 0, r: 4 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0e0722]/50 border border-white/5 relative group hover:border-[#a855f7]/30 transition-all">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('aiForecast')}</h4>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">+45.2% YoY</p>
                  <p className="text-[10px] opacity-50 font-mono mt-1">{language === 'id' ? 'Disimulasikan dengan Proyeksi Deep Neural' : 'Simulated with Deep Neural Projections'}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0e0722]/50 border border-white/5 relative group hover:border-[#a855f7]/30 transition-all">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('attendanceLogs')}</h4>
                  <p className="text-2xl font-black text-emerald-400">99.8% {t('efficiency')}</p>
                  <p className="text-[10px] opacity-50 font-mono mt-1">{language === 'id' ? 'Koordinat Wajah Aman Terverifikasi' : 'Secure Facial Coordinates Match OK'}</p>
                </div>
              </div>
            </div>

            {/* Embedded Interactive Ledger HUD */}
            <div className="p-6 bg-gradient-to-br from-[#10062a]/90 to-[#070311]/90 border border-[#a855f7]/30 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/10 rounded-full blur-3xl" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center font-bold text-xs text-violet-300">
                    AI
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold font-mono tracking-wider">{language === 'id' ? 'InMarket.id Bot AI' : 'InMarket.id AI Bot'}</h5>
                    <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">{language === 'id' ? 'ALGORITMA PREDIKTIF AKTIF' : 'PREDICTIVE ALGORITHMS ACTIVE'}</p>
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs leading-relaxed italic text-indigo-200">
                    {language === 'id' 
                      ? "“Sistem merekam peningkatan 14% loyalitas pelanggan. AI menyarankan peluncuran kupon diskon akhir pekan untuk memaksimalkan arus kas masuk Anda.”"
                      : "“System captures 14% lift in active customer returns. AI maps suggestion vectors to release weekend campaign coupons to optimize liquid assets.”"}
                  </p>
                </div>
              </div>

              <div className="bg-[#a855f7]/10 p-3 rounded-xl flex items-center justify-between text-[11px] font-bold mt-4 border border-[#a855f7]/20">
                <span className="text-indigo-200">✨ {language === 'id' ? 'Rekomendasi Stok Siap' : 'Stock Recommendation Ready'}</span>
                <Compass size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
             </div>
            </div>
        </motion.div>
      </section>

      {/* ================================================= */}
      {/* 5. LIVE ECOSYSTEM GROWTH MATRIX STATS              */}
      {/* ================================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="relative rounded-[36px] bg-gradient-to-b from-indigo-950/15 via-[#0e0722]/10 to-[#030107]/20 border border-white/5 p-8 md:p-12 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200">
              {t('landingMetricsTitle')}
            </h3>
            <p className="text-sm md:text-base opacity-70">
              {language === 'id' ? 'Ribuan transaksi dan pelaku UMKM modern terintegrasi dalam jejaring bisnis berbasis AI 2026.' : 'Thousands of transactions and modern MSME players integrated in AI-powered business networks 2026.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            <div className="p-8 text-center bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[32px] hover:border-violet-500/30 transition-all duration-500 shadow-xl group">
              <div className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 mb-4 font-mono group-hover:scale-110 transition-transform">
                {metricCounts.transactions.toLocaleString()}+
              </div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black opacity-60 text-indigo-200">{language === 'id' ? 'Transaksi Diproses' : 'Transactions Processed'}</p>
            </div>
            
            <div className="p-8 text-center bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[32px] hover:border-cyan-500/30 transition-all duration-500 shadow-xl group">
              <div className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 mb-4 font-mono group-hover:scale-110 transition-transform">
                {metricCounts.businesses}+
              </div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black opacity-60 text-cyan-200">{language === 'id' ? 'Gerai Bisnis UMKM Aktif' : 'Active MSME Business Outlets'}</p>
            </div>
            
            <div className="p-8 text-center bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[32px] hover:border-emerald-500/30 transition-all duration-500 shadow-xl group md:col-span-2 lg:col-span-1">
              <div className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mb-4 font-mono group-hover:scale-110 transition-transform">
                {metricCounts.satisfaction}%
              </div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black opacity-60 text-emerald-200">{language === 'id' ? 'Indeks Kepuasan Pengguna' : 'User Satisfaction Index'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 6. DYNAMIC CORPORATE MOTIVATOR TICKER              */}
      {/* ================================================= */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-white/5 p-8 text-center bg-gradient-to-r from-violet-950/15 via-[#180d3b]/10 to-teal-950/15 relative overflow-hidden backdrop-blur-xl">
          <MessageSquareQuote size={32} className="mx-auto text-violet-400 opacity-60 mb-4 animate-bounce" />
          <h4 className="text-[10px] font-mono tracking-[0.3em] font-extrabold text-[#a855f7] dark:text-cyan-400 uppercase mb-3">AI PROVERBAL MESSAGE</h4>
          <p className="text-base md:text-xl font-medium tracking-tight leading-relaxed italic text-indigo-100 max-w-2xl mx-auto">
            {language === 'id'
              ? "“Bisnis modern tidak hanya mencatat uang keluar masuk secara konvensional, tapi mengaktifkan prediksi cerdas untuk menguasai masa depan.”"
              : "“A modern venture does not merely sum standard ledgers, but equips self-correcting forecast engines to capture tomorrow.”"
            }
          </p>
        </div>
      </section>

      {/* ================================================= */}
      {/* 7. PREMIUM BENTO SPECIFICATIONS                    */}
      {/* ================================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-30">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-violet-200">
            {t('landingFeaturesTitle')}
          </h2>
          <p className="text-xs font-mono tracking-widest text-[#a855f7] dark:text-cyan-400 uppercase font-extrabold">PRESET MATRIX SAAS SPECIFICATION</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: LayoutDashboard, title: t('dashboard'), desc: language === 'id' ? "Sistem grafik real-time 2026 yang menyajikan tren laba-rugi, neraca pemasukan, dan pos pengeluaran dalam satu pandangan data." : "Real-time 2026 chart system presenting profit-loss trends, revenue balance, and expense categories in one data view." },
            { icon: Package, title: t('inventory'), desc: language === 'id' ? "Dilengkapi status stok berwarna merah, kuning, dan hijau. Dukungan upload foto produk ganda plus import bulk file CSV instan." : "Equipped with red, yellow, and green stock status. Supports dual product photo uploads plus instant bulk CSV file import." },
            { icon: Users, title: t('absensi'), desc: language === 'id' ? "Owner men-generate kode acak harian. Karyawan menginput kode dan mengupload foto masuk kerja bersertifikat biometrik." : "Owners generate daily random codes. Employees input the code and upload biometric-certified work-entry photos." },
            { icon: BarChart3, title: t('kasir'), desc: language === 'id' ? "Mendukung transaksi Cash, QRIS statis 2026, transfer bank, dan E-Wallet serta mencetak invoice digital dengan sound beeps." : "Supports Cash, static 2026 QRIS, bank transfer, and E-Wallet transactions and prints digital invoices with sound beeps." },
            { icon: Zap, title: t('aiAssistant'), desc: language === 'id' ? "Layanan asisten otomatis yang menjawab chat bisnis, membuat anjuran strategi harga, prediksi pengeluaran, dan tips draf." : "Automated assistant service answering business chats, creating price strategy suggestions, expense predictions, and draft tips." },
            { icon: ShieldCheck, title: t('landingSecTitle'), desc: language === 'id' ? "Seluruh basis data multi-toko terlindung di cloud, terisolasi sempurna pada ID otorisasi lokal agar mencegah kebocoran data." : "Entire multi-store database protected in the cloud, perfectly isolated on local authorization IDs to prevent data leaks." }
          ].map((f, i) => (
            <div key={i} className="p-6 md:p-8 bg-neutral-950/60 border border-white/5 rounded-[32px] hover:border-fuchsia-500/40 transition-all duration-500 group hover:-translate-y-2 shadow-xl relative overflow-hidden backdrop-blur-2xl">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-tr from-violet-600/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all border border-fuchsia-500/20">
                <f.icon size={28} />
              </div>
              <h4 className="text-lg md:text-xl font-black mb-3 text-white tracking-tight">{f.title}</h4>
              <p className="opacity-60 text-[11px] md:text-sm leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* 8. PRICING TIER ROADMAP PLANS                     */}
      {/* ================================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <h3 className="text-3xl md:text-5xl font-black text-center mb-16 tracking-tight text-white">{t('pricingTitle')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          
          <div className="p-8 md:p-10 rounded-[40px] border border-white/5 bg-neutral-950/40 backdrop-blur-3xl flex flex-col justify-between hover:border-fuchsia-500/30 transition-all duration-500 group">
            <div>
              <span className="text-[10px] md:text-[11px] font-black tracking-[0.3em] text-fuchsia-400 uppercase">STARTER CORE</span>
              <h4 className="text-4xl md:text-5xl font-black mt-3 text-white tracking-tighter">Rp 0 <span className="text-xs md:text-sm font-medium opacity-40 lowercase">/ forever</span></h4>
              <p className="text-xs md:text-sm text-slate-400 mt-4 leading-relaxed font-medium">{language === 'id' ? 'Sistem dasar untuk UMKM rintisan baru pelopor lokal.' : 'Basic system for new local pioneer MSME startups.'}</p>
              <ul className="space-y-4 text-xs md:text-sm font-bold mt-10 border-t border-white/5 pt-8 opacity-70">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">✓</div>
                  {language === 'id' ? 'Max 50 Item Produk' : 'Max 50 Product Items'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">✓</div>
                  {language === 'id' ? '1 Operator Kasir' : '1 Cashier Operator'}
                </li>
                <li className="flex items-center gap-3 opacity-40 italic">
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">✗</div>
                  {language === 'id' ? 'Tanpa Algoritma AI' : 'No AI Algorithm'}
                </li>
              </ul>
            </div>
            <button onClick={() => { playClickSound(); onNavigate('auth'); }} className="w-full mt-10 py-4 rounded-xl font-black text-[10px] md:text-xs bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 uppercase tracking-[0.2em] cursor-pointer">
              {language === 'id' ? "Daftar Gratis" : "Get Free Access"}
            </button>
          </div>

          <div className="p-8 md:p-10 rounded-[40px] border-2 border-fuchsia-500/60 bg-[#16062f]/40 backdrop-blur-3xl flex flex-col justify-between relative shadow-[0_0_40px_rgba(217,70,239,0.3)] hover:scale-[1.02] transition-all duration-500">
            <div className="absolute -top-4 right-8 px-4 py-1.5 rounded-full bg-fuchsia-500 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,70,239,0.5)] animate-pulse font-mono">PRO RECOMENDED</div>
            <div>
              <span className="text-[10px] md:text-[11px] font-black tracking-[0.3em] text-fuchsia-400 uppercase">PROFESSIONAL SAAS</span>
              <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 mt-3 tracking-tighter">Rp 199k <span className="text-xs md:text-sm font-medium text-slate-300 lowercase">/ mo</span></h4>
              <p className="text-xs md:text-sm text-indigo-100 mt-4 font-bold leading-relaxed">{language === 'id' ? 'Senjata tempur utama UMKM berkembang pesat.' : 'Primary toolset for rapidly growing MSMEs.'}</p>
              <ul className="space-y-4 text-xs md:text-sm font-black mt-10 border-t border-fuchsia-500/20 pt-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-300">✓</div>
                  {language === 'id' ? 'Produk Tanpa Batas' : 'Unlimited Products'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-300">✓</div>
                  {language === 'id' ? 'Absensi Foto Selfie' : 'Selfie Attendance'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-300">✓</div>
                  {language === 'id' ? 'Asisten AI Prediktif' : 'Predictive AI Assistant'}
                </li>
              </ul>
            </div>
            <button onClick={() => { playSuccessSound(); onNavigate('auth'); }} className="w-full mt-10 py-5 rounded-xl font-black text-[10px] md:text-xs bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-xl hover:shadow-fuchsia-500/30 transition-all uppercase tracking-[0.2em] cursor-pointer">
              ACTIVE ACCESS
            </button>
          </div>

          <div className="p-8 md:p-10 rounded-[40px] border border-white/5 bg-neutral-950/40 backdrop-blur-3xl flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-500 group">
            <div>
              <span className="text-[10px] md:text-[11px] font-black tracking-[0.3em] text-cyan-400 uppercase">ENTERPRISE OS</span>
              <h4 className="text-4xl md:text-5xl font-black mt-3 text-white tracking-tighter">Rp 499k <span className="text-xs md:text-sm font-medium opacity-40 lowercase">/ mo</span></h4>
              <p className="text-xs md:text-sm text-slate-400 mt-4 leading-relaxed font-medium">{language === 'id' ? 'Jejaring multi-toko waralaba dan lisensi korporat global.' : 'Multi-outlet franchises and global corporate licenses.'}</p>
              <ul className="space-y-4 text-xs md:text-sm font-bold mt-10 border-t border-white/5 pt-8 opacity-70">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">✓</div>
                  {language === 'id' ? 'Multi-Outlet Sync' : 'Multi-Outlet Sync'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">✓</div>
                  {language === 'id' ? 'Integrasi API & Barcode' : 'API & Barcode Integration'}
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">✓</div>
                  {language === 'id' ? 'Support Prioritas 24/7' : '24/7 Priority Support'}
                </li>
              </ul>
            </div>
            <button onClick={() => { playScanSound(); onNavigate('auth'); }} className="w-full mt-10 py-4 rounded-xl font-black text-[10px] md:text-xs bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 uppercase tracking-[0.2em] cursor-pointer">
              {language === 'id' ? "Hubungi Sales" : "Contact Sales"}
            </button>
          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* 9. MILITARY SECURITY CLOUD AUDITS                  */}
      {/* ================================================= */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center border-t border-white/5">
        <div className="space-y-6">
          <div className="p-3 bg-cyan-600/10 rounded-full inline-block text-cyan-400 border border-cyan-400/25">
            <Lock size={32} className="animate-pulse" />
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">{t('landingSecTitle')}</h3>
          <p className="opacity-70 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
            {language === 'id' 
              ? 'Seluruh ledger keuangan, detail sandi pengguna, serta katalog foto usaha dilindungi oleh enkripsi cloud modern. Transaksi dibatasi sesuai izin ketat Sandbox guna menjamin kenyamanan bebas dari kebocoran data.'
              : 'Entire financial ledgers, user credentials, and business photo catalogs are protected by modern cloud encryption. Transactions are scoped within strict Sandbox permissions to guarantee data breach prevention.'}
          </p>
        </div>
      </section>

      {/* ================================================= */}
      {/* 10. FAQ ACCORDION STRUCTURE                       */}
      {/* ================================================= */}
      <section className="py-24 px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <HelpCircle className="text-cyan-400 shrink-0" size={28} /> {t('landingFaqTitle')}
          </h3>
          <p className="text-xs font-mono tracking-widest text-[#a855f7] dark:text-cyan-400 uppercase font-extrabold">ECOSYSTEM CLARITY FAQ</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl border border-white/5 bg-neutral-950/20 backdrop-blur-sm overflow-hidden transition-all duration-300"
            >
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} 
                className="w-full flex justify-between items-center text-left font-bold text-sm md:text-base cursor-pointer"
              >
                <span className="text-white hover:text-cyan-300 transition-colors">{f.q}</span>
                <ChevronDown size={18} className={`opacity-60 transition-transform ${activeFaq === idx ? 'rotate-180 text-violet-450' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="text-xs md:text-sm opacity-75 leading-relaxed border-t border-white/5 pt-4 text-slate-350"
                  >
                    {f.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* 11. WORLDWIDE STARTUP CORPORATE FOOTER             */}
      {/* ================================================= */}
      <footer className="py-20 px-6 md:px-12 border-t border-white/5 bg-black/60 relative z-30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-sm text-white">M</div>
              <span className="text-xl font-bold">InMarket</span>
            </div>
            <p className="text-xs opacity-50 leading-relaxed">
              {language === 'id' 
                ? 'Sistem SaaS FinTech cerdas era 2026 yang mentransformasi ekosistem keuangan gerai dagang dan waralaba UMKM lokal.'
                : 'Smart 2026 FinTech SaaS system transforming the financial ecosystem of local MSME outlets and franchises.'}
            </p>
          </div>
          <div>
            <h5 className="font-extrabold text-[10px] tracking-widest uppercase opacity-40 mb-4 font-mono">{language === 'id' ? 'SPESIFIKASI PRODUK' : 'PRODUCT SPEC'}</h5>
            <ul className="space-y-2.5 text-xs opacity-70">
              <li className="hover:text-cyan-400 cursor-pointer">{language === 'id' ? 'POS Kasir Realtime' : 'Realtime Cashier POS'}</li>
              <li className="hover:text-cyan-400 cursor-pointer">{language === 'id' ? 'Ledger Prediktif AI' : 'AI Predictive Ledger'}</li>
              <li className="hover:text-cyan-400 cursor-pointer">{language === 'id' ? 'API Absensi Selfie' : 'Selfie Attendance API'}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-extrabold text-[10px] tracking-widest uppercase opacity-40 mb-4 font-mono">{language === 'id' ? 'REGULASI' : 'REGULATIONS'}</h5>
            <ul className="space-y-2.5 text-xs opacity-70">
              <li className="hover:text-cyan-400 cursor-pointer">Terms of Ledger Agreements</li>
              <li className="hover:text-cyan-400 cursor-pointer">Privacy Sandbox Regulations</li>
              <li className="hover:text-cyan-400 cursor-pointer">Platform Security Cert 2026</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-extrabold text-[10px] tracking-widest uppercase opacity-40 font-mono font-sans">{language === 'id' ? 'INTEGRATOR DUKUNGAN' : 'SUPPORT INTEGRATOR'}</h5>
            <div className="flex gap-4 text-xs">
              <a 
                href="https://www.instagram.com/onlyyzan_?igsh=cDBoeDBvaHZtYWY=" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-violet-500 cursor-pointer p-2 bg-white/5 rounded-full hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all"
              >
                <Instagram size={16} />
              </a>
              <div className="hover:text-violet-500 cursor-pointer p-2 bg-white/5 rounded-full hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all">
                <MessageCircle size={16} />
              </div>
            </div>
            <p className="text-[10px] opacity-40 font-mono">SECURE MAIL: support@inmarket.id</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6 text-xs font-mono">
          <div className="space-y-1 opacity-55 max-w-xl text-center lg:text-left">
            <p>© 2026 InMarket.id Platform. {language === 'id' ? 'Beroperasi aman di kluster AI-SaaS. Dibangun untuk performa UMKM global premium.' : 'Securely operating in AI-SaaS cluster. Built for premium global MSME performance.'}</p>
            <div className="flex justify-center lg:justify-start gap-4 text-[9px] opacity-75">
              <span>HOLOGRAPHIC PURPLE CONFIG v2.8</span>
              <span>DEPLOY: STABLE_CLOUD_RUN</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0d0725]/50 border border-[#a855f7]/20 p-2.5 rounded-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-violet-600/40 via-cyan-400/30 to-transparent" />
            <div className="flex items-center gap-2 pl-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[9px] font-mono font-black tracking-widest text-violet-400 dark:text-cyan-400 uppercase leading-none">
                {language === 'id' ? 'LOKALISASI : ' : 'LOCALE : '}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setLanguage('id');
                  playSuccessSound();
                }}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer flex items-center justify-center gap-1 border leading-none ${
                  language === 'id'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                    : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>🇮🇩</span>
                <span>BAHASA</span>
              </button>
              
              <button
                onClick={() => {
                  setLanguage('en');
                  playSuccessSound();
                }}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer flex items-center justify-center gap-1 border leading-none ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                    : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>🇬🇧</span>
                <span>ENGLISH</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================= */}
      {/* 12. FLOATING HOLOGRAM AI ASSISTANT POPUP         */}
      {/* ================================================= */}
      <div className="fixed bottom-6 right-6 z-50 font-sans pointer-events-auto">
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-80 md:w-96 rounded-2xl bg-slate-950/90 border border-violet-500/30 p-5 shadow-2xl mb-4 text-left relative overflow-hidden backdrop-blur-2xl"
              style={{
                boxShadow: '0 0 35px rgba(139,92,246,0.25), inset 0 0 15px rgba(139,92,246,0.1)'
              }}
            >
              {/* Sci-fi scanner lights */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-violet-400" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-violet-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-400/35 relative">
                      <Bot size={16} className="animate-pulse" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-black rounded-full" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">InMarket.id AI Assistant</h5>
                    <p className="text-[8px] text-cyan-400 font-mono tracking-wider font-bold">2026 COGNITIVE CHATBOT</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { playClickSound(); setAiOpen(false); }}
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-widest font-mono"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Message screen */}
              <div className="my-4 h-36 overflow-y-auto pr-1 text-xs space-y-2 custom-scrollbar flex flex-col justify-end">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex gap-1.5 items-center text-[9px] font-mono text-cyan-400 font-black uppercase mb-1">
                    <span>SYSTEM AGENT</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  {aiTyping ? (
                    <div className="flex items-center gap-1.5 py-1 text-slate-400 font-mono tracking-wider">
                      <span>Typing holographic response</span>
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse" />
                    </div>
                  ) : (
                    <p className="leading-relaxed text-slate-100">{aiMessage}</p>
                  )}
                </div>
              </div>

              {/* Dynamic Action suggestion keys */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-mono tracking-widest text-[#a855f7] dark:text-cyan-400 uppercase font-black">ASK A QUESTION</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleAiQuestion('about')}
                    className="py-1.5 px-2.5 bg-violet-600/10 hover:bg-violet-600/25 border border-violet-500/25 rounded-lg text-[9.5px] font-bold text-violet-300 text-left transition truncate cursor-pointer"
                  >
                    💡 Apa itu InMarket?
                  </button>
                  <button
                    onClick={() => handleAiQuestion('analytics')}
                    className="py-1.5 px-2.5 bg-violet-600/10 hover:bg-violet-600/25 border border-violet-500/25 rounded-lg text-[9.5px] font-bold text-violet-300 text-left transition truncate cursor-pointer"
                  >
                    📊 Realtime Analytics?
                  </button>
                  <button
                    onClick={() => handleAiQuestion('qris')}
                    className="py-1.5 px-2.5 bg-violet-600/10 hover:bg-violet-600/25 border border-violet-500/25 rounded-lg text-[9.5px] font-bold text-violet-300 text-left transition truncate cursor-pointer"
                  >
                    💳 Sistem Kasir POS?
                  </button>
                  <button
                    onClick={() => handleAiQuestion('reco')}
                    className="py-1.5 px-2.5 bg-violet-600/10 hover:bg-violet-600/25 border border-violet-500/25 rounded-lg text-[9.5px] font-bold text-violet-300 text-left transition truncate cursor-pointer"
                  >
                    🤖 Fitur Asisten AI?
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating bubble toggle */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); setAiOpen(!aiOpen); }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white relative border transition-all cursor-pointer ${
              aiOpen 
                ? 'bg-[#12082b] border-[#a855f7]/50 shadow-[0_0_20px_rgba(139,92,246,0.35)]' 
                : 'bg-gradient-to-tr from-violet-600 to-cyan-500 border-white/10 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)]'
            }`}
          >
            <Bot size={24} className={aiOpen ? 'text-violet-400' : 'text-white animate-pulse'} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* Modal Popup Akun Demo */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              onClick={() => setShowDemoModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30 }} 
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative z-[101] w-full max-w-[360px] mx-4 bg-[#111724]/95 border border-amber-500/30 p-8 flex flex-col items-center shadow-2xl rounded-[28px]"
            >
              <button 
                onClick={() => setShowDemoModal(false)} 
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="w-14 h-14 bg-amber-500/15 text-amber-400 rounded-2xl flex items-center justify-center mb-5 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Shield fill="currentColor" className="animate-pulse" size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Simulasi Workspace</h3>
              <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
                Pilih peran untuk menguji seluruh kecanggihan sistem, kasir POS, audit, dan asisten Voice AI secara instan.
              </p>

              <div className="space-y-3.5 w-full">
                <button 
                  onClick={() => handleDemoSelectLogin('owner')}
                  className="w-full relative group/owner overflow-hidden py-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15 text-white border border-amber-500/40 rounded-2xl font-bold flex items-center justify-between px-5 transition duration-300 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 group-hover/owner:scale-110 transition-transform" /> 
                    <span className="text-sm">Demo Pemilik</span>
                  </div>
                  <Crown size={16} className="text-amber-400 group-hover/owner:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={() => handleDemoSelectLogin('karyawan')}
                  className="w-full relative group/staf overflow-hidden py-3.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/15 hover:to-indigo-500/15 text-white border border-cyan-500/40 rounded-2xl font-bold flex items-center justify-between px-5 transition duration-300 cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 group-hover/staf:scale-110 transition-transform" /> 
                    <span className="text-sm">Karyawan Demo</span>
                  </div>
                  <UserCheck size={16} className="text-cyan-400 group-hover/staf:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Secure Token Info Badge */}
              <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>OFFLINE SECURE SESSION KEY CARRIER SYSTEM</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
