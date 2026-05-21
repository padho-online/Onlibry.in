// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getCartFromD1, 
  addToCartInD1, 
  removeFromCartInD1, 
  clearCartInD1 
} from '../services/d1Service';
import { logCartAction } from '../services/loggerService';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from D1 when user logs in
  useEffect(() => {
    if (user && !cartLoaded) {
      loadCartFromD1();
    } else if (!user) {
      // Clear cart when user logs out
      setCartItems([]);
      setCartLoaded(false);
      setLoading(false);
    }
  }, [user]);

  const loadCartFromD1 = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await getCartFromD1(user.uid);
      console.log('📦 Cart loaded from D1:', result);
      
      if (result.success && result.cart) {
        // Convert D1 cart format to frontend format
        const items = result.cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type || 'file',
          addedAt: item.addedAt
        }));
        setCartItems(items);
      } else {
        setCartItems([]);
      }
      setCartLoaded(true);
    } catch (error) {
      console.error('Error loading cart from D1:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Add to cart
  const addToCart = async (item) => {
    if (!user) {
      console.log('User not logged in, cannot add to cart');
      return false;
    }
    
    // Check if already in cart
    if (isInCart(item.id)) {
      console.log('Item already in cart:', item.name);
      return false;
    }
    
    try {
      // Add to D1
      const result = await addToCartInD1(user.uid, item);
      console.log('Add to cart result:', result);
      
      if (result.success) {
        // Update local state
        setCartItems(prev => [...prev, { ...item, addedAt: new Date().toISOString() }]);
        
        // Log to Google Sheet
        await logCartAction(user.uid, item.id, item.name, item.price, 'add_to_cart');
        
        // Save to localStorage as backup (for offline/speed)
        saveCartToLocalStorage([...cartItems, item]);
        
        console.log(`✅ Added to cart: ${item.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    if (!user) return false;
    
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return false;
    
    try {
      const result = await removeFromCartInD1(user.uid, itemId, item.name);
      
      if (result.success) {
        // Update local state
        setCartItems(prev => prev.filter(i => i.id !== itemId));
        
        // Log to Google Sheet
        await logCartAction(user.uid, itemId, item.name, item.price, 'remove_from_cart');
        
        // Update localStorage backup
        saveCartToLocalStorage(cartItems.filter(i => i.id !== itemId));
        
        console.log(`✅ Removed from cart: ${item.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!user) return false;
    
    try {
      const result = await clearCartInD1(user.uid);
      
      if (result.success) {
        setCartItems([]);
        localStorage.removeItem('onlibry_cart_backup');
        console.log('✅ Cart cleared');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  // Sync local cart with D1 (for when user logs in with items in localStorage)
  const syncCartWithD1 = async () => {
    if (!user) return;
    
    // Get local backup
    const localCart = getCartFromLocalStorage();
    if (localCart.length === 0) return;
    
    console.log('🔄 Syncing local cart with D1...');
    
    for (const item of localCart) {
      await addToCartInD1(user.uid, item);
    }
    
    // Clear local backup after sync
    localStorage.removeItem('onlibry_cart_backup');
    
    // Reload cart from D1
    await loadCartFromD1();
  };

  // Save cart to localStorage (backup)
  const saveCartToLocalStorage = (items) => {
    try {
      localStorage.setItem('onlibry_cart_backup', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  };

  // Get cart from localStorage
  const getCartFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('onlibry_cart_backup');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  // Check if item is in cart
  const isInCart = (itemId) => {
    return cartItems.some(item => item.id === itemId);
  };

  // Get cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  // Get cart count
  const getCartCount = () => cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        getCartCount,
        syncCartWithD1,
        loadCartFromD1
      }}
    >
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