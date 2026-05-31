import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Users, 
  User, 
  Award, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  CreditCard, 
  QrCode, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Phone, 
  Calendar, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { getPartitionedKey, safeJsonParse } from '../lib/utils';
import { playSalaryRewardSound, playClickSound, playSuccessSound } from '../lib/sounds';
import { toast } from 'react-hot-toast';

// Interfaces based on explicit prompt instructions
export interface EmployeeRecord {
  id: string;                    // UUID, e.g. 'emp_' + Date.now()
  fullName: string;              // Full name
  position: string;              // Jabatan: Kasir, Gudang, Supervisor, etc.
  baseSalary: number;            // Gaji pokok in Rupiah
  photoUrl: string;              // URL of profile photo
  gender: 'Male' | 'Female';
  email?: string;                // Optional email
  joinDate: string;              // Join date YYYY-MM-DD
  phone?: string;                // Optional Phone
  bankName?: string;             // Bank Name: BCA, Mandiri, etc.
  accountNumber?: string;        // Account number
  createdAt: string;             // ISO Timestamp
}

export interface SalaryPaymentRecord {
  employeeId: string;
  employeeName: string;
  amount: number;                // baseSalary
  bonus: number;                 // additional bonus
  deduction: number;             // deductions
  finalAmount: number;           // amount + bonus - deduction
  paidAt: string;                // ISO Timestamp when paid
  paidByOwner: string;           // Name/email of paying owner
  month: string;                 // Format: 'YYYY-MM'
  notes: string;                 // Optional comments
  method: 'Transfer Bank' | 'Tunai' | 'QRIS';
}

interface SalaryManagerProps {
  userRole: 'Owner' | 'Employee';
  employeeProfile: { fullName: string; photoUrl: string; gender: string; exp: number };
  language: 'id' | 'en';
  playClickSound: () => void;
  playSuccessSound: () => void;
  triggerNotification: (type: string, message: string) => void;
  logSystemActivity: (action: string) => void;
  onSalaryPaid: () => void; // callback to update isSalaryPaid state in Dashboard
  onClose: () => void; // close salary manager modal/section
}

