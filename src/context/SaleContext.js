import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const SaleContext = createContext();

export const useSales = () => {
  const context = useContext(SaleContext);
  if (!context) {
    throw new Error('useSales must be used within SaleProvider');
  }
  return context;
};

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load sales with real-time updates
  useEffect(() => {
    const q = query(collection(db, 'manual_sales'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData = [];
      querySnapshot.forEach((doc) => {
        salesData.push({ id: doc.id, ...doc.data() });
      });
      setSales(salesData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading manual sales:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a new manual sale
  const createSale = async (saleData) => {
    try {
      const data = {
        items: saleData.items.map(item => ({
          productId: item.productId,
          name: item.name,
          selectedSize: item.selectedSize || null,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          lineTotal: parseFloat(item.lineTotal) || 0,
          discountPercent: parseFloat(item.discountPercent) || 0
        })),
        subtotal: parseFloat(saleData.subtotal) || 0,
        discount: parseFloat(saleData.discount) || 0,
        total: parseFloat(saleData.total) || 0,
        paymentMethod: saleData.paymentMethod || 'cash',
        notes: saleData.notes || '',
        status: 'active',
        createdBy: saleData.createdBy || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: ''
      };

      await addDoc(collection(db, 'manual_sales'), data);
      return { success: true };
    } catch (error) {
      console.error('Error creating sale:', error);
      return { success: false, message: error.message };
    }
  };

  // Update a sale
  const updateSale = async (saleId, saleData, adminName) => {
    try {
      const data = {
        items: saleData.items.map(item => ({
          productId: item.productId,
          name: item.name,
          selectedSize: item.selectedSize || null,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          lineTotal: parseFloat(item.lineTotal) || 0,
          discountPercent: parseFloat(item.discountPercent) || 0
        })),
        subtotal: parseFloat(saleData.subtotal) || 0,
        discount: parseFloat(saleData.discount) || 0,
        total: parseFloat(saleData.total) || 0,
        paymentMethod: saleData.paymentMethod || 'cash',
        notes: saleData.notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: adminName || ''
      };

      await updateDoc(doc(db, 'manual_sales', saleId), data);
      return { success: true };
    } catch (error) {
      console.error('Error updating sale:', error);
      return { success: false, message: error.message };
    }
  };

  // Cancel a sale (soft delete)
  const cancelSale = async (saleId, adminName) => {
    try {
      await updateDoc(doc(db, 'manual_sales', saleId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: adminName || '',
        updatedAt: new Date().toISOString(),
        updatedBy: adminName || ''
      });
      return { success: true };
    } catch (error) {
      console.error('Error cancelling sale:', error);
      return { success: false, message: error.message };
    }
  };

  // Hard delete a sale (for cleanup only)
  const deleteSale = async (saleId) => {
    try {
      await deleteDoc(doc(db, 'manual_sales', saleId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    sales,
    loading,
    createSale,
    updateSale,
    cancelSale,
    deleteSale
  };

  return (
    <SaleContext.Provider value={value}>
      {children}
    </SaleContext.Provider>
  );
};