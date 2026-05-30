import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, RefreshCw, MapPin, UserCheck, CheckCircle, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

export default function AttendanceQR() {
  const [code, setCode] = useState('');
  const [expiresIn, setExpiresIn] = useState(60);
  const [firebaseUser, setFirebaseUser] = useState<any>(auth.currentUser);
  const [currentNumericCode, setCurrentNumericCode] = useState<number>(0);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load logs on mount
  useEffect(() => {
    try {
      const existingLogsStr = localStorage.getItem('inmarket_attendance_log');
      if (existingLogsStr) {
        setAttendanceLogs(JSON.parse(existingLogsStr).slice(0, 3));
      }
    } catch (e) {
      console.warn("Failed to load logs:", e);
    }
  }, []);

  const generateCode = (isManual = false) => {
    const uid = firebaseUser?.uid || 'anonymous';
    const name = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Employee';
    const cleanName = encodeURIComponent(name);
    
    // Generate an authentic 6 digit numerical passcode representational
    const numericCode = Math.floor(100000 + Math.random() * 900000);
    setCurrentNumericCode(numericCode);
    
    // Formulate a dynamic verification QR format mapping user metadata
    const dynamicURL = `https://inmarket.id/checkin?uid=${uid}&name=${cleanName}&salt=${numericCode}`;
    setCode(dynamicURL);
    setExpiresIn(60);

    // Save attendance log entry
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      time: timeStr,
      code: numericCode.toString(),
      user: firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Guest',
      type: isManual ? 'Manual-refresh' : 'Auto-refresh'
    };

    try {
      const existingLogsStr = localStorage.getItem('inmarket_attendance_log');
      const logs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      logs.unshift(logEntry);
      const sliced = logs.slice(0, 10); // Keep last 10
      localStorage.setItem('inmarket_attendance_log', JSON.stringify(sliced));
      setAttendanceLogs(sliced.slice(0, 3));
    } catch (e) {
      console.warn("Storage log write failed:", e);
    }
  };

  useEffect(() => {
    generateCode(false);
  }, [firebaseUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          generateCode(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [code, firebaseUser]);

  const handleSimulateCheckIn = async (type: 'Office' | 'WFH' | 'Manual Verified') => {
    const name = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Karyawan';
    const uid = firebaseUser?.uid || 'anonymous';
    const newRecord = {
      id: 'att-' + Date.now(),
      uid,
      name,
      date: new Date().toISOString(),
      status: 'Hadir',
      method: type === 'WFH' ? 'GPS (Remote/WFH)' : (type === 'Office' ? 'QR Code Quick Tap' : 'Manual Code Verified'),
      ownerId: uid
    };

    // Save offline backup!
    try {
      const saved = localStorage.getItem('inmarket_offline_attendance');
      const currentList = saved ? JSON.parse(saved) : [];
      currentList.push(newRecord);
      localStorage.setItem('inmarket_offline_attendance', JSON.stringify(currentList));
    } catch (e) {
      console.warn("Local storage attendance cache failed:", e);
    }

    // Save to Firestore!
    try {
      await addDoc(collection(db, 'attendance'), newRecord);
      toast.success(type === 'WFH' ? 'Absensi WFH Berhasil Terdaftar!' : (type === 'Office' ? 'Absensi Kantor Berhasil Terdaftar!' : 'Absensi Verifikasi Kode Manual Berhasil!'));
    } catch (err) {
      console.error("Firestore attendance write fallback to cache:", err);
      toast.success('Offline Mode: Absensi Disimpan Lokal di Browser!');
    }
  };

  const handleVerifyManualCode = () => {
    const trimmedInput = manualCodeInput.trim();
    if (trimmedInput === currentNumericCode.toString()) {
      toast.success('Kode Valid! Memproses Absensi...');
      handleSimulateCheckIn('Manual Verified');
      setManualCodeInput('');
      setShowManualInput(false);
    } else {
      toast.error('Kode Salah atau Kadaluarsa! Coba kode aktif saat ini.');
    }
  };

  return (
    <div className="bg-[#090615]/95 border border-white/10 rounded-[2rem] p-6 text-center shadow-xl backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      
      <h3 className="text-white text-sm font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2 relative z-10">
        <QrCode className="text-indigo-400 animate-pulse" size={18} /> Attendance QR Engine
      </h3>
      
      <div className="flex justify-center mb-3 relative z-10">
        <div className="p-4 bg-white rounded-2xl shadow-lg border border-indigo-500/20">
          <QRCode value={code || 'https://inmarket.id'} size={150} />
        </div>
      </div>

      <div className="mb-4 relative z-10">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Active User</span>
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
          {firebaseUser?.displayName || firebaseUser?.email || 'Guest Employee'}
        </span>
      </div>

      <div className="text-[9.5px] font-mono text-slate-400 tracking-tight bg-white/5 py-1.5 px-3 rounded-lg break-all max-w-[280px] mx-auto mb-2 select-all relative z-10">
        {code.slice(0, 45)}...
      </div>

      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-1 relative z-10">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
        Regenerating in {expiresIn}s
      </div>

      {/* Verification Logs Panel Section */}
      <div className="mb-4 text-left bg-white/[0.01] border border-white/5 rounded-xl p-3 relative z-10">
        <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block mb-2 px-1">
          Recent Regeneration Logs
        </span>
        {attendanceLogs.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-2">No dynamic codes generated yet.</p>
        ) : (
          <div className="space-y-1.5">
            {attendanceLogs.map((log) => (
              <div key={log.id} className="text-[10px] flex justify-between items-center text-slate-400 border-b border-white/[0.03] pb-1 font-medium">
                <span>{log.time} — <span className="font-mono text-emerald-400">Kode: {log.code}</span></span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 opacity-75">{log.type === 'Manual-refresh' ? 'Manual' : 'Auto'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => generateCode(true)}
            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition"
          >
            <RefreshCw size={12} /> Force Reset QR
          </button>

          <button 
            onClick={() => setShowManualInput(!showManualInput)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition ${showManualInput ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
          >
            <Smartphone size={12} /> Scan Manual
          </button>
        </div>

        {/* Animate Code Verification Input Section */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 rounded-xl p-3 border border-indigo-500/20 text-left overflow-hidden space-y-2"
            >
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">
                Verification Dynamic Passcode
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="e.g. 581938"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 min-w-0 flex-1 text-xs font-mono text-white tracking-widest uppercase focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleVerifyManualCode}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition flex items-center gap-1 shadow-md shadow-indigo-500/10"
                >
                  <CheckCircle size={11} /> Verify
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.05]">
          <button 
            onClick={() => handleSimulateCheckIn('Office')}
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[8.5px] font-bold uppercase tracking-wider transition"
          >
            <UserCheck size={14} />
            Check-In Office
          </button>
          
          <button 
            onClick={() => handleSimulateCheckIn('WFH')}
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-[8.5px] font-bold uppercase tracking-wider transition"
          >
            <MapPin size={14} />
            Check-In WFH (GPS)
          </button>
        </div>
      </div>
    </div>
  );
}
