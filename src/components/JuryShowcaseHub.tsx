import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Play, Square, Award, ArrowRight } from 'lucide-react';

export interface JuryShowcaseHubProps {
  products: any[];
  realtimeSales: any[];
  realtimeExpenses: any[];
  setProducts: (val: any) => void;
  setRealtimeSales: (val: any) => void;
  setRealtimeExpenses: (val: any) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
  language: string;
  playClickSound: () => void;
  playScanSound: () => void;
  playSuccessSound: () => void;
  triggerNotification: (type: string, message: string) => void;
  logSystemActivity: (msg: string) => void;
  userRole: string;
  onClose: () => void;
}

export const JuryShowcaseHub: React.FC<JuryShowcaseHubProps> = ({ 
  language, 
  playClickSound,
  onClose 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur pb-env p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0b031d] border border-violet-500/30 p-8 rounded-[36px] w-full max-w-lg text-white shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-2">
            <Award size={24} className="text-amber-400" />
            {language === 'id' ? 'Demo Mode Juri' : 'Jury Showcase Hub'}
          </h2>
          <button onClick={() => { playClickSound(); onClose(); }} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer"><X size={18} /></button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-sm text-slate-300 font-medium">
              {language === 'id' 
                ? 'Panel ini dirancang khusus untuk mempresentasikan fitur-fitur utamanya secara live tanpa perlu mengetik manual.'
                : 'This panel is specifically designed to present core features live without manual data entry.'
              }
            </p>
          </div>
          
          <button 
            disabled
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 opacity-50 cursor-not-allowed"
          >
            <span className="font-bold text-sm tracking-widest">{language === 'id' ? 'SIMULASI KASIR LIVE' : 'LIVE POS SIMULATION'}</span>
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-md">OFFLINE</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
