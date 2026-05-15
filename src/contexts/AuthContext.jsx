// src/contexts/AuthContext.jsx
// UPDATED - Fixed subscription update with proper error handling
// ADDED - Better subscription verification and debugging

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
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { logUserLogin, setCurrentUserGetter } from '../services/loggerService';

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
        console.log('📊 Subscription data:', subscription);
        
        // Check if subscription is active and not expired
        if (subscription.isActive === true && subscription.endDate) {
          let endDate;
          if (subscription.endDate.toDate) {
            endDate = subscription.endDate.toDate();
          } else {
            endDate = new Date(subscription.endDate);
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
        } else {
          console.log('⚠️ No active subscription found');
        }
      } else {
        console.log('⚠️ User document not found');
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

      // Check subscription
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
      localStorage.removeItem('subscriptionType');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update subscription (for admin/payment)
  // 🔥 FIXED: Better error handling and verification
  const updateSubscription = async (userId, planType, durationInDays) => {
    console.log('📝 Updating subscription for user:', userId);
    console.log('📝 Plan Type:', planType);
    console.log('📝 Duration Days:', durationInDays);
    
    if (!userId) {
      console.error('❌ No userId provided');
      return { success: false, error: 'No userId provided' };
    }
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationInDays);
      const endDateISO = endDate.toISOString();
      
      console.log('📝 Subscription end date:', endDateISO);
      
      const userRef = doc(db, 'users', userId);
      
      // First, get current user data to merge properly
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      
      // Update subscription data
      const updateData = {
        subscription: {
          type: planType,
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
      setSubscriptionType(planType);
      localStorage.setItem('isSubscribed', 'true');
      localStorage.setItem('subscriptionType', planType);
      
      // Verify the update
      const verifyDoc = await getDoc(userRef);
      const verifiedData = verifyDoc.data();
      console.log('✅ Verified subscription data:', verifiedData?.subscription);
      
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