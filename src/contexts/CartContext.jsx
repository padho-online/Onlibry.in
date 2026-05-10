// src/contexts/CartContext.jsx
// Cart management for file purchases

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('onlibry_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onlibry_cart', JSON.stringify(cartItems));
    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price || 29), 0);
    setCartTotal(total);
  }, [cartItems]);

  // Add item to cart
  const addToCart = (item) => {
    setCartItems(prev => {
      // Check if already in cart
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev;
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price || 29,
        type: item.type || 'file', // file, mocktest, quiz
        originalName: item.originalName,
        cloudflareKey: item.cloudflareKey
      }];
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get cart count
  const getCartCount = () => {
    return cartItems.length;
  };

  // Check if item is in cart
  const isInCart = (itemId) => {
    return cartItems.some(item => item.id === itemId);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartTotal,
      addToCart,
      removeFromCart,
      clearCart,
      getCartCount,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}