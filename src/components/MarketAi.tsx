import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Settings, Camera, QrCode, Send, ChevronUp, ChevronDown 
} from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarketAiProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'id' | 'en';
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isVisionActive: boolean;
  setIsVisionActive: (active: boolean) => void;
  aiChat: any[];
  aiTyping: boolean;
  thinkingStep: string;
  aiInp: string;
  setAiInp: (inp: string) => void;
  processVoiceAIQuery: (text: string) => void;
  aiChatContainerRef: React.RefObject<HTMLDivElement>;
  handleAiScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  showScrollTop: boolean;
  showScrollBottom: boolean;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

const MarketAi: React.FC<MarketAiProps> = ({
  isOpen,
  onClose,
  language,
  isSettingsOpen,
  setIsSettingsOpen,
  geminiApiKey,
  setGeminiApiKey,
  isVisionActive,
  setIsVisionActive,
  aiChat,
  aiTyping,
  thinkingStep,
  aiInp,
  setAiInp,
  processVoiceAIQuery,
  aiChatContainerRef,
  handleAiScroll,
  showScrollTop,
  showScrollBottom,
  scrollToTop,
  scrollToBottom,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 100 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 500 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 200) onClose();
            }}
            className="relative w-full max-w-4xl h-full md:h-[85vh] flex flex-col pt-10 md:pt-0"
          >
            <div className="absolute top-4 right-4 z-[100] md:z-50">
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-[#0b0a1a] border border-white/5 rounded-t-[3rem] md:rounded-[2.5rem] shadow-2xl flex-1 flex flex-col relative group/modal overflow-hidden">
               {/* Drag Handle for Mobile */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full md:hidden" />
               
               {/* Multi-layered background glow */}
               <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 blur-[120px] pointer-events-none group-hover/modal:opacity-100 opacity-60 transition-opacity" />
               <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/10 blur-[120px] pointer-events-none group-hover/modal:opacity-100 opacity-60 transition-opacity" />

               <div className="flex items-center gap-4 mb-8 p-6 md:p-10 pb-0 shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-violet-500/20 group-hover/modal:scale-110 transition-transform">
                    <Sparkles size={28} className="text-white" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 items-center relative">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="w-2 h-2 bg-emerald-500/30 rounded-full animate-ping absolute" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Core Engine Synchronized</p>
                      <span className="bg-gradient-to-r from-violet-600 to-indigo-500 border border-violet-400/20 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase text-white tracking-widest animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.3)] shrink-0">
                        🔋 GEMINI PRO 1.5
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="AI Settings"
                    >
                      <Settings size={18} />
                    </button>

                    <button 
                      onClick={() => {
                        setIsVisionActive(true);
                        setTimeout(() => setIsVisionActive(false), 3000);
                        processVoiceAIQuery("Analisis objek fisik di depan kamera...");
                      }}
                      className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400 hover:text-white hover:bg-violet-600/40 transition-all cursor-pointer flex items-center gap-2"
                      title="AI Vision Scan"
                    >
                      <Camera size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Vision</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isVisionActive && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                      <div className="relative w-64 h-64 border-2 border-violet-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent animate-scan" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <QrCode size={48} className="text-violet-400 animate-pulse" />
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <span className="text-[10px] font-mono text-violet-300 uppercase tracking-[0.3em] animate-pulse">Scanning_Physical_Object...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isSettingsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-6 md:px-10 mb-4 overflow-hidden"
                  >
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Konfigurasi Gemini</p>
                        <span className="text-[10px] text-emerald-400 font-mono">ENCRYPTED_SSL</span>
                      </div>
                      <input 
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGeminiApiKey(val);
                          localStorage.setItem('gemini_api_key', val);
                        }}
                        placeholder="Masukkan Gemini API Key..."
                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500/50"
                      />
                      <p className="text-[9px] text-slate-500">Kosongkan untuk menggunakan koneksi Simulator Cerdas kami.</p>
                    </div>
                  </motion.div>
                )}

                <div 
                  ref={aiChatContainerRef}
                  onScroll={handleAiScroll}
                  className="flex-1 overflow-y-auto space-y-8 px-6 md:px-10 mb-6 custom-scrollbar relative scroll-smooth no-scrollbar"
                >
                    <div className="mb-8">
                      <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-3 px-1">
                        Saran Pertanyaan
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => processVoiceAIQuery('Apakah stock barang hampir habis?')} 
                          className="px-4 py-2 text-[11px] font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-slate-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                          <span>Stok menipis?</span>
                        </button>
                        <button 
                          onClick={() => processVoiceAIQuery('Berapa profit hari ini?')} 
                          className="px-4 py-2 text-[11px] font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-slate-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
                          <span>Profit hari ini</span>
                        </button>
                      </div>
                    </div>

                    {aiChat.map((chat, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={cn(
                          "flex flex-col gap-2 max-w-[85%]", 
                          chat.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div className={cn(
                          "p-4 rounded-3xl text-[13px] leading-relaxed transition-all duration-300", 
                          chat.role === 'user' 
                            ? "bg-violet-600 text-white rounded-tr-none shadow-lg shadow-violet-600/10 font-medium" 
                            : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none font-normal"
                        )}>
                          {chat.role === 'user' ? (
                            <p>{chat.text}</p>
                          ) : (
                            <div className="flex gap-3">
                              <div className="shrink-0 mt-1">
                                <Sparkles size={16} className="text-violet-400 opacity-60" />
                              </div>
                              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                {chat.text.includes('[CHART:') ? (
                                  <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Visualisasi Statistik</p>
                                    <div className="flex items-end gap-3 h-40">
                                      {Object.entries(JSON.parse(chat.text.match(/\[CHART:(.*)\]/)?.[1] || '{}')).map(([k, v]: [string, any], idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                          <div className="w-full relative flex flex-col justify-end h-full">
                                            <motion.div 
                                              initial={{ height: 0 }}
                                              animate={{ height: `${(v / 50) * 100}%` }}
                                              className="w-full bg-gradient-to-t from-violet-600 to-cyan-400 rounded-t-lg relative"
                                            >
                                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                                {v}
                                              </div>
                                            </motion.div>
                                          </div>
                                          <span className="text-[10px] text-slate-500 font-bold truncate w-full text-center">{k}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{chat.text}</Markdown>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                           "text-[9px] font-medium uppercase tracking-[0.1em] opacity-30 mt-1",
                           chat.role === 'user' ? "mr-2" : "ml-4 flex items-center gap-2"
                        )}>
                           {chat.role === 'user' ? 'Terkirim' : (
                             <>
                               <span className="w-1 h-1 bg-violet-400 rounded-full" />
                               MARKET_AI_CORE
                             </>
                           )}
                        </div>
                      </motion.div>
                    ))}

                    {aiTyping && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="flex items-start gap-3 ml-4"
                       >
                         <div className="shrink-0 mt-1">
                           <Sparkles size={16} className="text-violet-400/50 animate-pulse" />
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex gap-1.5 h-6 items-center">
                             <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-violet-400/80 tracking-[0.2em] uppercase">Rantai Pemikiran:</span>
                             <span className="text-[11px] font-medium text-slate-300 italic animate-pulse">{thinkingStep}</span>
                           </div>
                         </div>
                       </motion.div>
                    )}

                    <AnimatePresence>
                      <div className="sticky bottom-4 right-0 flex flex-col items-end gap-2 pr-2 pointer-events-none">
                        {showScrollTop && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 20 }}
                            onClick={scrollToTop}
                            className="pointer-events-auto p-2.5 bg-violet-600/80 hover:bg-violet-600 text-white rounded-xl shadow-lg border border-violet-400/30 backdrop-blur-sm transition-all active:scale-95 group"
                            title="Scroll to Top"
                          >
                            <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                          </motion.button>
                        )}
                        
                        {showScrollBottom && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 10 }}
                            onClick={scrollToBottom}
                            className="pointer-events-auto p-2.5 bg-cyan-500/80 hover:bg-cyan-500 text-slate-900 rounded-xl shadow-lg border border-cyan-400/30 backdrop-blur-sm transition-all active:scale-95 group"
                            title="Scroll to Bottom"
                          >
                            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                          </motion.button>
                        )}
                      </div>
                    </AnimatePresence>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); if (aiInp.trim()){ processVoiceAIQuery(aiInp); setAiInp(''); } }} className="flex gap-3 relative z-[60] pt-4 border-t border-white/5 bg-[#0b0a1a]">
                   <div className="flex-1 relative group">
                      <input 
                        value={aiInp} 
                        onChange={e=>setAiInp(e.target.value)} 
                        type="text" 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[13px] outline-none text-white placeholder-slate-500 focus:border-violet-500/50 transition-all" 
                        placeholder={language === 'id' ? "Kirim pesan ke Market AI..." : "Message Market AI..."} 
                      />
                      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                   </div>
                   <button type="submit" className="w-14 h-14 bg-white text-slate-950 rounded-2xl hover:bg-violet-100 transition-all shadow-xl flex items-center justify-center cursor-pointer active:scale-95 group shrink-0">
                     <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                   </button>
                </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarketAi;