export default function SalaryManager({
  userRole,
  employeeProfile,
  language,
  playClickSound: propPlayClickSound,
  playSuccessSound: propPlaySuccessSound,
  triggerNotification,
  logSystemActivity,
  onSalaryPaid,
  onClose
}: SalaryManagerProps) {
  
  // Wrap sounds safely
  const clickSound = () => {
    try { propPlayClickSound(); } catch(e) { playClickSound(); }
  };
  
  const successSound = () => {
    try { propPlaySuccessSound(); } catch(e) { playSuccessSound(); }
  };

  // Month code tracking (Format: '2026-05')
  const currentMonthCode = new Date().toISOString().slice(0, 7); // '2026-05'

  // Load partitioned state for Employee Registry & Salary history
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    const registryKey = getPartitionedKey('inmarket_employees_registry', false);
    const saved = localStorage.getItem(registryKey);
    let list = safeJsonParse(saved, [] as EmployeeRecord[]);

    // Ensure baseline default data if clean slate is detected
    if (!list || list.length === 0) {
      const defaultEmployees: EmployeeRecord[] = [
        {
          id: 'emp_1',
          fullName: 'Budi Santoso',
          position: 'Kasir Utama',
          baseSalary: 4500000,
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          gender: 'Male',
          joinDate: '2025-03-01',
          createdAt: new Date().toISOString()
        },
        {
          id: 'emp_2',
          fullName: 'Siti Rahma',
          position: 'Staff Gudang',
          baseSalary: 4200000,
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          gender: 'Female',
          joinDate: '2025-05-15',
          createdAt: new Date().toISOString()
        }
      ];

      // Auto-populate logged-in employee to avoid empty search on Employee role simulation
      if (employeeProfile && employeeProfile.fullName) {
        const exist = defaultEmployees.some(
          d => d.fullName.toLowerCase().trim() === employeeProfile.fullName.toLowerCase().trim()
        );
        if (!exist) {
          defaultEmployees.push({
            id: 'emp_self',
            fullName: employeeProfile.fullName,
            position: 'Supervisor Cabang',
            baseSalary: 5500000,
            photoUrl: employeeProfile.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            gender: (employeeProfile.gender as 'Male' | 'Female') || 'Female',
            joinDate: '2025-10-01',
            createdAt: new Date().toISOString()
          });
        }
      }
      localStorage.setItem(registryKey, JSON.stringify(defaultEmployees));
      return defaultEmployees;
    }
    
    // Also inject logged employee if missing in registry for absolute safety
    if (employeeProfile && employeeProfile.fullName) {
      const hasSelf = list.some(
        d => d.fullName.toLowerCase().trim() === employeeProfile.fullName.toLowerCase().trim()
      );
      if (!hasSelf) {
        const updated = [...list, {
          id: 'emp_self',
          fullName: employeeProfile.fullName,
          position: 'Supervisor Cabang',
          baseSalary: 5500000,
          photoUrl: employeeProfile.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
          gender: (employeeProfile.gender as 'Male' | 'Female') || 'Female',
          joinDate: '2025-10-01',
          createdAt: new Date().toISOString()
        }];
        localStorage.setItem(registryKey, JSON.stringify(updated));
        return updated;
      }
    }

    return list;
  });

  const [salaryHistory, setSalaryHistory] = useState<SalaryPaymentRecord[]>(() => {
    const historyKey = getPartitionedKey('inmarket_salary_history', false);
    return safeJsonParse(localStorage.getItem(historyKey), []);
  });

  // Save changes to localStorage on states changes
  const saveEmployeesToStorage = (updatedList: EmployeeRecord[]) => {
    const registryKey = getPartitionedKey('inmarket_employees_registry', false);
    localStorage.setItem(registryKey, JSON.stringify(updatedList));
    setEmployees(updatedList);
  };

  const saveSalaryHistoryToStorage = (updatedHistory: SalaryPaymentRecord[]) => {
    const historyKey = getPartitionedKey('inmarket_salary_history', false);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setSalaryHistory(updatedHistory);
  };

  // Searching & active tabs states inside the Salary Manager
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState(false); // Toggle to show history vs lists

  // Modals visibility state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<EmployeeRecord | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmployeeForPay, setSelectedEmployeeForPay] = useState<EmployeeRecord | null>(null);

  // Add/Edit Form state
  const [fullNameInp, setFullNameInp] = useState('');
  const [positionInp, setPositionInp] = useState('Kasir');
  const [baseSalaryInp, setBaseSalaryInp] = useState(4000000);
  const [photoUrlInp, setPhotoUrlInp] = useState('');
  const [genderInp, setGenderInp] = useState<'Male' | 'Female'>('Male');
  const [emailInp, setEmailInp] = useState('');
  const [joinDateInp, setJoinDateInp] = useState(new Date().toISOString().slice(0, 10));
  const [phoneInp, setPhoneInp] = useState('');
  const [bankNameInp, setBankNameInp] = useState('BCA');
  const [accountNumberInp, setAccountNumberInp] = useState('');

  // Pay Salary Form state
  const [salaryBonus, setSalaryBonus] = useState(0);
  const [salaryDeduction, setSalaryDeduction] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Tunai' | 'QRIS'>('Transfer Bank');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Track envelope animations for employees
  const [simulatedEnvelopeState, setSimulatedEnvelopeState] = useState<'closed' | 'opening' | 'opened'>('closed');

  // Trigger payout details
  const getIsPaidThisMonth = (empId: string) => {
    return salaryHistory.some(h => h.employeeId === empId && h.month === currentMonthCode);
  };

  const getPaidRecordThisMonth = (empId: string) => {
    return salaryHistory.find(h => h.employeeId === empId && h.month === currentMonthCode);
  };

  // Total summary calculations for metrics
  const totalEmployeesCount = employees.length;
  const totalBaseSalaryMonthly = employees.reduce((acc, emp) => acc + emp.baseSalary, 0);

  const paidThisMonthRecords = salaryHistory.filter(h => h.month === currentMonthCode);
  const totalPaidSumThisMonth = paidThisMonthRecords.reduce((acc, h) => acc + h.finalAmount, 0);
  
  const unpaidEmployeesCount = employees.filter(emp => !getIsPaidThisMonth(emp.id)).length;
  const totalUnpaidSumThisMonth = employees
    .filter(emp => !getIsPaidThisMonth(emp.id))
    .reduce((acc, emp) => acc + emp.baseSalary, 0);

  // Match logged in employee credentials
  const getMatchedEmployee = () => {
    const nameToMatch = employeeProfile.fullName.toLowerCase().trim();
    if (!nameToMatch) return null;
    return employees.find(e => e.fullName.toLowerCase().trim() === nameToMatch);
  };

  const matchedEmployee = getMatchedEmployee();
  const isEmployeePaid = matchedEmployee ? getIsPaidThisMonth(matchedEmployee.id) : false;
  const employeePaidDetails = matchedEmployee ? getPaidRecordThisMonth(matchedEmployee.id) : null;

  // Handle Save (Add / Edit) Employee Registry
  const handleOpenAddEdit = (emp: EmployeeRecord | null) => {
    clickSound();
    if (emp) {
      setSelectedEmployeeForEdit(emp);
      setFullNameInp(emp.fullName);
      setPositionInp(emp.position);
      setBaseSalaryInp(emp.baseSalary);
      setPhotoUrlInp(emp.photoUrl);
      setGenderInp(emp.gender);
      setEmailInp(emp.email || '');
      setJoinDateInp(emp.joinDate || new Date().toISOString().slice(0, 10));
      setPhoneInp(emp.phone || '');
      setBankNameInp(emp.bankName || 'BCA');
      setAccountNumberInp(emp.accountNumber || '');
    } else {
      setSelectedEmployeeForEdit(null);
      setFullNameInp('');
      setPositionInp('Kasir');
      setBaseSalaryInp(4000000);
      setPhotoUrlInp('');
      setGenderInp('Male');
      setEmailInp('');
      setJoinDateInp(new Date().toISOString().slice(0, 10));
      setPhoneInp('');
      setBankNameInp('BCA');
      setAccountNumberInp('');
    }
    setShowAddEditModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    clickSound();

    if (!fullNameInp.trim() || !positionInp.trim()) {
      toast.error(language === 'id' ? 'Nama lengkap dan jabatan wajib diisi!' : 'Full name and position are required!');
      return;
    }

    if (baseSalaryInp <= 0) {
      toast.error(language === 'id' ? 'Gaji pokok harus bernilai positif!' : 'Base salary must be positive!');
      return;
    }

    let defaultPhoto = photoUrlInp.trim();
    if (!defaultPhoto) {
      defaultPhoto = genderInp === 'Male' 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
    }

    if (selectedEmployeeForEdit) {
      // Execute Edit
      const updated = employees.map(emp => {
        if (emp.id === selectedEmployeeForEdit.id) {
          return {
            ...emp,
            fullName: fullNameInp.trim(),
            position: positionInp.trim(),
            baseSalary: baseSalaryInp,
            photoUrl: defaultPhoto,
            gender: genderInp,
            email: emailInp.trim() || undefined,
            joinDate: joinDateInp,
            phone: phoneInp.trim() || undefined,
            bankName: bankNameInp,
            accountNumber: accountNumberInp.trim() || undefined
          };
        }
        return emp;
      });
      saveEmployeesToStorage(updated);
      toast.success(language === 'id' ? 'Karyawan berhasil diperbarui.' : 'Employee updated successfully.');
      logSystemActivity(`Updated employee profile for "${fullNameInp.trim()}"`);
    } else {
      // Execute New Add
      const newEmp: EmployeeRecord = {
        id: 'emp_' + Date.now(),
        fullName: fullNameInp.trim(),
        position: positionInp.trim(),
        baseSalary: baseSalaryInp,
        photoUrl: defaultPhoto,
        gender: genderInp,
        email: emailInp.trim() || undefined,
        joinDate: joinDateInp,
        phone: phoneInp.trim() || undefined,
        bankName: bankNameInp,
        accountNumber: accountNumberInp.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      saveEmployeesToStorage([...employees, newEmp]);
      toast.success(language === 'id' ? 'Karyawan baru terdaftar.' : 'New employee registered.');
      logSystemActivity(`Registered new employee "${fullNameInp.trim()}"`);
    }

    setShowAddEditModal(false);
    setSelectedEmployeeForEdit(null);
  };

  const handleDeleteEmployee = (empId: string, empName: string) => {
    clickSound();
    if (confirm(language === 'id' ? `Hapus Karyawan "${empName}" dari sistem?` : `Remove Employee "${empName}" from system?`)) {
      const filtered = employees.filter(e => e.id !== empId);
      saveEmployeesToStorage(filtered);
      
      // Also scrub from history of unpaid elements if needed (leaving paid logs for audits)
      toast.success(language === 'id' ? 'Karyawan dilepas dari registry.' : 'Employee removed from registry.');
      logSystemActivity(`Deregistered employee "${empName}"`);
    }
  };

  // Open payout confirmation modal
  const handleOpenPayModal = (emp: EmployeeRecord) => {
    clickSound();
    if (getIsPaidThisMonth(emp.id)) {
      toast.error(language === 'id' ? 'Gaji bulan ini sudah dibayar!' : 'Salary has been paid for this month!');
      return;
    }
    setSelectedEmployeeForPay(emp);
    setSalaryBonus(0);
    setSalaryDeduction(0);
    setPaymentNotes('');
    setPaymentMethod('Transfer Bank');
    setShowPayModal(true);
  };

  const handleConfirmPayout = () => {
    clickSound();
    if (!selectedEmployeeForPay) return;

    const baseAmount = selectedEmployeeForPay.baseSalary;
    const finalCalculatedSum = baseAmount + salaryBonus - salaryDeduction;

    if (finalCalculatedSum < 0) {
      toast.error(language === 'id' ? 'Total pembayaran tidak boleh negatif!' : 'Total payout amount cannot be negative!');
      return;
    }

    const payRecord: SalaryPaymentRecord = {
      employeeId: selectedEmployeeForPay.id,
      employeeName: selectedEmployeeForPay.fullName,
      amount: baseAmount,
      bonus: salaryBonus,
      deduction: salaryDeduction,
      finalAmount: finalCalculatedSum,
      paidAt: new Date().toISOString(),
      paidByOwner: 'System Owner Platform',
      month: currentMonthCode,
      notes: paymentNotes.trim(),
      method: paymentMethod
    };

    const updatedHistory = [...salaryHistory, payRecord];
    saveSalaryHistoryToStorage(updatedHistory);

    // Backward legacy compatibility key updating
    onSalaryPaid();

    // Aesthetics & alerts sound cues
    try {
      playSalaryRewardSound();
    } catch(e) {
      successSound();
    }
    toast.success(
      language === 'id' 
        ? `Sukses! Gaji Rp ${finalCalculatedSum.toLocaleString('id-ID')} telah dikirim ke ${selectedEmployeeForPay.fullName}`
        : `Success! Paid Rp ${finalCalculatedSum.toLocaleString('id-ID')} to ${selectedEmployeeForPay.fullName}`,
      { duration: 4000, icon: '💸' }
    );

    triggerNotification(
      'salary_payment', 
      language === 'id' 
        ? `Gaji ${selectedEmployeeForPay.fullName} bulan ini telah ditransfer!`
        : `Salary payment for ${selectedEmployeeForPay.fullName} has been fully sent!`
    );

    logSystemActivity(`Authorized salary payout of Rp ${finalCalculatedSum.toLocaleString('id-ID')} for "${selectedEmployeeForPay.fullName}" via ${paymentMethod}`);
    
    setShowPayModal(false);
    setSelectedEmployeeForPay(null);
  };

  // Searching filter logic
  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto font-sans text-slate-100">
      
      {/* Outer Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0b081a]/95 border border-violet-500/35 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl h-[90vh] flex flex-col shadow-[0_0_80px_rgba(139,92,246,0.3)] relative overflow-hidden"
      >
        {/* Futuristic Laser Highlight Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <DollarSign size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase font-mono tracking-widest text-violet-400 flex items-center gap-2">
                <span>{language === 'id' ? '💸 Manajemen Keuangan Gaji' : '💸 Salary Asset Management'}</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-bold">
                  {currentMonthCode}
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {language === 'id' 
                  ? 'Transparansi ledger gaji, insentif, pemotongan, dan data registrasi operasional'
                  : 'Transparent payroll ledgering, base salaries, incentives, and structural rosters'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { clickSound(); onClose(); }}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            id="close-salary-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic content scroll wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10 custom-scrollbar">

          {/* ========================================================== */}
          {/* OWNER SUITE PATHWAY */}
          {/* ========================================================== */}
          {userRole === 'Owner' && (
            <>
              {/* Summary Metrics Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-violet-500/20 transition duration-300">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs tracking-wider uppercase font-mono mb-1.5">
                    <Users size={14} className="text-violet-400" />
                    <span>{language === 'id' ? 'Total Karyawan' : 'Active Roster'}</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-white font-mono">{totalEmployeesCount} <span className="text-[10px] font-normal text-slate-400">{language === 'id' ? 'Staff' : 'Staff'}</span></p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:border-violet-500/20 transition duration-300">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs tracking-wider uppercase font-mono mb-1.5">
                    <Banknote size={14} className="text-indigo-400" />
                    <span>{language === 'id' ? 'Target Beban Gaji' : 'Payroll Overhead'}</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-[#6366f1] font-mono">Rp {totalBaseSalaryMonthly.toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-3 sm:p-4 bg-emerald-500/5 transition duration-300">
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] sm:text-xs tracking-wider uppercase font-mono mb-1.5">
                    <CheckCircle2 size={14} />
                    <span>{language === 'id' ? 'Telah Dibayar (Bulan Ini)' : 'Disbursed (This Mo)'}</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">Rp {totalPaidSumThisMonth.toLocaleString('id-ID')}</p>
                  <p className="text-[9px] text-emerald-300/60 font-mono">
                    {totalEmployeesCount - unpaidEmployeesCount} / {totalEmployeesCount} {language === 'id' ? 'Karyawan' : 'Employees'}
                  </p>
                </div>

                <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-3 sm:p-4 bg-amber-500/5 transition duration-300">
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] sm:text-xs tracking-wider uppercase font-mono mb-1.5">
                    <Clock size={14} />
                    <span>{language === 'id' ? 'Belum Dibayar' : 'Outstanding (Unpaid)'}</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-amber-500 font-mono">Rp {totalUnpaidSumThisMonth.toLocaleString('id-ID')}</p>
                  <p className="text-[9px] text-amber-300/60 font-mono">
                    {unpaidEmployeesCount} {language === 'id' ? 'Menunggu Pembayaran' : 'Pending payouts'}
                  </p>
                </div>

              </div>

              {/* Action and Search Rails */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-black/30 p-3 sm:p-4 border border-white/5 rounded-2xl">
                
                {/* Switch view toggle tabs */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => { clickSound(); setActiveHistoryTab(false); }}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                      !activeHistoryTab 
                        ? 'bg-violet-600 font-black text-white' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    📂 {language === 'id' ? 'Daftar Karyawan' : 'Employee Directory'}
                  </button>
                  <button
                    onClick={() => { clickSound(); setActiveHistoryTab(true); }}
                    className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                      activeHistoryTab 
                        ? 'bg-violet-600 font-black text-white' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    📜 {language === 'id' ? 'Riwayat Gaji' : 'Payment History Logs'}
                  </button>
                </div>

                {/* Director Controls / Search box */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  {!activeHistoryTab && (
                    <input
                      type="text"
                      placeholder={language === 'id' ? 'Cari nama atau jabatan...' : 'Search name or job role...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-60 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white"
                    />
                  )}

                  <button
                    onClick={() => handleOpenAddEdit(null)}
                    className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase rounded-xl px-4 py-2.5 transition flex items-center justify-center gap-1 w-full md:w-auto"
                  >
                    <Plus size={14} />
                    <span>{language === 'id' ? 'Tambah Karyawan' : 'Add Employee'}</span>
                  </button>
                </div>

              </div>

              {/* ========================================================== */}
              {/* PRIMARY TAB: ACTIVE DIRECTORY LISTING */}
              {/* ========================================================== */}
              {!activeHistoryTab && (
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                  
                  {filteredEmployees.length === 0 ? (
                    <div className="p-12 text-center">
                      <User size={48} className="mx-auto text-slate-600 mb-3 animate-pulse" />
                      <p className="text-slate-400 text-xs">
                        {language === 'id' ? 'Tidak ada data karyawan ditemukan.' : 'No registered employees match your queries.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-slate-400 font-mono text-[10px] uppercase tracking-widest border-b border-white/5">
                            <th className="p-4">{language === 'id' ? 'PROFIL KARYAWAN' : 'EMPLOYEE PROFILE'}</th>
                            <th className="p-4">{language === 'id' ? 'JABATAN & GENDER' : 'JOB & GENDER'}</th>
                            <th className="p-4">{language === 'id' ? 'GAJI POKOK' : 'BASE SALARY'}</th>
                            <th className="p-4">{language === 'id' ? 'STATUS BULAN INI' : 'THIS MO STATUS'}</th>
                            <th className="p-4 text-right">{language === 'id' ? 'AKSI' : 'ACTIONS'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans">
                          {filteredEmployees.map((emp) => {
                            const isPaid = getIsPaidThisMonth(emp.id);
                            const paidRecord = getPaidRecordThisMonth(emp.id);

                            return (
                              <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                                
                                {/* Photo & Name */}
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <img 
                                        src={emp.photoUrl} 
                                        alt={emp.fullName} 
                                        className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-violet-400 transition"
                                        referrerPolicy="no-referrer"
                                      />
                                      {emp.gender === 'Male' ? (
                                        <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-[8px] text-white p-0.5 rounded-full font-mono font-bold px-1 scale-90">M</div>
                                      ) : (
                                        <div className="absolute -bottom-1 -right-1 bg-fuchsia-500 text-[8px] text-white p-0.5 rounded-full font-mono font-bold px-1 scale-90">F</div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-slate-100 group-hover:text-violet-300 transition">{emp.fullName}</p>
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <Calendar size={10} className="text-slate-500" />
                                        <span>{language === 'id' ? 'Bergabung:' : 'Joined:'} {emp.joinDate}</span>
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Position Details */}
                                <td className="p-4">
                                  <div>
                                    <span className="bg-slate-800 text-slate-200 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono">
                                      {emp.position}
                                    </span>
                                    {emp.phone && (
                                      <p className="text-[10px] text-slate-500 font-mono mt-2">{emp.phone}</p>
                                    )}
                                  </div>
                                </td>

                                {/* Base Salary amount */}
                                <td className="p-4">
                                  <p className="font-bold font-mono text-slate-100 text-xs">
                                    Rp {emp.baseSalary.toLocaleString('id-ID')}
                                  </p>
                                  {emp.bankName && (
                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                      <Building2 size={10} />
                                      <span>{emp.bankName} - {emp.accountNumber || 'N/A'}</span>
                                    </p>
                                  )}
                                </td>

                                {/* Payout monthly status flag */}
                                <td className="p-4">
                                  <AnimatePresence mode="wait">
                                    {isPaid ? (
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10.5px] font-black font-mono uppercase"
                                      >
                                        <CheckCircle2 size={12} className="animate-pulse" />
                                        <span>{language === 'id' ? 'SUDAH DIBAYAR' : 'PAID OUT'}</span>
                                      </motion.span>
                                    ) : (
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-[10.5px] font-black font-mono uppercase"
                                      >
                                        <Clock size={12} className="animate-pulse" />
                                        <span>{language === 'id' ? 'BELUM DIBAYAR' : 'UNPAID'}</span>
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                  {isPaid && paidRecord && (
                                    <p className="text-[9px] text-slate-400 font-mono mt-1">
                                      {paidRecord.method} ({new Date(paidRecord.paidAt).toLocaleDateString()})
                                    </p>
                                  )}
                                </td>

                                {/* Row action utilities */}
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      disabled={isPaid}
                                      onClick={() => handleOpenPayModal(emp)}
                                      className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                                        isPaid
                                          ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                      }`}
                                    >
                                      💸 {language === 'id' ? 'Bayar Gaji' : 'Disburse'}
                                    </button>

                                    <button
                                      onClick={() => handleOpenAddEdit(emp)}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white rounded-lg transition border border-white/5"
                                      title={language === 'id' ? 'Edit data' : 'Edit profile'}
                                    >
                                      <Edit2 size={13} />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                                      className="p-1.5 bg-white/5 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-lg transition border border-white/5"
                                      title={language === 'id' ? 'Hapus karyawan' : 'Delete employee'}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* ========================================================== */}
              {/* SECONDARY TAB: DISBURSED TRANSACTIONS AUDIT HISTORIES */}
              {/* ========================================================== */}
              {activeHistoryTab && (
                <div className="border border-white/5 rounded-2xl p-4 bg-black/25 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest font-mono text-indigo-400 flex items-center gap-2">
                    <Award size={14} />
                    <span>{language === 'id' ? '📜 Jurnal Pencatatan Pengeluaran Gaji' : '📜 Payroll Ledgering & Audits'}</span>
                  </h3>

                  {salaryHistory.length === 0 ? (
                    <div className="p-10 text-center font-mono text-slate-500 text-xs">
                      {language === 'id' ? 'Belum ada catatan riwayat gaji.' : 'No audit trail reports generated.'}
                    </div>
                  ) : (
                    <div className="space-y-3 font-mono">
                      {[...salaryHistory].reverse().map((record, index) => (
                        <div 
                          key={record.employeeId + '_' + record.paidAt + '_' + index}
                          className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-100">{record.employeeName}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 border border-white/10 rounded font-bold uppercase">
                                {record.month}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] space-y-0.5">
                              <p>{language === 'id' ? 'Gaji Pokok:' : 'Base Salary:'} Rp {record.amount.toLocaleString('id-ID')} | {language === 'id' ? 'Bonus:' : 'Bonus:'} +Rp {record.bonus.toLocaleString('id-ID')} | {language === 'id' ? 'Potongan:' : 'Deduction:'} -Rp {record.deduction.toLocaleString('id-ID')}</p>
                              {record.notes && <p className="italic text-slate-500">"{record.notes}"</p>}
                            </div>
                          </div>
                          
                          <div className="md:text-right space-y-1 text-slate-300">
                            <p className="font-bold text-emerald-400 font-mono text-sm leading-none">
                              Rp {record.finalAmount.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center md:justify-end gap-1 font-mono">
                              <CreditCard size={10} className="text-slate-500" />
                              <span>{record.method}</span>
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {new Date(record.paidAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </>
          )}

          {/* ========================================================== */}
          {/* EMPLOYEE PORTAL PATHWAY */}
          {/* ========================================================== */}
          {userRole === 'Employee' && (
            <div className="max-w-xl mx-auto space-y-6">
              
              {!matchedEmployee ? (
                <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-3 font-mono">
                  <User size={36} className="mx-auto text-amber-500 animate-bounce" />
                  <p className="text-xs text-slate-300 font-medium">
                    {language === 'id'
                      ? `Maaf, akun Anda ("${employeeProfile.fullName}") belum terdaftar dalam registrasi gaji Owner.`
                      : `Appologies, your profile name ("${employeeProfile.fullName}") is not registered inside the Owner payroll roster.`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === 'id'
                      ? 'Silakan minta Owner untuk mendaftarkan nama lengkap Anda agar Anda bisa melacak slip gaji Anda.'
                      : 'Please notify the owner to register your exact full name to download slip pay receipts.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Profil Employee Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1242] to-[#0a0518] border border-violet-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-violet-500/40 p-1 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      <img 
                        src={matchedEmployee.photoUrl} 
                        alt={matchedEmployee.fullName} 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <h3 className="text-lg font-black text-white leading-none">{matchedEmployee.fullName}</h3>
                    <p className="text-xs text-violet-400 font-mono mt-1 uppercase tracking-widest">{matchedEmployee.position}</p>
                    
                    <div className="mt-4 flex gap-4 text-xs font-mono text-slate-400 border-t border-white/5 pt-4 w-full justify-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">{language === 'id' ? 'ID KARYAWAN' : 'EMP ID'}</p>
                        <p className="font-bold text-slate-200">{matchedEmployee.id}</p>
                      </div>
                      <div className="w-[1.5px] bg-white/5" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">{language === 'id' ? 'GAJI BULANAN' : 'BASE RATIO'}</p>
                        <p className="font-bold text-emerald-400 font-mono">Rp {matchedEmployee.baseSalary.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Gaji Box with Gorgeous Simulations */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-6">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-mono text-slate-400">
                        {language === 'id' ? '⏳ status pembayaran gaji' : '⏳ pay check envelope'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{currentMonthCode}</p>
                    </div>

                    {isEmployeePaid && employeePaidDetails ? (
                      /* Display detailed breakdown slip if paid out */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4 text-left font-mono"
                      >
                        <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={14} className="animate-bounce" />
                            <span>{language === 'id' ? 'GAJI TELAH DITERIMA ✓' : 'SALARY RECEIVED ✓'}</span>
                          </span>
                          <span className="text-[9px] text-emerald-300 font-mono">
                            {new Date(employeePaidDetails.paidAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs border-b border-white/5 pb-3 font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{language === 'id' ? 'Gaji Pokok:' : 'Base Salary:'}</span>
                            <span className="text-slate-200">Rp {employeePaidDetails.amount.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>{language === 'id' ? 'Bonus Operasional:' : 'Incentive Bonus:'}</span>
                            <span>+Rp {employeePaidDetails.bonus.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-rose-400">
                            <span>{language === 'id' ? 'Potongan / Penalty:' : 'Deductions (late, etc):'}</span>
                            <span>-Rp {employeePaidDetails.deduction.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-end font-bold font-mono">
                          <div>
                            <p className="text-[10px] text-slate-500">{language === 'id' ? 'METODE TRANSAKSI' : 'DISBURSED VIA'}</p>
                            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                              {employeePaidDetails.method === 'Transfer Bank' ? <CreditCard size={12} /> : employeePaidDetails.method === 'QRIS' ? <QrCode size={12} /> : <Banknote size={12} />}
                              <span>{employeePaidDetails.method}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500">{language === 'id' ? 'TOTAL BESIH DITERIMA' : 'TOTAL TAKE-HOME PAY'}</p>
                            <p className="text-lg text-emerald-400 font-black">
                              Rp {employeePaidDetails.finalAmount.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        {employeePaidDetails.notes && (
                          <div className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5 text-[10px] text-slate-400">
                            <span className="font-black block uppercase text-[8px] text-slate-500 mb-0.5">{language === 'id' ? 'CATATAN OWNER:' : 'OWNER MEMO:'}</span>
                            "{employeePaidDetails.notes}"
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      /* Display simple gorgeous simple lock/envelope widget for unpaid */
                      <div className="space-y-4 font-mono">
                        <div className="relative h-24 max-w-[160px] mx-auto flex items-center justify-center">
                          {/* Animated digital envelope bouncing */}
                          <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 p-4 rounded-2xl flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.05)] w-16 h-16"
                          >
                            <Clock size={32} className="animate-spin-slow" />
                          </motion.div>
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-amber-500 font-black text-xs uppercase tracking-widest leading-none">
                            ⏳ {language === 'id' ? 'MENUNGGU TRANSFER OWNER' : 'WAITING FOR PAYCHECK'}
                          </p>
                          <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                            {language === 'id'
                              ? 'Admin sedang mereview log kehadiran & performansi bulanan sebelum menjadwalkan pencairan.'
                              : 'Admin is reviewing attendance reports & logs before scheduler payout dispatch.'}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between bg-black/40 relative z-10 text-xs">
          <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
            {language === 'id' 
              ? 'Enkripsi isolasi ledger karyawan aktif' 
              : 'Isolated corporate ledgering telemetry enabled'}
          </p>
          <button
            onClick={() => { clickSound(); onClose(); }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer font-black text-[10px] sm:text-xs uppercase font-mono border border-white/10"
          >
            {language === 'id' ? 'Tutup Halaman' : 'Close Console'}
          </button>
        </div>

      </motion.div>

      {/* ========================================================== */}
      {/* MODAL WINDOWS: ADD / EDIT EMPLOYEE REGISTRY FORM */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0a1f] border border-violet-500/40 rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 w-full max-w-xl shadow-[0_0_60px_rgba(139,92,246,0.3)] relative overflow-hidden"
            >
              
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <h3 className="text-xs sm:text-sm font-black font-mono uppercase text-violet-400 flex items-center gap-2">
                  <User size={16} />
                  <span>
                    {selectedEmployeeForEdit 
                      ? (language === 'id' ? 'Edit Profil Karyawan' : 'Edit Employee Profile')
                      : (language === 'id' ? 'Tambah Karyawan Baru' : 'Add New Employee')
                    }
                  </span>
                </h3>
                <button
                  onClick={() => { clickSound(); setShowAddEditModal(false); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="space-y-4 font-sans text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'NAMA LENGKAP *' : 'FULL NAME *'}</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      required
                      placeholder="e.g. Budi Santoso"
                      value={fullNameInp}
                      onChange={(e) => setFullNameInp(e.target.value)}
                    />
                  </div>

                  {/* Position / Role */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'JABATAN / ATRIBUSI *' : 'JOB POSITION *'}</label>
                    <select
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      required
                      value={positionInp}
                      onChange={(e) => setPositionInp(e.target.value)}
                    >
                      <option value="Kasir">Kasir</option>
                      <option value="Kasir Utama">Kasir Utama</option>
                      <option value="Staff Gudang">Staff Gudang</option>
                      <option value="Supervisor Cabang">Supervisor Cabang</option>
                      <option value="Admin Keuangan">Admin Keuangan</option>
                      <option value="Kurir">Kurir</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base Salary */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'GAJI POKOK (IDR) *' : 'BASE SALARY (IDR) *'}</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-white outline-none focus:border-violet-500 transition"
                      required
                      value={baseSalaryInp}
                      onChange={(e) => setBaseSalaryInp(Number(e.target.value))}
                    />
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'GENDER' : 'GENDER'}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { clickSound(); setGenderInp('Male'); }}
                        className={`flex-1 py-3 text-xs rounded-xl font-bold border transition ${
                          genderInp === 'Male'
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => { clickSound(); setGenderInp('Female'); }}
                        className={`flex-1 py-3 text-xs rounded-xl font-bold border transition ${
                          genderInp === 'Female'
                            ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Profile Url */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'FOTO PROFILE URL' : 'AVATAR PHOTO URL'}</label>
                    <input
                      type="url"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      placeholder="https://images.unsplash.com/..."
                      value={photoUrlInp}
                      onChange={(e) => setPhotoUrlInp(e.target.value)}
                    />
                  </div>

                  {/* Join Date info */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'TANGGAL BERGABUNG' : 'JOIN DATE'}</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      value={joinDateInp}
                      onChange={(e) => setJoinDateInp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'ALAMAT EMAIL (OPSIONAL)' : 'EMAIL ADDRESS (OPTIONAL)'}</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      placeholder="name@business.com"
                      value={emailInp}
                      onChange={(e) => setEmailInp(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'NOMOR HP / KONTAK' : 'CONTACT PHONE'}</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      placeholder="+62 8..."
                      value={phoneInp}
                      onChange={(e) => setPhoneInp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Name Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'DEPOSIT BANK SALURAN' : 'CLEARING HOUSES BANK'}</label>
                    <select
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 transition"
                      value={bankNameInp}
                      onChange={(e) => setBankNameInp(e.target.value)}
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BRI">BRI (Rakyat Indonesia)</option>
                      <option value="BNI">BNI (Negara Indonesia)</option>
                      <option value="BSI">BSI (Syariah Indonesia)</option>
                      <option value="GoPay/GoTo">GoPay / GoTo Financial</option>
                      <option value="OVO/Dana">OVO / Dana Wallet</option>
                      <option value="Tunai/Cash">Metode Tunai Terbuka</option>
                    </select>
                  </div>

                  {/* Bank Account Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">{language === 'id' ? 'NOMOR REKENING' : 'ACCOUNT NUMBER'}</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-white outline-none focus:border-violet-500 transition"
                      placeholder="e.g. 804257122"
                      value={accountNumberInp}
                      onChange={(e) => setAccountNumberInp(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { clickSound(); setShowAddEditModal(false); }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase rounded-xl transition"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase rounded-xl transition"
                  >
                    💾 {language === 'id' ? 'Simpan Data' : 'Save Employee'}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* MODAL WINDOWS: PAYOUTS INCL. BONUS & DEDUCTION CONFIRMATION */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showPayModal && selectedEmployeeForPay && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c081e] border-2 border-violet-500/50 rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 w-full max-w-lg shadow-[0_0_80px_rgba(139,92,246,0.45)] relative overflow-hidden text-slate-100"
            >
              
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Banknote size={16} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black font-mono uppercase text-emerald-400">
                    {language === 'id' ? 'Konfirmasi Payout Gaji' : 'Confirm Payroll Dispatch'}
                  </h3>
                </div>
                <button
                  onClick={() => { clickSound(); setShowPayModal(false); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Employee Quick Info Card */}
              <div className="mb-4 bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-center gap-3 font-mono">
                <img 
                  src={selectedEmployeeForPay.photoUrl} 
                  alt={selectedEmployeeForPay.fullName} 
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-100">{selectedEmployeeForPay.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-sans uppercase mt-0.5">{selectedEmployeeForPay.position}</p>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                
                {/* Fixed Base Salary display */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{language === 'id' ? 'GAJI POKOK BULANAN (READ-ONLY)' : 'MONTHLY BASE SALARY (READ-ONLY)'}</span>
                  <div className="p-3 bg-white/5 rounded-xl text-slate-300 font-bold text-xs">
                    Rp {selectedEmployeeForPay.baseSalary.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Bonus incentive Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] text-emerald-400 font-bold uppercase">{language === 'id' ? '+ BONUS / INSENTIF' : '+ BONUS ACCRUED'}</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl font-mono text-xs text-emerald-300 outline-none focus:border-emerald-500"
                      value={salaryBonus}
                      onChange={(e) => setSalaryBonus(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                    />
                  </div>

                  {/* Deduction penalty Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] text-rose-400 font-bold uppercase">{language === 'id' ? '- POTONGAN / TERLAMBAT' : '- DEDUCTIONS (ABSENCE)'}</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl font-mono text-xs text-rose-300 outline-none focus:border-rose-500"
                      value={salaryDeduction}
                      onChange={(e) => setSalaryDeduction(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Payment Method Radio / Select */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">{language === 'id' ? 'SALURAN PEMBAYARAN' : 'TRANSACTION PATHWAY'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Transfer Bank', 'Tunai', 'QRIS'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { clickSound(); setPaymentMethod(m); }}
                        className={`py-2 text-[10px] rounded-lg font-bold border transition flex flex-col items-center justify-center gap-1 uppercase tracking-wider ${
                          paymentMethod === m
                            ? 'bg-violet-600/15 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {m === 'Transfer Bank' ? <CreditCard size={14} /> : m === 'QRIS' ? <QrCode size={14} /> : <Banknote size={14} />}
                        <span>{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Memo */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] text-slate-400 font-bold uppercase">{language === 'id' ? 'CATATAN TRANSFER' : 'PAYROLL INVOICE MEMO'}</label>
                  <textarea
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500 h-16 resize-none"
                    placeholder="e.g. Pembayaran Gaji Bersih Mei 2026 + Lembur Shift Malam"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                {/* Realtime net pay preview receipt card */}
                <div className="p-4 bg-gradient-to-r from-[#110129] to-black border border-violet-500/30 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>{language === 'id' ? 'PERHITUNGAN:' : 'SUB-OVERHEAD:'}</span>
                    <span>
                      {selectedEmployeeForPay.baseSalary.toLocaleString('id-ID')} + {salaryBonus.toLocaleString('id-ID')} - {salaryDeduction.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 font-mono">
                    <span className="font-extrabold text-[#22d3ee] flex items-center gap-1 uppercase text-[10px]">
                      <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                      <span>{language === 'id' ? 'TOTAL TAKE-HOME PAY' : 'TOTAL TAKE-HOME PAY'}</span>
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                      Rp {(selectedEmployeeForPay.baseSalary + salaryBonus - salaryDeduction).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Execute Confirm Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => { clickSound(); setShowPayModal(false); }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase rounded-xl transition"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayout}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-[10px] uppercase rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    💸 {language === 'id' ? 'Konfirmasi Payout' : 'Authorize Payout'}
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
