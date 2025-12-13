import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check if user profile exists, create if not
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create new user profile
          const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
          if (allowedDomain && !user.email.endsWith(`@${allowedDomain}`)) {
            await signOut(auth);
            alert(`Only emails from @${allowedDomain} are allowed.`);
            return;
          }
          
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isTeacher: false,
            createdAt: new Date(),
            stats: {
              booksRead: 0,
              reviewsWritten: 0,
              totalPages: 0,
            },
          });
        }
        
        const profileData = userSnap.exists() 
          ? userSnap.data() 
          : (await getDoc(userRef)).data();
        setUserProfile(profileData);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    signInWithGoogle,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

