import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Load products from Firebase on mount with real-time updates
  // Uses limit() so we don't fetch ALL products before showing anything
  useEffect(() => {
    // First, do a quick limited fetch to show products ASAP
    const quickQuery = query(
      collection(db, 'ecommerce_products'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Use getDocs for the initial limited load (faster than waiting for all)
    getDocs(quickQuery).then((querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        productsData.push({
          ...data,
          id: docSnap.id,
          price: parseFloat(data.price) || 0,
          discountPercent: data.discountPercent ? parseFloat(data.discountPercent) : null,
          stock: parseInt(data.stock) || 0,
          weight: parseFloat(data.weight) || 0,
          featured: data.featured === true,
          active: data.active !== false
        });
      });
      setProducts(productsData);
      updateCategories(productsData);
      setLoading(false);
    }).catch((error) => {
      console.error('Error in quick product load:', error);
      setLoading(false);
    });

    // Then subscribe to real-time updates for full sync (ongoing)
    const fullQuery = query(collection(db, 'ecommerce_products'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(fullQuery, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        productsData.push({
          ...data,
          id: docSnap.id,
          price: parseFloat(data.price) || 0,
          discountPercent: data.discountPercent ? parseFloat(data.discountPercent) : null,
          stock: parseInt(data.stock) || 0,
          weight: parseFloat(data.weight) || 0,
          featured: data.featured === true,
          active: data.active !== false
        });
      });
      setProducts(productsData);
      updateCategories(productsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateCategories = (productList) => {
    const uniqueCategories = [...new Set(productList.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
  };

  // Generate unique ID for products
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Convert file to base64 for storage
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Create product
  const createProduct = async (productData, imageFiles) => {
    setLoading(true);
    try {
      // Convert images to base64
      const images = [];
      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const base64 = await fileToBase64(file);
          images.push({
            url: base64,
            filename: file.name,
            type: file.type
          });
        }
      }

      const newProduct = {
        _id: generateId(),
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        discountPercent: productData.discountPercent ? parseFloat(productData.discountPercent) : null,
        category: productData.category,
        stock: parseInt(productData.stock),
        featured: productData.featured === 'true' || productData.featured === true,
        weight: productData.weight ? parseFloat(productData.weight) : 0,
        images: images,
        sizes: productData.sizes || [],
        active: true,
        createdAt: new Date().toISOString()
      };

      // Add to Firebase
      await addDoc(collection(db, 'ecommerce_products'), newProduct);

      return { success: true, product: newProduct };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProduct = async (id, productData, newImageFiles) => {
    setLoading(true);
    try {
      const existingProduct = products.find(p => p._id === id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Convert new images to base64
      const newImages = [];
      if (newImageFiles && newImageFiles.length > 0) {
        for (const file of newImageFiles) {
          const base64 = await fileToBase64(file);
          newImages.push({
            url: base64,
            filename: file.name,
            type: file.type
          });
        }
      }

      // Strip out the 'id' field (Firestore doc ID) before writing to the document
      // to prevent it from contaminating doc.data() on subsequent reads
      const { id: _ignoreId, ...existingData } = existingProduct;
      const updatedProduct = {
        ...existingData,
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        discountPercent: productData.discountPercent ? parseFloat(productData.discountPercent) : null,
        category: productData.category,
        stock: parseInt(productData.stock),
        featured: productData.featured === 'true' || productData.featured === true,
        weight: productData.weight ? parseFloat(productData.weight) : 0,
        images: [...existingProduct.images, ...newImages], // Append new images
        sizes: productData.sizes || []
      };

      // Update in Firebase
      await updateDoc(doc(db, 'ecommerce_products', existingProduct.id), updatedProduct);

      return { success: true, product: updatedProduct };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete product permanently from Firestore
  const deleteProduct = async (firestoreId, customId) => {
    try {
      // Use the Firestore document ID directly to delete
      if (firestoreId) {
        await deleteDoc(doc(db, 'ecommerce_products', firestoreId));
      } else {
        throw new Error('Firestore document ID not found');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: error.message };
    }
  };

  // Get product by ID
  const getProduct = (id) => {
    return products.find(p => p._id === id && p.active);
  };

  // Get all products with filtering (in-memory, for admin/quick use)
  const getProducts = (filters = {}) => {
    let filtered = products.filter(p => p.active);

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    // Pagination
    const page = filters.page || 1;
    const limitCount = filters.limit || 12;
    const startIndex = (page - 1) * limitCount;
    const endIndex = startIndex + limitCount;

    const paginatedProducts = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / limitCount);

    return {
      products: paginatedProducts,
      totalPages,
      currentPage: page,
      total: filtered.length
    };
  };

  // Remove image from product
  const removeProductImage = (productId, imageIndex) => {
    setProducts(prev => prev.map(p =>
      p._id === productId
        ? { ...p, images: p.images.filter((_, index) => index !== imageIndex) }
        : p
    ));
    return { success: true };
  };

  const value = {
    products,
    categories,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    getProducts,
    removeProductImage
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};