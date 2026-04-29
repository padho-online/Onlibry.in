import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { logUserLogin, setCurrentUserGetter } from '../services/loggerService';
import { checkSubscriptionStatus } from '../services/cloudFunctions';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState(null);
  const [savedFiles, setSavedFiles] = useState([]);

  const googleProvider = new GoogleAuthProvider();

  // Check subscription via Cloud Function
  const checkUserSubscription = async (userId) => {
    try {
      const result = await checkSubscriptionStatus();
      setIsSubscribed(result.isSubscribed);
      setSubscriptionType(result.subscriptionType);
      localStorage.setItem('isSubscribed', result.isSubscribed ? 'true' : 'false');
      return result.isSubscribed;
    } catch (error) {
      console.error('Error checking subscription via cloud:', error);
      
      // Fallback to Firestore direct check
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.subscription?.isActive && data.subscription?.endDate) {
            const endDate = data.subscription.endDate.toDate?.() || new Date(data.subscription.endDate);
            if (endDate > new Date()) {
              setIsSubscribed(true);
              setSubscriptionType(data.subscription.type);
              localStorage.setItem('isSubscribed', 'true');
              return true;
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback subscription check failed:', fallbackError);
      }
      
      setIsSubscribed(false);
      setSubscriptionType(null);
      localStorage.setItem('isSubscribed', 'false');
      return false;
    }
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          createdAt: serverTimestamp(),
          savedFiles: [],
          subscription: {
            type: 'free',
            startDate: null,
            endDate: null,
            isActive: false,
          },
        });
        setSavedFiles([]);
      } else {
        const userData = userDoc.data();
        setSavedFiles(userData.savedFiles || []);
      }

      // Check subscription via cloud function
      await checkUserSubscription(firebaseUser.uid);

      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setIsSubscribed(false);
      setSubscriptionType(null);
      setSavedFiles([]);
      localStorage.setItem('isSubscribed', 'false');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update subscription (for admin/payment)
  const updateSubscription = async (userId, planType, durationInDays) => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationInDays);

      await setDoc(doc(db, 'users', userId), {
        subscription: {
          type: planType,
          startDate: serverTimestamp(),
          endDate: endDate,
          isActive: true,
        },
      }, { merge: true });

      setIsSubscribed(true);
      setSubscriptionType(planType);
      localStorage.setItem('isSubscribed', 'true');

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Auth state listener
  useEffect(() => {
    setCurrentUserGetter(() => auth.currentUser);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        console.log('✅ User logged in:', currentUser.email);
        await logUserLogin(currentUser);
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSavedFiles(userData.savedFiles || []);
        }
        
        await checkUserSubscription(currentUser.uid);
      } else {
        setIsSubscribed(false);
        setSubscriptionType(null);
        setSavedFiles([]);
        localStorage.setItem('isSubscribed', 'false');
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSubscribed,
        subscriptionType,
        savedFiles,
        setSavedFiles,
        loginWithGoogle,
        logout,
        checkSubscription: checkUserSubscription,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}