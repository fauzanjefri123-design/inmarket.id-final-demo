import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { Sun, Moon, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThemeLanguageSwitcher() {
  const { theme, toggleTheme, language, setLanguage } = useThemeLanguage();

  return (
    <div className={`flex items-center gap-3 p-1.5 backdrop-blur-xl border rounded-full shadow-lg relative overflow-hidden group transition-colors duration-700 ease-in-out ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/10'}`}>
      
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-700 ease-in-out hover:scale-105 active:scale-[0.95] ${
          theme === 'dark' 
            ? 'bg-white text-black' 
            : 'bg-zinc-900 text-zinc-50'
        }`}
        title={theme === 'dark' ? "Beralih ke Terang" : "Beralih ke Gelap"}
      >
        {theme === 'dark' ? (
          <>
            <Sun size={14} className="text-zinc-900" />
            <span className="text-[10px] font-bold font-sans tracking-wide">Beralih ke Terang</span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-zinc-50" />
            <span className="text-[10px] font-bold font-sans tracking-wide">Beralih ke Gelap</span>
          </>
        )}
      </button>

      {/* Vertical Divider */}
      <div className={`w-[1px] h-4 transition-colors duration-700 ${theme === 'dark' ? 'bg-white/20' : 'bg-black/20'}`} />

      {/* Language Toggle Pill */}
      <div className={`relative flex items-center p-0.5 rounded-full border transition-colors duration-700 ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-white/50 border-black/10'}`}>
        <motion.div 
          layout
          className={`absolute h-[85%] top-[7.5%] rounded-full shadow-md transition-colors duration-700 ${theme === 'dark' ? 'bg-white' : 'bg-zinc-900'}`}
          initial={false}
          animate={{
            left: language === 'id' ? '2%' : '51%',
            width: '47%'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        <button 
          onClick={() => setLanguage('id')}
          className={`relative z-10 px-2 py-1 text-[9px] font-black tracking-widest transition-colors duration-300 hover:scale-105 active:scale-[0.95] ${
            language === 'id' 
              ? (theme === 'dark' ? 'text-black' : 'text-zinc-50') 
              : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
          }`}
        >
          ID
        </button>

        <button 
          onClick={() => setLanguage('en')}
          className={`relative z-10 px-2 py-1 text-[9px] font-black tracking-widest transition-colors duration-300 hover:scale-105 active:scale-[0.95] ${
            language === 'en' 
              ? (theme === 'dark' ? 'text-black' : 'text-zinc-50') 
              : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
