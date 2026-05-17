// src/contexts/CartContext.jsx - D1 only (No localStorage)
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const D1_API_URL = import.meta.env.VITE_D1_API_URL;

const CartContext = createContext();

async function callCartAPI(endpoint, options = {}) {
  try {
    console.log(`📡 Cart API Call: ${endpoint}`);
    const response = await fetch(`${D1_API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json();
    console.log(`📡 Cart API Response:`, data);
    return data;
  } catch (error) {
    console.error('Cart API Error:', error);
    return { success: false, error: error.message };
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load cart from D1 only (no localStorage)
  useEffect(() => {
    if (user) {
      loadCartFromD1();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadCartFromD1 = async () => {
    setLoading(true);
    try {
      const result = await callCartAPI(`/api/cart/${user.uid}`);
      if (result.success && result.cart) {
        setCartItems(result.cart);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart from D1:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update total whenever cartItems change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.price || 29), 0);
    setCartTotal(total);
  }, [cartItems]);

  const addToCart = async (item) => {
    // Determine item type
    const itemType = item.type || 'file';
    
    console.log(`🛒 Adding to cart: ${item.name} (${itemType})`);
    
    // Optimistically update UI
    setCartItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price || 29,
        type: itemType,
        originalName: item.originalName,
        cloudflareKey: item.cloudflareKey
      }];
    });
    
    // Sync to D1
    if (user) {
      await callCartAPI('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          fileId: item.id,
          fileName: item.name,
          price: item.price || 29,
          itemType: itemType,
          action: 'add_to_cart'
        })
      });
    }
  };

  const removeFromCart = async (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    
    // Optimistically update UI
    setCartItems(prev => prev.filter(i => i.id !== itemId));
    
    // Sync to D1
    if (user && item) {
      await callCartAPI('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: user.uid,
          fileId: itemId,
          fileName: item.name,
          price: item.price
        })
      });
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (user) {
      await callCartAPI(`/api/cart/clear/${user.uid}`, { method: 'DELETE' });
    }
  };

  const getCartCount = () => cartItems.length;
  const isInCart = (itemId) => cartItems.some(item => item.id === itemId);
  const refreshCart = () => user && loadCartFromD1();

  return (
    <CartContext.Provider value={{
      cartItems,
      cartTotal,
      loading,
      addToCart,
      removeFromCart,
      clearCart,
      getCartCount,
      isInCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}