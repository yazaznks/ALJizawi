import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const translations = {
  ar: {
    // Navbar
    home: 'الرئيسية',
    products: 'المنتجات',
    cart: 'السلة',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    logout: 'تسجيل الخروج',
    admin: 'لوحة التحكم',
    
    // Admin
    dashboard: 'لوحة التحكم',
    manageProducts: 'إدارة المنتجات',
    manageOrders: 'إدارة الطلبات',
    orders: 'الطلبات',
    addNewProduct: 'إضافة منتج جديد',
    editProduct: 'تعديل المنتج',
    cancel: 'إلغاء',
    
    // Product Form
    productName: 'اسم المنتج',
    description: 'الوصف',
    price: 'السعر',
    category: 'الفئة',
    stock: 'المخزون',
    featuredProduct: 'منتج مميز (عرض في الصفحة الرئيسية)',
    productImages: 'صور المنتج (اختياري)',
    currentImages: 'الصور الحالية:',
    newImagesToUpload: 'صور جديدة للتحميل:',
    selected: 'محدد',
    addProduct: 'إضافة منتج',
    updateProduct: 'تحديث المنتج',
    
    // Product Table
    name: 'الاسم',
    status: 'الحالة',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    active: 'نشط',
    inactive: 'غير نشط',
    
    // Messages
    deleteConfirm: 'هل تريد حذف هذا المنتج؟',
    productDeleted: 'تم حذف المنتج بنجاح!',
    errorDeleting: 'خطأ في حذف المنتج',
    productAdded: 'تم إضافة المنتج بنجاح!',
    productUpdated: 'تم تحديث المنتج بنجاح!',
    errorAdding: 'خطأ في إضافة المنتج',
    errorUpdating: 'خطأ في تحديث المنتج',
    loading: 'جاري التحميل...',
    loadingProducts: 'جاري تحميل المنتجات...',
    
    // Product Detail
    addToCart: 'أضف إلى السلة',
    quantity: 'الكمية',
    available: 'متوفر',
    outOfStock: 'نفذت الكمية',
    productNotFound: 'المنتج غير موجود',
    noImage: 'لا توجد صورة',
    
    // Cart
    yourCart: 'سلة التسوق',
    emptyCart: 'سلة التسوق فارغة',
    continueShopping: 'متابعة التسوق',
    remove: 'إزالة',
    subtotal: 'المجموع الفرعي',
    proceedToCheckout: 'المتابعة للدفع',
    
    // Home
    welcomeMessage: 'مرحباً بك في متجرنا الإلكتروني',
    featuredProducts: 'المنتجات المميزة',
    shopNow: 'تسوق الآن',
    
    // Auth
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    phone: 'رقم الهاتف',
    fullName: 'الاسم الكامل',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب؟',
    
    // Checkout
    checkout: 'الدفع',
    shippingInformation: 'معلومات الشحن',
    address: 'العنوان',
    city: 'المدينة',
    orderSummary: 'ملخص الطلب',
    shippingFee: 'رسوم الشحن',
    total: 'المجموع',
    placeOrder: 'تأكيد الطلب',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    
    // Misc
    required: 'مطلوب',
    optional: 'اختياري',
    search: 'بحث',
    filter: 'تصفية',
    sortBy: 'ترتيب حسب',
    noResults: 'لا توجد نتائج',
    
    // Additional translations
    allProducts: 'جميع المنتجات',
    browseProducts: 'تصفح المنتجات',
    shopWithLocation: 'تسوق مع الشحن المحدد بالموقع! احصل على تقديرات دقيقة للتوصيل بناءً على موقعك.',
    noFeaturedProducts: 'لا توجد منتجات مميزة متاحة.',
    loadingProduct: 'جاري تحميل المنتج...',
    loggingIn: 'جاري تسجيل الدخول...',
    creatingAccount: 'جاري إنشاء الحساب...',
    shoppingCart: 'سلة التسوق',
    cartSummary: 'ملخص السلة',
    customerInformation: 'معلومات العميل',
    street: 'الشارع',
    country: 'الدولة',
    locationForShipping: '📍 الموقع لحساب الشحن',
    locationDescription: 'نحتاج موقعك لحساب رسوم الشحن بدقة',
    useCurrentLocation: '📍 استخدام موقعي الحالي',
    enterManually: 'إدخال يدوي',
    gettingLocation: 'جاري الحصول على الموقع...',
    locationSet: '✓ تم تعيين الموقع:',
    shippingInformationTitle: '🚚 معلومات الشحن',
    distance: 'المسافة',
    estimatedDelivery: 'التوصيل المتوقع',
    placingOrder: 'جاري تأكيد الطلب...',
    cashOnDelivery: 'تأكيد الطلب (الدفع عند الاستلام)',
    
    // Admin Dashboard
    loadingDashboard: 'جاري تحميل لوحة التحكم...',
    totalOrders: 'إجمالي الطلبات',
    pendingOrders: 'الطلبات المعلقة',
    totalRevenue: 'إجمالي الإيرادات',
    totalProducts: 'إجمالي المنتجات',
    lowStockProducts: 'المنتجات منخفضة المخزون',
    totalCustomers: 'إجمالي العملاء',
    recentOrders: 'الطلبات الأخيرة',
    orderNumber: 'رقم الطلب',
    customer: 'العميل',
    date: 'التاريخ',
    
    // Admin Orders
    loadingOrders: 'جاري تحميل الطلبات...',
    phone: 'الهاتف',
    whatsapp: '💬 واتساب',
    pending: 'معلق',
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    orderStatusUpdated: 'تم تحديث حالة الطلب بنجاح!',
    errorUpdatingStatus: 'خطأ في تحديث حالة الطلب',
    
    // Product Detail specific
    productAddedToCart: 'تم إضافة المنتج إلى السلة!',
    km: 'كم'
  },
  en: {
    // Navbar
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    admin: 'Admin',
    
    // Admin
    dashboard: 'Dashboard',
    manageProducts: 'Manage Products',
    manageOrders: 'Manage Orders',
    orders: 'Orders',
    addNewProduct: 'Add New Product',
    editProduct: 'Edit Product',
    cancel: 'Cancel',
    
    // Product Form
    productName: 'Product Name',
    description: 'Description',
    price: 'Price',
    category: 'Category',
    stock: 'Stock',
    featuredProduct: 'Featured Product (Show on homepage)',
    productImages: 'Product Images (Optional)',
    currentImages: 'Current Images:',
    newImagesToUpload: 'New Images to Upload:',
    selected: 'selected',
    addProduct: 'Add Product',
    updateProduct: 'Update Product',
    
    // Product Table
    name: 'Name',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    active: 'Active',
    inactive: 'Inactive',
    
    // Messages
    deleteConfirm: 'Delete this product?',
    productDeleted: 'Product deleted successfully!',
    errorDeleting: 'Error deleting product',
    productAdded: 'Product added successfully!',
    productUpdated: 'Product updated successfully!',
    errorAdding: 'Error adding product',
    errorUpdating: 'Error updating product',
    loading: 'Loading...',
    loadingProducts: 'Loading products...',
    
    // Product Detail
    addToCart: 'Add to Cart',
    quantity: 'Quantity',
    available: 'available',
    outOfStock: 'Out of Stock',
    productNotFound: 'Product not found',
    noImage: 'No Image',
    
    // Cart
    yourCart: 'Your Cart',
    emptyCart: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    remove: 'Remove',
    subtotal: 'Subtotal',
    proceedToCheckout: 'Proceed to Checkout',
    
    // Home
    welcomeMessage: 'Welcome to Our E-Commerce Store',
    featuredProducts: 'Featured Products',
    shopNow: 'Shop Now',
    
    // Auth
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    fullName: 'Full Name',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    
    // Checkout
    checkout: 'Checkout',
    shippingInformation: 'Shipping Information',
    address: 'Address',
    city: 'City',
    orderSummary: 'Order Summary',
    shippingFee: 'Shipping Fee',
    total: 'Total',
    placeOrder: 'Place Order',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    
    // Misc
    required: 'Required',
    optional: 'Optional',
    search: 'Search',
    filter: 'Filter',
    sortBy: 'Sort By',
    noResults: 'No results',
    
    // Additional translations
    allProducts: 'All Products',
    browseProducts: 'Browse Products',
    shopWithLocation: 'Shop with location-based shipping! Get accurate delivery estimates based on your location.',
    noFeaturedProducts: 'No featured products available.',
    loadingProduct: 'Loading product...',
    loggingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    shoppingCart: 'Shopping Cart',
    cartSummary: 'Cart Summary',
    customerInformation: 'Customer Information',
    street: 'Street',
    country: 'Country',
    locationForShipping: '📍 Location for Shipping Calculation',
    locationDescription: 'We need your location to calculate accurate shipping fees',
    useCurrentLocation: '📍 Use My Current Location',
    enterManually: 'Enter Manually',
    gettingLocation: 'Getting Location...',
    locationSet: '✓ Location set:',
    shippingInformationTitle: '🚚 Shipping Information',
    distance: 'Distance',
    estimatedDelivery: 'Estimated Delivery',
    placingOrder: 'Placing Order...',
    cashOnDelivery: 'Place Order (Cash on Delivery)',
    
    // Admin Dashboard
    loadingDashboard: 'Loading dashboard...',
    totalOrders: 'Total Orders',
    pendingOrders: 'Pending Orders',
    totalRevenue: 'Total Revenue',
    totalProducts: 'Total Products',
    lowStockProducts: 'Low Stock Products',
    totalCustomers: 'Total Customers',
    recentOrders: 'Recent Orders',
    orderNumber: 'Order #',
    customer: 'Customer',
    date: 'Date',
    
    // Admin Orders
    loadingOrders: 'Loading orders...',
    phone: 'Phone',
    whatsapp: '💬 WhatsApp',
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    orderStatusUpdated: 'Order status updated successfully!',
    errorUpdatingStatus: 'Error updating order status',
    
    // Product Detail specific
    productAddedToCart: 'Product added to cart!',
    km: 'km'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar'; // Arabic as default
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
