import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { verifyOfflineSessionSignature } from '../lib/validation';
import { getPartitionedKey } from '../lib/utils';

interface UserData {
  role: 'Owner' | 'Employee' | 'Guest' | '';
  email: string;
  businessId?: string;
  ownerId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  authLoading: boolean;
  refreshAuth: () => void;
  hasBusiness: boolean;
  setHasBusiness: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  authLoading: true,
  refreshAuth: () => {},
  hasBusiness: false,
  setHasBusiness: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [hasBusiness, setHasBusiness] = useState(false);

  const refreshAuth = () => {
    setRefreshToggle(prev => prev + 1);
  };

  useEffect(() => {
    const businessKey = getPartitionedKey('inmarket_business', true);
    const businessData = localStorage.getItem(businessKey);
    if (businessData) {
      setHasBusiness(true);
    } else {
      setHasBusiness(false);
    }
  }, [userData]);

  // 30 Minutes Inactivity Timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastResetTime = 0;

    const resetTimeout = (event?: Event) => {
      const now = Date.now();
      // Throttle high-frequency events (like mousemove and scroll) to once per 5 seconds
      if (event && (event.type === 'mousemove' || event.type === 'scroll')) {
        if (now - lastResetTime < 5000) {
          return;
        }
      }
      lastResetTime = now;

      if (timeoutId) clearTimeout(timeoutId);
      // Auto logout after 30 minutes of inactivity
      timeoutId = setTimeout(() => {
        if (auth.currentUser || localStorage.getItem('offline_logged_in_user')) {
          console.log('Session expired due to 30 minutes of inactivity. Logging out...');
          localStorage.removeItem('offline_logged_in_user');
          localStorage.removeItem('inmarket_cached_user_uid');
          if (auth.currentUser) {
            signOut(auth).then(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
      }, 30 * 60 * 1000); 
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  useEffect(() => {
    // Listen to local changes (e.g. login/logout in tabs)
    const handleStorage = () => {
      const offlineUserStr = localStorage.getItem('offline_logged_in_user');
      if (offlineUserStr && !auth.currentUser) {
        try {
          const u = JSON.parse(offlineUserStr);
          if (!verifyOfflineSessionSignature(u)) {
            localStorage.removeItem('offline_logged_in_user');
            setUserData(null);
            return;
          }
          setUserData({
            role: u.role === 'Employee' || u.role === 'Karyawan' ? 'Employee' : (u.role === 'Guest' ? 'Guest' : 'Owner'),
            email: u.email || '',
            businessId: u.businessId || 'bus_offline_' + (u.email ? u.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default'),
            ownerId: u.ownerId || (u.uid || 'owner_offline_default')
          });
        } catch (e) {
          setUserData(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    const checkStatus = async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        // Cache online user uid to prevent race condition during session restore
        localStorage.setItem('inmarket_cached_user_uid', user.uid);
        try {
          await user.getIdToken(false);
        } catch (e) {
          console.error("Token might be expired", e);
          localStorage.removeItem('inmarket_cached_user_uid');
          await signOut(auth);
          setCurrentUser(null);
          setUserData(null);
          setAuthLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const mappedRole = data.role === 'owner' ? 'Owner' : (data.role === 'employee' ? 'Employee' : 'Guest');
            setUserData({
              role: mappedRole,
              email: data.email || user.email || '',
              businessId: data.businessId || 'bus_' + user.uid,
              ownerId: data.ownerId || user.uid,
            });
            localStorage.setItem('inmarket_user_role', mappedRole);
          } else {
            setUserData({ role: 'Guest', email: user.email || '' });
            localStorage.setItem('inmarket_user_role', 'Guest');
          }
        } catch (error: any) {
          const isOfflineError = error.message?.includes('offline') || error.code === 'unavailable';
          if (!isOfflineError) {
            console.error("Error fetching user data:", error);
          }
          
          const offlineUserStr = localStorage.getItem('offline_logged_in_user');
          if (offlineUserStr) {
            try {
              const u = JSON.parse(offlineUserStr);
              if (u.email === user.email || u.uid === user.uid) {
                const mappedRole = u.role === 'Employee' || u.role === 'Karyawan' ? 'Employee' : (u.role === 'Guest' ? 'Guest' : 'Owner');
                setUserData({
                  role: mappedRole,
                  email: u.email || user.email || '',
                  businessId: u.businessId || 'bus_' + user.uid,
                  ownerId: u.ownerId || user.uid,
                });
                localStorage.setItem('inmarket_user_role', mappedRole);
                setAuthLoading(false);
                return;
              }
            } catch (e) {
              console.warn("Offline user fallback failed", e);
            }
          }

          setUserData({ role: 'Guest', email: user.email || '' });
          localStorage.setItem('inmarket_user_role', 'Guest');
        }
      } else {
        localStorage.removeItem('inmarket_cached_user_uid');
        const offlineUserStr = localStorage.getItem('offline_logged_in_user');
        if (offlineUserStr) {
          try {
            const u = JSON.parse(offlineUserStr);
            if (!verifyOfflineSessionSignature(u)) {
              localStorage.removeItem('offline_logged_in_user');
              setUserData(null);
            } else {
              const mappedRole = u.role === 'Employee' || u.role === 'Karyawan' ? 'Employee' : (u.role === 'Guest' ? 'Guest' : 'Owner');
              setUserData({
                role: mappedRole,
                email: u.email || '',
                businessId: u.businessId || 'bus_offline_' + (u.email ? u.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default'),
                ownerId: u.ownerId || (u.uid || 'owner_offline_default')
              });
              localStorage.setItem('inmarket_user_role', mappedRole);
            }
          } catch (e) {
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      }
      setAuthLoading(false);
    };

    // Run initial offline check if not already loading via Firebase
    if (!auth.currentUser) {
      const offlineUserStr = localStorage.getItem('offline_logged_in_user');
      if (offlineUserStr) {
        try {
          const u = JSON.parse(offlineUserStr);
          if (verifyOfflineSessionSignature(u)) {
            const mappedRole = u.role === 'Employee' || u.role === 'Karyawan' ? 'Employee' : (u.role === 'Guest' ? 'Guest' : 'Owner');
            setUserData({
              role: mappedRole,
              email: u.email || '',
              businessId: u.businessId || 'bus_offline_' + (u.email ? u.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default'),
              ownerId: u.ownerId || (u.uid || 'owner_offline_default')
            });
            localStorage.setItem('inmarket_user_role', mappedRole);
            setAuthLoading(false);
          }
        } catch (e) {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, checkStatus);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshToggle]);


  return (
    <AuthContext.Provider value={{ currentUser, userData, authLoading, refreshAuth, hasBusiness, setHasBusiness }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
