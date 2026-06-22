import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const OfferContext = createContext();

export const useOffers = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffers must be used within OfferProvider');
  }
  return context;
};

export const OfferProvider = ({ children }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load offers with real-time updates
  useEffect(() => {
    const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const offersData = [];
      querySnapshot.forEach((doc) => {
        offersData.push({ id: doc.id, ...doc.data() });
      });
      setOffers(offersData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading offers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new offer
  const addOffer = async (offerData) => {
    try {
      const data = {
        buyProductId: offerData.buyProductId,
        buyQuantity: parseInt(offerData.buyQuantity) || 1,
        buyProductSize: offerData.buyProductSize || '',
        getProductId: offerData.getProductId,
        getPrice: parseFloat(offerData.getPrice) || 0,
        getProductSize: offerData.getProductSize || '',
        getLimit: parseInt(offerData.getLimit) || 0,
        active: offerData.active !== false,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'offers'), data);
      return { success: true };
    } catch (error) {
      console.error('Error adding offer:', error);
      return { success: false, message: error.message };
    }
  };

  // Update offer
  const updateOffer = async (id, offerData) => {
    try {
      const data = {
        buyProductId: offerData.buyProductId,
        buyQuantity: parseInt(offerData.buyQuantity) || 1,
        buyProductSize: offerData.buyProductSize || '',
        getProductId: offerData.getProductId,
        getPrice: parseFloat(offerData.getPrice) || 0,
        getProductSize: offerData.getProductSize || '',
        getLimit: parseInt(offerData.getLimit) || 0,
        active: offerData.active !== false
      };

      await updateDoc(doc(db, 'offers', id), data);
      return { success: true };
    } catch (error) {
      console.error('Error updating offer:', error);
      return { success: false, message: error.message };
    }
  };

  // Delete offer
  const deleteOffer = async (id) => {
    try {
      await deleteDoc(doc(db, 'offers', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting offer:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    offers,
    loading,
    addOffer,
    updateOffer,
    deleteOffer
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
};