import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
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
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load banners with real-time updates
  useEffect(() => {
    const q = query(collection(db, 'banner'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bannersData = [];
      querySnapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() });
      });
      setBanners(bannersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading banners:', error);
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

  // Add new banner
  const addBanner = async (bannerData) => {
    try {
      const data = {
        type: bannerData.type,
        content: bannerData.content || '',
        active: bannerData.active !== false,
        createdAt: new Date().toISOString()
      };

      // If image file is provided, convert to base64
      if (bannerData.imageFile) {
        data.imageData = await fileToBase64(bannerData.imageFile);
      }

      // If video file is provided, convert to base64
      if (bannerData.videoFile) {
        data.videoData = await fileToBase64(bannerData.videoFile);
      }

      await addDoc(collection(db, 'banner'), data);
      return { success: true };
    } catch (error) {
      console.error('Error adding banner:', error);
      return { success: false, message: error.message };
    }
  };

  // Delete banner
  const deleteBanner = async (id) => {
    try {
      await deleteDoc(doc(db, 'banner', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting banner:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    banners,
    loading,
    addBanner,
    deleteBanner
  };

  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
};