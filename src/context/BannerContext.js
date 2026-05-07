import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  doc,
  setDoc,
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Save/update banner
  const saveBanner = async (bannerData) => {
    try {
      const data = {
        type: bannerData.type,
        content: bannerData.content,
        active: bannerData.active !== false
      };

      // If image file is provided, convert to base64
      if (bannerData.imageFile) {
        data.imageData = await fileToBase64(bannerData.imageFile);
      }

      await setDoc(doc(db, 'banner', 'main'), data);
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
