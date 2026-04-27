import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
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
import { logUserLogin } from '../services/loggerService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState(null);

  // ✅ Saved Files State
  const [savedFiles, setSavedFiles] = useState([]);

  const googleProvider = new GoogleAuthProvider();

  // =========================
  // GOOGLE SIGN IN
  // =========================
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email.split('@')[0],
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

        if (
          userData.subscription?.isActive &&
          userData.subscription?.endDate
        ) {
          const endDate =
            userData.subscription.endDate.toDate();

          if (endDate > new Date()) {
            setIsSubscribed(true);
            setSubscriptionType(
              userData.subscription.type
            );
          }
        }
      }

      return {
        success: true,
        user: firebaseUser,
      };
    } catch (error) {
      console.error('Google sign-in error:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      await signOut(auth);

      setIsSubscribed(false);
      setSubscriptionType(null);
      setSavedFiles([]);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  };

  // =========================
  // CHECK SUBSCRIPTION
  // =========================
  const checkSubscription = async (userId) => {
    try {
      const userDoc = await getDoc(
        doc(db, 'users', userId)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        if (
          data.subscription?.isActive &&
          data.subscription?.endDate
        ) {
          const endDate =
            data.subscription.endDate.toDate();

          if (endDate > new Date()) {
            setIsSubscribed(true);
            setSubscriptionType(
              data.subscription.type
            );
            return true;
          }
        }
      }

      setIsSubscribed(false);
      setSubscriptionType(null);
      return false;
    } catch (error) {
      console.error(
        'Error checking subscription:',
        error
      );
      return false;
    }
  };

  // =========================
  // UPDATE SUBSCRIPTION
  // =========================
  const updateSubscription = async (
    userId,
    planType,
    durationInDays
  ) => {
    try {
      const endDate = new Date();
      endDate.setDate(
        endDate.getDate() + durationInDays
      );

      await setDoc(
        doc(db, 'users', userId),
        {
          subscription: {
            type: planType,
            startDate: serverTimestamp(),
            endDate: endDate,
            isActive: true,
          },
        },
        { merge: true }
      );

      setIsSubscribed(true);
      setSubscriptionType(planType);

      return { success: true };
    } catch (error) {
      console.error(
        'Error updating subscription:',
        error
      );

      return {
        success: false,
        error: error.message,
      };
    }
  };

  // =========================
  // AUTH STATE LISTENER
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          // ✅ Log user login
          logUserLogin(currentUser);

          const userDoc = await getDoc(
            doc(db, 'users', currentUser.uid)
          );

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSavedFiles(
              userData.savedFiles || []
            );
          } else {
            setSavedFiles([]);
          }

          await checkSubscription(
            currentUser.uid
          );
        } else {
          setIsSubscribed(false);
          setSubscriptionType(null);
          setSavedFiles([]);
        }

        setLoading(false);
      }
    );

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
        checkSubscription,
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
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}