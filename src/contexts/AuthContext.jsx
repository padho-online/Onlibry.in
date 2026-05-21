// src/contexts/AuthContext.jsx
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
import { logUserLogin, logUserSync } from '../services/loggerService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState(null);
  const [savedFiles, setSavedFiles] = useState([]);

  const googleProvider = new GoogleAuthProvider();

  // Check subscription directly from Firestore
  const checkUserSubscription = async (userId) => {
    if (!userId) {
      setIsSubscribed(false);
      setSubscriptionType(null);
      return false;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const subscription = userData.subscription || {};
        
        console.log('📊 Checking subscription for user:', userId);
        
        // Check if subscription is active and not expired
        if (subscription.isActive === true && subscription.endDate) {
          let endDate;
          if (subscription.endDate.toDate) {
            endDate = subscription.endDate.toDate();
          } else {
            endDate = new Date(subscription.endDate);
          }
          
          // Check if endDate is valid
          if (isNaN(endDate.getTime())) {
            console.log('⚠️ Invalid end date format');
            setIsSubscribed(false);
            setSubscriptionType(null);
            return false;
          }
          
          const now = new Date();
          
          if (endDate > now) {
            setIsSubscribed(true);
            setSubscriptionType(subscription.type || 'monthly');
            localStorage.setItem('isSubscribed', 'true');
            localStorage.setItem('subscriptionType', subscription.type || 'monthly');
            console.log('✅ User is subscribed until:', endDate);
            return true;
          } else {
            console.log('⚠️ Subscription expired on:', endDate);
          }
        }
      }
      
      setIsSubscribed(false);
      setSubscriptionType(null);
      localStorage.setItem('isSubscribed', 'false');
      localStorage.removeItem('subscriptionType');
      return false;
      
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
      setSubscriptionType(null);
      return false;
    }
  };

  // Sync user to Google Sheet Logs
  const syncUserToSheet = async (firebaseUser) => {
    if (!firebaseUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const subscription = userData.subscription || {};
      
      await logUserSync({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        photoURL: firebaseUser.photoURL || '',
        isAdmin: userData.isAdmin || false,
        isBanned: userData.isBanned || false,
        subscriptionType: subscription.isActive ? (subscription.type || 'free') : 'free',
        subscriptionEnd: subscription.isActive ? (subscription.endDate || null) : null
      });
      console.log('👤 User synced to Sheet:', firebaseUser.email);
    } catch (error) {
      console.error('Error syncing user to sheet:', error);
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
          purchasedFiles: [],
          purchasedMockTests: [],
          purchasedQuizzes: [],
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

      await checkUserSubscription(firebaseUser.uid);
      
      // Sync user to Google Sheet Logs
      await syncUserToSheet(firebaseUser);

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
      localStorage.removeItem('subscriptionType');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update subscription (for admin/payment)
  const updateSubscription = async (userId, planType, durationInDays) => {
    console.log('📝 updateSubscription called with:', { userId, planType, durationInDays });
    
    if (!userId) {
      console.error('❌ No userId provided');
      return { success: false, error: 'No userId provided' };
    }
    
    // 🔥 FIX: Ensure planType is a string
    let finalPlanType = 'monthly'; // default fallback
    let finalDuration = 30; // default fallback
    
    if (planType && typeof planType === 'string' && planType !== 'undefined') {
      if (planType.toLowerCase().includes('yearly') || planType.toLowerCase().includes('annual')) {
        finalPlanType = 'yearly';
        finalDuration = 365;
      } else if (planType.toLowerCase().includes('monthly')) {
        finalPlanType = 'monthly';
        finalDuration = 30;
      } else if (planType.toLowerCase().includes('weekly')) {
        finalPlanType = 'weekly';
        finalDuration = 7;
      } else {
        finalPlanType = planType.toLowerCase();
      }
    }
    
    // Use durationDays if provided and valid
    if (durationInDays && !isNaN(parseInt(durationInDays))) {
      finalDuration = parseInt(durationInDays);
      if (finalDuration === 365) finalPlanType = 'yearly';
      else if (finalDuration === 30) finalPlanType = 'monthly';
      else if (finalDuration === 7) finalPlanType = 'weekly';
    }
    
    console.log('📝 Processed plan:', { finalPlanType, finalDuration });
    
    // Validate final values
    if (!finalPlanType || finalPlanType === 'undefined') {
      console.error('❌ Invalid planType:', finalPlanType);
      return { success: false, error: 'Invalid plan type' };
    }
    
    if (isNaN(finalDuration) || finalDuration <= 0) {
      console.error('❌ Invalid duration:', finalDuration);
      finalDuration = 30;
    }
    
    try {
      // Calculate end date
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + finalDuration);
      
      // Validate dates
      if (isNaN(now.getTime()) || isNaN(endDate.getTime())) {
        console.error('❌ Invalid date calculation');
        return { success: false, error: 'Invalid date calculation' };
      }
      
      const endDateISO = endDate.toISOString();
      console.log('📝 Start date:', now.toISOString());
      console.log('📝 End date:', endDateISO);
      
      const userRef = doc(db, 'users', userId);
      
      const updateData = {
        subscription: {
          type: finalPlanType,
          startDate: serverTimestamp(),
          endDate: endDateISO,
          isActive: true,
        },
        purchasedMockTests: 'all',
        purchasedQuizzes: 'all',
        lastSubscriptionAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Updating Firestore with:', updateData);
      await setDoc(userRef, updateData, { merge: true });
      console.log('✅ Firestore update successful');
      
      // Update local state
      setIsSubscribed(true);
      setSubscriptionType(finalPlanType);
      localStorage.setItem('isSubscribed', 'true');
      localStorage.setItem('subscriptionType', finalPlanType);
      
      // Get current user and sync to sheet
      const currentUser = auth.currentUser;
      if (currentUser) {
        await syncUserToSheet(currentUser);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Force refresh subscription status
  const refreshSubscription = async () => {
    if (user) {
      return await checkUserSubscription(user.uid);
    }
    return false;
  };

  // Auth state listener
  useEffect(() => {
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
        
        // Sync user to Google Sheet Logs on auth state change
        await syncUserToSheet(currentUser);
      } else {
        setIsSubscribed(false);
        setSubscriptionType(null);
        setSavedFiles([]);
        localStorage.setItem('isSubscribed', 'false');
        localStorage.removeItem('subscriptionType');
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
        refreshSubscription,
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