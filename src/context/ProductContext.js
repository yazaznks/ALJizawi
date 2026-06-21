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
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadMultipleFiles } from '../services/r2Upload';

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
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const PAGE_SIZE = 500;

  // Load initial products from Firebase
  const loadProducts = async (loadMore = false) => {
    if (loadMore && !hasMore) return;

    setLoading(true);
    try {
      let q = query(
        collection(db, 'ecommerce_products'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (loadMore && lastVisible) {
        q = query(
          collection(db, 'ecommerce_products'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      if (docs.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const productsData = docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          price: parseFloat(data.price) || 0,
          discountPercent: data.discountPercent ? parseFloat(data.discountPercent) : null,
          stock: parseInt(data.stock) || 0,
          weight: parseFloat(data.weight) || 0,
          featured: data.featured === true,
          active: data.active !== false
        };
      });

      setLastVisible(docs[docs.length - 1]);
      setHasMore(docs.length === PAGE_SIZE);

      setProducts(prev => {
        const newProducts = loadMore ? [...prev, ...productsData] : productsData;
        updateCategories(newProducts);
        return newProducts;
      });
      setTotalLoaded(prev => (loadMore ? prev + docs.length : docs.length));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial products on mount
  useEffect(() => {
    loadProducts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCategories = (productList) => {
    const uniqueCategories = [...new Set(productList.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
  };

  // Generate unique ID for products
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Create product
  const createProduct = async (productData, imageFiles) => {
    setLoading(true);
    try {
      // Upload files to Cloudflare R2 (faster and cheaper than base64 in Firestore)
      const images = [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadedFiles = await uploadMultipleFiles(imageFiles);
        images.push(...uploadedFiles);
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
  const updateProduct = async (id, productData, newImageFiles, keptImages) => {
    setLoading(true);
    try {
      const existingProduct = products.find(p => p._id === id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Upload new images/videos to Cloudflare R2
      const newImages = [];
      if (newImageFiles && newImageFiles.length > 0) {
        const uploadedFiles = await uploadMultipleFiles(newImageFiles);
        newImages.push(...uploadedFiles);
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
        images: [...(keptImages || existingProduct.images), ...newImages], // Keep selected + append new
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
    hasMore,
    loadProducts,
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