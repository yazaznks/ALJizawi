import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

const BannerContext = createContext();

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within BannerProvider');
  }
  return context;
};

export const BannerProvider = ({ children }) => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load banner with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'banner', 'main'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setBanner({ id: docSnapshot.id, ...docSnapshot.data() });
      } else {
        setBanner(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading banner:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save/update banner
  const saveBanner = async (bannerData) => {
    try {
      await setDoc(doc(db, 'banner', 'main'), {
        type: bannerData.type,
        content: bannerData.content,
        active: bannerData.active !== false
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving banner:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    banner,
    loading,
    saveBanner
  };

  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
};