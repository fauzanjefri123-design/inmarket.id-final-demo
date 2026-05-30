import { db, auth } from './firebase';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, runTransaction, getDoc, query, where
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// TYPED INTERFACES
export interface ExpenseInput {
  category: 'Listrik' | 'Air' | 'Wifi' | 'Sewa' | 'Beli Stock' | 'Gaji' | 'Pajak' | 'Lainnya';
  amount: number;
  date: string;
  notes: string;
}

export interface ExpenseRecord extends ExpenseInput {
  id: string;
  ownerId: string;
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
  totalSpent: number;
  points: number;
  memberLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  shoppingHistory: { id: string; date: string; amount: number; items: string }[];
  cashbackBalance: number;
}

export interface CustomerRecord extends CustomerInput {
  id: string;
  ownerId: string;
  createdAt: string;
}

export interface WalletTransactionInput {
  id: string;
  type: 'in' | 'out';
  amount: number;
  method: string;
  status: 'Pending' | 'Success' | 'Failed';
  date?: string;
  accountName: string;
  paymentNumber: string;
  notes?: string;
  proofUrl?: string;
}

export interface WalletRecord {
  userId: string;
  balance: number;
  transactions: WalletTransactionInput[];
}

export interface LoginLogInput {
  device: string;
  ip: string;
  status: string;
}

export interface LoginLogRecord extends LoginLogInput {
  id: string;
  userId: string;
  timestamp: string;
}

export interface AttendanceInput {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  status: string;
  method: string;
  codeUsed: string;
  date: string;
  time: string;
}

export interface AttendanceRecord extends AttendanceInput {
  id: string;
  ownerId: string;
  timestamp: string;
}

export interface ChatMessageInput {
  sender: string;
  text: string;
  time: string;
  file: any;
}

export interface ChatMessageRecord extends ChatMessageInput {
  id: string;
  spaceId: string;
  createdAt?: string;
}

// EXPENSES INTERACTION
export function getExpenses(ownerId: string, onUpdate: (data: ExpenseRecord[]) => void, onError?: (err: any) => void) {
  if (!ownerId || ownerId.includes('offline')) { onUpdate([]); return () => {}; }
  const path = 'expenses';
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const expensesList: ExpenseRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        expensesList.push({ id: docSnap.id, ...data } as ExpenseRecord);
      });
      // Sort expenses by date descending
      expensesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(expensesList);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function addExpense(ownerId: string, expense: ExpenseInput) {
  if (!ownerId || ownerId.includes('offline')) return 'local-expense-' + Date.now();
  const path = 'expenses';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...expense,
      ownerId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteExpense(ownerId: string, expenseId: string) {
  if (!ownerId || ownerId.includes('offline')) return;
  const path = `expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// CUSTOMERS INTERACTION
export function getCustomers(ownerId: string, onUpdate: (data: CustomerRecord[]) => void, onError?: (err: any) => void) {
  if (!ownerId || ownerId.includes('offline')) { onUpdate([]); return () => {}; }
  const path = 'customers';
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const customersList: CustomerRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        customersList.push({ id: docSnap.id, ...data } as CustomerRecord);
      });
      onUpdate(customersList);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function addCustomer(ownerId: string, customer: CustomerInput) {
  if (!ownerId || ownerId.includes('offline')) return 'local-customer-' + Date.now();
  const path = 'customers';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...customer,
      ownerId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCustomer(ownerId: string, customerId: string, latestData: Partial<CustomerInput>) {
  if (!ownerId || ownerId.includes('offline')) return;
  const path = `customers/${customerId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId), latestData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomer(ownerId: string, customerId: string) {
  if (!ownerId || ownerId.includes('offline')) return;
  const path = `customers/${customerId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// WALLET INTERACTION
export function getWalletData(userId: string, onUpdate: (data: WalletRecord) => void, onError?: (err: any) => void) {
  if (!userId || userId.includes('offline')) {
    onUpdate({ userId, balance: 0, transactions: [] });
    return () => {};
  }
  const path = `wallets/${userId}`;
  return onSnapshot(
    doc(db, 'wallets', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as WalletRecord);
      } else {
        onUpdate({ userId, balance: 0, transactions: [] });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateWalletBalance(userId: string, deltaAmount: number, newTx: WalletTransactionInput) {
  if (!userId || userId.includes('offline')) return;
  const path = `wallets/${userId}`;
  const walletRef = doc(db, 'wallets', userId);
  try {
    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      let currentBalance = 0;
      let transactionsList: WalletTransactionInput[] = [];
      
      if (walletDoc.exists()) {
        const data = walletDoc.data() as WalletRecord;
        currentBalance = data.balance || 0;
        transactionsList = data.transactions || [];
      }
      
      const updatedBalance = currentBalance + deltaAmount;
      const updatedTx = { ...newTx, date: new Date().toLocaleString() };
      
      transaction.set(walletRef, {
        userId,
        balance: updatedBalance,
        transactions: [updatedTx, ...transactionsList]
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// LOGIN LOGS INTERACTION
export function getLoginLogs(userId: string, onUpdate: (data: LoginLogRecord[]) => void, onError?: (err: any) => void) {
  if (!userId || userId.includes('offline')) { onUpdate([]); return () => {}; }
  const path = 'loginLogs';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const logsList: LoginLogRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logsList.push({ id: docSnap.id, ...data } as LoginLogRecord);
      });
      // Sort logs by timestamp descending
      logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(logsList);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function addLoginLog(userId: string, log: LoginLogInput) {
  if (!userId || userId.includes('offline')) return 'local-login-log-' + Date.now();
  const path = 'loginLogs';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...log,
      userId,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ATTENDANCE INTERACTION
export async function addAttendanceEntry(ownerId: string, attendance: AttendanceInput) {
  if (!ownerId || ownerId.includes('offline') || attendance.employeeId?.includes('offline')) return 'local-attendance-' + Date.now();
  const path = 'attendance';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...attendance,
      ownerId,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// CHAT INTERACTION
export function getChatMessages(spaceId: string, onUpdate: (data: ChatMessageRecord[]) => void, onError?: (err: any) => void) {
  if (!spaceId || spaceId.includes('offline')) { onUpdate([]); return () => {}; }
  const path = 'chats';
  const q = query(collection(db, path), where('spaceId', '==', spaceId));
  return onSnapshot(
    q,
    (snapshot) => {
      const messagesList: ChatMessageRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messagesList.push({ id: docSnap.id, ...data } as ChatMessageRecord);
      });
      // Sort by createdAt ascending for chat
      messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(messagesList);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function addChatMessage(spaceId: string, message: ChatMessageInput) {
  if (!spaceId || spaceId.includes('offline')) return 'local-chat-' + Date.now();
  const path = 'chats';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...message,
      spaceId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
