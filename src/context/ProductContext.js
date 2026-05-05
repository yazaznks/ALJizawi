import React, { createContext, useState, useContext, useEffect } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
        updateCategories(parsedProducts);
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
        setProducts([]);
      }
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    updateCategories(products);
  }, [products]);

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
        category: productData.category,
        stock: parseInt(productData.stock),
        featured: productData.featured === 'true' || productData.featured === true,
        weight: productData.weight ? parseFloat(productData.weight) : 0,
        images: images,
        active: true,
        createdAt: new Date().toISOString()
      };

      setProducts(prev => [...prev, newProduct]);
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

      const updatedProduct = {
        ...existingProduct,
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock),
        featured: productData.featured === 'true' || productData.featured === true,
        weight: productData.weight ? parseFloat(productData.weight) : 0,
        images: [...existingProduct.images, ...newImages] // Append new images
      };

      setProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
      return { success: true, product: updatedProduct };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete product (soft delete)
  const deleteProduct = (id) => {
    setProducts(prev => prev.map(p =>
      p._id === id ? { ...p, active: false } : p
    ));
    return { success: true };
  };

  // Get product by ID
  const getProduct = (id) => {
    return products.find(p => p._id === id && p.active);
  };

  // Get all products with filtering
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
    const limit = filters.limit || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / limit);

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